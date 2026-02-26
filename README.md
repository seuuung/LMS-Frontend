# LMS (Learning Management System) 프론트엔드 프로젝트

학습자, 교수자, 관리자 역할에 따른 맞춤형 기능을 제공하는 LMS 프론트엔드 플랫폼입니다.
바닐라 자바스크립트(ES6+ Module) 기반으로 동작하며, 유지보수의 용이성을 위해 기능 및 역할 단위로 파일 구조가 분리되어 있습니다.

## 기술 스택

| 분류 | 기술 |
|------|------|
| 마크업 | HTML5 |
| 스타일 | CSS3 (CSS 변수 기반 디자인 시스템) |
| 스크립트 | JavaScript (ES6+ Module) |
| 데이터 저장 | localStorage (Mock API, 향후 백엔드 전환 대비) |
| 영상 플레이어 | YouTube IFrame API |

## 폴더 구조

```text
LMS/
├── index.html                # 메인 진입점 (로그인/회원가입)
├── README.md
├── css/
│   └── style.css             # 전역 디자인 시스템 (CSS 변수, 공통 컴포넌트, 뱃지)
├── docs/
│   ├── API_설계서.md            # 프론트-백엔드 연동 32종 REST 통신 명세서
│   ├── 요구사항 정의서.md       # 기능 요구사항 정의서
│   └── Learning...svg        # 시스템 아키텍처 다이어그램
├── js/
│   ├── api.js                # API 진입점 (Mock/Real 스위치)
│   ├── api_mock.js           # Mock API 로직 (localStorage 기반)
│   ├── api_server.js         # 실제 서버 연동 API (fetch 기반 뼈대)
│   ├── auth.js               # 로그인/회원가입 처리 로직
│   ├── common.js             # 공통 유틸 (인증, UI, XSS 방지, 탭, 뱃지, 에러 핸들링)
│   ├── admin.js              # 관리자 대시보드 (유저 관리·클래스 검색·생성·수정)
│   ├── admin_class.js        # 관리자 클래스 상세 (강의·자료·QnA 수정·생성·삭제)
│   ├── professor.js          # 교수자 클래스 목록 및 생성
│   ├── professor_class.js    # 교수자 클래스 상세 (강의·자료·QnA·수강생 관리)
│   ├── professor_upload.js   # 강의 업로드 (유튜브 링크 등록 + 자료 첨부)
│   ├── student.js            # 학습자 클래스 탐색 및 수강 신청
│   ├── student_class.js      # 학습자 클래스 상세 (강의 시청·자료·QnA)
│   ├── lecture_stats.js      # 강의 수강률 통계 (수강생별 진도 매핑)
│   └── lecture.js            # 강의 시청 (YouTube 플레이어 + 진도 추적 + 편집)
└── pages/
    ├── admin.html            # 관리자 대시보드 메인
    ├── admin_class.html      # 관리자 전용 클래스 상세 관리 (강의 수정·자료 수정·QnA 생성·삭제)
    ├── professor.html        # 교수자 클래스 목록
    ├── professor_class.html  # 교수자 클래스 상세 대시보드
    ├── professor_upload.html # 강의 업로드 폼
    ├── lecture_stats.html    # 강의 수강률 통계 상세
    ├── student.html          # 학습자 메인 (탐색/내 학습 공간)
    ├── student_class.html    # 학습자 클래스 상세
    └── lecture.html          # 강의 시청 전용 뷰
```

## 주요 기능

### 역할별 기능 요약

| 역할 | 주요 기능 |
|------|-----------| 
| **관리자** | 전체 유저 조회·추가·이름 수정·역할 변경·삭제, 전체 클래스 조회·검색·생성(교수자 지정)·수정·삭제, **클래스 내 강의 수정·자료 수정·QnA 생성·삭제, 소유권(담당 교수) 즉시 이전 가능 (`admin_class.html`)** |
| **교수자** | 클래스 생성·삭제, 강의 업로드(유튜브)·수정·삭제, 자료 등록·삭제, QnA 관리, **강의별 학생 수강률 실시간 통계 확인** |
| **학습자** | 클래스 탐색·수강 신청, 강의 시청(진도율 자동 추적, 건너뛰기 방지, **이어보기 기능**), 자료 다운로드, QnA 작성·삭제 |

### 핵심 모듈 설명

