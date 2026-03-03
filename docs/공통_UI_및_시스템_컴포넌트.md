# 공통 UI 및 시스템 컴포넌트 가이드

LMS 프로젝트 전반에서 일관된 UX를 제공하고 개발 효율을 높이기 위해 구축된 공통 컴포넌트 및 전역 상테 시스템의 명세입니다.

## 1. 전역 시스템 (Context & Hooks)

### 💬 토스트 알림 시스템 (`useToast`)
간결한 메시지 피드백을 사용자에게 상단에 노출합니다.
- **사용법**: `const { showToast } = useToast();`
- **인터페이스**: `showToast(message, type)`
    - `type`: `'success'`, `'error'`, `'info'`, `'warning'`

### ❓ 확인 모달 시스템 (`useConfirm`)
삭제나 중요한 상태 변경 전 사용자의 최종 승인을 받는 브라우저 `confirm()`의 커스텀 대안입니다.
- **사용법**: `const { confirm } = useConfirm();`
- **인터페이스**: `if (await confirm('정말 삭제하시겠습니까?')) { ... }`

## 2. 주요 UI 컴포넌트 (`src/components/ui`)

### 🗂️ 탭 바 (`TabBar`)
클래스 상세 페이지 등에서 '강의/자료/QnA' 등의 섹션을 전환하는 통일된 스타일의 탭 UI입니다.

### ❓ QnA 게시판 (`QnaList`)
QnA 게시판의 목록 조회, 상세 보기, 글쓰기 기능을 제어합니다. 유지보수성을 위해 전체 로직이 `src/components/ui/qna/` 폴더로 모듈화되어 관리됩니다.
- **구성**: `QnaList.jsx`, `QnaDetailView.jsx`, `QnaWriteView.jsx`

### 📋 사이드바 네비게이션 (`Sidebar`)
사용자의 역할에 맞춰 동적으로 메뉴를 렌더링하고, 대시보드 내 탭 전환을 담당합니다.
- **동작**: `URLSearchParams`의 `tab` 값을 감시하여 활성 메뉴를 표시하며, 페이지 이동 시 `push`/`replace` 전략을 사용하여 불필요한 히스토리 누적을 방지합니다.

### 📤 강의 업로드 폼 (`UploadForm`)
관리자와 교수자가 공유하는 강의 등록 인터페이스입니다.
- **기능**: 유튜브 링크 검증 및 미리보기, 첨부 파일(Resource) 동시 등록 프로세스를 포함합니다.

### 🏷️ 상태 배지 (`StatusBadge`)
수강 진도(완료/진행중/미수강) 등을 시각적으로 구분하여 표시합니다.
- **스타일**:
    - `complete`: 초록색 (95% 이상)
    - `ongoing`: 파란색 (1% ~ 94%)
    - `not-started`: 회색 (0%)

### ⏳ 로딩 및 빈 상태 (`LoadingSpinner`, `EmptyState`)
- **`LoadingSpinner`**: 데이터 패칭 중 사용자에게 대기 중임을 시각화합니다.
- **`EmptyState`**: 조회된 데이터가 없을 때 일관된 텍스트와 레이아웃으로 안내 메시지를 표시합니다.

## 3. 모달 기초 (`Modal`)
모든 팝업 UI의 베이스가 되는 컴포넌트로, 오버레이 클릭 시 닫기 및 제목 표시줄 등의 기본 기능을 포함합니다.
