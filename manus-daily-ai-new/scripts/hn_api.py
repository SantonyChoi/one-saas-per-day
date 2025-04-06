#!/usr/bin/env python3
"""
Hacker News API 접근 모듈
Y Combinator Hacker News에서 AI 관련 스타트업 정보를 수집합니다.
"""

import requests
import json
import time
import os
import datetime
from pathlib import Path

# 기본 경로 설정
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
REPORTS_DIR = BASE_DIR / "reports"

# 데이터 디렉토리가 없으면 생성
DATA_DIR.mkdir(exist_ok=True)
REPORTS_DIR.mkdir(exist_ok=True)

# Hacker News API 엔드포인트
HN_API_BASE = "https://hacker-news.firebaseio.com/v0"
HN_ITEM_URL = f"{HN_API_BASE}/item"
HN_TOP_STORIES_URL = f"{HN_API_BASE}/topstories.json"
HN_NEW_STORIES_URL = f"{HN_API_BASE}/newstories.json"
HN_SHOW_STORIES_URL = f"{HN_API_BASE}/showstories.json"
HN_ASK_STORIES_URL = f"{HN_API_BASE}/askstories.json"

# AI 관련 키워드 (소문자로 저장)
AI_KEYWORDS = [
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 
    'neural network', 'llm', 'large language model', 'gpt', 'chatgpt', 'openai',
    'stable diffusion', 'midjourney', 'diffusion model', 'generative ai', 'gen ai',
    'computer vision', 'nlp', 'natural language processing', 'transformer',
    'reinforcement learning', 'rl', 'autonomous', 'robotics', 'automation',
    'anthropic', 'claude', 'gemini', 'mistral', 'llama', 'bert', 'gato',
    'multimodal', 'vector database', 'embedding', 'fine-tuning', 'rag',
    'prompt engineering', 'ai agent', 'ai assistant', 'foundation model'
]

# 스타트업 관련 키워드 (소문자로 저장)
STARTUP_KEYWORDS = [
    'startup', 'venture', 'seed', 'series a', 'series b', 'funding', 'raised',
    'launch', 'founded', 'founder', 'yc', 'y combinator', 'incubator', 'accelerator',
    'angel investor', 'vc', 'venture capital', 'valuation', 'exit', 'acquisition',
    'ipo', 'bootstrap', 'saas', 'b2b', 'b2c', 'product market fit', 'mvp',
    'scale', 'scaling', 'growth', 'revenue', 'customer', 'pitch', 'demo day'
]

def get_stories(story_type='top', limit=100):
    """
    Hacker News에서 스토리 ID 목록을 가져옵니다.
    
    Args:
        story_type (str): 스토리 유형 ('top', 'new', 'show', 'ask')
        limit (int): 가져올 스토리 수
        
    Returns:
        list: 스토리 ID 목록
    """
    url_map = {
        'top': HN_TOP_STORIES_URL,
        'new': HN_NEW_STORIES_URL,
        'show': HN_SHOW_STORIES_URL,
        'ask': HN_ASK_STORIES_URL
    }
    
    url = url_map.get(story_type, HN_TOP_STORIES_URL)
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        story_ids = response.json()
        return story_ids[:limit]
    except requests.exceptions.RequestException as e:
        print(f"Error fetching stories: {e}")
        return []

def get_item_details(item_id):
    """
    특정 아이템(스토리, 댓글 등)의 세부 정보를 가져옵니다.
    
    Args:
        item_id (int): 아이템 ID
        
    Returns:
        dict: 아이템 세부 정보
    """
    url = f"{HN_ITEM_URL}/{item_id}.json"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching item {item_id}: {e}")
        return None

def is_ai_startup_related(item):
    """
    아이템이 AI 스타트업 관련인지 확인합니다.
    
    Args:
        item (dict): 아이템 세부 정보
        
    Returns:
        bool: AI 스타트업 관련 여부
    """
    if not item:
        return False
    
    # 제목과 텍스트 추출 (소문자로 변환)
    title = item.get('title', '').lower()
    text = item.get('text', '').lower()
    url = item.get('url', '').lower()
    
    # 텍스트 결합
    combined_text = f"{title} {text} {url}"
    
    # AI 키워드 확인
    has_ai_keyword = any(keyword in combined_text for keyword in AI_KEYWORDS)
    
    # 스타트업 키워드 확인
    has_startup_keyword = any(keyword in combined_text for keyword in STARTUP_KEYWORDS)
    
    # AI 관련 키워드가 있으면 관련 있는 것으로 간주
    # 스타트업 키워드가 있으면 더 관련성이 높음
    return has_ai_keyword or has_startup_keyword

def fetch_ai_startup_stories(story_types=['top', 'new', 'show'], limit_per_type=100, max_stories=50):
    """
    여러 유형의 스토리에서 AI 스타트업 관련 스토리를 수집합니다.
    
    Args:
        story_types (list): 수집할 스토리 유형 목록
        limit_per_type (int): 각 유형별로 가져올 스토리 수
        max_stories (int): 처리할 최대 스토리 수 (모든 유형 합계)
        
    Returns:
        list: AI 스타트업 관련 스토리 목록
    """
    ai_startup_stories = []
    total_stories_processed = 0
    
    for story_type in story_types:
        print(f"Fetching {story_type} stories...")
        story_ids = get_stories(story_type, limit_per_type)
        
        for i, story_id in enumerate(story_ids):
            # 최대 스토리 수 확인
            if total_stories_processed >= max_stories:
                print(f"Reached maximum number of stories to process ({max_stories})")
                return ai_startup_stories
                
            # 진행 상황 표시 (10개마다)
            if i % 10 == 0:
                print(f"Processing {story_type} story {i+1}/{len(story_ids)}...")
                
            # API 요청 간 지연 추가 (0.5초로 증가)
            time.sleep(0.5)
            
            item = get_item_details(story_id)
            if item and is_ai_startup_related(item):
                # 수집 시간 추가
                item['collected_at'] = datetime.datetime.now().isoformat()
                ai_startup_stories.append(item)
                
                print(f"Found AI startup related story: {item.get('title')}")
            
            total_stories_processed += 1
    
    return ai_startup_stories

def save_stories_to_file(stories, filename=None):
    """
    수집된 스토리를 JSON 파일로 저장합니다.
    
    Args:
        stories (list): 저장할 스토리 목록
        filename (str, optional): 저장할 파일 이름
        
    Returns:
        str: 저장된 파일 경로
    """
    if not filename:
        # 현재 날짜를 파일 이름에 포함
        today = datetime.datetime.now().strftime('%Y-%m-%d')
        filename = f"hn_ai_startup_stories_{today}.json"
    
    file_path = DATA_DIR / filename
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(stories, f, ensure_ascii=False, indent=2)
    
    print(f"Saved {len(stories)} stories to {file_path}")
    return str(file_path)

def main():
    """
    메인 함수: AI 스타트업 관련 스토리를 수집하고 저장합니다.
    """
    print("Starting Hacker News AI startup stories collection...")
    
    # 여러 유형의 스토리에서 AI 스타트업 관련 스토리 수집
    ai_startup_stories = fetch_ai_startup_stories()
    
    # 결과가 있으면 파일로 저장
    if ai_startup_stories:
        save_stories_to_file(ai_startup_stories)
        print(f"Collected {len(ai_startup_stories)} AI startup related stories")
    else:
        print("No AI startup related stories found")

if __name__ == "__main__":
    main()
