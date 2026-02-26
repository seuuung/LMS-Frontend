import { api } from './api.js';
import { requireAuth, renderNavbar, showToast, escapeHtml, handleApiError, confirmDelete } from './common.js';

document.addEventListener('DOMContentLoaded', async () => {
    requireAuth(['admin']); // 관리자만 접근 가능
    renderNavbar();

    // 전체 유저 목록 캐시 (교수자 목록 등에 재사용)
    let allUsers = [];

    // 사이드바 탭 전환 로직
    const navItems = document.querySelectorAll('.nav-item');
    const sections = {
        users: document.getElementById('usersSec'),
        classes: document.getElementById('classesSec')
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            Object.values(sections).forEach(sec => sec.style.display = 'none');
            const target = item.dataset.target;
            if (sections[target]) {
                sections[target].style.display = 'block';
                loadData(target);
            }
        });
    });

    // URL 쿼리에 지정된 탭이 있으면 해당 탭 활성화
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('t') || 'users';

    let initialTabItem = Array.from(navItems).find(n => n.dataset.target === initialTab);
    if (initialTabItem) {
        initialTabItem.click();
    } else {
        navItems[0].click();
    }

    // ========== 데이터 로드 ==========
    async function loadData(type) {
        // 유저 목록은 공통으로 사용하므로 항상 최신화
        allUsers = await api.users.getAll();

        if (type === 'users') {
            loadUsers();
        } else if (type === 'classes') {
            loadClasses();
        }
    }

    // ========== 유저 관리 ==========
    function loadUsers() {
        const tbody = document.getElementById('userList');
        tbody.innerHTML = allUsers.map(u => `
            <tr>
                <td>${escapeHtml(u.username)}</td>
                <td>
                    <span class="user-name-display" data-id="${u.id}">${escapeHtml(u.name)}</span>
                    <input class="form-control user-name-edit" data-id="${u.id}" value="${escapeHtml(u.name)}" style="display:none; width:120px; padding:0.2rem 0.4rem; font-size:0.9rem;">
                </td>
                <td>
                    <select data-action="update-role" data-id="${u.id}">
                        <option value="student" ${u.role === 'student' ? 'selected' : ''}>학습자</option>
                        <option value="prof" ${u.role === 'prof' ? 'selected' : ''}>교수자</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>관리자</option>
                    </select>
                </td>
                <td>
                    <button class="action-btn" data-action="edit-user" data-id="${u.id}">수정</button>
                    <button class="action-btn" data-action="save-user" data-id="${u.id}" style="display:none; color:var(--primary-color);">저장</button>
                    <button class="action-btn del" data-action="delete-user" data-id="${u.id}">삭제</button>
                </td>
            </tr>
        `).join('');

        // 이벤트 위임: 역할 변경
        tbody.onchange = async (e) => {
            const select = e.target.closest('[data-action="update-role"]');
            if (!select) return;
            try {
                await api.users.updateRole(select.dataset.id, select.value);
                showToast('권한이 변경되었습니다.', 'success');
            } catch (err) {
                handleApiError(err);
            }
        };

        // 이벤트 위임: 유저 수정/삭제
        tbody.onclick = async (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;

            if (action === 'delete-user') {
                if (!await confirmDelete('정말 삭제하시겠습니까?')) return;
                try {
                    await api.users.delete(id);
                    showToast('삭제되었습니다.', 'success');
                    loadData('users');
                } catch (err) {
                    handleApiError(err);
                }
            } else if (action === 'edit-user') {
                // 인라인 편집 모드 전환
                const row = btn.closest('tr');
                row.querySelector(`.user-name-display[data-id="${id}"]`).style.display = 'none';
                row.querySelector(`.user-name-edit[data-id="${id}"]`).style.display = 'inline-block';
                row.querySelector(`[data-action="edit-user"][data-id="${id}"]`).style.display = 'none';
                row.querySelector(`[data-action="save-user"][data-id="${id}"]`).style.display = 'inline-block';
            } else if (action === 'save-user') {
                // 이름 저장
                const row = btn.closest('tr');
                const newName = row.querySelector(`.user-name-edit[data-id="${id}"]`).value.trim();
                if (!newName) return showToast('이름을 입력하세요.', 'error');
                try {
                    await api.users.update(id, { name: newName });
                    showToast('유저 정보가 수정되었습니다.', 'success');
                    loadData('users');
                } catch (err) {
                    handleApiError(err);
                }
            }
        };
    }

    // ========== 유저 추가 ==========
    document.getElementById('addUserBtn').addEventListener('click', async () => {
        // confirmDelete를 범용 모달로 활용하여 인라인 폼 대신 prompt 패턴 사용
        const username = prompt('아이디를 입력하세요:');
        if (!username) return;
        const name = prompt('이름을 입력하세요:');
        if (!name) return;
        const password = prompt('비밀번호를 입력하세요:');
        if (!password) return;
        const role = prompt('역할을 입력하세요 (student / prof / admin):', 'student');
        if (!role || !['student', 'prof', 'admin'].includes(role)) {
            return showToast('유효한 역할을 입력하세요. (student, prof, admin)', 'error');
        }

        try {
            await api.auth.register({ username, password, name, role });
            showToast('유저가 추가되었습니다.', 'success');
            loadData('users');
        } catch (err) {
            handleApiError(err);
        }
    });

    // ========== 클래스 관리 ==========
    let allClasses = []; // 검색 필터링용 캐시

    async function loadClasses() {
        allClasses = await api.classes.getAll();
        renderClassTable(allClasses);
    }

    function renderClassTable(classes) {
        const tbody = document.getElementById('classList');
        tbody.innerHTML = classes.map(c => {
            const prof = allUsers.find(u => u.id === c.profId);
            const profName = prof ? prof.name : c.profId;
            return `
                <tr>
                    <td>
                        <span class="class-title-display" data-id="${c.id}">${escapeHtml(c.title)}</span>
                        <input class="form-control class-title-edit" data-id="${c.id}" value="${escapeHtml(c.title)}" style="display:none; width:160px; padding:0.2rem 0.4rem; font-size:0.9rem;">
                    </td>
                    <td>${escapeHtml(profName)}</td>
                    <td>${new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="action-btn" data-action="edit-class" data-id="${c.id}">수정</button>
                        <button class="action-btn" data-action="save-class" data-id="${c.id}" style="display:none; color:var(--primary-color);">저장</button>
                        <button class="action-btn" style="color:var(--primary-color);" data-action="manage-class" data-id="${c.id}">관리</button>
                        <button class="action-btn del" data-action="delete-class" data-id="${c.id}">삭제</button>
                    </td>
                </tr>
            `;
        }).join('');

        // 이벤트 위임: 클래스 관리/수정/삭제
        tbody.onclick = async (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;

            if (action === 'manage-class') {
                location.href = `admin_class.html?classId=${id}`;
            } else if (action === 'delete-class') {
                if (!await confirmDelete('클래스를 삭제할까요? 하위 데이터도 모두 삭제됩니다.')) return;
                try {
                    await api.classes.delete(id);
                    showToast('삭제되었습니다.', 'success');
                    loadData('classes');
                } catch (err) {
                    handleApiError(err);
                }
            } else if (action === 'edit-class') {
                // 인라인 편집 모드 전환
                const row = btn.closest('tr');
                row.querySelector(`.class-title-display[data-id="${id}"]`).style.display = 'none';
                row.querySelector(`.class-title-edit[data-id="${id}"]`).style.display = 'inline-block';
                row.querySelector(`[data-action="edit-class"][data-id="${id}"]`).style.display = 'none';
                row.querySelector(`[data-action="save-class"][data-id="${id}"]`).style.display = 'inline-block';
            } else if (action === 'save-class') {
                const row = btn.closest('tr');
                const newTitle = row.querySelector(`.class-title-edit[data-id="${id}"]`).value.trim();
                if (!newTitle) return showToast('클래스 제목을 입력하세요.', 'error');
                try {
                    await api.classes.update(id, { title: newTitle });
                    showToast('클래스 정보가 수정되었습니다.', 'success');
                    loadData('classes');
                } catch (err) {
                    handleApiError(err);
                }
            }
        };
    }

    // ========== 클래스 검색 ==========
    document.getElementById('classSearch').addEventListener('input', (e) => {
        const keyword = e.target.value.trim().toLowerCase();
        if (!keyword) {
            renderClassTable(allClasses);
            return;
        }
        const filtered = allClasses.filter(c => c.title.toLowerCase().includes(keyword));
        renderClassTable(filtered);
    });

    // ========== 클래스 생성 ==========
    document.getElementById('addClassBtn').addEventListener('click', async () => {
        const form = document.getElementById('classForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';

        // 교수자 목록 동적 로드
        if (form.style.display === 'block') {
            const profs = allUsers.filter(u => u.role === 'prof');
            const select = document.getElementById('classProfSelect');
            select.innerHTML = '<option value="">-- 담당 교수자 선택 --</option>' +
                profs.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.username)})</option>`).join('');
        }
    });

    document.getElementById('btnCancelClass').addEventListener('click', () => {
        document.getElementById('classForm').style.display = 'none';
        document.getElementById('classTitle').value = '';
        document.getElementById('classDesc').value = '';
    });

    document.getElementById('btnCreateClass').addEventListener('click', async () => {
        const title = document.getElementById('classTitle').value.trim();
        const desc = document.getElementById('classDesc').value.trim();
        const profId = document.getElementById('classProfSelect').value;

        if (!title) return showToast('클래스 제목을 입력하세요.', 'error');
        if (!profId) return showToast('담당 교수자를 선택하세요.', 'error');

        try {
            await api.classes.create(title, desc, profId);
            showToast('클래스가 생성되었습니다.', 'success');
            document.getElementById('classForm').style.display = 'none';
            document.getElementById('classTitle').value = '';
            document.getElementById('classDesc').value = '';
            loadData('classes');
        } catch (err) {
            handleApiError(err);
        }
    });
});
