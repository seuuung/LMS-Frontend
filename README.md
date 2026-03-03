# LMS (Learning Management System) 프론트엔드 프로젝트

학습자, 교수자, 관리자 역할에 따른 맞춤형 기능을 제공하는 LMS 웹 애플리케이션 플랫폼입니다.
기존 바닐라 자바스크립트 버전을 현대적인 **Next.js (App Router) + React** 스택으로 성공적으로 마이그레이션하여, 유지보수성과 컴포넌트 재사용성을 극대화했습니다.

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router, Turbopack) |
| 라이브러리 | React 19 |
| 스타일 | Tailwind CSS 4 + 전역 디자인 변수 (CSS Custom Properties) |
| 데이터 통신 | Client Components 기반 `useEffect` & `useState` |
| 상태 관리 | React Context API (`AuthContext`, `ToastContext`, `ConfirmContext`) |
| 커스텀 훅 | `useAuth`, `useToast`, `useConfirm` |
| 데이터 저장 | localStorage (Mock API, 향후 백엔드 전환을 위한 규격 완성) |
| 영상 플레이어 | YouTube IFrame API (`useRef`를 통한 자체 인터랙트 제어) |

## 폴더 구조

```text
LMS/
├── README.md
├── docs/                            # 시스템 및 API 설계 문서 모음
│   ├── API_설계서.md
│   ├── 요구사항 정의서.md
│   ├── QnA_게시판_구현.md
│   ├── 강의_업로드_및_재생_구현.md
│   ├── 공통_사이드바_구현.md
│   ├── 내_정보_관리_구현.md
│   ├── 인증_및_사용자_관리_구현.md
│   ├── 클래스_기본관리_CRUDS_구현.md
│   ├── 클래스_수강신청_및_관리_구현.md
│   ├── 학습_자료실_구현.md
│   ├── 학습_진도율_및_통계_구현.md
│   ├── 활동_내역_로그_구현.md
│   └── Learning...svg               # 시스템 아키텍처 다이어그램
└── lms-react/                       # Next.js 애플리케이션 루트
    ├── public/                      # 정적 파일 (favicon 등)
    └── src/
        ├── app/                     # Next.js App Router 페이지 및 레이아웃
        │   ├── globals.css          # 전역 디자인 시스템 (CSS 변수, 공통 스타일)
        │   ├── layout.js            # 최상위 HTML 구조 및 Providers 래핑
        │   ├── Providers.jsx        # Context Provider 통합 래퍼
        │   ├── page.js              # 진입 루트 (로그인 / 회원가입)
        │   ├── admin/               # 관리자 기능 라우트
        │   │   ├── page.js          #   유저/클래스 통합 관리
        │   │   └── class/[classId]/
        │   │       ├── page.js      #   클래스별 대시보드 (강의/자료/QnA/수강생)
        │   │       ├── upload/      #   강의 업로드 페이지
        │   │       └── student/[studentId]/  # 개별 학생 진도 상세 조회
        │   ├── professor/           # 교수 기능 라우트
        │   │   ├── page.js          #   클래스 목록
        │   │   └── class/[classId]/
        │   │       ├── page.js      #   클래스별 대시보드 (강의/자료/QnA/수강생)
        │   │       ├── upload/      #   강의 업로드 페이지
        │   │       └── student/[studentId]/  # 개별 학생 진도 상세 조회
        │   ├── student/             # 학생 기능 라우트
        │   │   ├── page.js          #   수강 신청 및 학습 공간
        │   │   └── class/[classId]/ #   클래스별 강의 시청/자료/QnA
        │   ├── lecture/             # 유튜브 연동 강의 시청 (건너뛰기 방지)
        │   └── lecture_stats/       # 강의별 수강률 통계 조회
        │
        ├── components/              # 재사용 가능한 UI 컴포넌트
        │   ├── layout/              # 공통 레이아웃 골격
        │   │   ├── Header.jsx       #   네비게이션 바 (뒤로가기 포함)
        │   │   └── Footer.jsx       #   하단 푸터
        │   └── ui/                  # 공용 UI 컴포넌트
        │       ├── LoadingSpinner.jsx   # 전역 로딩 스피너
        │       ├── Modal.jsx            # 전역 커스텀 오버레이 모달 창
        │       ├── StatusBadge.jsx      # 수강 상태 뱃지 (완료/진행중/미수강)
        │       ├── TabBar.jsx           # 탭 전환 바
        │       ├── EmptyState.jsx       # 빈 목록 안내 메시지
        │       ├── Sidebar.jsx          # 역할별 공통 사이드바 네비게이션
        │       ├── LectureList.jsx      # 강의 목록 (admin/professor 공용)
        │       ├── ResourceList.jsx     # 자료 목록 (전 역할 공용)
        │       ├── ResourceForm.jsx     # 자료 등록 폼 (admin/professor 공용)
        │       ├── QnaList.jsx          # QnA 게시판 (목록/상세/글쓰기 3모드)
        │       ├── EnrollmentList.jsx   # 수강생 현황 (admin/professor 공용)
        │       ├── UploadForm.jsx       # 강의 업로드 폼 (YouTube 링크 등록)
        │       ├── StudentDetail.jsx    # 개별 학생 진도 상세 뷰
        │       └── ActivityLogModal.jsx # 활동 내역 로그 모달
        │
        ├── context/                 # React Context (전역 상태)
        │   ├── AuthContext.jsx      #   인증 상태 관리 (updateUser 포함)
        │   ├── ToastContext.jsx     #   토스트 알림 관리
        │   └── ConfirmContext.jsx   #   확인 모달 관리
        │
        ├── hooks/                   # 커스텀 훅 (Context 소비 인터페이스)
        │   ├── useAuth.js
        │   ├── useToast.js
        │   └── useConfirm.js
        │
        └── lib/                     # 유틸리티 및 데이터 로직
            ├── utils.js             # 공용 헬퍼 (extractVideoId, formatDate)
            └── api/
                ├── api.js           # API 진입점 및 로딩 인터셉터 (Proxy)
                ├── api_mock.js      # localStorage 기반 Mock 구현체
                └── api_server.js    # fetch 기반 서버 API 규격 인터페이스
```

