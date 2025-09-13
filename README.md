# 재고관리 시스템 (Inventory Manager)

직원들이 웹에서 재고를 실시간으로 조회·관리하고, 입출고 이력을 기록/검색/통계로 확인할 수 있는 풀스택 애플리케이션입니다. 프론트엔드는 Vue 3 + TypeScript + Vite, 백엔드는 Express + TypeScript 기반이며, JWT 인증과 SQLite를 사용합니다.

## 기술 스택
- Frontend: Vue 3, TypeScript, Vite, Tailwind CSS, Pinia, Vue Router
- Backend: Express, TypeScript, JWT, bcryptjs, CORS
- DB: SQLite (better-sqlite3/wasm)
- Dev: ESLint, Prettier, Nodemon, TSX, Concurrently

## 폴더 구조(요약)
- api: Express 서버(app.ts, server.ts), 라우트(routes/), 미들웨어(middleware/), DB 관련(database/)
- src: Vue 앱, 페이지(pages/), 컴포넌트(components/), 라우터(router/)
- shared: 프론트/백엔드 공용 타입
- .trae/documents: 요구사항 및 아키텍처 문서(참고용)

## 환경 변수(.env 예시)
```
PORT=8000
JWT_SECRET=your-secure-secret
JWT_EXPIRES_IN=24h
```
- PORT: 백엔드 API 서버 포트(기본 8000)
- JWT_SECRET/JWT_EXPIRES_IN: 인증 토큰 설정

## 설치 및 기동
사전 요구: Node.js LTS, pnpm(권장) 또는 npm

1) 의존성 설치
- pnpm i (또는 npm install)

2) 개발 모드 동시 실행(프론트+백엔드)
- pnpm dev (또는 npm run dev)
  - 프론트엔드: http://localhost:5173
  - 백엔드 API: http://localhost:8000
  - Vite 프록시가 /api 요청을 8000으로 전달합니다.

3) 개별 실행
- 프론트만: pnpm run client:dev
- 백엔드만: pnpm run server:dev (nodemon가 api/server.ts를 감시 재시작)

4) 빌드/프리뷰
- 프론트 빌드: pnpm run build → dist 생성
- 정적 프리뷰: pnpm run preview (프론트 정적 미리보기)
- 백엔드 실행(프로덕션 간단 실행): npx tsx api/server.ts (또는 pm2 등 프로세스 매니저 권장)

## 사용 방법(요약)
1) 로그인: 로그인 후 대시보드에서 오늘/주/월 단위 요약 통계를 확인합니다.
2) 재고 목록: 검색/정렬/필터로 재고를 조회하고 상세 페이지에서 정보/이력을 확인·수정합니다.
3) 입출고 관리: 
   - 새 거래 등록(입고/출고, 수량, 메모)
   - 거래 이력 조회(검색/유형/기간 필터, 종료일 포함으로 동작)
   - 상단 카드에서 오늘 입고/출고, 이번 주/월 합계를 확인
4) 사용자/설정: 관리자 전용 사용자 관리, 프로필 및 시스템 설정

## 주요 API(요약)
- 인증: POST /api/auth/login → JWT 토큰 발급
- 재고: GET/POST/PUT/DELETE /api/inventory(,/ :id)
- 입출고: 
  - GET /api/transactions (검색/유형/기간/정렬 필터 지원)
  - POST /api/transactions (입출고 등록)
  - GET /api/transactions/inventory/:id(\d+)
  - GET /api/transactions/stats (오늘/주/월 요약)
- 사용자(관리자): GET/POST/PUT/DELETE /api/users(,/ :id)

프론트엔드는 Vite 프록시(vite.config.ts)로 /api → http://localhost:8000 에 위임됩니다. 백엔드 라우터는 app.use('/api/...') 경로로 마운트됩니다.

## 품질 관리
- 타입/빌드 체크: pnpm run check
- 린트: pnpm run lint (자동 수정: pnpm run lint:fix)

## 자주 묻는 질문(FAQ)
- /api 요청이 404에요
  - 백엔드가 8000에서 실행 중인지 확인하세요.
  - 프론트 개발 서버 로그에서 프록시가 8000으로 라우팅되는지 확인하세요.
- /api/transactions/stats 404
  - 서버 재시작 후에도 404라면 라우팅 충돌 여부를 확인하세요. 현재 코드에서는 /api/transactions/:id 를 숫자만 매칭하도록 제한해 충돌을 방지했습니다.

## 참고 문서
- ./.trae/documents/inventory_management_system_requirements.md
- ./.trae/documents/technical_architecture_document.md

## 운영 배포 가이드

본 프로젝트는 로컬/개발 환경에서는 JSON 파일 기반 저장소를 사용합니다. 운영 환경에서는 영속 스토리지가 필수이며, 서버리스(예: Vercel)에서는 디스크가 비영속이므로 별도의 DB 도입 또는 아키텍처 변경이 필요합니다.

