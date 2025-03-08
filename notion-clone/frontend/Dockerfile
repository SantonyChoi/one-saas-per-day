FROM node:20-alpine

WORKDIR /app

# 먼저 package.json이 있는지 확인
RUN ls -la

# package.json이 없으면 빈 파일 생성
RUN touch package.json && echo '{"name":"frontend","version":"0.1.0","private":true,"scripts":{"dev":"next dev","build":"next build","start":"next start"}}' > package.json

# 필요한 디렉토리 생성
RUN mkdir -p src/app src/components src/lib src/types

# 필요한 패키지 설치
RUN npm install next react react-dom react-markdown socket.io-client react-icons marked
RUN npm install --save-dev typescript @types/node @types/react @types/react-dom

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 3000

# 개발 모드로 애플리케이션 시작
CMD ["npm", "run", "dev"] 