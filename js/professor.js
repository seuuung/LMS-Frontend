import { api } from './api.js';
import { requireAuth, renderNavbar, showToast, getCurrentUser } from './common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth(['prof']);
    if (!user) return;
    renderNavbar();

    // 단일 메뉴 체제이므로 탭 전환 로직 제거

    // ========== 1. 내 클래스 관리 ==========
    const classFormContainer = document.getElementById('classFormContainer');
    document.getElementById('btnCreateClass').addEventListener('click', () => {
        classFormContainer.style.display = classFormContainer.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('submitCreateClass').addEventListener('click', async () => {
        const title = document.getElementById('newClassTitle').value;
        const desc = document.getElementById('newClassDesc').value;
        if (!title) return showToast('제목을 입력하세요', 'error');

        try {
            await api.classes.create(title, desc, user.id);
            showToast('클래스가 생성되었습니다.', 'success');
            document.getElementById('newClassTitle').value = '';
            document.getElementById('newClassDesc').value = '';
            classFormContainer.style.display = 'none';
            loadMyClasses();
        } catch (e) {
            showToast(e.message, 'error');
        }
    });

    async function loadMyClasses() {
        const allClasses = await api.classes.getAll();
        const myClasses = allClasses.filter(c => c.profId === user.id);
        const container = document.getElementById('myClassList');

        document.getElementById('myClassesListWrapper').style.display = 'block';
        document.getElementById('courseDashboardWrapper').style.display = 'none';

        if (myClasses.length === 0) {
            container.innerHTML = '<p>개설한 클래스가 없습니다.</p>';
            return;
        }

        container.innerHTML = myClasses.map(c => `
            <div class="class-card cursor-pointer" onclick="window.openManageClass('${c.id}')" style="position:relative;">
                <div style="display:flex; justify-content:space-between;">
                    <div>
                        <h3 style="margin-bottom:0.5rem; color:var(--text-main);">${c.title}</h3>
                        <p style="color:var(--text-muted);">${c.description}</p>
                        <small style="color:#94a3b8;">생성일: ${new Date(c.createdAt).toLocaleDateString()}</small>
                    </div>
                    <div>
                        <button class="btn btn-primary" style="padding: 0.5rem 1rem;" onclick="event.stopPropagation(); window.openManageClass('${c.id}')">관리하기</button>
                        <button class="btn" style="color:var(--danger-color); padding: 0.5rem; margin-left:0.5rem;" onclick="event.stopPropagation(); window.deleteClassProf('${c.id}')">삭제</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    window.deleteClassProf = async (id) => {
        if (!confirm('클래스를 삭제하시겠습니까?')) return;
        await api.classes.delete(id);
        showToast('삭제되었습니다.', 'success');
        loadMyClasses();
    };

    // ========== 대시보드 컨트롤 로직 ==========
    let activeClassId = null;

    window.openManageClass = async (classId) => {
        activeClassId = classId;
        const allClasses = await api.classes.getAll();
        const currentClass = allClasses.find(c => c.id === classId);

        document.getElementById('myClassesListWrapper').style.display = 'none';
        const wrapper = document.getElementById('courseDashboardWrapper');
        wrapper.style.display = 'block';
        document.getElementById('dashboardCourseTitle').textContent = currentClass ? currentClass.title : '클래스 대시보드';

        document.getElementById('tabLecRes').click();

        // 스크롤 상단 이동
        setTimeout(() => {
            const yOffset = -80;
            const y = wrapper.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }, 50);
    };

    document.getElementById('btnBackToMyClasses').addEventListener('click', () => {
        document.getElementById('courseDashboardWrapper').style.display = 'none';
        document.getElementById('myClassesListWrapper').style.display = 'block';
    });

    const tabsProf = {
        lecRes: { btn: document.getElementById('tabLecRes'), area: document.getElementById('lecResArea') },
        qna: { btn: document.getElementById('tabQna'), area: document.getElementById('qnaStuArea') }
    };

    Object.keys(tabsProf).forEach(key => {
        tabsProf[key].btn.addEventListener('click', () => {
            Object.values(tabsProf).forEach(t => {
                t.btn.classList.remove('active');
                t.area.style.display = 'none';
            });
            tabsProf[key].btn.classList.add('active');
            tabsProf[key].area.style.display = key === 'lecRes' ? 'grid' : 'block';

            if (activeClassId) {
                if (key === 'lecRes') loadLecturesAndResources(activeClassId);
                if (key === 'qna') loadQnaAndStudents(activeClassId);
            }
        });
    });

    async function loadLecturesAndResources(classId) {
        const lectures = await api.lectures.getByClass(classId);
        const resources = await api.resources.getByClass(classId);

        document.getElementById('lectureList').innerHTML = lectures.map(l => `
            <div class="list-item">
                <span>
                    <strong>${l.title}</strong>
                    <button class="btn" style="background:#e2e8f0; color:#0f172a; padding:0.2rem 0.5rem; font-size:0.8rem; margin-left:0.5rem;" onclick="window.playProfLecture('${classId}', '${l.id}')">영상 보기</button>
                </span>
                <button class="action-btn del" onclick="window.deleteLecture('${l.id}', '${classId}')">삭제</button>
            </div>
        `).join('') || '<p style="font-size:0.9rem; color:var(--text-muted); margin-top:0.5rem;">등록된 강의가 없습니다.</p>';

        document.getElementById('resourceList').innerHTML = resources.map(r => `
            <div class="list-item">
                <span>${r.title} <small>(${r.filename})</small></span>
                <button class="action-btn del" onclick="window.deleteResource('${r.id}', '${classId}')">삭제</button>
            </div>
        `).join('') || '<p style="font-size:0.9rem; color:var(--text-muted); margin-top:0.5rem;">등록된 자료가 없습니다.</p>';
    }

    document.getElementById('btnToggleLecForm').addEventListener('click', () => {
        const form = document.getElementById('lecForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('btnToggleResForm').addEventListener('click', () => {
        const form = document.getElementById('resForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('btnCreateLec').addEventListener('click', async () => {
        if (!activeClassId) return showToast('영역 오류입니다.', 'error');
        const classId = activeClassId;
        const title = document.getElementById('lecTitle').value;
        const desc = document.getElementById('lecDesc').value;
        const link = document.getElementById('lecLink').value;
        if (!title || !link) return showToast('제목과 링크를 입력하세요.', 'error');
        await api.lectures.create(classId, title, desc, link);
        showToast('강의가 등록되었습니다.', 'success');
        document.getElementById('lecTitle').value = '';
        document.getElementById('lecDesc').value = '';
        document.getElementById('lecLink').value = '';
        document.getElementById('lecForm').style.display = 'none';
        loadLecturesAndResources(classId);
    });

    document.getElementById('btnCreateRes').addEventListener('click', async () => {
        if (!activeClassId) return showToast('영역 오류입니다.', 'error');
        const classId = activeClassId;
        const title = document.getElementById('resTitle').value;
        const desc = document.getElementById('resDesc').value;
        const fileInput = document.getElementById('resFile');
        if (!title || !fileInput.files[0]) return showToast('제목과 파일을 선택하세요.', 'error');
        const filename = fileInput.files[0].name; // Mock Upload
        await api.resources.create(classId, title, desc, filename);
        showToast('자료가 등록되었습니다.', 'success');
        document.getElementById('resTitle').value = '';
        document.getElementById('resDesc').value = '';
        fileInput.value = '';
        document.getElementById('resForm').style.display = 'none';
        loadLecturesAndResources(classId);
    });

    // 교수자용 강의 뷰 전환
    window.playProfLecture = (classId, lectureId) => {
        location.href = `lecture.html?classId=${classId}&lectureId=${lectureId}`;
    };

    window.deleteLecture = async (id, classId) => {
        await api.lectures.delete(id);
        showToast('삭제되었습니다.', 'success');
        loadLecturesAndResources(classId);
    };

    window.deleteResource = async (id, classId) => {
        await api.resources.delete(id);
        showToast('삭제되었습니다.', 'success');
        loadLecturesAndResources(classId);
    };

    async function loadQnaAndStudents(classId) {
        const qnas = await api.qnas.getByClass(classId);
        const enrolls = await api.enrollments.getByClass(classId);
        const lectures = await api.lectures.getByClass(classId);
        const allViews = await api.lectureViews.getByClass(classId);
        const allUsers = await api.users.getAll();

        document.getElementById('qnaList').innerHTML = qnas.map(q => {
            const author = allUsers.find(u => u.id === q.authorId);
            const authorName = author ? author.name : q.authorId;
            return `
            <div class="list-item" style="flex-direction:column; align-items:flex-start;">
                <div style="width:100%; display:flex; justify-content:space-between;">
                    <strong style="margin-bottom:0.5rem;">${q.title} <small>(${authorName})</small></strong>
                    <button class="action-btn del" onclick="window.deleteQna('${q.id}', '${classId}')">삭제</button>
                </div>
                <p style="font-size:0.9rem; margin-bottom:0;">${q.content}</p>
            </div>
            `;
        }).join('') || '<p style="font-size:0.9rem; color:var(--text-muted); margin-top:0.5rem;">QnA 내역이 없습니다.</p>';

        document.getElementById('enrollmentList').innerHTML = enrolls.map(e => {
            const student = allUsers.find(u => u.id === e.studentId);
            const studentName = student ? student.name : e.studentId;

            // 학생별 진도율 계산
            let avgProgress = 0;
            if (lectures.length > 0) {
                const studentViews = allViews.filter(v => v.studentId === e.studentId);
                const totalRate = lectures.reduce((sum, lec) => {
                    const view = studentViews.find(v => v.lectureId === lec.id);
                    return sum + (view ? (view.progressRate || 0) : 0);
                }, 0);
                avgProgress = Math.round(totalRate / lectures.length);
            }

            let badgeHtml = '';
            if (avgProgress >= 90) {
                badgeHtml = `<span style="background:#dcfce7; color:#166534; padding:0.2rem 0.6rem; border-radius:12px; font-size:0.8rem; font-weight:600;">완료 (${avgProgress}%)</span>`;
            } else if (avgProgress > 0) {
                badgeHtml = `<span style="background:#dbeafe; color:#1e40af; padding:0.2rem 0.6rem; border-radius:12px; font-size:0.8rem; font-weight:600;">진행중 (${avgProgress}%)</span>`;
            } else {
                badgeHtml = `<span style="background:#f1f5f9; color:#64748b; padding:0.2rem 0.6rem; border-radius:12px; font-size:0.8rem; font-weight:600;">미수강 (0%)</span>`;
            }

            return `
            <div class="list-item" style="align-items:center;">
                <span><strong>${studentName}</strong> <small style="color:var(--text-muted); marginLeft:0.5rem;">(${e.studentId})</small></span>
                <div>
                    ${badgeHtml}
                </div>
            </div>
            `;
        }).join('') || '<p style="font-size:0.9rem; color:var(--text-muted); margin-top:0.5rem;">수강생이 없습니다.</p>';
    }

    window.deleteQna = async (id, classId) => {
        if (!confirm('질문을 삭제하시겠습니까?')) return;
        await api.qnas.delete(id);
        showToast('삭제되었습니다.', 'success');
        loadQnaAndStudents(classId);
    };

    // 초기 실행
    loadMyClasses();
});
