/**
 * api_mock.js
 * 
 * localStorage를 다루는 디버깅용 Mock API 모듈입니다.
 */

const DB_KEY = 'lms_db';
const DELAY_MS = 200;

const getDB = () => {
    const data = localStorage.getItem(DB_KEY);
    if (data) return JSON.parse(data);

    const initDB = {
        users: [
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

const saveDB = (db) => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
};

const delay = () => new Promise(res => setTimeout(res, DELAY_MS));
const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

export const apiMock = {
    auth: {
        login: async (username, password) => {
            await delay();
            const db = getDB();
            const user = db.users.find(u => u.username === username && u.password === password);
            if (!user) throw new Error('아이디 또는 비밀번호가 잘못되었습니다.');
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
        updateProgress: async (classId, lectureId, studentId, progressRate, lastPosition) => {
            await delay();
            const db = getDB();
            let view = db.lecture_views.find(v => v.classId === classId && v.lectureId === lectureId && v.studentId === studentId);
            if (view) {
                if (progressRate > (view.progressRate || 0)) view.progressRate = progressRate;
                if (lastPosition !== undefined) view.lastPosition = lastPosition;
                view.viewedAt = Date.now();
            } else {
                db.lecture_views.push({ id: generateId('v'), classId, lectureId, studentId, progressRate, lastPosition: lastPosition || 0, viewedAt: Date.now() });
            }
            saveDB(db);
            return true;
        }
    }
};
