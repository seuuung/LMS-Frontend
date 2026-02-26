import { api } from './api.js';
import { requireAuth, renderNavbar, showToast, escapeHtml, handleApiError, confirmDelete } from './common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth(['prof']);
    if (!user) return;
    renderNavbar();

    // ========== 클래스 생성 UI 제어 ==========
    const createClassWrapper = document.getElementById('createClassWrapper');
    const myClassesListWrapper = document.getElementById('myClassesListWrapper');

    document.getElementById('btnCreateClass').addEventListener('click', () => {
        myClassesListWrapper.style.display = 'none';
        createClassWrapper.style.display = 'block';
    });

    document.getElementById('btnBackFromCreate').addEventListener('click', () => {
        createClassWrapper.style.display = 'none';
        myClassesListWrapper.style.display = 'block';
        document.getElementById('newClassTitle').value = '';
        document.getElementById('newClassDesc').value = '';
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
            createClassWrapper.style.display = 'none';
            loadMyClasses();
        } catch (e) {
            handleApiError(e);
        }
    });

    // ========== 클래스 목록 로드 ==========
    const container = document.getElementById('myClassList');

    async function loadMyClasses() {
        const allClasses = await api.classes.getAll();
        const myClasses = allClasses.filter(c => c.profId === user.id);

        myClassesListWrapper.style.display = 'block';

        if (myClasses.length === 0) {
            container.innerHTML = '<p>개설한 클래스가 없습니다.</p>';
            return;
        }

        container.innerHTML = myClasses.map(c => `
            <div class="class-card cursor-pointer" data-action="go-class" data-id="${c.id}" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                <div style="margin-bottom: 1rem;">
                    <h3 style="margin-bottom:0.5rem; color:var(--text-main); word-break: keep-all;">${escapeHtml(c.title)}</h3>
                    <p style="color:var(--text-muted); margin-bottom: 0.5rem;">${escapeHtml(c.description)}</p>
                    <small style="color:#94a3b8;">생성일: ${new Date(c.createdAt).toLocaleDateString()}</small>
                </div>
                <div style="display:flex; gap: 0.5rem;">
                    <button class="btn btn-primary" style="flex:1; padding: 0.5rem;" data-action="manage" data-id="${c.id}">관리하기</button>
                    <button class="btn" style="flex:1; border: 1px solid #ef4444; color:#ef4444; background:transparent; padding: 0.5rem;" data-action="delete" data-id="${c.id}">삭제</button>
                </div>
            </div>
        `).join('');
    }

    // 이벤트 위임: 클래스 카드 클릭 처리
    container.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        e.stopPropagation();
        const action = btn.dataset.action;
        const id = btn.dataset.id;

        if (action === 'go-class' || action === 'manage') {
            location.href = `professor_class.html?classId=${id}`;
        } else if (action === 'delete') {
            if (!await confirmDelete('클래스를 삭제하시겠습니까?')) return;
            try {
                await api.classes.delete(id);
                showToast('삭제되었습니다.', 'success');
                loadMyClasses();
            } catch (err) {
                handleApiError(err);
            }
        }
    });

    // 초기 실행
    loadMyClasses();
});
