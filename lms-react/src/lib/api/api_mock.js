/**
 * api_mock.js
 * 
 * localStorage를 활용하여 서버 없이 동작을 시뮬레이션하는 디버깅용 Mock API 모듈입니다.
 * 모든 함수는 실제 API 통신과의 일관성을 위해 비동기(Promise)로 설계되었습니다.
 */

// 로컬 스토리지에 저장될 DB 키 이름
const DB_KEY = 'lms_db';
// 네트워크 통신 느낌을 주기 위한 인위적인 지연 시간 (0.1초)
const DELAY_MS = 100;

/**
 * 로컬 스토리지에서 전체 DB 객체를 가져오거나 초기화합니다.
 * 백엔드 데이터베이스 역할을 클라이언트 단에서 수행하기 위함입니다.
 * SSR(Next.js 서버사이드) 환경에서는 localStorage가 없으므로 빈 객체 구조를 반환합니다.
 * @returns {Object} { users, classes, lectures, resources, qnas, enrollments, lecture_views } 형태의 DB
 */
const getDB = () => {
    // Next.js SSR 오류 방지를 위한 분기 처리
    if (typeof window === 'undefined') return { users: [], classes: [], lectures: [], resources: [], qnas: [], enrollments: [], lecture_views: [] };

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
        logs: [],
        notifications: [],
    };

    localStorage.setItem(DB_KEY, JSON.stringify(initDB));
    return initDB;
};

/**
 * 수정된 DB 객체를 로컬 스토리지에 다시 저장합니다.
 */
const saveDB = (db) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DB_KEY, JSON.stringify(db));
};

/**
 * 비동기 처리를 위한 딜레이 함수
 */
const delay = () => new Promise(res => setTimeout(res, DELAY_MS));

/**
 * 도메인별 유니크 ID 생성 함수
 * @param {string} prefix - 식별자 접두사 (u: 유저, c: 클래스, l: 강의 등)
 * @returns {string} 고유 식별자 문자열
 */
const generateId = (prefix) => {
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().split('-')[0]
        : Math.random().toString(36).substring(2, 9);
    return `${prefix}_${Date.now()}_${uuid}`;
};

/**
 * DB 액션 수행 시 타임스탬프와 함께 로그를 남기는 헬퍼 함수
 */
const createLog = (db, action, entityType, entityId, message, actorId = 'system', classId = null) => {
    if (!db.logs) db.logs = [];
    const newLog = {
        id: generateId('log'),
        action,
        entityType,
        entityId,
        message,
        actorId,
        classId,
        timestamp: Date.now()
    };
    db.logs.push(newLog);
};

