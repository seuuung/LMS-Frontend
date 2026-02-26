# 프론트엔드 - 백엔드 API 연동 명세서

현재 LMS 프론트엔드는 로컬 환경 테스트를 위해 `api_mock.js` (localStorage 기반)로 통신하고 있으나, 백엔드 프레임워크와의 데이터 통신을 위해 `api_server.js`에 모든 Fetch 요청 인터페이스가 완벽히 구성(1:1 매핑)되어 있습니다.
차후 백엔드 개발 시 **아래 32종의 REST API URI와 매개변수 구조**만 준수하여 서버를 구축하시면, 프론트엔드쪽 추가 수정 없이(`api.js`의 `USE_MOCK_API = false`로 옵션 1줄 전환) 즉시 100% 가동됩니다.

---

### 1. 인증 (Authentication)
| 기능 | 통신 URI | Method | Request Body |
| :--- | :--- | :--- | :--- |
| 로그인 | `/auth/login` | POST | `{ username, password }` |
| 회원가입 | `/auth/register` | POST | `{ ...userData }` |

### 2. 유저 관리 (Users)
| 기능 | 통신 URI | Method | Request Body / Param |
| :--- | :--- | :--- | :--- |
| 전체 유저 | `/users` | GET | None |
| 단일 유저 | `/users/:id` | GET | Path: `id` |
| 유저 정보 수정 | `/users/:id` | PATCH | `updates` (변경 항목 객체: name 등) |
| 역할 변경 | `/users/:id/role` | PATCH | `{ role }` |
| 유저 삭제 | `/users/:id` | DELETE | Path: `id` |

### 3. 과목 / 클래스 (Classes)
| 기능 | 통신 URI | Method | Request Body / Param |
| :--- | :--- | :--- | :--- |
| 전체 조회 | `/classes` | GET | None |
| 단일 조회 | `/classes/:id` | GET | Path: `id` |
| 생성 | `/classes` | POST | `{ title, description, profId }` |
| 정보 수정 | `/classes/:id` | PATCH | `updates` (변경 항목 객체) |
| 과목 삭제 | `/classes/:id` | DELETE | Path: `id` |

### 4. 영상 및 강의 관리 (Lectures)
| 기능 | 통신 URI | Method | Request Body / Param |
| :--- | :--- | :--- | :--- |
| 과목별 목록 | `/classes/:classId/lectures` | GET | Path: `classId` |
| 단일 조회 | `/lectures/:id` | GET | Path: `id` |
| 강의 생성 | `/lectures` | POST | `{ classId, title, description, youtubeLink }` |
| 정보 수정 | `/lectures/:id` | PATCH | `updates` (변경 항목 객체) |
| 강의 삭제 | `/lectures/:id` | DELETE | Path: `id` |

### 5. 자료실 관리 (Resources)
| 기능 | 통신 URI | Method | Request Body / Param |
| :--- | :--- | :--- | :--- |
| 과목별 목록 | `/classes/:classId/resources` | GET | Path: `classId` |
| 등록 | `/resources` | POST | `{ classId, title, description, filename, lectureId }` |
| 자료 수정 | `/resources/:id` | PATCH | `updates` (변경 항목 객체: title, description 등) |
| 자료 삭제 | `/resources/:id` | DELETE | Path: `id` |

### 6. 질문 답변 (QnAs)
| 기능 | 통신 URI | Method | Request Body / Param |
| :--- | :--- | :--- | :--- |
| 과목별 목록 | `/classes/:classId/qnas` | GET | Path: `classId` |
| 질문 등록 | `/qnas` | POST | `{ classId, authorId, title, content }` |
| 질문 삭제 | `/qnas/:id` | DELETE | Path: `id` |

### 7. 수강 정보 관리 (Enrollments)
| 기능 | 통신 URI | Method | Request Body / Param |
| :--- | :--- | :--- | :--- |
| 수강생 목록 | `/classes/:classId/enrollments` | GET | Path: `classId` |
| 내 수강목록 | `/students/:studentId/enrollments` | GET | Path: `studentId` |
| 수강 신청 | `/enrollments` | POST | `{ classId, studentId }` |

### 8. 진도율 시청 통계 (Lecture Views)
| 기능 | 통신 URI | Method | Request Body / Param |
| :--- | :--- | :--- | :--- |
| 과목별 통계 | `/classes/:classId/views` | GET | Path: `classId` |
| 개인 상세 통계 | `/classes/:classId/students/:studentId/views` | GET | Path: `classId`, `studentId` |
| 진도 저장 | `/views/progress` | POST | `{ classId, lectureId, studentId, progressRate, lastPosition }` |