1. **API 아키텍처 (`api.js`, `api_mock.js`, `api_server.js`)**
   - **환경 전환**: `api.js` 내의 `USE_MOCK_API` 플래그를 통해 디버깅 모드(localStorage)와 서버 연동 모드(fetch)를 즉시 전환 가능
   - **전역 로딩 UI (Proxy 패턴)**: `api.js` 내부에서 Proxy를 사용해, Mock/Real 상관없이 모든 API 호출의 시작과 끝에 글로벌 로딩 스피너 UI가 자동 연동
   - **선택적 백그라운드 스피너 무시**: `{ skipLoading: true }` 옵션을 전달하여 수강률 자동 저장과 같은 백그라운드 요청 시 렌더링 방해 요소 차단
   - **Mock API**: `api_mock.js`에서 `localStorage`를 활용하여 기능 테스트 지원 (`crypto.randomUUID()`를 활용한 안전한 식별자 체계 도입)
   - **Real API**: `api_server.js` 기반 `fetch` 프로토콜 골격 제공 (현재 32종의 Front API 호출 구조와 100% 1:1 매핑 연동 구현 확보)

2. **공통 유틸 (`common.js`)**
   - `requireAuth()`: 역할 기반 접근 제어 (라우팅 가드 및 관리자 무적 패스 지원)
   - `renderNavbar()` / `renderFooter()`: 동적 레이아웃 렌더링
   - `showToast()`: 알림 메시지 표시
   - `confirmDelete()`: 네이티브 팝업창을 대체하는 자체 제작(Custom) DOM 렌더링 **Promise 기반의 삭제/위험 모달 컴포넌트**
   - `escapeHtml()`: XSS 방지를 위한 HTML 이스케이프 처리
   - `extractVideoId()`: 유튜브 링크에서 Video ID 추출 (여러 링크 형식 지원)
   - `renderStatusBadge()`: 수강 상태(완료/진행중/미수강) 뱃지 HTML 생성
   - `initTabs()`: 탭 전환 UI 초기화 공통 함수
   - `handleApiError()`: API 호출 에러 통합 핸들링

3. **강의 시청 및 진도 관리 (`lecture.js`)**
   - YouTube IFrame API를 활용한 영상 재생 및 상태 감지
   - 3초 간격 자동 진도율 추적 및 학습 이력 저장
   - **강력한 건너뛰기 방지**: 미시청 구간으로 점프 시 강제 복귀 (수강 완료 시 제한 해제)
   - **이어보기 지원**: 마지막 시청 위치(`lastPosition`)를 저장하여 재접속 시 자동 복구
   - **메모리 보호**: `beforeunload` 이벤트 연동으로 페이지 이탈 시 타이머(setInterval) 완전 해제
   - **교수자 편집 기능**: 실시간 강의 제목, 설명, 영상 링크 수정 및 첨부파일 관리

### 코드 패턴

- **이벤트 위임(Event Delegation)**: 동적 생성 요소의 이벤트를 `data-action` 속성과 부모 컨테이너 위임으로 처리
- **XSS 방지**: 사용자 입력(`title`, `name`, `description` 등)을 `innerHTML`에 삽입 시 `escapeHtml()` 적용
- **CSS 기반 뱃지**: 상태별 뱃지 스타일을 CSS 클래스(`.badge-complete`, `.badge-progress`, `.badge-none`)로 관리

### 데이터 모델 (localStorage)

| 컬렉션 | 주요 필드 |
|--------|-----------| 
| `users` | id, username, password, name, role, createdAt |
| `classes` | id, title, description, profId, createdAt |
| `lectures` | id, classId, title, description, youtubeLink, createdAt |
| `resources` | id, classId, title, description, filename, createdAt |
| `qnas` | id, classId, authorId, title, content, createdAt |
| `enrollments` | id, studentId, classId, enrolledAt |
| `lecture_views` | id, studentId, lectureId, classId, progressRate, lastPosition, viewedAt |

## 설치 및 실행

1. **코드 클론**
   ```bash
   git clone https://github.com/seuuung/LMS-Frontend.git
   ```

2. **로컬 서버 실행** (ES6 Module 사용으로 `file://` 프로토콜 불가)
   ```bash
   # 방법 1: VSCode Live Server 확장 사용
   # 방법 2: 터미널에서 실행
   npx serve .
   ```

3. **브라우저 접속**: `http://localhost:5500` 또는 서버가 안내하는 포트

### 테스트 계정

| 역할 | 아이디 | 비밀번호 |
|------|--------|----------|
| 관리자 | `admin` | `1` |
| 교수자 | `test1` | `1` |
| 학생 | `test2` | `1` |
