# Sports Discovery Platform

주변 스포츠 시설을 찾고 추천받는 웹 플랫폼입니다. Naver Maps API를 활용하여 사용자 위치 기반으로 스포츠 시설을 표시합니다.

## 주요 기능

- 🏃 100가지 스포츠 종목 선택
- 📍 Naver Maps 기반 위치 검색
- 🎯 맞춤형 시설 추천
- 🔍 실시간 검색 기능
- 👤 사용자 프로필 관리
- 🗺️ 스포츠별 맞춤 이모지 마커

## 기술 스택

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcrypt

### Frontend
- React 18
- React Router v6
- Axios
- Vite
- Naver Maps JS API v3

## 설치 및 실행

### 사전 요구사항

1. Node.js (v18 이상)
2. MongoDB (로컬 또는 MongoDB Atlas)
3. Naver Maps Client ID ([발급 방법](https://www.ncloud.com/product/applicationService/maps))

### 설치

```bash
# 모든 의존성 설치
npm run install-all
```

### 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성하고 값을 입력하세요:

```bash
cp .env.example .env
```

`.env` 파일:
```
MONGODB_URI=mongodb://localhost:27017/sports-discovery
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=development
NAVER_MAPS_CLIENT_ID=your_naver_client_id
```

`client/index.html` 파일에서 Naver Maps Client ID를 교체하세요:
```html
<script type="text/javascript" src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=YOUR_NAVER_CLIENT_ID"></script>
```

### 개발 서버 실행

```bash
# 클라이언트와 서버 동시 실행
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### 프로덕션 빌드

```bash
# 클라이언트 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## Cloudtype 배포

1. Cloudtype 계정 생성
2. GitHub 저장소 연결
3. Dockerfile을 사용하여 자동 배포
4. 환경 변수 설정 (MongoDB URI, JWT Secret, Naver Maps Client ID)

## 프로젝트 구조

```
sports-discovery/
├── server/                 # Backend
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── middleware/        # Auth middleware
│   └── server.js          # Express server
├── client/                # Frontend
│   ├── src/
│   │   ├── pages/        # React pages
│   │   ├── components/   # Reusable components
│   │   ├── styles/       # CSS files
│   │   ├── utils/        # Utilities
│   │   └── App.jsx       # Main app
│   └── index.html
├── Dockerfile             # For Cloudtype deployment
└── package.json           # Root package
```

## 라이선스

MIT
