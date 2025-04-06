# AI 스타트업 동향 트래커 사용 설명서

## 개요

이 시스템은 Y Combinator Hacker News에서 AI 관련 스타트업 동향을 자동으로 수집하고 분석하여 정기적인 리포트를 생성합니다. 매일 최신 AI 스타트업 정보를 한눈에 볼 수 있는 HTML 리포트를 제공합니다.

## 시스템 구성

- **데이터 수집**: Hacker News API를 통해 AI 및 스타트업 관련 스토리를 수집합니다.
- **데이터 처리**: 수집된 데이터를 분석하여 유용한 인사이트를 추출합니다.
- **리포트 생성**: 분석된 데이터를 기반으로 시각적으로 보기 좋은 HTML 리포트를 생성합니다.
- **자동화**: 스케줄러를 통해 전체 프로세스를 자동화하여 정기적으로 실행합니다.

## 설치 및 요구사항

이 시스템은 다음과 같은 Python 패키지를 사용합니다:
- requests
- beautifulsoup4
- pandas
- schedule
- jinja2

시스템 실행 시 자동으로 필요한 패키지를 확인하고 설치합니다.

## 사용 방법

### 기본 명령어

시스템의 루트 디렉토리에서 다음 명령어를 사용할 수 있습니다:

```bash
# 전체 시스템 테스트
python3 main.py test

# 전체 파이프라인 한 번 실행
python3 main.py run

# 데이터 수집만 실행
python3 main.py collect

# 데이터 처리만 실행
python3 main.py process

# 리포트 생성만 실행
python3 main.py report

# 스케줄러 시작 (백그라운드 자동 실행)
python3 main.py schedule
```

### 스케줄링 설정

기본적으로 시스템은 다음과 같은 일정으로 작업을 수행합니다:

- **데이터 수집**: 매 시간마다 실행
- **데이터 처리**: 매 시간 15분에 실행
- **리포트 생성**: 매일 오후 6시(18:00)에 실행
- **전체 파이프라인**: 매일 오전 8시(08:00)에 실행

스케줄링 설정을 변경하려면 `scripts/scheduler.py` 파일의 `setup_schedule()` 함수를 수정하세요.

## 디렉토리 구조

```
ai_news_tracker/
├── data/               # 수집된 데이터 저장
│   └── processed/      # 처리된 데이터 저장
├── logs/               # 로그 파일 저장
├── reports/            # 생성된 리포트 저장
├── scripts/            # 시스템 스크립트
│   ├── hn_api.py       # Hacker News API 접근 모듈
│   ├── data_processor.py # 데이터 처리 모듈
│   ├── report_generator.py # 리포트 생성 모듈
│   └── scheduler.py    # 스케줄링 모듈
├── templates/          # 리포트 템플릿
│   └── report_template.html # HTML 리포트 템플릿
├── main.py             # 메인 실행 스크립트
└── README.md           # 사용 설명서
```

## 리포트 확인

생성된 리포트는 `reports/` 디렉토리에 저장됩니다. 가장 최근에 생성된 리포트는 다음 명령어로 확인할 수 있습니다:

```bash
python3 main.py report
```

리포트는 HTML 형식으로 생성되며, 웹 브라우저에서 열어서 확인할 수 있습니다.

## 커스터마이징

### AI 및 스타트업 키워드 수정

AI 및 스타트업 관련 키워드를 수정하려면 `scripts/hn_api.py` 파일의 `AI_KEYWORDS` 및 `STARTUP_KEYWORDS` 변수를 수정하세요.

### 리포트 템플릿 수정

리포트 디자인을 수정하려면 `templates/report_template.html` 파일을 수정하세요. 이 파일은 HTML, CSS, JavaScript로 구성되어 있으며, 원하는 대로 디자인을 변경할 수 있습니다.

### 데이터 분석 방법 수정

데이터 분석 방법을 수정하려면 `scripts/data_processor.py` 파일의 `analyze_stories()` 함수를 수정하세요.

## 문제 해결

### 로그 확인

시스템 실행 중 문제가 발생하면 `logs/` 디렉토리의 로그 파일을 확인하세요:

- `main.log`: 메인 스크립트 로그
- `scheduler.log`: 스케줄러 로그

### 일반적인 문제

1. **데이터 수집 실패**: 인터넷 연결을 확인하고, Hacker News API가 정상적으로 작동하는지 확인하세요.
2. **리포트 생성 실패**: 데이터 파일이 올바르게 생성되었는지 확인하세요.
3. **스케줄러 작동 중단**: 로그를 확인하고 필요한 경우 스케줄러를 재시작하세요.

## 추가 기능 개발

이 시스템은 확장 가능하도록 설계되었습니다. 다음과 같은 기능을 추가로 개발할 수 있습니다:

1. 이메일을 통한 리포트 자동 전송
2. 웹 인터페이스를 통한 리포트 확인
3. 추가 데이터 소스(Twitter, LinkedIn 등) 통합
4. 자연어 처리를 통한 더 정교한 분석

추가 기능 개발을 위해서는 해당 모듈을 수정하거나 새로운 모듈을 추가하세요.
