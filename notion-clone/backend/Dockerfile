FROM node:20-alpine

WORKDIR /app

# package.json 파일 복사
COPY package.json ./

# 필요한 패키지 설치
RUN npm install

# 소스 코드 복사
COPY . .

# 데이터 디렉토리 생성
RUN mkdir -p /app/data && chmod 777 /app/data

# 포트 노출
EXPOSE 4000

# 개발 모드로 애플리케이션 시작
CMD ["npm", "run", "dev"] 