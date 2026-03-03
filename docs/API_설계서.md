# 프론트엔드 - 백엔드 API 연동 명세서

현재 LMS 프론트엔드는 로컬 환경 테스트를 위해 `api_mock.js` (localStorage 기반)로 통신하고 있으나, 백엔드 프레임워크와의 데이터 통신을 위해 `api_server.js`에 모든 Fetch 요청 인터페이스가 완벽히 구성(1:1 매핑)되어 있습니다.

### 🏛️ API 추상화 및 프록시 패턴 (Proxy Pattern)
`api.js`는 모든 API 호출을 래핑하는 **Proxy 객체**를 반환합니다. 이를 통해 다음과 같은 전역 기능을 자동화합니다:
- **자동 로딩 이벤트**: 모든 API 호출 직전 `api-load-start` 이벤트를, 종료 후 `api-load-end` 이벤트를 발송하여 전역 로딩 스피너를 제어합니다.
- **로딩 우회**: `{ skipLoading: true }` 인자를 전달하여 특정 호출에서 로딩 UI를 생략할 수 있습니다.
- **재귀적 프록시**: `api.auth.login()`과 같이 중첩된 하위 객체 메서드 체이닝을 지원합니다.

### 🔁 Mock / Server 스위칭 메커니즘
`src/lib/api/api.js`의 변수 하나로 전체 시스템의 데이터 소스를 전환할 수 있습니다.
- `const USE_MOCK_API = true;` ➔ **Mock Mode**: 클라이언트 `localStorage`를 DB로 활용 (오프라인 테스트용)
- `const USE_MOCK_API = false;` ➔ **Server Mode**: 실제 백엔드 서버(`/api/...`)와 REST 통신

---

### 1. 인증 (Authentication) — 2종
| 기능 | 통신 URI | Method | Request Body |
| :--- | :--- | :--- | :--- |
| 로그인 | `/api/auth/login` | POST | `{ username, password }` |
| 회원가입 | `/api/auth/register` | POST | `{ username, password, name, role }` |

### 2. 유저 관리 (Users) — 7종
| 기능 | 통신 URI | Method | Request Body / Param |
| :--- | :--- | :--- | :--- |
| 전체 유저 | `/api/users` | GET | None |
| 단일 유저 | `/api/users/:id` | GET | Path: `id` |
| 유저 정보 수정 | `/api/users/:id` | PATCH | `updates` (변경 항목 객체: name 등) |
| 유저 비밀번호 수정 | `/api/users/:id/password` | PATCH | `{ currentPassword, password }` |
| 역할 변경 | `/api/users/:id/role` | PATCH | `{ role }` |
| 유저 삭제 | `/api/users/:id` | DELETE | Path: `id` |
| 이름/ID 겸용 사용자 검색 | `/api/users/search` | GET | Query: `?q=검색어` |

### 3. 과목 / 클래스 (Classes) — 5종
| 기능 | 통신 URI | Method | Request Body / Param |
| :--- | :--- | :--- | :--- |
| 전체 조회 | `/api/classes` | GET | None |
| 단일 조회 | `/api/classes/:id` | GET | Path: `id` |
| 생성 | `/api/classes` | POST | `{ title, description, profId }` |
| 정보 수정 | `/api/classes/:id` | PATCH | `updates` (변경 항목 객체) |
| 과목 삭제 | `/api/classes/:id` | DELETE | Path: `id` |

### 4. 영상 및 강의 관리 (Lectures) — 5종
| 기능 | 통신 URI | Method | Request Body / Param |
| :--- | :--- | :--- | :--- |
| 과목별 목록 | `/api/classes/:classId/lectures` | GET | Path: `classId` |
| 단일 조회 | `/api/lectures/:id` | GET | Path: `id` |
| 강의 생성 | `/api/lectures` | POST | `{ classId, title, description, youtubeLink }` |
| 정보 수정 | `/api/lectures/:id` | PATCH | `updates` (변경 항목 객체) |
| 강의 삭제 | `/api/lectures/:id` | DELETE | Path: `id` |

### 5. 자료실 관리 (Resources) — 4종
| 기능 | 통신 URI | Method | Request Body / Param |
| :--- | :--- | :--- | :--- |
| 과목별 목록 | `/api/classes/:classId/resources` | GET | Path: `classId` |
| 등록 | `/api/resources` | POST | `{ classId, title, description, filename, lectureId }` |
| 자료 수정 | `/api/resources/:id` | PATCH | `updates` (변경 항목 객체: title, description 등) |
| 자료 삭제 | `/api/resources/:id` | DELETE | Path: `id` |

### 6. 질문 답변 (QnAs) — 5종
| 기능 | 통신 URI | Method | Request Body / Param |
| :--- | :--- | :--- | :--- |
| 과목별 목록 | `/api/classes/:classId/qnas` | GET | Path: `classId` |
| 질문 등록 | `/api/qnas` | POST | `{ classId, authorId, title, content, isPrivate }` |
| 답변 등록 | `/api/qnas/:qnaId/replies` | POST | `{ authorId, content }` |
| 답변 삭제 | `/api/qnas/:qnaId/replies/:replyId` | DELETE | Path: `qnaId`, `replyId` |
| 질문 삭제 | `/api/qnas/:id` | DELETE | Path: `id` |

### 7. 수강 정보 관리 (Enrollments) — 4종
| 기능 | 통신 URI | Method | Request Body / Param |
| :--- | :--- | :--- | :--- |
| 수강생 목록 | `/api/classes/:classId/enrollments` | GET | Path: `classId` |
| 내 수강목록 | `/api/students/:studentId/enrollments` | GET | Path: `studentId` |
| 수강 신청 | `/api/enrollments` | POST | `{ classId, studentId }` |
| 코드로 수강 신청 | `/api/enrollments/join` | POST | `{ code, studentId }` |

### 8. 진도율 시청 통계 (Lecture Views) — 3종
| 기능 | 통신 URI | Method | Request Body / Param |
| :--- | :--- | :--- | :--- |
| 과목별 통계 | `/api/classes/:classId/views` | GET | Path: `classId` |
| 개인 상세 통계 | `/api/classes/:classId/students/:studentId/views` | GET | Path: `classId`, `studentId` |
| 진도 저장 | `/api/views/progress` | POST | `{ classId, lectureId, studentId, progressRate, lastPosition }` |

### 9. 활동 내역 로그 (Logs) — 3종
| 기능 | 통신 URI | Method | Request Body / Param |
| :--- | :--- | :--- | :--- |
| 전체 로그 조회 | `/api/logs` | GET | None |
| 엔티티별 대상 로그 조회 | `/api/logs/:entityType/:entityId` | GET | Path: `entityType` (class, lecture, resource, qna, user), `entityId` |
| 활동 로그 생성 | `/api/logs` | POST | `{ action, entityType, entityId, message, actorId, classId(optional) }` |

> **총 39종 = 인증 2 + 유저 7 + 클래스 5 + 강의 5 + 자료 4 + QnA 5 + 수강 4 + 진도율 3 + 로그 3**
