#!/usr/bin/env python3
"""
리포트 생성 모듈
수집 및 분석된 데이터를 기반으로 HTML 리포트를 생성합니다.
"""

import json
import pandas as pd
import datetime
import os
from pathlib import Path
import re
import sys
from jinja2 import Template, Environment, FileSystemLoader
import math
import time
from collections import Counter

# 기본 경로 설정
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
REPORTS_DIR = BASE_DIR / "reports"
PROCESSED_DIR = DATA_DIR / "processed"
TEMPLATES_DIR = BASE_DIR / "templates"

# 디렉토리가 없으면 생성
REPORTS_DIR.mkdir(exist_ok=True)

def load_processed_data(date_str=None):
    """
    처리된 데이터와 분석 결과를 로드합니다.
    
    Args:
        date_str (str, optional): 날짜 문자열
        
    Returns:
        tuple: (DataFrame, 분석 결과)
    """
    if not date_str:
        date_str = datetime.datetime.now().strftime('%Y-%m-%d')
    
    # 처리된 데이터 파일 찾기
    df_file = PROCESSED_DIR / f"processed_stories_{date_str}.csv"
    analysis_file = PROCESSED_DIR / f"analysis_{date_str}.json"
    
    # 파일이 없으면 최신 파일 찾기
    if not df_file.exists() or not analysis_file.exists():
        df_files = list(PROCESSED_DIR.glob('processed_stories_*.csv'))
        analysis_files = list(PROCESSED_DIR.glob('analysis_*.json'))
        
        if not df_files or not analysis_files:
            print("No processed data files found")
            return None, None
        
        # 가장 최근 파일 선택
        df_file = max(df_files, key=os.path.getmtime)
        analysis_file = max(analysis_files, key=os.path.getmtime)
    
    try:
        # DataFrame 로드
        df = pd.read_csv(df_file)
        
        # 분석 결과 로드
        with open(analysis_file, 'r', encoding='utf-8') as f:
            analysis = json.load(f)
        
        print(f"Loaded processed data from {df_file}")
        print(f"Loaded analysis results from {analysis_file}")
        
        return df, analysis
    except Exception as e:
        print(f"Error loading processed data: {e}")
        return None, None

def format_time_ago(timestamp):
    """
    타임스탬프를 '~시간 전' 형식으로 변환합니다.
    
    Args:
        timestamp: 변환할 타임스탬프
        
    Returns:
        str: 변환된 문자열
    """
    if isinstance(timestamp, str):
        try:
            dt = datetime.datetime.fromisoformat(timestamp)
        except ValueError:
            return timestamp
    else:
        dt = timestamp
    
    now = datetime.datetime.now()
    diff = now - dt
    
    if diff.days > 0:
        return f"{diff.days}일 전"
    elif diff.seconds >= 3600:
        return f"{diff.seconds // 3600}시간 전"
    elif diff.seconds >= 60:
        return f"{diff.seconds // 60}분 전"
    else:
        return "방금 전"

def prepare_report_data(df, analysis):
    """
    리포트 생성에 필요한 데이터를 준비합니다.
    
    Args:
        df (pandas.DataFrame): 처리된 DataFrame
        analysis (dict): 분석 결과
        
    Returns:
        dict: 리포트 데이터
    """
    if df is None or analysis is None:
        return None
    
    # 현재 날짜 및 시간
    now = datetime.datetime.now()
    report_date = now.strftime('%Y년 %m월 %d일')
    current_year = now.year
    
    # 기본 통계
    total_stories = analysis.get('total_stories', 0)
    avg_score = round(analysis.get('avg_score', 0), 1)
    max_score = analysis.get('max_score', 0)
    
    # 인기 도메인
    top_domains = []
    if 'top_domains' in analysis:
        for domain, count in analysis['top_domains'].items():
            top_domains.append({'domain': domain, 'count': count})
    
    # 상위 키워드
    top_keywords = []
    if 'top_keywords' in analysis:
        for keyword, count in analysis['top_keywords'].items():
            top_keywords.append({'keyword': keyword, 'count': count})
    
    # 시간대별 분포
    hour_data = {'labels': [], 'values': []}
    if 'hour_distribution' in analysis:
        for hour in range(24):
            hour_data['labels'].append(f"{hour}시")
            hour_data['values'].append(analysis['hour_distribution'].get(str(hour), 0))
    
    # 요일별 분포
    day_data = {'labels': [], 'values': []}
    day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    day_korean = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일']
    
    if 'day_distribution' in analysis:
        for i, day in enumerate(day_order):
            day_data['labels'].append(day_korean[i])
            day_data['values'].append(analysis['day_distribution'].get(day, 0))
    
    # 상위 스토리 (점수 기준)
    top_stories = []
    if not df.empty and 'score' in df.columns:
        top_df = df.sort_values('score', ascending=False).head(5)
        for _, row in top_df.iterrows():
            story = row.to_dict()
            if 'time' in story and isinstance(story['time'], str):
                try:
                    story['time_ago'] = format_time_ago(story['time'])
                except:
                    story['time_ago'] = story['time']
            top_stories.append(story)
    
    # 새로운 스토리 (시간 기준)
    new_stories = []
    if not df.empty and 'time' in df.columns:
        new_df = df.sort_values('time', ascending=False).head(5)
        for _, row in new_df.iterrows():
            story = row.to_dict()
            if 'time' in story and isinstance(story['time'], str):
                try:
                    story['time_ago'] = format_time_ago(story['time'])
                except:
                    story['time_ago'] = story['time']
            new_stories.append(story)
    
    # 토론이 활발한 스토리 (댓글 수 기준)
    discussions = []
    if not df.empty and 'descendants' in df.columns:
        disc_df = df.sort_values('descendants', ascending=False).head(5)
        for _, row in disc_df.iterrows():
            story = row.to_dict()
            if 'time' in story and isinstance(story['time'], str):
                try:
                    story['time_ago'] = format_time_ago(story['time'])
                except:
                    story['time_ago'] = story['time']
            discussions.append(story)
    
    # 요약 텍스트 생성
    top_domain = top_domains[0]['domain'] if top_domains else "없음"
    top_keyword = top_keywords[0]['keyword'] if top_keywords else "없음"
    
    summary_text = f"""
    오늘 Hacker News에서 {total_stories}개의 AI 스타트업 관련 스토리가 수집되었습니다.
    평균 점수는 {avg_score}점이며, 최고 점수는 {max_score}점입니다.
    가장 많이 언급된 도메인은 {top_domain}이고, 가장 인기 있는 키워드는 '{top_keyword}'입니다.
    """
    
    # 리포트 데이터 구성
    report_data = {
        'report_date': report_date,
        'current_year': current_year,
        'summary_text': summary_text.strip(),
        'total_stories': total_stories,
        'avg_score': avg_score,
        'max_score': max_score,
        'top_domain': top_domain,
        'top_domains': top_domains,
        'top_keywords': top_keywords,
        'hour_data': hour_data,
        'day_data': day_data,
        'top_stories': top_stories,
        'new_stories': new_stories,
        'discussions': discussions
    }
    
    return report_data

