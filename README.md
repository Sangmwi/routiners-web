# Routiners Web (루티너스 웹)

현역 군인을 위한 피트니스 & 웰니스 웹 애플리케이션

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.1 (App Router) |
| Language | TypeScript 5 |
| UI | React 19.2, Tailwind CSS 4 |
| State | Zustand 5.0 (Client), React Query 5.9 (Server) |
| Backend | Supabase (PostgreSQL + Auth) |
| AI | OpenAI API (GPT-4) |
| Validation | Zod 3.24 |
| Icons | Phosphor Icons |

## Project Structure

```
routiners-web/
├── app/                      # Next.js App Router
│   ├── (auth)/               # 인증 관련 페이지
│   │   ├── login/            # 로그인
│   │   └── signup/           # 회원가입
│   ├── (main)/               # 메인 앱 페이지
│   │   ├── profile/          # 프로필 관리
│   │   ├── routine/          # 루틴 관리
│   │   │   ├── calendar/     # 캘린더 뷰
│   │   │   ├── coach/        # AI 코치
│   │   │   ├── meal/         # 식단 관리
│   │   │   ├── workout/      # 운동 기록
│   │   │   └── stats/        # 통계
│   │   └── community/        # 커뮤니티
│   └── api/                  # API Routes
│       ├── auth/             # 인증 API
│       ├── coach/            # AI 코치 API
│       ├── community/        # 커뮤니티 API
│       ├── inbody/           # 인바디 데이터 API
│       ├── routine/          # 루틴 API
│       └── user/             # 사용자 API
├── components/               # React 컴포넌트 (179개)
│   ├── coach/                # AI 코치 UI
│   ├── common/               # 공통 컴포넌트
│   ├── community/            # 커뮤니티 컴포넌트
│   ├── home/                 # 홈 화면
│   ├── inbody/               # 인바디 측정
│   ├── profile/              # 프로필 관련
│   ├── routine/              # 루틴 관련
│   ├── signup/               # 회원가입 플로우
│   └── ui/                   # 기본 UI 컴포넌트
├── lib/
│   ├── ai/                   # AI 통합 (23개 파일)
│   │   ├── chat-handlers/    # 채팅 핸들러
│   │   ├── executors/        # 액션 실행기
│   │   ├── stream/           # SSE 스트리밍
│   │   ├── system-prompts/   # 시스템 프롬프트
│   │   ├── tools.ts          # AI 도구 정의
│   │   └── schemas.ts        # Zod 스키마
│   ├── stores/               # Zustand 스토어
│   │   ├── appStore.ts       # 앱 상태
│   │   ├── errorStore.ts     # 에러 상태
│   │   └── modalStore.ts     # 모달 상태
│   ├── schemas/              # Zod 검증 스키마
│   ├── config/               # 설정 (테마 등)
│   ├── constants/            # 상수 정의
│   ├── providers/            # React Providers
│   ├── types/                # TypeScript 타입
│   └── utils/                # 유틸리티 함수
├── utils/
│   └── supabase/             # Supabase 클라이언트
│       ├── client.ts         # 브라우저용
│       ├── server.ts         # 서버용
│       └── auth.ts           # 인증 유틸
├── public/                   # 정적 파일
├── docs/                     # 문서
│   ├── ARCHITECTURE.md       # 아키텍처 문서
│   ├── DESIGN_SYSTEM.md      # 디자인 시스템
│   └── REACT_QUERY_GUIDE.md  # React Query 가이드
└── middleware.ts             # 인증 미들웨어
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 또는 yarn
- Supabase 프로젝트
- OpenAI API Key

### Installation

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일을 열어 본인 환경에 맞게 수정
```

### Development

```bash
# 개발 서버 시작
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### Build & Deploy

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start

# 린트 검사
npm run lint
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (서버용) | Yes |
| `SUPABASE_PROJECT_ID` | Supabase 프로젝트 ID (타입 생성용) | No |
| `OPENAI_API_KEY` | OpenAI API Key | Yes |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | 개발 서버 시작 |
| `npm run build` | 프로덕션 빌드 |
| `npm start` | 프로덕션 서버 시작 |
| `npm run lint` | ESLint 검사 |
| `npm run db:types` | Supabase 타입 생성 (원격) |
| `npm run db:types:local` | Supabase 타입 생성 (로컬) |

## Key Features

### AI Coach (AI 코치)

OpenAI GPT-4를 활용한 개인화된 피트니스 코칭:

- 실시간 스트리밍 응답 (SSE)
- 대화 컨텍스트 유지
- 루틴 추천 및 적용
- 식단 조언

### InBody Integration (인바디 연동)

체성분 분석 데이터 관리:

- OCR 스캔을 통한 자동 입력
- 체성분 변화 추적
- 목표 설정 및 달성률

### Routine Management (루틴 관리)

- 캘린더 기반 일정 관리
- 운동/식단 기록
- 통계 및 분석

### Community (커뮤니티)

- 게시글 작성/조회
- 댓글 및 좋아요
- 이미지 업로드

## Architecture

### Authentication Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  Middleware  │────▶│   Supabase  │
│  (Browser)  │     │  (Auth Check)│     │    Auth     │
└─────────────┘     └──────────────┘     └─────────────┘
```

1. 사용자가 Google OAuth로 로그인
2. Middleware가 모든 요청에서 세션 검증
3. 세션 없으면 로그인 페이지로 리다이렉트

### API Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  API Routes  │────▶│   Supabase  │
│             │     │  (Next.js)   │     │  PostgreSQL │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   OpenAI    │
                    │     API     │
                    └─────────────┘
```

### State Management

- **Server State**: React Query로 서버 데이터 캐싱/동기화
- **Client State**: Zustand로 UI 상태 관리 (모달, 에러 등)

## WebView Integration

모바일 앱 (`routiners-app`)에서 WebView로 렌더링됩니다:

```
┌─────────────────────────────────────────────────────┐
│                   React Native App                   │
│  ┌───────────────────────────────────────────────┐  │
│  │                    WebView                     │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │           Routiners Web (Next.js)        │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

`lib/webview/` 디렉토리에서 Native ↔ Web 통신을 관리합니다.

## Database Schema

주요 테이블:

- `users`: 사용자 프로필 (군 정보, 피트니스 목표 등)
- `threads`: AI 대화 스레드
- `messages`: AI 대화 메시지

Supabase 타입 생성:

```bash
# 원격 DB에서 타입 생성
npm run db:types

# 로컬 Supabase에서 타입 생성
npm run db:types:local
```

## Documentation

자세한 문서는 `docs/` 디렉토리를 참조하세요:

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - 전체 아키텍처
- [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) - 디자인 시스템
- [REACT_QUERY_GUIDE.md](docs/REACT_QUERY_GUIDE.md) - React Query 패턴

## Related Projects

- [routiners-app](../routiners-app) - Expo/React Native 모바일 앱
