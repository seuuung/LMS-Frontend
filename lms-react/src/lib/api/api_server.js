/**
 * api_server.js
 * 
 * 실제 백엔드 REST API 서버와 통신하는 핵심 모듈입니다.
 * 
 * [유지보수 가이드]
 * 1. BASE_URL: 서버 주소가 변경되면 9번 라인의 URL을 수정하세요.
 * 2. headers: JWT 인증 등이 필요하면 request 함수의 headers 부분을 수정하세요.
 * 3. 엔드포인트: 백엔드 API 설계에 따라 객체 내부의 경로(path)를 수정하세요.
 */

// 실제 REST API 서버의 베이스 URL
const BASE_URL = 'localhost:8080';

/**
 * 공통 fetch 요청 함수
 * @param {string} method - HTTP 메서드 (GET, POST, PATCH, DELETE 등)
 * @param {string} path - 상세 엔드포인트 경로
 * @param {object} body - 요청 바디 데이터 (optional)
 */
const request = async (method, path, body = null) => {
    const isFormData = body instanceof FormData;
    const options = {
        method,
        headers: {
            ...(!isFormData && { 'Content-Type': 'application/json' }),
            'Accept': 'application/json',
            // 인증이 필요한 경우 아래 주석을 해제하고 토큰을 설정하세요.
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    };

    // 데이터가 있을 경우 JSON 문자열 또는 FormData 객체 형태로 바디에 포함
    if (body) {
        options.body = isFormData ? body : JSON.stringify(body);
    }

    // --- 디버그 로깅: 요청 정보 ---
    console.log(`[API Request] %c${method} %c${path}`, 'color: blue; font-weight: bold;', 'color: inherit;', {
        body,
        options
    });

    try {
        const response = await fetch(`${BASE_URL}${path}`, options);

        // 204 No Content: 성공했으나 반환할 데이터가 없는 경우
        if (response.status === 204) return null;

        const responseData = await response.json();

        // --- 디버그 로깅: 응답 및 처리 결과 ---
        console.log(`[API Response] %c${path}`, 'color: green; font-weight: bold;', {
            status: response.status,
            data: responseData
        });

        // HTTP 상태 코드가 200-299 범위가 아닌 경우 에러 처리
        if (!response.ok) {
            throw new Error(responseData.error || responseData.message || `서버 오류 (${response.status})`);
        }

        // 백엔드 공통 응답 포맷({ success, data, error }) 처리
        if (responseData && typeof responseData.success === 'boolean') {
            if (!responseData.success) {
                // success가 false이면 error 필드를 메시지로 사용
                throw new Error(responseData.error || 'API 요청 실패');
            }
            // success가 true이면 data 객체 안의 알맹이만 반환
            // 데이터가 null일 경우 빈 객체나 null을 안전하게 반환하도록 보장
            return responseData.data !== undefined ? responseData.data : responseData;
        }

        // 공통 포맷이 아닐 경우(예외 처리) 전체 데이터 반환
        return responseData;
    } catch (error) {
        // 네트워크 장애 또는 API 에러 발생 시 로그 출력
        console.error(`[API ERROR] ${method} ${path}:`, error);
        throw error;
    }
};

/**
 * 서비스별 API 객체 정의
 * 모든 함수는 Promise를 반환하므로 async/await를 사용하세요.
 */
export const apiReal = {
    // --- 인증 (로그인, 회원가입) ---
    auth: {
        login: async (username, password) => {
            return request('POST', '/api/auth/login', { username, password });
        },
        register: async (userData) => {
            return request('POST', '/api/auth/register', userData);
        }
    },

    // --- 유저 정보 관리 ---
    users: {
        /**
         * 전체 사용자 목록 조회
         * @returns {Promise<Array>}
         */
        getAll: async () => request('GET', '/api/users'),
        /**
         * 단일 사용자 조회
         * @param {string} id - 조회할 사용자 ID
         * @returns {Promise<Object>}
         */
        getById: async (id) => request('GET', `/api/users/${id}`),
        update: async (id, updates) => request('PATCH', `/api/users/${id}`, updates),
        updatePassword: async (id, currentPassword, newPassword) => request('PATCH', `/api/users/${id}/password`, { currentPassword, password: newPassword }),
        updateRole: async (id, role) => request('PATCH', `/api/users/${id}/role`, { role }),
        delete: async (id) => request('DELETE', `/api/users/${id}`),
        /**
         * 수동 수강생 추가를 위한 이름/아이디 기반 회원 검색
         * @param {string} query 검색어
         */
        search: async (query) => request('GET', `/api/users/search?q=${encodeURIComponent(query)}`)
    },

    // --- 클래스(과목) 관리 ---
    classes: {
        getAll: async () => request('GET', '/api/classes'),
        getById: async (id) => {
            const res = await request('GET', `/api/classes/${id}`);
            console.log('[API Debug] fetched class data:', res);
            return res;
        },
        create: async (title, desc, profId, role) => request('POST', '/api/classes', { title, description: desc, profId, role }),
        update: async (id, updates) => request('PATCH', `/api/classes/${id}`, updates),
        delete: async (id) => request('DELETE', `/api/classes/${id}`)
    },

    // --- 강의 아이템 관리 ---
    lectures: {
        /**
         * 특정 클래스의 강의 목록 조회
         * @param {string} classId - 대상 클래스 ID
         */
        getByClass: async (classId) => request('GET', `/api/classes/${classId}/lectures`),
        /**
         * 단일 강의 상세 조회
         * @param {string} id - 강의 ID
         */
        getById: async (id) => request('GET', `/api/lectures/${id}`),
        /**
         * 새 강의 등록 (유튜브 링크)
         */
        create: async (classId, title, desc, link) => request('POST', '/api/lectures', { classId, title, description: desc, youtubeLink: link }),
        update: async (id, updates) => request('PATCH', `/api/lectures/${id}`, updates),
        delete: async (id) => request('DELETE', `/api/lectures/${id}`)
    },

    // --- 강의 자료실 관리 ---
    resources: {
        /**
         * 특정 클래스의 자료 목록 조회
         * @param {string} classId - 대상 클래스 ID
         */
        getByClass: async (classId) => request('GET', `/api/classes/${classId}/resources`),
        /**
         * 새 학습 자료 등록 (Multipart form 형식 지원)
         */
        create: async (classId, title, desc, fileObj, lectureId) => {
            const formData = new FormData();
            formData.append('classId', classId);
            formData.append('title', title);
            if (desc) formData.append('description', desc);
            if (lectureId) formData.append('lectureId', lectureId);
            formData.append('file', fileObj); 
            
            return request('POST', '/api/resources', formData);
        },
        /**
         * 단일 파일(자료) 다운로드
         */
        download: async (id, filename) => {
            const url = `${BASE_URL}/api/resources/download/${id}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    // 필요 시 'Authorization': `Bearer ...` 추가
                }
            });
            
            if (!response.ok) throw new Error(`다운로드에 실패했습니다. (${response.status})`);
            
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename || 'downloaded_file';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        },
        update: async (id, updates) => request('PATCH', `/api/resources/${id}`, updates),
        delete: async (id) => request('DELETE', `/api/resources/${id}`)
    },

    // --- QnA 게시판 관리 ---
    qnas: {
        getByClass: async (classId) => request('GET', `/api/classes/${classId}/qnas`),
        create: async (classId, authorId, title, content, isPrivate = false) => request('POST', '/api/qnas', { classId, authorId, title, content, isPrivate }),
        addReply: async (qnaId, authorId, content) => request('POST', `/api/qnas/${qnaId}/replies`, { authorId, content }),
        deleteReply: async (qnaId, replyId) => request('DELETE', `/api/qnas/${qnaId}/replies/${replyId}`),
        delete: async (id) => request('DELETE', `/api/qnas/${id}`)
    },

    // --- 수강 신청 정보 ---
    enrollments: {
        getByClass: async (classId) => request('GET', `/api/classes/${classId}/enrollments`),
        getByStudent: async (studentId) => request('GET', `/api/students/${studentId}/enrollments`),
        create: async (classId, studentId) => request('POST', '/api/enrollments', { classId, studentId }),
        /**
         * 학생이 발급받은 참여 코드로 수강 신청
         */
        joinWithCode: async (code, studentId) => request('POST', '/api/enrollments/join', { code, studentId })
    },

    // --- 강의 진도율 및 시청 정보 추적 ---
    lectureViews: {
        getByClass: async (classId) => request('GET', `/api/classes/${classId}/views`),
        getByClassAndStudent: async (classId, studentId) => request('GET', `/api/classes/${classId}/students/${studentId}/views`),
        updateProgress: async (classId, lectureId, studentId, progressRate, lastPosition) =>
            request('POST', '/api/views/progress', { classId, lectureId, studentId, progressRate, lastPosition })
    },

    // --- 활동 로그 관리 ---
    logs: {
        getAll: async () => request('GET', '/api/logs'),
        getByEntity: async (entityType, entityId) => request('GET', `/api/logs/${entityType}/${entityId}`),
        create: async (action, entityType, entityId, message, actorId, classId = null) => request('POST', '/api/logs', { action, entityType, entityId, message, actorId, classId })
    },
    // --- 알림 관리 ---
    notifications: {
        getAll: async (userId) => request('GET', `/api/notifications/user/${userId}`),
        getUnreadCount: async (userId) => request('GET', `/api/notifications/user/${userId}/unread/count`),
        markAsRead: async (id) => request('PATCH', `/api/notifications/${id}/read`),
        markAllAsRead: async (userId) => request('PATCH', `/api/notifications/user/${userId}/read-all`)
    }
};
