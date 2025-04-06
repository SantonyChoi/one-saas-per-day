#!/usr/bin/env python3
"""
스케줄러 모듈
전체 AI 스타트업 동향 트래킹 시스템을 스케줄링하고 실행합니다.
"""

import schedule
import time
import datetime
import os
import sys
import subprocess
from pathlib import Path
import logging

# 기본 경로 설정
BASE_DIR = Path(__file__).parent.parent
SCRIPTS_DIR = BASE_DIR / "scripts"
LOG_DIR = BASE_DIR / "logs"

# 로그 디렉토리가 없으면 생성
LOG_DIR.mkdir(exist_ok=True)

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_DIR / "scheduler.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("ai_news_scheduler")

def run_script(script_name):
    """
    지정된 스크립트를 실행합니다.
    
    Args:
        script_name (str): 실행할 스크립트 파일 이름
        
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
            check=True
        )
        logger.info(f"Script output: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Script error: {e}")
        logger.error(f"Error output: {e.stderr}")
        return False
    except Exception as e:
        logger.error(f"Failed to run script: {e}")
        return False

def collect_data():
    """
    데이터 수집 작업을 실행합니다.
    """
    logger.info("Starting data collection job")
    success = run_script("hn_api.py")
    
    if success:
        logger.info("Data collection completed successfully")
    else:
        logger.error("Data collection failed")

def process_data():
    """
    데이터 처리 작업을 실행합니다.
    """
    logger.info("Starting data processing job")
    success = run_script("data_processor.py")
    
    if success:
        logger.info("Data processing completed successfully")
    else:
        logger.error("Data processing failed")

def generate_report():
    """
    리포트 생성 작업을 실행합니다.
    """
    logger.info("Starting report generation job")
    success = run_script("report_generator.py")
    
    if success:
        logger.info("Report generation completed successfully")
    else:
        logger.error("Report generation failed")

def run_full_pipeline():
    """
    전체 파이프라인을 순차적으로 실행합니다.
    """
    logger.info("Starting full pipeline execution")
    
    # 데이터 수집
    collect_data()
    
    # 데이터 처리
    process_data()
    
    # 리포트 생성
    generate_report()
    
    logger.info("Full pipeline execution completed")

def setup_schedule():
    """
    작업 스케줄을 설정합니다.
    """
    # 매일 오전 8시에 전체 파이프라인 실행
    schedule.every().day.at("08:00").do(run_full_pipeline)
    
    # 매 시간마다 데이터 수집 및 처리
    schedule.every(1).hours.do(collect_data)
    schedule.every(1).hours.at(":15").do(process_data)
    
    # 매일 오후 6시에 리포트 생성
    schedule.every().day.at("18:00").do(generate_report)
    
    logger.info("Schedule setup completed")

def run_scheduler():
    """
    스케줄러를 실행합니다.
    """
    logger.info("Starting scheduler")
    
    # 스케줄 설정
    setup_schedule()
    
    # 시작 시 전체 파이프라인 한 번 실행
    run_full_pipeline()
    
    # 스케줄에 따라 작업 실행
    while True:
        try:
            schedule.run_pending()
            time.sleep(60)  # 1분마다 스케줄 확인
        except KeyboardInterrupt:
            logger.info("Scheduler stopped by user")
            break
        except Exception as e:
            logger.error(f"Scheduler error: {e}")
            time.sleep(300)  # 오류 발생 시 5분 후 재시도

def main():
    """
    메인 함수: 스케줄러를 실행합니다.
    """
    # 명령행 인수에 따라 다른 작업 실행
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "collect":
            collect_data()
        elif command == "process":
            process_data()
        elif command == "report":
            generate_report()
        elif command == "pipeline":
            run_full_pipeline()
        else:
            print(f"Unknown command: {command}")
            print("Available commands: collect, process, report, pipeline")
    else:
        # 인수가 없으면 스케줄러 실행
        run_scheduler()

if __name__ == "__main__":
    main()
