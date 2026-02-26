/**
 * api_mock.js
 * 
 * localStorage를 활용하여 서버 없이 동작을 시뮬레이션하는 디버깅용 Mock API 모듈입니다.
 * 모든 함수는 실제 API 통신과의 일관성을 위해 비동기(Promise)로 설계되었습니다.
 */

// 로컬 스토리지에 저장될 DB 키 이름
const DB_KEY = 'lms_db';
// 네트워크 통신 느낌을 주기 위한 인위적인 지연 시간 (0.2초)
const DELAY_MS = 200;

/**
 * 로컬 스토리지에서 전체 DB 객체를 가져오거나 초기화합니다.
 */
const getDB = () => {
    const data = localStorage.getItem(DB_KEY);
    if (data) return JSON.parse(data);

    // 초기 실행 시 생성될 기본 데이터 구조
    const initDB = {
        users: [
            // 관리자 및 테스트용 기본 계정
            { id: 'u_admin', username: 'admin', password: '1', name: '최고관리자', role: 'admin', createdAt: Date.now() },
            { id: 'u_test1', username: 'test1', password: '1', name: '테스트교수', role: 'prof', createdAt: Date.now() },
            { id: 'u_test2', username: 'test2', password: '1', name: '테스트학생', role: 'student', createdAt: Date.now() }
        ],
        classes: [],
        lectures: [],
        resources: [],
        qnas: [],
        enrollments: [],
        lecture_views: [],
    };

    localStorage.setItem(DB_KEY, JSON.stringify(initDB));
    return initDB;
};

/**
 * 수정된 DB 객체를 로컬 스토리지에 다시 저장합니다.
 */
const saveDB = (db) => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
};

/**
 * 비동기 처리를 위한 딜레이 함수
 */
const delay = () => new Promise(res => setTimeout(res, DELAY_MS));

/**
 * 도메인별 유니크 ID 생성 함수 (2차 리뷰 제안: 식별자 충돌 방지 강화)
 */
const generateId = (prefix) => {
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().split('-')[0]
        : Math.random().toString(36).substring(2, 9);
    return `${prefix}_${Date.now()}_${uuid}`;
};

