import { api } from './api.js';
import { requireAuth, renderNavbar, showToast, initTabs, renderStatusBadge, escapeHtml, handleApiError } from './common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth(['student']);
    if (!user) return;
    renderNavbar();

    // URL에서 classId 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const classId = urlParams.get('classId');

    if (!classId) {
        showToast('잘못된 접근입니다.', 'error');
        location.href = 'student.html';
        return;
    }

    // 클래스 정보 로드 — getById() 사용 (getAll 비효율 제거)
    const currentClass = await api.classes.getById(classId);

    if (!currentClass) {
        showToast('클래스를 찾을 수 없습니다.', 'error');
        location.href = 'student.html';
        return;
    }

    document.getElementById('dashboardCourseTitle').textContent = currentClass.title;

    // ========== 탭 제어 — initTabs 공통 함수 사용 ==========
    initTabs({
        lec: { btnId: 'tabLec', areaId: 'lecArea' },
        res: { btnId: 'tabRes', areaId: 'resArea' },
        qna: { btnId: 'tabQna', areaId: 'qnaArea' }
    }, (key) => {
        loadClassContent(key);
    });

    // ========== 콘텐츠 로드 ==========
    async function loadClassContent(type) {
        if (type === 'lec') {
            const lectures = await api.lectures.getByClass(classId);
            const views = await api.lectureViews.getByClassAndStudent(classId, user.id);

            const myLecturesEl = document.getElementById('myLectures');
            myLecturesEl.innerHTML = lectures.map(l => {
                const viewInfo = views.find(v => v.lectureId === l.id);
                const currentRate = viewInfo ? (viewInfo.progressRate || 0) : 0;

                return `
                <div class="list-item">
                    <div>
                        <strong>${escapeHtml(l.title)}</strong>
                        <p style="margin:0; font-size:0.9rem;">${escapeHtml(l.description)}</p>
                    </div>
                    <div style="display:flex; align-items:center; gap:1rem;">
                        ${renderStatusBadge(currentRate)}
                        <button class="btn btn-primary" style="padding:0.4rem 1rem; font-size:0.9rem;" data-action="play" data-id="${l.id}">시청</button>
                    </div>
                </div>
                `;
            }).join('') || '<p style="color:var(--text-muted);">업로드된 강의가 없습니다.</p>';

            // 이벤트 위임: 강의 시청
            myLecturesEl.onclick = (e) => {
                const btn = e.target.closest('[data-action="play"]');
                if (!btn) return;
                location.href = `lecture.html?classId=${classId}&lectureId=${btn.dataset.id}`;
            };
        }
        else if (type === 'res') {
            const resources = await api.resources.getByClass(classId);
            document.getElementById('myResources').innerHTML = resources.map(r => `
                <div class="list-item">
                    <span>${escapeHtml(r.title)} <small>(${escapeHtml(r.filename)})</small></span>
                    <button class="btn btn-primary" style="padding:0.4rem 1rem; font-size:0.9rem;" data-action="download" data-filename="${escapeHtml(r.filename)}">다운로드</button>
                </div>
            `).join('') || '<p style="color:var(--text-muted);">등록된 자료가 없습니다.</p>';

            // 이벤트 위임: 다운로드
            document.getElementById('myResources').onclick = (e) => {
                const btn = e.target.closest('[data-action="download"]');
                if (!btn) return;
                showToast(`[${btn.dataset.filename}] 다운로드를 시작합니다.`, 'success');
            };
        }
        else if (type === 'qna') {
            const qnas = await api.qnas.getByClass(classId);
            document.getElementById('qTitle').value = '';
            document.getElementById('qContent').value = '';
            document.getElementById('qnaForm').style.display = 'none';

            const myQnasEl = document.getElementById('myQnas');
            myQnasEl.innerHTML = qnas.map(q => `
                <div class="list-item" style="flex-direction:column; align-items:flex-start;">
                    <strong style="margin-bottom:0.5rem;">${escapeHtml(q.title)} <small>(${escapeHtml(q.authorId)})</small></strong>
                    <p style="font-size:0.9rem; margin-bottom:0;">${escapeHtml(q.content)}</p>
                    ${q.authorId === user.id ? `<button class="action-btn del mt-4" style="align-self:flex-end;" data-action="delete-qna" data-id="${q.id}">내 게시글 삭제</button>` : ''}
                </div>
            `).join('') || '<p style="color:var(--text-muted);">등록된 QnA가 없습니다.</p>';

            // 이벤트 위임: QnA 삭제
            myQnasEl.onclick = async (e) => {
                const btn = e.target.closest('[data-action="delete-qna"]');
                if (!btn) return;
                if (!confirm('삭제하시겠습니까?')) return;
                await api.qnas.delete(btn.dataset.id);
                showToast('삭제되었습니다', 'success');
                loadClassContent('qna');
            };
        }
    }

    // ========== QnA 작성 ==========
    document.getElementById('btnWriteQna').addEventListener('click', () => {
        const form = document.getElementById('qnaForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('submitQna').addEventListener('click', async () => {
        const title = document.getElementById('qTitle').value;
        const content = document.getElementById('qContent').value;
        if (!title || !content) return showToast('제목과 내용을 입력하세요', 'error');

        await api.qnas.create(classId, user.id, title, content);
        showToast('질문이 등록되었습니다.', 'success');
        loadClassContent('qna');
    });

    // 초기 실행: 강의 탭 데이터 로드
    loadClassContent('lec');
});
