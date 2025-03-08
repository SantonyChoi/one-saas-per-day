FROM node:20-alpine

WORKDIR /app

# 먼저 package.json이 있는지 확인
RUN ls -la

# package.json이 없으면 빈 파일 생성
RUN touch package.json && echo '{"name":"backend","version":"1.0.0","type":"module","scripts":{"dev":"nodemon --exec ts-node --esm src/index.ts","build":"tsc","start":"node dist/index.js"}}' > package.json

# 필요한 디렉토리 생성
RUN mkdir -p src

# 필요한 패키지 설치
RUN npm install express cors bcrypt jsonwebtoken cookie-parser socket.io better-sqlite3 dotenv
RUN npm install --save-dev typescript @types/node @types/express @types/cors @types/bcrypt @types/jsonwebtoken @types/cookie-parser @types/better-sqlite3 ts-node nodemon

# 소스 코드 복사
COPY . .

# 데이터 디렉토리 생성
RUN mkdir -p /app/data && chmod 777 /app/data

# 포트 노출
EXPOSE 4000

# 개발 모드로 애플리케이션 시작
CMD ["npm", "run", "dev"] 