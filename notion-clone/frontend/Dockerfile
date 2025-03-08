FROM node:22-alpine

WORKDIR /app

# package.json과 package-lock.json 파일 복사
COPY package*.json ./

# 필요한 패키지 설치
RUN npm install

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 3000

# 개발 모드로 애플리케이션 시작
CMD ["npm", "run", "dev"] 