/**
 * api.js
 * 
 * 나중에 백엔드 서버(API)와 연동하기 쉽도록
 * localStorage를 다루는 로직을 모조리 비동기 함수(Promise)로 감싸서 제공합니다.
 * 백엔드가 구성되면 이 파일 내부의 코드를 fetch / axios로 변경하기만 하면 됩니다.
 */

const DB_KEY = 'lms_db';
const DELAY_MS = 200; // 네트워크 통신 대기 시간(Mock)

// DB 초기화 및 반환
const getDB = () => {
    const data = localStorage.getItem(DB_KEY);
    if (data) {
        return JSON.parse(data);
    }

    // 초기 데이터 구조
    const initDB = {
        users: [
            // 기본 최고 관리자
            { id: 'u_admin', username: 'admin', password: '1', name: '최고관리자', role: 'admin', createdAt: Date.now() }
        ],
        classes: [],
        lectures: [],
        resources: [],
        qnas: [],
        enrollments: [], // 학생 수강 클래스 정보 {id, studentId, classId}
        lecture_views: [], // 강의 시청 정보 {id, studentId, lectureId, classId, viewedAt}
    };

    localStorage.setItem(DB_KEY, JSON.stringify(initDB));
    return initDB;
};

// DB 저장
const saveDB = (db) => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// 인위적 딜레이 생성
const delay = () => new Promise(res => setTimeout(res, DELAY_MS));

// 유니크 ID 생성기
const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

export const api = {
    // --- 인증 관련 API ---
    auth: {
        login: async (username, password) => {
            await delay();
            const db = getDB();
            const user = db.users.find(u => u.username === username && u.password === password);
            if (!user) {
                throw new Error('아이디 또는 비밀번호가 잘못되었습니다.');
            }
            // 비밀번호를 제외하고 반환 (보안 시뮬레이션)
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
                role: userData.role, // 'prof', 'student'
                createdAt: Date.now()
            };
            db.users.push(newUser);
            saveDB(db);
            return { id: newUser.id, username: newUser.username, name: newUser.name, role: newUser.role };
        }
    },

    // --- 유저 정보 API (Admin 전용) ---
    users: {
        getAll: async () => {
            await delay();
            return getDB().users.map(u => {
                const { password, ...rest } = u;
                return rest;
            });
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

    // --- 클래스 관련 API ---
    classes: {
        getAll: async () => {
            await delay();
            return getDB().classes;
        },
        create: async (title, description, profId) => {
            await delay();
            const db = getDB();
            const newClass = {
                id: generateId('c'),
                title,
                description,
                profId,
                createdAt: Date.now()
            };
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
            // 관련 데이터 삭제 생략(필요 시 구현)
            saveDB(db);
            return true;
        }
    },


    // --- 강의 API ---
    lectures: {
        getByClass: async (classId) => {
            await delay();
            return getDB().lectures.filter(l => l.classId === classId);
        },
        create: async (classId, title, description, youtubeLink) => {
            await delay();
            const db = getDB();
            const newLecture = { id: generateId('l'), classId, title, description, youtubeLink, createdAt: Date.now() };
            db.lectures.push(newLecture);
            saveDB(db);
            return newLecture;
        },
        delete: async (id) => {
            await delay();
            const db = getDB();
            db.lectures = db.lectures.filter(x => x.id !== id);
            saveDB(db);
        }
    },

    // --- 자료실 API ---
    resources: {
        getByClass: async (classId) => {
            await delay();
            return getDB().resources.filter(r => r.classId === classId);
        },
        create: async (classId, title, description, filename) => {
            await delay();
            const db = getDB();
            const newRes = { id: generateId('r'), classId, title, description, filename, createdAt: Date.now() };
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

    // --- QnA API ---
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

    // --- 수강 관련 정보 ---
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
    lectureViews: {
        getByClass: async (classId) => {
            await delay();
            return getDB().lecture_views.filter(v => v.classId === classId);
        },
        getByClassAndStudent: async (classId, studentId) => {
            await delay();
            return getDB().lecture_views.filter(v => v.classId === classId && v.studentId === studentId);
        },
        updateProgress: async (classId, lectureId, studentId, progressRate) => {
            await delay();
            const db = getDB();
            let view = db.lecture_views.find(v => v.classId === classId && v.lectureId === lectureId && v.studentId === studentId);
            if (view) {
                // 기존보다 진도율이 높을 때만 갱신 (또는 계속 덮어씌울 수도 있음. 여기선 높은 값으로)
                if (progressRate > (view.progressRate || 0)) {
                    view.progressRate = progressRate;
                    view.viewedAt = Date.now();
                }
            } else {
                db.lecture_views.push({ id: generateId('v'), classId, lectureId, studentId, progressRate, viewedAt: Date.now() });
            }
            saveDB(db);
            return true;
        }
    }
};