### 공통 준비
- Node.js LTS, pnpm 또는 npm 설치
- 환경 변수 설정(서버): PORT, JWT_SECRET, JWT_EXPIRES_IN
- 빌드: `pnpm run build` (프런트엔드 dist 생성)

### 1) PM2 + Nginx (단일 서버 배포)
1. 백엔드 서비스 실행(PM2)
   - 예: `pm2 start "tsx api/server.ts" --name inventory-api`
   - 재시작 정책/로그 로테이션 등은 PM2 설정으로 구성 권장
2. 프런트엔드 배포(Nginx)
   - dist 폴더를 Nginx `root`로 지정, SPA 라우팅을 위해 `try_files` 사용
   - /api는 127.0.0.1:8000으로 리버스 프록시

예시 Nginx 설정(요약):
```
server {
  listen 80;
  server_name your_domain_or_ip;

  root /var/www/inventory-manager/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:8000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }
}
```

데이터 영속성: `/data/inventory.json`이 위치한 프로젝트의 data 디렉터리에 쓰기 권한과 백업 정책을 부여하세요.

### 2) Vercel (Serverless)
- 이 레포는 이미 <mcfile name="vercel.json" path="c:\workspaces\workspace-trae\inventory-manager\vercel.json"></mcfile> 과 <mcfile name="api/index.ts" path="c:\workspaces\workspace-trae\inventory-manager\api\index.ts"></mcfile>를 포함합니다.
- 설정 권장
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Environment Variables: JWT_SECRET, JWT_EXPIRES_IN (필수), PORT는 무시 가능
- 주의: Vercel의 함수/디스크는 비영속입니다. 현재 JSON 파일 DB는 운영 사용에 적합하지 않습니다. 운영에서는 별도의 지속형 DB(예: 외부 SQLite 호스팅/클라우드 DB)로 전환해야 합니다.

### 3) Render
- 권장 구성
  - Static Site: Build `npm run build`, Publish Directory `dist`
  - Web Service(Node): Start `npx tsx api/server.ts`, Environment JWT_SECRET/JWT_EXPIRES_IN 설정
  - Persistent Disk를 API 서비스에 연결하여 `data/` 디렉터리를 영속화(또는 외부 DB 도입)
- 프런트에서 백엔드로의 /api 프록시는 Render의 Static Site "Redirects/Proxies" 설정을 사용해 `/api/* -> https://<backend-service>/*`로 프록시 규칙 추가를 권장합니다.

---

## 데이터 시드/마이그레이션 절차

### 1) JSON DB 초기화/시드(현재 기본)
- 최초 실행 시 <mcfile name="database.ts" path="c:\workspaces\workspace-trae\inventory-manager\api\database\database.ts"></mcfile>의 DatabaseManager가 `data/inventory.json`을 생성하고 기본 데이터(관리자, 카테고리, 샘플 재고)를 시드합니다.
- 기본 관리자 계정: `admin / admin123` (운영 배포 후 즉시 변경 권장)
- 트랜잭션 샘플 데이터는 기본으로 생성되지 않습니다(입출고는 UI 또는 API로 등록).

초기화/리셋 방법
- 서버 중지 → `data/inventory.json` 삭제 → 서버 재기동(파일 자동 재생성)
- 백업/복원: 서버 중지 후 해당 파일을 복사/교체

### 2) 레거시 사용자 마이그레이션(자동)
- DatabaseManager는 시작 시 `migrateLegacyUsers()`로 평문 password를 bcrypt 해시로 변환하고 필드를 정리합니다.
- `updateAdminPassword()`가 기본 관리자 비밀번호를 보정합니다. 운영에서는 사용자 관리 화면 또는 별도 스크립트로 즉시 변경하세요.

### 3) SQLite 마이그레이션(옵션)
- 스키마/트리거/기본 데이터는 <mcfile name="init.sql" path="c:\workspaces\workspace-trae\inventory-manager\api\database\init.sql"></mcfile>에 정의되어 있습니다.
- DB 생성 예시(로컬):
  - `sqlite3 inventory.db < api/database/init.sql`
- 주의: 현재 애플리케이션은 JSON DB를 사용합니다. SQLite로 전환하려면
  1) 저장소 레이어(Repository)를 구현하여 SQLite 드라이버를 사용하도록 변경
  2) 라우트에서 사용하는 데이터 접근부를 새 Repository로 교체
  3) 운영 환경에서 DB 파일 경로/권한/백업 정책 수립

---

추가 문서화가 필요하시면 운영 환경에 맞춘 상세 가이드를(예: 도메인/TLS 설정, PM2 에코시스템 파일, Render 프로비저닝 스텝) 더 작성해 드릴게요.
