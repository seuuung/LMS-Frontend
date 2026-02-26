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
const BASE_URL = 'https://api.your-lms-server.com';

/**
 * 공통 fetch 요청 함수
 * @param {string} method - HTTP 메서드 (GET, POST, PATCH, DELETE 등)
 * @param {string} path - 상세 엔드포인트 경로
 * @param {object} body - 요청 바디 데이터 (optional)
 */
const request = async (method, path, body = null) => {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            // 인증이 필요한 경우 아래 주석을 해제하고 토큰을 설정하세요.
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    };

    // 데이터가 있을 경우 JSON 문자열로 변환하여 바디에 포함
    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(`${BASE_URL}${path}`, options);

        // 204 No Content: 성공했으나 반환할 데이터가 없는 경우
        if (response.status === 204) return null;

        const data = await response.json();

        // HTTP 상태 코드가 200-299 범위가 아닌 경우 에러 처리
        if (!response.ok) {
            throw new Error(data.message || `서버 오류 (${response.status})`);
        }

        return data;
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
            return request('POST', '/auth/login', { username, password });
        },
        register: async (userData) => {
            return request('POST', '/auth/register', userData);
        }
    },

    // --- 유저 정보 관리 ---
    users: {
        getAll: async () => request('GET', '/users'),
        getById: async (id) => request('GET', `/users/${id}`),
        updateRole: async (id, role) => request('PATCH', `/users/${id}/role`, { role }),
        delete: async (id) => request('DELETE', `/users/${id}`)
    },

    // --- 클래스(과목) 관리 ---
    classes: {
        getAll: async () => request('GET', '/classes'),
        getById: async (id) => request('GET', `/classes/${id}`),
        create: async (title, desc, profId) => request('POST', '/classes', { title, description: desc, profId }),
        update: async (id, updates) => request('PATCH', `/classes/${id}`, updates),
        delete: async (id) => request('DELETE', `/classes/${id}`)
    },

    // --- 강의 아이템 관리 ---
    lectures: {
        getByClass: async (classId) => request('GET', `/classes/${classId}/lectures`),
        getById: async (id) => request('GET', `/lectures/${id}`),
        create: async (classId, title, desc, link) => request('POST', '/lectures', { classId, title, description: desc, youtubeLink: link }),
        update: async (id, updates) => request('PATCH', `/lectures/${id}`, updates),
        delete: async (id) => request('DELETE', `/lectures/${id}`)
    },

    // --- 강의 자료실 관리 ---
    resources: {
        getByClass: async (classId) => request('GET', `/classes/${classId}/resources`),
        create: async (classId, title, desc, filename, lectureId) => request('POST', '/resources', { classId, title, description: desc, filename, lectureId }),
        delete: async (id) => request('DELETE', `/resources/${id}`)
    },

    // --- QnA 게시판 관리 ---
    qnas: {
        getByClass: async (classId) => request('GET', `/classes/${classId}/qnas`),
        create: async (classId, authorId, title, content) => request('POST', '/qnas', { classId, authorId, title, content }),
        delete: async (id) => request('DELETE', `/qnas/${id}`)
    },

    // --- 수강 신청 정보 ---
    enrollments: {
        getByClass: async (classId) => request('GET', `/classes/${classId}/enrollments`),
        getByStudent: async (studentId) => request('GET', `/students/${studentId}/enrollments`),
        create: async (classId, studentId) => request('POST', '/enrollments', { classId, studentId })
    },

    // --- 강의 진도율 및 시청 정보 추적 ---
    lectureViews: {
        getByClass: async (classId) => request('GET', `/classes/${classId}/views`),
        getByClassAndStudent: async (classId, studentId) => request('GET', `/classes/${classId}/students/${studentId}/views`),
        updateProgress: async (classId, lectureId, studentId, progressRate, lastPosition) =>
            request('POST', '/views/progress', { classId, lectureId, studentId, progressRate, lastPosition })
    }
};