export const apiMock = {
    // --- 인증 관련 (로그인, 회원가입) ---
    auth: {
        /**
         * 사용자 로그인 검증
         * @param {string} username - 사용자 아이디
         * @param {string} password - 사용자 패스워드
         * @returns {Promise<Object>} 비밀번호가 제외된 유저 정보 객체
         */
        login: async (username, password) => {
            await delay();
            const db = getDB();
            const user = db.users.find(u => u.username === username && u.password === password);
            if (!user) throw new Error('아이디 또는 비밀번호가 잘못되었습니다.');
            // 보안상 비밀번호를 제외한 정보만 반환
            const { password: _, ...userInfo } = user;
            return userInfo;
        },
        /**
         * 신규 사용자 등록
         * @param {Object} userData - 가입할 유저 정보 (username, password, name, role)
         * @returns {Promise<Object>} 생성된 유저 정보 객체
         */
        register: async (userData) => {
            await delay();
            const db = getDB();
            if (db.users.some(u => u.username === userData.username)) {
                throw new Error('이미 존재하는 아이디입니다.');
            }
            const roleNames = { student: '학생', prof: '교수자', admin: '관리자' };
            const newUser = {
                id: generateId('u'),
                username: userData.username,
                password: userData.password,
                name: userData.name,
                role: userData.role,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            db.users.push(newUser);
            createLog(db, 'CREATE', 'user', newUser.id, `새로운 사용자("${newUser.username}") 등록 [이름: ${newUser.name}, 역할: ${roleNames[newUser.role] || newUser.role}]`);
            saveDB(db);
            return { id: newUser.id, username: newUser.username, name: newUser.name, role: newUser.role };
        }
    },

    // --- 유저 관리 (Admin용) ---
    users: {
        /**
         * 전체 사용자 목록 반환 (비밀번호 제외)
         * @returns {Promise<Array>} 유저 객체 배열
         */
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
            const roleNames = { student: '학생', prof: '교수자', admin: '관리자' };
            const oldRole = user.role;
            user.role = newRole;
            user.updatedAt = Date.now();
            createLog(db, 'UPDATE', 'user', user.id, `사용자("${user.username}") 역할 변경: ${roleNames[oldRole] || oldRole} → ${roleNames[newRole] || newRole}`);
            saveDB(db);
            return true;
        },
        update: async (userId, updates) => {
            await delay();
            const db = getDB();
            const user = db.users.find(u => u.id === userId);
            if (!user) throw new Error('유저를 찾을 수 없습니다.');
            // 보안상 id, password, createdAt은 변경 불가
            const { id, password, createdAt, ...allowed } = updates;
            // 변경 내역 상세 기록
            const changes = [];
            for (const [key, value] of Object.entries(allowed)) {
                if (user[key] !== value) {
                    const fieldNames = { name: '이름', email: '이메일', role: '역할' };
                    const label = fieldNames[key] || key;
                    changes.push(`${label}: "${user[key] || '(없음)'}" → "${value}"`);
                }
            }
            Object.assign(user, allowed);
            user.updatedAt = Date.now();
            const detail = changes.length > 0 ? ` [변경: ${changes.join(', ')}]` : '';
            createLog(db, 'UPDATE', 'user', user.id, `사용자("${user.username}") 정보 수정${detail}`);
            saveDB(db);
            const { password: _, ...rest } = user;
            return rest;
        },
        updatePassword: async (userId, currentPassword, newPassword) => {
            await delay();
            const db = getDB();
            const user = db.users.find(u => u.id === userId);
            if (!user) throw new Error('유저를 찾을 수 없습니다.');
            if (user.password !== currentPassword) throw new Error('기존 비밀번호가 일치하지 않습니다.');
            user.password = newPassword;
            user.updatedAt = Date.now();
            createLog(db, 'UPDATE', 'user', user.id, `사용자("${user.username}") 비밀번호가 변경되었습니다.`);
            saveDB(db);
            return true;
        },
        delete: async (userId) => {
            await delay();
            const db = getDB();
            const user = db.users.find(u => u.id === userId);
            if (user) {
                createLog(db, 'DELETE', 'user', userId, `사용자("${user.username}")가 삭제되었습니다.`);
            }
            db.users = db.users.filter(u => u.id !== userId);
            saveDB(db);
            return true;
        },
        search: async (query) => {
            await delay();
            const lowerQuery = query.toLowerCase();
            return getDB().users
                .filter(u => u.name.toLowerCase().includes(lowerQuery) || u.username.toLowerCase().includes(lowerQuery))
                .map(u => {
                    const { password, ...rest } = u;
                    return rest;
                });
        }
    },

    // --- 클래스(과목) 관리 ---
    classes: {
        /**
         * 전체 클래스 목록 조회
         * @returns {Promise<Array>} 클래스 객체 배열
         */
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
            const enrollmentCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const newClass = { id: generateId('c'), title, description, profId, enrollmentCode, createdAt: Date.now() };
            db.classes.push(newClass);
            createLog(db, 'CREATE', 'class', newClass.id, `새로운 클래스("${title}")가 개설되었습니다.`, profId, newClass.id);
            saveDB(db);
            return newClass;
        },
        update: async (classId, updates) => {
            await delay();
            const db = getDB();
            const idx = db.classes.findIndex(c => c.id === classId);
            if (idx === -1) throw new Error('클래스를 찾을 수 없습니다.');
            db.classes[idx] = { ...db.classes[idx], ...updates };
            createLog(db, 'UPDATE', 'class', classId, `클래스("${db.classes[idx].title}") 정보가 수정되었습니다.`, 'system', classId);
            saveDB(db);
            return db.classes[idx];
        },
        delete: async (classId) => {
            await delay();
            const db = getDB();
            const cls = db.classes.find(c => c.id === classId);
            if (cls) {
                createLog(db, 'DELETE', 'class', classId, `클래스("${cls.title}")가 삭제되었습니다.`, 'system', classId);
            }
            db.classes = db.classes.filter(c => c.id !== classId);
            saveDB(db);
            return true;
        }
    },

    // --- 강의 아이템 관리 ---
    lectures: {
        /**
         * 특정 클래스의 강의 목록 조회
         * @param {string} classId - 대상 클래스 ID
         * @returns {Promise<Array>} 강의 객체 배열
         */
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
            createLog(db, 'CREATE', 'lecture', newLecture.id, `새 강의("${title}")가 등록되었습니다.`, 'system', classId);

            // 알림 생성: 수강 학생들에게 새 강의 알림
            const students = db.enrollments.filter(e => e.classId === classId).map(e => e.studentId);
            students.forEach(studentId => {
                db.notifications.push({
                    id: generateId('nt'),
                    userId: studentId,
                    type: 'NEW_LECTURE',
                    message: `[${title}] 새로운 강의가 등록되었습니다.`,
                    link: `/lecture?classId=${classId}&lectureId=${newLecture.id}`,
                    isRead: false,
                    createdAt: Date.now()
                });
            });

            saveDB(db);
            return newLecture;
        },
        update: async (id, updates) => {
            await delay();
            const db = getDB();
            const idx = db.lectures.findIndex(l => l.id === id);
            if (idx === -1) throw new Error('강의를 찾을 수 없습니다.');
            db.lectures[idx] = { ...db.lectures[idx], ...updates };
            createLog(db, 'UPDATE', 'lecture', id, `강의("${db.lectures[idx].title}")가 수정되었습니다.`, 'system', db.lectures[idx].classId);
            saveDB(db);
            return db.lectures[idx];
        },
        delete: async (id) => {
            await delay();
            const db = getDB();
            const lec = db.lectures.find(l => l.id === id);
            if (lec) {
                createLog(db, 'DELETE', 'lecture', id, `강의("${lec.title}")가 삭제되었습니다.`, 'system', lec.classId);
            }
            db.lectures = db.lectures.filter(x => x.id !== id);
            saveDB(db);
        }
    },

    // --- 강의 자료 관리 ---
    resources: {
        /**
         * 특정 클래스의 자료 목록 조회
         * @param {string} classId - 대상 클래스 ID
         * @returns {Promise<Array>} 자료 객체 배열
         */
        getByClass: async (classId) => {
            await delay();
            return getDB().resources.filter(r => r.classId === classId);
        },
        create: async (classId, title, description, filename, lectureId = null) => {
            await delay();
            const db = getDB();
            const newRes = { id: generateId('r'), classId, lectureId, title, description, filename, createdAt: Date.now() };
            db.resources.push(newRes);
            createLog(db, 'CREATE', 'resource', newRes.id, `새로운 학습 자료("${title}")가 등록되었습니다.`, 'system', classId);
            saveDB(db);
            return newRes;
        },
        update: async (id, updates) => {
            await delay();
            const db = getDB();
            const idx = db.resources.findIndex(r => r.id === id);
            if (idx === -1) throw new Error('자료를 찾을 수 없습니다.');
            db.resources[idx] = { ...db.resources[idx], ...updates };
            createLog(db, 'UPDATE', 'resource', id, `학습 자료("${db.resources[idx].title}")가 수정되었습니다.`, 'system', db.resources[idx].classId);
            saveDB(db);
            return db.resources[idx];
        },
        delete: async (id) => {
            await delay();
            const db = getDB();
            const resItem = db.resources.find(r => r.id === id);
            if (resItem) {
                createLog(db, 'DELETE', 'resource', id, `학습 자료("${resItem.title}")가 삭제되었습니다.`, 'system', resItem.classId);
            }
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
        create: async (classId, authorId, title, content, isPrivate = false) => {
            await delay();
            const db = getDB();
            if (!db.qnas) db.qnas = [];
            const newQna = { id: generateId('q'), classId, authorId, title, content, isPrivate, replies: [], createdAt: Date.now() };
            db.qnas.push(newQna);
            createLog(db, 'CREATE', 'qna', newQna.id, `새로운 질문("${title}")이 등록되었습니다.`, authorId, classId);

            // 알림 생성: 교수자에게 새 질문 알림
            const cls = db.classes.find(c => c.id === classId);
            if (cls && cls.profId) {
                db.notifications.push({
                    id: generateId('nt'),
                    userId: cls.profId,
                    type: 'NEW_QNA',
                    message: `[${cls.title}] 새로운 질문이 등록되었습니다: ${title}`,
                    link: `/professor/class/${classId}?tab=qna`,
                    isRead: false,
                    createdAt: Date.now()
                });
            }

            saveDB(db);
            return newQna;
        },
        addReply: async (qnaId, authorId, content) => {
            await delay();
            const db = getDB();
            const qnaItem = db.qnas.find(q => q.id === qnaId);
            if (!qnaItem) throw new Error('해당 질문을 찾을 수 없습니다.');

            if (!qnaItem.replies) qnaItem.replies = [];
            const newReply = { id: generateId('qr'), authorId, content, createdAt: Date.now() };
            qnaItem.replies.push(newReply);

            createLog(db, 'CREATE', 'qna_reply', qnaId, `질문("${qnaItem.title}")에 답변이 등록되었습니다.`, authorId, qnaItem.classId);

            // 알림 생성: 질문 작성자에게 답변 알림 (답변자가 본인이 아닐 경우)
            if (qnaItem.authorId !== authorId) {
                db.notifications.push({
                    id: generateId('nt'),
                    userId: qnaItem.authorId,
                    type: 'QNA_REPLY',
                    message: `질문 [${qnaItem.title}]에 새로운 답변이 달렸습니다.`,
                    // 역할에 따른 링크 분기 (알림 수신자의 역할을 알 수 없으므로 범용 링크 사용 권장하나, 여기선 간단히 처리)
                    link: `/student/class/${qnaItem.classId}?tab=qna`,
                    isRead: false,
                    createdAt: Date.now()
                });
            }

            saveDB(db);
            return qnaItem;
        },
        deleteReply: async (qnaId, replyId) => {
            await delay();
            const db = getDB();
            const qnaItem = db.qnas.find(q => q.id === qnaId);
            if (!qnaItem) throw new Error('QnA 게시글을 찾을 수 없습니다.');

            if (qnaItem.replies) {
                qnaItem.replies = qnaItem.replies.filter(r => r.id !== replyId);
            }
            saveDB(db);
            return qnaItem;
        },
        delete: async (id) => {
            await delay();
            const db = getDB();
            const qnaItem = db.qnas.find(q => q.id === id);
            if (qnaItem) {
                createLog(db, 'DELETE', 'qna', id, `질문("${qnaItem.title}")이 삭제되었습니다.`, 'system', qnaItem.classId);
            }
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
        },
        joinWithCode: async (code, studentId) => {
            await delay();
            const db = getDB();
            const targetClass = db.classes.find(c => c.enrollmentCode === code);
            if (!targetClass) {
                throw new Error('유효하지 않은 참여 코드입니다.');
            }
            if (db.enrollments.some(e => e.classId === targetClass.id && e.studentId === studentId)) {
                throw new Error('이미 수강 중인 클래스입니다.');
            }
            const newEnroll = { id: generateId('e'), classId: targetClass.id, studentId, enrolledAt: Date.now() };
            db.enrollments.push(newEnroll);
            saveDB(db);
            return targetClass;
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
    },

    // --- 활동 로그 관리 ---
    logs: {
        getAll: async () => {
            await delay();
            const db = getDB();
            // 최신순 정렬
            return (db.logs || []).sort((a, b) => b.timestamp - a.timestamp);
        },
        getByEntity: async (entityType, entityId) => {
            await delay();
            const db = getDB();
            return (db.logs || [])
                .filter(log => log.entityType === entityType && log.entityId === entityId)
                .sort((a, b) => b.timestamp - a.timestamp);
        }
    },

    // --- 알림 관리 ---
    notifications: {
        getAll: async (userId) => {
            await delay();
            const db = getDB();
            return (db.notifications || [])
                .filter(n => n.userId === userId)
                .sort((a, b) => b.createdAt - a.createdAt);
        },
        getUnreadCount: async (userId) => {
            await delay();
            const db = getDB();
            return (db.notifications || [])
                .filter(n => n.userId === userId && !n.isRead).length;
        },
        markAsRead: async (notifId) => {
            await delay();
            const db = getDB();
            const notif = db.notifications.find(n => n.id === notifId);
            if (notif) {
                notif.isRead = true;
                saveDB(db);
            }
            return true;
        },
        markAllAsRead: async (userId) => {
            await delay();
            const db = getDB();
            (db.notifications || [])
                .filter(n => n.userId === userId && !n.isRead)
                .forEach(n => n.isRead = true);
            saveDB(db);
            return true;
        }
    }
};