export const apiMock = {
    // --- 인증 관련 (로그인, 회원가입) ---
    auth: {
        login: async (username, password) => {
            await delay();
            const db = getDB();
            const user = db.users.find(u => u.username === username && u.password === password);
            if (!user) throw new Error('아이디 또는 비밀번호가 잘못되었습니다.');
            // 보안상 비밀번호를 제외한 정보만 반환
            const { password: _, ...userInfo } = user;
            return userInfo;
        },
        register: async (userData) => {
            await delay();
            const db = getDB();
            if (db.users.some(u => u.username === userData.username)) {
                throw new Error('이미 존재하는 아이디입니다.');
            }
            const newUser = {
                id: generateId('u'),
                username: userData.username,
                password: userData.password,
                name: userData.name,
                role: userData.role,
                createdAt: Date.now()
            };
            db.users.push(newUser);
            saveDB(db);
            return { id: newUser.id, username: newUser.username, name: newUser.name, role: newUser.role };
        }
    },

    // --- 유저 관리 (Admin용) ---
    users: {
        getAll: async () => {
            await delay();
            return getDB().users.map(u => {
                const { password, ...rest } = u;
                return rest;
            });
        },
        getById: async (userId) => {
            await delay();
            const user = getDB().users.find(u => u.id === userId);
            if (!user) return null;
            const { password, ...rest } = user;
            return rest;
        },
        updateRole: async (userId, newRole) => {
            await delay();
            const db = getDB();
            const user = db.users.find(u => u.id === userId);
            if (!user) throw new Error('유저를 찾을 수 없습니다.');
            user.role = newRole;
            saveDB(db);
            return true;
        },
        delete: async (userId) => {
            await delay();
            const db = getDB();
            db.users = db.users.filter(u => u.id !== userId);
            saveDB(db);
            return true;
        }
    },

    // --- 클래스(과목) 관리 ---
    classes: {
        getAll: async () => {
            await delay();
            return getDB().classes;
        },
        getById: async (classId) => {
            await delay();
            return getDB().classes.find(c => c.id === classId);
        },
        create: async (title, description, profId) => {
            await delay();
            const db = getDB();
            const newClass = { id: generateId('c'), title, description, profId, createdAt: Date.now() };
            db.classes.push(newClass);
            saveDB(db);
            return newClass;
        },
        update: async (classId, updates) => {
            await delay();
            const db = getDB();
            const idx = db.classes.findIndex(c => c.id === classId);
            if (idx === -1) throw new Error('클래스를 찾을 수 없습니다.');
            db.classes[idx] = { ...db.classes[idx], ...updates };
            saveDB(db);
            return db.classes[idx];
        },
        delete: async (classId) => {
            await delay();
            const db = getDB();
            db.classes = db.classes.filter(c => c.id !== classId);
            saveDB(db);
            return true;
        }
    },

    // --- 강의 아이템 관리 ---
    lectures: {
        getByClass: async (classId) => {
            await delay();
            return getDB().lectures.filter(l => l.classId === classId);
        },
        getById: async (id) => {
            await delay();
            return getDB().lectures.find(l => l.id === id);
        },
        create: async (classId, title, description, youtubeLink) => {
            await delay();
            const db = getDB();
            const newLecture = { id: generateId('l'), classId, title, description, youtubeLink, createdAt: Date.now() };
            db.lectures.push(newLecture);
            saveDB(db);
            return newLecture;
        },
        update: async (id, updates) => {
            await delay();
            const db = getDB();
            const idx = db.lectures.findIndex(l => l.id === id);
            if (idx === -1) throw new Error('강의를 찾을 수 없습니다.');
            db.lectures[idx] = { ...db.lectures[idx], ...updates };
            saveDB(db);
            return db.lectures[idx];
        },
        delete: async (id) => {
            await delay();
            const db = getDB();
            db.lectures = db.lectures.filter(x => x.id !== id);
            saveDB(db);
        }
    },

    // --- 강의 자료 관리 ---
    resources: {
        getByClass: async (classId) => {
            await delay();
            return getDB().resources.filter(r => r.classId === classId);
        },
        create: async (classId, title, description, filename, lectureId = null) => {
            await delay();
            const db = getDB();
            const newRes = { id: generateId('r'), classId, lectureId, title, description, filename, createdAt: Date.now() };
            db.resources.push(newRes);
            saveDB(db);
            return newRes;
        },
        delete: async (id) => {
            await delay();
            const db = getDB();
            db.resources = db.resources.filter(x => x.id !== id);
            saveDB(db);
        }
    },

    // --- QnA 게시판 ---
    qnas: {
        getByClass: async (classId) => {
            await delay();
            return getDB().qnas.filter(q => q.classId === classId);
        },
        create: async (classId, authorId, title, content) => {
            await delay();
            const db = getDB();
            const newQna = { id: generateId('q'), classId, authorId, title, content, createdAt: Date.now() };
            db.qnas.push(newQna);
            saveDB(db);
            return newQna;
        },
        delete: async (id) => {
            await delay();
            const db = getDB();
            db.qnas = db.qnas.filter(x => x.id !== id);
            saveDB(db);
        }
    },

    // --- 수강 정보 관리 ---
    enrollments: {
        getByClass: async (classId) => {
            await delay();
            return getDB().enrollments.filter(e => e.classId === classId);
        },
        getByStudent: async (studentId) => {
            await delay();
            return getDB().enrollments.filter(e => e.studentId === studentId);
        },
        create: async (classId, studentId) => {
            await delay();
            const db = getDB();
            if (db.enrollments.some(e => e.classId === classId && e.studentId === studentId)) {
                throw new Error('이미 수강신청된 클래스입니다.');
            }
            const newEnroll = { id: generateId('e'), classId, studentId, enrolledAt: Date.now() };
            db.enrollments.push(newEnroll);
            saveDB(db);
            return newEnroll;
        }
    },

    // --- 학습 진도율 추적 ---
    lectureViews: {
        getByClass: async (classId) => {
            await delay();
            return getDB().lecture_views.filter(v => v.classId === classId);
        },
        getByClassAndStudent: async (classId, studentId) => {
            await delay();
            return getDB().lecture_views.filter(v => v.classId === classId && v.studentId === studentId);
        },
        updateProgress: async (classId, lectureId, studentId, progressRate, lastPosition) => {
            await delay();
            const db = getDB();
            let view = db.lecture_views.find(v => v.classId === classId && v.lectureId === lectureId && v.studentId === studentId);
            if (view) {
                // 진도율은 이전보다 높은 경우에만 갱신
                if (progressRate > (view.progressRate || 0)) view.progressRate = progressRate;
                // 마지막 본 시점은 항상 갱신
                if (lastPosition !== undefined) view.lastPosition = lastPosition;
                view.viewedAt = Date.now();
            } else {
                // 새로운 시청 기록 생성
                db.lecture_views.push({ id: generateId('v'), classId, lectureId, studentId, progressRate, lastPosition: lastPosition || 0, viewedAt: Date.now() });
            }
            saveDB(db);
            return true;
        }
    }
};
