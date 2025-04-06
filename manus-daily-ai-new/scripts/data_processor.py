#!/usr/bin/env python3
"""
데이터 처리 파이프라인 모듈
수집된 Hacker News 데이터를 처리하고 분석합니다.
"""

import json
import pandas as pd
import datetime
import os
from pathlib import Path
import re
import sys
from collections import Counter

# 기본 경로 설정
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
REPORTS_DIR = BASE_DIR / "reports"
PROCESSED_DIR = DATA_DIR / "processed"

# 디렉토리가 없으면 생성
PROCESSED_DIR.mkdir(exist_ok=True)

def load_stories(file_path):
    """
    저장된 스토리 데이터를 로드합니다.
    
    Args:
        file_path (str): 로드할 파일 경로
        
    Returns:
        list: 스토리 목록
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            stories = json.load(f)
        print(f"Loaded {len(stories)} stories from {file_path}")
        return stories
    except Exception as e:
        print(f"Error loading stories from {file_path}: {e}")
        return []

def convert_to_dataframe(stories):
    """
    스토리 목록을 pandas DataFrame으로 변환합니다.
    
    Args:
        stories (list): 스토리 목록
        
    Returns:
        pandas.DataFrame: 변환된 DataFrame
    """
    # 필요한 필드만 추출
    processed_stories = []
    
    for story in stories:
        processed_story = {
            'id': story.get('id'),
            'title': story.get('title', ''),
            'url': story.get('url', ''),
            'text': story.get('text', ''),
            'score': story.get('score', 0),
            'by': story.get('by', ''),
            'time': datetime.datetime.fromtimestamp(story.get('time', 0)),
            'descendants': story.get('descendants', 0),
            'type': story.get('type', ''),
            'kids': story.get('kids', []),
            'collected_at': story.get('collected_at', '')
        }
        processed_stories.append(processed_story)
    
    # DataFrame 생성
    df = pd.DataFrame(processed_stories)
    
    # 시간 관련 필드 추가
    if 'time' in df.columns:
        df['date'] = df['time'].dt.date
        df['hour'] = df['time'].dt.hour
        df['day_of_week'] = df['time'].dt.day_name()
    
    return df

def extract_domains(df):
    """
    URL에서 도메인을 추출하여 DataFrame에 추가합니다.
    
    Args:
        df (pandas.DataFrame): 처리할 DataFrame
        
    Returns:
        pandas.DataFrame: 도메인이 추가된 DataFrame
    """
    def extract_domain(url):
        if not url or not isinstance(url, str):
            return ''
        
        # URL에서 도메인 추출
        domain_match = re.search(r'https?://(?:www\.)?([^/]+)', url)
        if domain_match:
            return domain_match.group(1)
        return ''
    
    if 'url' in df.columns:
        df['domain'] = df['url'].apply(extract_domain)
    
    return df

def analyze_stories(df):
    """
    스토리 데이터를 분석합니다.
    
    Args:
        df (pandas.DataFrame): 분석할 DataFrame
        
    Returns:
        dict: 분석 결과
    """
    analysis = {}
    
    # 기본 통계
    analysis['total_stories'] = len(df)
    analysis['avg_score'] = df['score'].mean() if 'score' in df.columns else 0
    analysis['max_score'] = df['score'].max() if 'score' in df.columns else 0
    
    # 인기 도메인
    if 'domain' in df.columns:
        domain_counts = df['domain'].value_counts().head(10).to_dict()
        analysis['top_domains'] = domain_counts
    
    # 인기 작성자
    if 'by' in df.columns:
        author_counts = df['by'].value_counts().head(10).to_dict()
        analysis['top_authors'] = author_counts
    
    # 시간대별 분포
    if 'hour' in df.columns:
        hour_counts = df['hour'].value_counts().sort_index().to_dict()
        analysis['hour_distribution'] = hour_counts
    
    # 요일별 분포
    if 'day_of_week' in df.columns:
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        day_counts = df['day_of_week'].value_counts().reindex(day_order).to_dict()
        analysis['day_distribution'] = day_counts
    
    # 키워드 분석
    if 'title' in df.columns:
        # 제목에서 단어 추출
        all_words = ' '.join(df['title'].fillna('')).lower()
        words = re.findall(r'\b[a-z][a-z0-9]{2,}\b', all_words)
        
        # 불용어 제거 (간단한 영어 불용어 목록)
        stopwords = {'the', 'and', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with', 'you', 'it'}
        filtered_words = [word for word in words if word not in stopwords]
        
        # 상위 키워드 추출
        word_counts = Counter(filtered_words).most_common(20)
        analysis['top_keywords'] = dict(word_counts)
    
    return analysis

def save_processed_data(df, analysis, date_str=None):
    """
    처리된 데이터와 분석 결과를 저장합니다.
    
    Args:
        df (pandas.DataFrame): 저장할 DataFrame
        analysis (dict): 저장할 분석 결과
        date_str (str, optional): 날짜 문자열
        
    Returns:
        tuple: (DataFrame 파일 경로, 분석 결과 파일 경로)
    """
    if not date_str:
        date_str = datetime.datetime.now().strftime('%Y-%m-%d')
    
    # DataFrame을 CSV로 저장
    df_file = PROCESSED_DIR / f"processed_stories_{date_str}.csv"
    df.to_csv(df_file, index=False, encoding='utf-8')
    
    # NumPy 타입을 Python 기본 타입으로 변환
    def convert_numpy_types(obj):
        if isinstance(obj, dict):
            return {k: convert_numpy_types(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_numpy_types(item) for item in obj]
        elif hasattr(obj, 'item'):  # NumPy 스칼라 타입 확인
            return obj.item()  # Python 기본 타입으로 변환
        else:
            return obj
    
    # 분석 결과의 NumPy 타입 변환
    analysis_converted = convert_numpy_types(analysis)
    
    # 분석 결과를 JSON으로 저장
    analysis_file = PROCESSED_DIR / f"analysis_{date_str}.json"
    with open(analysis_file, 'w', encoding='utf-8') as f:
        json.dump(analysis_converted, f, ensure_ascii=False, indent=2)
    
    print(f"Saved processed data to {df_file}")
    print(f"Saved analysis results to {analysis_file}")
    
    return str(df_file), str(analysis_file)

def process_latest_data():
    """
    최신 데이터를 처리하고 분석합니다.
    
    Returns:
        tuple: (DataFrame, 분석 결과, 저장된 파일 경로들)
    """
    # 최신 데이터 파일 찾기
    data_files = list(DATA_DIR.glob('hn_ai_startup_stories_*.json'))
    if not data_files:
        print("No data files found")
        return None, None, []
    
    # 가장 최근 파일 선택
    latest_file = max(data_files, key=os.path.getmtime)
    date_str = latest_file.stem.split('_')[-1]  # 파일 이름에서 날짜 추출
    
    # 데이터 로드
    stories = load_stories(latest_file)
    if not stories:
        return None, None, []
    
    # DataFrame 변환 및 처리
    df = convert_to_dataframe(stories)
    df = extract_domains(df)
    
    # 데이터 분석
    analysis = analyze_stories(df)
    
    # 처리된 데이터 저장
    df_file, analysis_file = save_processed_data(df, analysis, date_str)
    
    return df, analysis, [df_file, analysis_file]

def main():
    """
    메인 함수: 최신 데이터를 처리하고 분석합니다.
    """
    print("Starting data processing pipeline...")
    
    df, analysis, saved_files = process_latest_data()
    
    if df is not None:
        print(f"Processed {len(df)} stories")
        print(f"Analysis summary: {len(analysis)} metrics calculated")
    else:
        print("No data processed")

if __name__ == "__main__":
    main()