def generate_report(report_data, template_file='report_template.html'):
    """
    리포트 데이터와 템플릿을 사용하여 HTML 리포트를 생성합니다.
    
    Args:
        report_data (dict): 리포트 데이터
        template_file (str): 템플릿 파일 이름
        
    Returns:
        str: 생성된 HTML 리포트 내용
    """
    if report_data is None:
        return None
    
    # Jinja2 환경 설정
    env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))
    
    try:
        # 템플릿 로드
        template = env.get_template(template_file)
        
        # 템플릿에 데이터 적용
        # 텍스트 필드에서 특수 문자 처리
        def clean_text(text):
            if isinstance(text, str):
                return text.replace('#', '\\#').replace('{', '\\{').replace('}', '\\}')
            return text
            
        # 스토리 목록에서 텍스트 필드 정리
        for story_list in [report_data['top_stories'], report_data['new_stories'], report_data['discussions']]:
            for story in story_list:
                if 'title' in story:
                    story['title'] = clean_text(story['title'])
                if 'text' in story:
                    story['text'] = clean_text(story['text'])
        
        html_content = template.render(
            report_date=report_data['report_date'],
            current_year=report_data['current_year'],
            summary_text=clean_text(report_data['summary_text']),
            total_stories=report_data['total_stories'],
            avg_score=report_data['avg_score'],
            max_score=report_data['max_score'],
            top_domain=clean_text(report_data['top_domain']),
            top_domains=report_data['top_domains'],
            top_keywords=report_data['top_keywords'],
            hour_data=json.dumps(report_data['hour_data']),
            day_data=json.dumps(report_data['day_data']),
            top_stories=report_data['top_stories'],
            new_stories=report_data['new_stories'],
            discussions=report_data['discussions']
        )
        
        return html_content
    except Exception as e:
        print(f"Error generating report: {e}")
        return None

def save_report(html_content, date_str=None):
    """
    생성된 HTML 리포트를 파일로 저장합니다.
    
    Args:
        html_content (str): HTML 리포트 내용
        date_str (str, optional): 날짜 문자열
        
    Returns:
        str: 저장된 파일 경로
    """
    if html_content is None:
        return None
    
    if not date_str:
        date_str = datetime.datetime.now().strftime('%Y-%m-%d')
    
    # 리포트 파일 경로
    report_file = REPORTS_DIR / f"ai_startup_report_{date_str}.html"
    
    try:
        # HTML 파일 저장
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"Saved report to {report_file}")
        return str(report_file)
    except Exception as e:
        print(f"Error saving report: {e}")
        return None

def create_report(date_str=None):
    """
    지정된 날짜 또는 최신 데이터를 사용하여 리포트를 생성합니다.
    
    Args:
        date_str (str, optional): 날짜 문자열
        
    Returns:
        str: 생성된 리포트 파일 경로
    """
    print("Starting report generation...")
    
    # 처리된 데이터 로드
    df, analysis = load_processed_data(date_str)
    if df is None or analysis is None:
        print("No data available for report generation")
        return None
    
    # 리포트 데이터 준비
    report_data = prepare_report_data(df, analysis)
    if report_data is None:
        print("Failed to prepare report data")
        return None
    
    # HTML 리포트 생성
    html_content = generate_report(report_data)
    if html_content is None:
        print("Failed to generate HTML report")
        return None
    
    # 리포트 저장
    report_file = save_report(html_content, date_str)
    if report_file is None:
        print("Failed to save report")
        return None
    
    print(f"Report generation completed: {report_file}")
    return report_file

def main():
    """
    메인 함수: 최신 데이터를 사용하여 리포트를 생성합니다.
    """
    # 명령행 인수로 날짜 지정 가능
    date_str = None
    if len(sys.argv) > 1:
        date_str = sys.argv[1]
    
    report_file = create_report(date_str)
    
    if report_file:
        print(f"Report created successfully: {report_file}")
    else:
        print("Report creation failed")

if __name__ == "__main__":
    main()