## 주요 기능

### 역할별 기능 요약

| 역할 | 주요 기능 |
|------|-----------|
| **관리자** | 전체 유저 조회·추가·수정(비밀번호 포함)·삭제, 전체 클래스 조회·생성(교수자 지정/자동 코드발급)·수정·삭제, 지정/수동 수강생 강제 등록, 클래스 내 강의/자료/QnA 관리, 활동 로그 조회 |
| **교수자** | 클래스 생성·삭제, 지정/수동 수강생 강제 등록, 강의 업로드(유튜브)·수정·삭제, 자료 등록·삭제, QnA 답변 관리, 학생별 수강률 실시간 조회 |
| **학습자** | 무제한 클래스 탐색·참여 코드를 통한 수강 신청 모달, 강의 시청(진도 자동 추적, 건너뛰기 방지, 이어보기), 자료 다운로드, QnA 작성·삭제(공개/비공개 선택) |

### 핵심 아키텍처

1. **상태 관리 (`context/` + `hooks/`)**
   - **Context-Hook 쌍 패턴**: 각 Context마다 대응하는 Custom Hook을 제공하여 사용 편의성 확보
   - `useAuth`: 역할 기반 접근 제어 + `localStorage` 기반 로그인 상태 유지 + `updateUser`로 즉시 반영
   - `useToast` / `useConfirm`: 전역 UI 피드백 (토스트 알림, 확인 모달)

2. **API 추상화 (`lib/api/`)**
   - **Mock ↔ Server 전환 구조**: `api.js`를 Proxy 진입점으로 두고 `api_mock.js` / `api_server.js`를 상호 전환
   - **글로벌 로딩 인터셉터**: 모든 API 호출 전후에 로딩 스피너를 자동 제어
   - `{ skipLoading: true }`: 백그라운드 진도율 트래킹 등 성능 민감 호출의 로딩 UI 스킵
   - **35종 REST 엔드포인트**: Promise 기반 1:1 대응 규격으로 백엔드 전환 시 무중단 교체 가능

3. **공용 컴포넌트 (`components/ui/`)**
   - 역할별 페이지에서 반복되는 UI 요소를 14개의 공용 컴포넌트로 추출
   - Props 기반 설계로 역할 간 차이를 유연하게 처리 (예: `onDelete` / `onDownload`)

4. **영상 제어 시스템 (`/app/lecture/`)**
   - `useEffect` 내 YouTube SDK 주입 및 플레이어 라이프사이클 관리
   - `useRef` 기반 타이머로 영상 건너뛰기 방지 (`checkAndEnforcePosition`)
   - 수강 진도율 자동 저장 및 이어보기 지원

### 데이터 모델 (localStorage Mock API)

| 컬렉션 | 주요 필드 |
|--------|-----------|
| `users` | id, username, password, name, role, createdAt, updatedAt |
| `classes` | id, title, description, profId, **enrollmentCode**(초대 코드), createdAt |
| `lectures` | id, classId, title, description, youtubeLink, createdAt |
| `resources` | id, classId, title, description, filename, createdAt |
| `qnas` | id, classId, authorId, title, content, isPrivate, replies[], createdAt |
| `enrollments` | id, studentId, classId, enrolledAt |
| `lecture_views` | id, studentId, lectureId, classId, progressRate, lastPosition, viewedAt |
| `logs` | id, action, entityType, entityId, message, actorId, classId, timestamp |

## 설치 및 실행

> 본 프로젝트는 **Next.js (App Router)** 기반으로 동작하므로 Node.js 환경이 필요합니다.

1. **저장소 클론**
   ```bash
   git clone https://github.com/seuuung/LMS-Frontend.git
   ```

2. **의존성 설치 및 실행**
   ```bash
   cd lms-react
   npm install      # 의존성 패키지 설치
   npm run dev      # 로컬 개발 서버 구동 (http://localhost:3000)
   ```

3. **브라우저 접속**: [http://localhost:3000](http://localhost:3000)

### 테스트 계정 안내

모든 계정의 초기 비밀번호는 **`1`** 로 세팅되어 있습니다.

| 역할 | 아이디 |
|------|--------|
| 관리자 | `admin` |
| 교수자 | `test1` |
| 학생 | `test2` |
