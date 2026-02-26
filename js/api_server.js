/**
 * api_server.js
 * 
 * 실제 백엔드 REST API 서버와 통신하는 모듈입니다.
 * 표준 HTTP 메서드(GET, POST, PATCH, DELETE)를 사용하며,
 * JSON 형식의 데이터를 주고받도록 설계되었습니다.
 */

const BASE_URL = 'https://api.your-lms-server.com'; // 실제 REST API 서버 주소

const request = async (method, path, body = null) => {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            // 'Authorization': `Bearer ${localStorage.getItem('token')}` // JWT 토큰인증 필요 시 활성화
        }
    };
    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(`${BASE_URL}${path}`, options);

        // 204 No Content 대응
        if (response.status === 204) return null;

        const data = await response.json();

        if (!response.ok) {
            // RESTful 에러 응답 처리 (4xx, 5xx)
            throw new Error(data.message || `서버 오류 (${response.status})`);
        }
        return data;
    } catch (error) {
        console.error(`[API ERROR] ${method} ${path}:`, error);
        throw error;
    }
};

export const apiReal = {
    auth: {
        login: async (username, password) => {
            return request('POST', '/auth/login', { username, password });
        },
        register: async (userData) => {
            return request('POST', '/auth/register', userData);
        }
    },
    users: {
        getAll: async () => request('GET', '/users'),
        getById: async (id) => request('GET', `/users/${id}`),
        updateRole: async (id, role) => request('PATCH', `/users/${id}/role`, { role }),
        delete: async (id) => request('DELETE', `/users/${id}`)
    },
    classes: {
        getAll: async () => request('GET', '/classes'),
        getById: async (id) => request('GET', `/classes/${id}`),
        create: async (title, desc, profId) => request('POST', '/classes', { title, description: desc, profId }),
        update: async (id, updates) => request('PATCH', `/classes/${id}`, updates),
        delete: async (id) => request('DELETE', `/classes/${id}`)
    },
    lectures: {
        getByClass: async (classId) => request('GET', `/classes/${classId}/lectures`),
        getById: async (id) => request('GET', `/lectures/${id}`),
        create: async (classId, title, desc, link) => request('POST', '/lectures', { classId, title, description: desc, youtubeLink: link }),
        update: async (id, updates) => request('PATCH', `/lectures/${id}`, updates),
        delete: async (id) => request('DELETE', `/lectures/${id}`)
    },
    resources: {
        getByClass: async (classId) => request('GET', `/classes/${classId}/resources`),
        create: async (classId, title, desc, filename, lectureId) => request('POST', '/resources', { classId, title, description: desc, filename, lectureId }),
        delete: async (id) => request('DELETE', `/resources/${id}`)
    },
    qnas: {
        getByClass: async (classId) => request('GET', `/classes/${classId}/qnas`),
        create: async (classId, authorId, title, content) => request('POST', '/qnas', { classId, authorId, title, content }),
        delete: async (id) => request('DELETE', `/qnas/${id}`)
    },
    enrollments: {
        getByClass: async (classId) => request('GET', `/classes/${classId}/enrollments`),
        getByStudent: async (studentId) => request('GET', `/students/${studentId}/enrollments`),
        create: async (classId, studentId) => request('POST', '/enrollments', { classId, studentId })
    },
    lectureViews: {
        getByClass: async (classId) => request('GET', `/classes/${classId}/views`),
        getByClassAndStudent: async (classId, studentId) => request('GET', `/classes/${classId}/students/${studentId}/views`),
        updateProgress: async (classId, lectureId, studentId, progressRate, lastPosition) =>
            request('POST', '/views/progress', { classId, lectureId, studentId, progressRate, lastPosition })
    }
};
