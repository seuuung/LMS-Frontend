import { api } from './api.js';
import { requireAuth, renderNavbar, showToast, initTabs, renderStatusBadge, escapeHtml, handleApiError, confirmDelete } from './common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth(['prof', 'admin']);
    if (!user) return;
    renderNavbar();

    // URL에서 classId 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const classId = urlParams.get('classId');

    const btnBack = document.querySelector('.btn-back');
    if (btnBack) {
        btnBack.href = 'admin.html?t=classes';
    }

    if (!classId) {
        showToast('잘못된 접근입니다.', 'error');
        location.href = 'admin.html?t=classes';
        return;
    }

    // 클래스 정보 로드 — getById() 사용 (getAll 비효율 제거)
    const currentClass = await api.classes.getById(classId);

    if (!currentClass) {
        showToast('클래스를 찾을 수 없습니다.', 'error');
        location.href = 'admin.html?t=classes';
        return;
    }

    const allUsers = await api.users.getAll();
    const profs = allUsers.filter(u => u.role === 'prof');
    const currentProf = profs.find(p => p.id === currentClass.profId);

    // [최고권한] 클래스 타이틀 및 담당 교수 변경 UI 렌더링
    const titleArea = document.getElementById('dashboardCourseTitle');
    titleArea.innerHTML = `
        ${escapeHtml(currentClass.title)} 
        <span style="font-size:1rem; font-weight:normal; margin-left:1rem; color:var(--text-muted);">
            담당 교수: <strong>${currentProf ? escapeHtml(currentProf.name) : '미지정'}</strong>
        </span>
        <select id="profSelect" style="margin-left:0.5rem; padding:0.2rem; border-radius:4px;">
            ${profs.map(p => `<option value="${p.id}" ${p.id === currentClass.profId ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
        </select>
        <button id="btnChangeProf" class="btn" style="background:#f1f5f9; border:1px solid #cbd5e1; padding:0.2rem 0.6rem; font-size:0.85rem; margin-left:0.3rem;">변경</button>
    `;

    document.getElementById('btnChangeProf').addEventListener('click', async () => {
        const newProfId = document.getElementById('profSelect').value;
        if (currentClass.profId === newProfId) return showToast('이미 해당 교수가 담당중입니다.', 'info');

        const isConfirmed = await confirmDelete('담당 교수를 변경하시겠습니까?', {
            title: '교수자 변경 확인',
            confirmText: '변경',
            confirmBtnClass: 'btn-primary'
        });
        if (!isConfirmed) return;

        try {
            await api.classes.update(classId, { profId: newProfId });
            showToast('담당 교수가 성공적으로 변경되었습니다.', 'success');
            setTimeout(() => location.reload(), 500);
        } catch (e) { handleApiError(e); }
    });

    // ========== 탭 제어 — initTabs 공통 함수 사용 ==========
    initTabs({
        lec: { btnId: 'tabLec', areaId: 'lecArea' },
        res: { btnId: 'tabRes', areaId: 'resArea' },
        qna: { btnId: 'tabQna', areaId: 'qnaArea' }
    }, (key) => {
        if (key === 'lec' || key === 'res') loadLecturesAndResources();
        if (key === 'qna') loadQnaAndStudents();
    });

    // ========== 강의/자료 로드 ==========
    async function loadLecturesAndResources() {
        const lectures = await api.lectures.getByClass(classId);
        const resources = await api.resources.getByClass(classId);

        const lectureListEl = document.getElementById('lectureList');
        lectureListEl.innerHTML = lectures.map(l => `
            <div class="list-item">
                <span>
                    <strong>${escapeHtml(l.title)}</strong>
                    <button class="btn" style="background:#e2e8f0; color:#0f172a; padding:0.2rem 0.5rem; font-size:0.8rem; margin-left:0.5rem;" data-action="play" data-id="${l.id}">영상 보기</button>
                    <button class="btn" style="background:#eff6ff; color:#3b82f6; padding:0.2rem 0.5rem; font-size:0.8rem; margin-left:0.5rem;" data-action="stats" data-id="${l.id}">수강률 통계</button>
                </span>
                <button class="action-btn del" data-action="delete-lecture" data-id="${l.id}">삭제</button>
            </div>
        `).join('') || '<p style="font-size:0.9rem; color:var(--text-muted); margin-top:0.5rem;">등록된 강의가 없습니다.</p>';

        const resourceListEl = document.getElementById('resourceList');
        resourceListEl.innerHTML = resources.map(r => `
            <div class="list-item">
                <span>${escapeHtml(r.title)} <small>(${escapeHtml(r.filename)})</small></span>
                <button class="action-btn del" data-action="delete-resource" data-id="${r.id}">삭제</button>
            </div>
        `).join('') || '<p style="font-size:0.9rem; color:var(--text-muted); margin-top:0.5rem;">등록된 자료가 없습니다.</p>';

        // 이벤트 위임: 강의 목록
        lectureListEl.onclick = async (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;

            if (action === 'play') {
                location.href = user.role === 'admin' ? `lecture.html?classId=${classId}&lectureId=${id}` : `lecture.html?classId=${classId}&lectureId=${id}`;
            } else if (action === 'stats') {
                location.href = `lecture_stats.html?classId=${classId}&lectureId=${id}`;
            } else if (action === 'delete-lecture') {
                if (!await confirmDelete('정말로 이 강의를 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.')) return;
                await api.lectures.delete(id);
                showToast('삭제되었습니다.', 'success');
                loadLecturesAndResources();
            }
        };

        // 이벤트 위임: 자료 목록
        resourceListEl.onclick = async (e) => {
            const btn = e.target.closest('[data-action="delete-resource"]');
            if (!btn) return;
            if (!await confirmDelete('이 자료를 삭제하시겠습니까?')) return;
            await api.resources.delete(btn.dataset.id);
            showToast('삭제되었습니다.', 'success');
            loadLecturesAndResources();
        };
    }

    // ========== 강의 업로드 페이지 이동 ==========
    document.getElementById('btnGoUpload').addEventListener('click', () => {
        location.href = `professor_upload.html?classId=${classId}`;
    });

    // ========== 인라인 자료 업로드 ==========
    document.getElementById('btnToggleResForm').addEventListener('click', () => {
        const form = document.getElementById('resForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('btnCancelRes').addEventListener('click', () => {
        document.getElementById('resForm').style.display = 'none';
        document.getElementById('resTitle').value = '';
        document.getElementById('resDesc').value = '';
        document.getElementById('resFile').value = '';
    });

    document.getElementById('btnCreateRes').addEventListener('click', async () => {
        const title = document.getElementById('resTitle').value;
        const desc = document.getElementById('resDesc').value;
        const fileInput = document.getElementById('resFile');
        if (!title || !fileInput.files[0]) return showToast('제목과 파일을 선택하세요.', 'error');
        const filename = fileInput.files[0].name;
        await api.resources.create(classId, title, desc, filename);
        showToast('자료가 등록되었습니다.', 'success');
        document.getElementById('resTitle').value = '';
        document.getElementById('resDesc').value = '';
        fileInput.value = '';
        document.getElementById('resForm').style.display = 'none';
        loadLecturesAndResources();
    });

    // ========== QnA / 수강생 로드 ==========
    async function loadQnaAndStudents() {
        const qnas = await api.qnas.getByClass(classId);
        const enrolls = await api.enrollments.getByClass(classId);
        const lectures = await api.lectures.getByClass(classId);
        const allViews = await api.lectureViews.getByClass(classId);
        const allUsers = await api.users.getAll();

        const qnaListEl = document.getElementById('qnaList');
        qnaListEl.innerHTML = qnas.map(q => {
            const author = allUsers.find(u => u.id === q.authorId);
            const authorName = author ? author.name : q.authorId;
            return `
            <div class="list-item" style="flex-direction:column; align-items:flex-start;">
                <div style="width:100%; display:flex; justify-content:space-between;">
                    <strong style="margin-bottom:0.5rem;">${escapeHtml(q.title)} <small>(${escapeHtml(authorName)})</small></strong>
                    <button class="action-btn del" data-action="delete-qna" data-id="${q.id}">삭제</button>
                </div>
                <p style="font-size:0.9rem; margin-bottom:0;">${escapeHtml(q.content)}</p>
            </div>
            `;
        }).join('') || '<p style="font-size:0.9rem; color:var(--text-muted); margin-top:0.5rem;">QnA 내역이 없습니다.</p>';

        // 이벤트 위임: QnA 삭제
        qnaListEl.onclick = async (e) => {
            const btn = e.target.closest('[data-action="delete-qna"]');
            if (!btn) return;
            if (!await confirmDelete('질문을 삭제하시겠습니까?')) return;
            await api.qnas.delete(btn.dataset.id);
            showToast('삭제되었습니다.', 'success');
            loadQnaAndStudents();
        };

        document.getElementById('enrollmentList').innerHTML = enrolls.map(e => {
            const student = allUsers.find(u => u.id === e.studentId);
            const studentName = student ? student.name : e.studentId;

            let avgProgress = 0;
            if (lectures.length > 0) {
                const studentViews = allViews.filter(v => v.studentId === e.studentId);
                const totalRate = lectures.reduce((sum, lec) => {
                    const view = studentViews.find(v => v.lectureId === lec.id);
                    return sum + (view ? (view.progressRate || 0) : 0);
                }, 0);
                avgProgress = Math.round(totalRate / lectures.length);
            }

            return `
            <div class="list-item" style="align-items:center;">
                <span><strong>${escapeHtml(studentName)}</strong> <small style="color:var(--text-muted); margin-left:0.5rem;">(${escapeHtml(e.studentId)})</small></span>
                <div>${renderStatusBadge(avgProgress)}</div>
            </div>
            `;
        }).join('') || '<p style="font-size:0.9rem; color:var(--text-muted); margin-top:0.5rem;">수강생이 없습니다.</p>';
    }

    // 초기 실행: 강의 탭 데이터 로드
    loadLecturesAndResources();
});
