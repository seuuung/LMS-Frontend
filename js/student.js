import { api } from './api.js';
import { requireAuth, renderNavbar, showToast } from './common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth(['student']);
    if (!user) return;
    renderNavbar();

    // 탭 전환 로직
    const navItems = document.querySelectorAll('.nav-item');
    const sections = {
        exploreClasses: document.getElementById('exploreClassesSec'),
        myClasses: document.getElementById('myClassesSec')
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            Object.values(sections).forEach(sec => sec.style.display = 'none');
            const target = item.dataset.target;
            if (sections[target]) {
                sections[target].style.display = 'block';
                if (target === 'exploreClasses') loadExploreClasses();
                if (target === 'myClasses') loadSelectMyClasses();
            }
        });
    });

    // ========== 1. 클래스 탐색 ==========
    async function loadExploreClasses() {
        const allClasses = await api.classes.getAll();
        const myEnrolls = await api.enrollments.getByStudent(user.id);
        const myClassIds = myEnrolls.map(e => e.classId);
        const allUsers = await api.users.getAll();

        const container = document.getElementById('allClassesList');
        if (allClasses.length === 0) {
            container.innerHTML = '<p>개설된 클래스가 없습니다.</p>';
            return;
        }

        container.innerHTML = allClasses.map(c => {
            const isEnrolled = myClassIds.includes(c.id);
            return `
            <div class="class-card">
                <h3>${c.title}</h3>
                <p>${c.description}</p>
                <small style="color:var(--text-muted); display:block; margin-bottom:1rem;">교수자: ${allUsers.find(u => u.id === c.profId)?.name || c.profId}</small>
                ${isEnrolled
                    ? `<button class="btn" style="background:#e2e8f0; width:100%; cursor:not-allowed;" disabled>수강 중</button>`
                    : `<button class="btn btn-primary" style="width:100%;" onclick="window.enrollClass('${c.id}')">수강 신청</button>`
                }
            </div>
            `;
        }).join('');
    }

    window.enrollClass = async (classId) => {
        try {
            await api.enrollments.create(classId, user.id);
            showToast('수강 신청이 완료되었습니다.', 'success');
            loadExploreClasses();
        } catch (e) {
            showToast(e.message, 'error');
        }
    };

    // ========== 2. 내 학습 공간 ==========
    async function loadSelectMyClasses() {
        const container = document.getElementById('myClassesList');
        const myEnrolls = await api.enrollments.getByStudent(user.id);
        const allClasses = await api.classes.getAll();
        const myClasses = myEnrolls.map(e => allClasses.find(c => c.id === e.classId)).filter(Boolean);

        document.getElementById('myClassesListWrapper').style.display = 'block';
        document.getElementById('courseDashboardWrapper').style.display = 'none';

        if (myClasses.length === 0) {
            container.innerHTML = '<p>수강 중인 클래스가 없습니다.</p>';
            return;
        }

        container.innerHTML = myClasses.map(c => `
            <div class="class-card cursor-pointer" onclick="window.openMyClass('${c.id}')">
                <h3>${c.title}</h3>
                <p>${c.description}</p>
                <button class="btn btn-primary mt-4" style="width:100%;">학습 시작</button>
            </div>
        `).join('');
    }

    let activeClassId = null;

    window.openMyClass = async (classId) => {
        activeClassId = classId;
        const allClasses = await api.classes.getAll();
        const currentClass = allClasses.find(c => c.id === classId);

        document.getElementById('myClassesListWrapper').style.display = 'none';
        const wrapper = document.getElementById('courseDashboardWrapper');
        wrapper.style.display = 'block';
        document.getElementById('dashboardCourseTitle').textContent = currentClass ? currentClass.title : '클래스 대시보드';

        // 디폴트로 강의 목록 탭 활성화
        document.getElementById('tabLec').click();
        loadClassContent(classId, 'lec');

        // 스크롤을 학습 영역으로 이동 (UX 개선)
        setTimeout(() => {
            const yOffset = -80; // 네비게이션 바 등의 높이 고려
            const y = wrapper.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }, 50);
    };

    document.getElementById('btnBackToMyClasses').addEventListener('click', () => {
        document.getElementById('courseDashboardWrapper').style.display = 'none';
        document.getElementById('myClassesListWrapper').style.display = 'block';
    });

    const tabs = {
        lec: { btn: document.getElementById('tabLec'), area: document.getElementById('lecArea') },
        res: { btn: document.getElementById('tabRes'), area: document.getElementById('resArea') },
        qna: { btn: document.getElementById('tabQna'), area: document.getElementById('qnaArea') },
    };

    Object.keys(tabs).forEach(key => {
        tabs[key].btn.addEventListener('click', () => {
            Object.values(tabs).forEach(t => {
                t.btn.classList.remove('active');
                t.area.style.display = 'none';
            });
            tabs[key].btn.classList.add('active');
            tabs[key].area.style.display = 'block';

            if (activeClassId) loadClassContent(activeClassId, key);
        });
    });

    async function loadClassContent(classId, type) {
        if (type === 'lec') {
            const lectures = await api.lectures.getByClass(classId);
            const views = await api.lectureViews.getByClassAndStudent(classId, user.id);

            document.getElementById('myLectures').innerHTML = lectures.map(l => {
                const viewInfo = views.find(v => v.lectureId === l.id);
                const currentRate = viewInfo ? (viewInfo.progressRate || 0) : 0;

                let statusHtml = '';
                if (currentRate >= 90) {
                    statusHtml = '<span style="color:var(--success-color); font-size:0.9rem; font-weight:600;">수강 완료 (100%)</span>';
                } else if (currentRate > 0) {
                    statusHtml = `<span style="color:var(--primary-color); font-size:0.9rem; font-weight:600;">수강 중 (${currentRate}%)</span>`;
                } else {
                    statusHtml = '<span style="color:var(--text-muted); font-size:0.9rem;">미수강 (0%)</span>';
                }

                return `
                <div class="list-item">
                    <div>
                        <strong>${l.title}</strong>
                        <p style="margin:0; font-size:0.9rem;">${l.description}</p>
                    </div>
                    <div style="display:flex; align-items:center; gap:1rem;">
                        ${statusHtml}
                        <button class="btn btn-primary" style="padding:0.4rem 1rem; font-size:0.9rem;" onclick="window.playLecture('${classId}', '${l.id}', '${l.youtubeLink}')">시청</button>
                    </div>
                </div>
                `;
            }).join('') || '<p style="color:var(--text-muted);">업로드된 강의가 없습니다.</p>';
        }
        else if (type === 'res') {
            const resources = await api.resources.getByClass(classId);
            document.getElementById('myResources').innerHTML = resources.map(r => `
                <div class="list-item">
                    <span>${r.title} <small>(${r.filename})</small></span>
                    <button class="btn btn-primary" style="padding:0.4rem 1rem; font-size:0.9rem;" onclick="showToast('다운로드 시뮬레이션')">다운로드</button>
                </div>
            `).join('') || '<p style="color:var(--text-muted);">등록된 자료가 없습니다.</p>';
        }
        else if (type === 'qna') {
            const qnas = await api.qnas.getByClass(classId);
            // 작성 폼 비우기
            document.getElementById('qTitle').value = '';
            document.getElementById('qContent').value = '';
            document.getElementById('qnaForm').style.display = 'none';

            document.getElementById('myQnas').innerHTML = qnas.map(q => `
                <div class="list-item" style="flex-direction:column; align-items:flex-start;">
                    <strong style="margin-bottom:0.5rem;">${q.title} <small>(${q.authorId})</small></strong>
                    <p style="font-size:0.9rem; margin-bottom:0;">${q.content}</p>
                    ${q.authorId === user.id ? `<button class="action-btn del mt-4" style="align-self:flex-end;" onclick="window.deleteQna('${q.id}', '${classId}')">내 게시글 삭제</button>` : ''}
                </div>
            `).join('') || '<p style="color:var(--text-muted);">등록된 QnA가 없습니다.</p>';
        }
    }

    // 유튜브 추출 및 모달 오픈 대신 새 페이지로 이동
    window.playLecture = async (classId, lectureId, link) => {
        // 전용 강의 시청 페이지(lecture.html)로 이동
        location.href = `lecture.html?classId=${classId}&lectureId=${lectureId}`;
    };

    // QnA 작성
    document.getElementById('btnWriteQna').addEventListener('click', () => {
        const form = document.getElementById('qnaForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('submitQna').addEventListener('click', async () => {
        if (!activeClassId) return;
        const classId = activeClassId;
        const title = document.getElementById('qTitle').value;
        const content = document.getElementById('qContent').value;
        if (!title || !content) return showToast('제목과 내용을 입력하세요', 'error');

        await api.qnas.create(classId, user.id, title, content);
        showToast('질문이 등록되었습니다.', 'success');
        loadClassContent(classId, 'qna');
    });

    window.deleteQna = async (id, classId) => {
        if (!confirm('삭제하시겠습니까?')) return;
        await api.qnas.delete(id);
        showToast('삭제되었습니다', 'success');
        loadClassContent(classId, 'qna');
    };



    // 초기 실행
    loadExploreClasses();
});
