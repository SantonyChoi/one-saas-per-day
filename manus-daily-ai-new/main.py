#!/usr/bin/env python3
"""
메인 실행 스크립트
전체 AI 스타트업 동향 트래킹 시스템을 테스트하고 실행합니다.
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path
import time
import logging

# 기본 경로 설정
BASE_DIR = Path(__file__).parent
SCRIPTS_DIR = BASE_DIR / "scripts"
LOG_DIR = BASE_DIR / "logs"
REPORTS_DIR = BASE_DIR / "reports"

# 로그 디렉토리가 없으면 생성
LOG_DIR.mkdir(exist_ok=True)

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_DIR / "main.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("ai_news_main")

def check_dependencies():
    """
    필요한 Python 패키지가 설치되어 있는지 확인합니다.
    
    Returns:
        bool: 모든 의존성이 설치되어 있는지 여부
    """
    required_packages = [
        "requests", "beautifulsoup4", "pandas", "schedule", "jinja2"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        logger.warning(f"Missing packages: {', '.join(missing_packages)}")
        logger.info("Installing missing packages...")
        
        try:
            subprocess.run(
                [sys.executable, "-m", "pip", "install"] + missing_packages,
                check=True
            )
            logger.info("All packages installed successfully")
        except subprocess.CalledProcessError:
            logger.error("Failed to install packages")
            return False
    
    return True

def run_script(script_name, timeout=300):
    """
    지정된 스크립트를 실행합니다.
    
    Args:
        script_name (str): 실행할 스크립트 파일 이름
        timeout (int): 스크립트 실행 제한 시간(초)
        
    Returns:
        bool: 성공 여부
    """
    script_path = SCRIPTS_DIR / script_name
    
    if not script_path.exists():
        logger.error(f"Script not found: {script_path}")
        return False
    
    try:
        logger.info(f"Running script: {script_path}")
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True,
            check=True,
            timeout=timeout
        )
        logger.info(f"Script output: {result.stdout}")
        return True
    except subprocess.TimeoutExpired:
        logger.error(f"Script timed out after {timeout} seconds")
        return False
    except subprocess.CalledProcessError as e:
        logger.error(f"Script error: {e}")
        logger.error(f"Error output: {e.stderr}")
        return False
    except Exception as e:
        logger.error(f"Failed to run script: {e}")
        return False

def test_data_collection():
    """
    데이터 수집 기능을 테스트합니다.
    
    Returns:
        bool: 테스트 성공 여부
    """
    logger.info("Testing data collection...")
    return run_script("hn_api.py")

def test_data_processing():
    """
    데이터 처리 기능을 테스트합니다.
    
    Returns:
        bool: 테스트 성공 여부
    """
    logger.info("Testing data processing...")
    return run_script("data_processor.py")

def test_report_generation():
    """
    리포트 생성 기능을 테스트합니다.
    
    Returns:
        bool: 테스트 성공 여부
    """
    logger.info("Testing report generation...")
    return run_script("report_generator.py")

def test_full_pipeline():
    """
    전체 파이프라인을 테스트합니다.
    
    Returns:
        bool: 테스트 성공 여부
    """
    logger.info("Testing full pipeline...")
    
    # 데이터 수집 테스트
    if not test_data_collection():
        logger.error("Data collection test failed")
        return False
    
    # 데이터 처리 테스트
    if not test_data_processing():
        logger.error("Data processing test failed")
        return False
    
    # 리포트 생성 테스트
    if not test_report_generation():
        logger.error("Report generation test failed")
        return False
    
    logger.info("Full pipeline test completed successfully")
    return True

def start_scheduler():
    """
    스케줄러를 시작합니다.
    
    Returns:
        subprocess.Popen: 스케줄러 프로세스
    """
    logger.info("Starting scheduler...")
    
    try:
        process = subprocess.Popen(
            [sys.executable, str(SCRIPTS_DIR / "scheduler.py")],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        logger.info(f"Scheduler started with PID: {process.pid}")
        return process
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")
        return None

def find_latest_report():
    """
    가장 최근에 생성된 리포트 파일을 찾습니다.
    
    Returns:
        Path: 최신 리포트 파일 경로
    """
    report_files = list(REPORTS_DIR.glob("ai_startup_report_*.html"))
    
    if not report_files:
        return None
    
    return max(report_files, key=os.path.getmtime)

def main():
    """
    메인 함수: 명령행 인수에 따라 다양한 작업을 실행합니다.
    """
    parser = argparse.ArgumentParser(description="AI 스타트업 동향 트래커")
    parser.add_argument("command", nargs="?", default="test", choices=["test", "run", "collect", "process", "report", "schedule"],
                        help="실행할 명령 (test, run, collect, process, report, schedule)")
    
    args = parser.parse_args()
    
    # 의존성 확인
    if not check_dependencies():
        logger.error("Dependency check failed")
        return 1
    
    if args.command == "test":
        # 전체 시스템 테스트
        if test_full_pipeline():
            logger.info("All tests passed successfully")
            
            # 최신 리포트 찾기
            latest_report = find_latest_report()
            if latest_report:
                logger.info(f"Latest report: {latest_report}")
            
            return 0
        else:
            logger.error("Tests failed")
            return 1
    
    elif args.command == "run":
        # 전체 파이프라인 한 번 실행
        if test_full_pipeline():
            logger.info("Pipeline executed successfully")
            
            # 최신 리포트 찾기
            latest_report = find_latest_report()
            if latest_report:
                logger.info(f"Latest report: {latest_report}")
            
            return 0
        else:
            logger.error("Pipeline execution failed")
            return 1
    
    elif args.command == "collect":
        # 데이터 수집만 실행
        if test_data_collection():
            logger.info("Data collection completed successfully")
            return 0
        else:
            logger.error("Data collection failed")
            return 1
    
    elif args.command == "process":
        # 데이터 처리만 실행
        if test_data_processing():
            logger.info("Data processing completed successfully")
            return 0
        else:
            logger.error("Data processing failed")
            return 1
    
    elif args.command == "report":
        # 리포트 생성만 실행
        if test_report_generation():
            logger.info("Report generation completed successfully")
            
            # 최신 리포트 찾기
            latest_report = find_latest_report()
            if latest_report:
                logger.info(f"Latest report: {latest_report}")
            
            return 0
        else:
            logger.error("Report generation failed")
            return 1
    
    elif args.command == "schedule":
        # 스케줄러 시작
        process = start_scheduler()
        
        if process:
            try:
                # 스케줄러 로그 출력
                while True:
                    output = process.stdout.readline()
                    if output:
                        print(output.strip())
                    
                    # 프로세스가 종료되었는지 확인
                    if process.poll() is not None:
                        break
                
                return process.returncode
            except KeyboardInterrupt:
                logger.info("Stopping scheduler...")
                process.terminate()
                return 0
        else:
            logger.error("Failed to start scheduler")
            return 1

if __name__ == "__main__":
    sys.exit(main())
