import { api } from './api.js';
import { requireAuth, renderNavbar, showToast, escapeHtml, handleApiError, confirmDelete } from './common.js';

document.addEventListener('DOMContentLoaded', async () => {
    requireAuth(['admin']); // 관리자만 접근 가능
    renderNavbar();

    // 사이드바 탭 전환 로직 (admin은 사이드바 패턴 사용)
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

    // URL 쿼리에 지정된 탭이 있으면 해당 탭 활성화, 없으면 기본 users 탭
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('t') || 'users';

    let initialTabItem = Array.from(navItems).find(n => n.dataset.target === initialTab);
    if (initialTabItem) {
        initialTabItem.click();
    } else {
        navItems[0].click(); // fallback
    }

    async function loadData(type) {
        if (type === 'users') {
            const users = await api.users.getAll();
            const tbody = document.getElementById('userList');
            tbody.innerHTML = users.map(u => `
                <tr>
                    <td>${escapeHtml(u.username)}</td>
                    <td>${escapeHtml(u.name)}</td>
                    <td>
                        <select data-action="update-role" data-id="${u.id}">
                            <option value="student" ${u.role === 'student' ? 'selected' : ''}>학습자</option>
                            <option value="prof" ${u.role === 'prof' ? 'selected' : ''}>교수자</option>
                            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>관리자</option>
                        </select>
                    </td>
                    <td>
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

            // 이벤트 위임: 유저 삭제
            tbody.onclick = async (e) => {
                const btn = e.target.closest('[data-action="delete-user"]');
                if (!btn) return;
                if (!await confirmDelete('정말 삭제하시겠습니까?')) return;
                try {
                    await api.users.delete(btn.dataset.id);
                    showToast('삭제되었습니다.', 'success');
                    loadData('users');
                } catch (err) {
                    handleApiError(err);
                }
            };
        } else if (type === 'classes') {
            const classes = await api.classes.getAll();
            const tbody = document.getElementById('classList');
            tbody.innerHTML = classes.map(c => `
                <tr>
                    <td>${escapeHtml(c.title)}</td>
                    <td>${escapeHtml(c.profId)}</td>
                    <td>${new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="action-btn" style="color:var(--primary-color);" data-action="manage-class" data-id="${c.id}">관리</button>
                        <button class="action-btn del" data-action="delete-class" data-id="${c.id}">삭제</button>
                    </td>
                </tr>
            `).join('');

            // 이벤트 위임: 클래스 삭제
            tbody.onclick = async (e) => {
                const btn = e.target.closest('[data-action="delete-class"]');
                if (!btn) return;
                if (!await confirmDelete('클래스를 삭제할까요? 하위 데이터도 모두 삭제됩니다.')) return;
                try {
                    await api.classes.delete(btn.dataset.id);
                    showToast('삭제되었습니다.', 'success');
                    loadData('classes');
                } catch (err) {
                    handleApiError(err);
                }
            };

            // 이벤트 위임: 클래스 관리 (입장)
            tbody.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-action="manage-class"]');
                if (!btn) return;
                location.href = `admin_class.html?classId=${btn.dataset.id}`;
            });
        }
    }
});
