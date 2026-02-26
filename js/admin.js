import { api } from './api.js';
import { requireAuth, renderNavbar, showToast } from './common.js';

document.addEventListener('DOMContentLoaded', async () => {
    requireAuth(['admin']); // 관리자만 접근 가능
    renderNavbar();

    // 탭 전환 로직
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

    // 초기 데이터 로드
    loadData('users');

    async function loadData(type) {
        if (type === 'users') {
            const users = await api.users.getAll();
            const tbody = document.getElementById('userList');
            tbody.innerHTML = users.map(u => `
                <tr>
                    <td>${u.username}</td>
                    <td>${u.name}</td>
                    <td>
                        <select onchange="window.updateRole('${u.id}', this.value)">
                            <option value="student" ${u.role === 'student' ? 'selected' : ''}>학습자</option>
                            <option value="prof" ${u.role === 'prof' ? 'selected' : ''}>교수자</option>
                            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>관리자</option>
                        </select>
                    </td>
                    <td>
                        <button class="action-btn del" onclick="window.deleteUser('${u.id}')">삭제</button>
                    </td>
                </tr>
            `).join('');
        } else if (type === 'classes') {
            const classes = await api.classes.getAll();
            const tbody = document.getElementById('classList');
            tbody.innerHTML = classes.map(c => `
                <tr>
                    <td>${c.title}</td>
                    <td>${c.profId}</td>
                    <td>${new Date(c.createdAt).toLocaleDateString()}</td>
                    <td><button class="action-btn del" onclick="window.deleteClass('${c.id}')">삭제</button></td>
                </tr>
            `).join('');
        }
    }

    // 글로벌 함수 등록 (인라인 onclick용)
    window.updateRole = async (id, role) => {
        try {
            await api.users.updateRole(id, role);
            showToast('권한이 변경되었습니다.', 'success');
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.deleteUser = async (id) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await api.users.delete(id);
            showToast('삭제되었습니다.', 'success');
            loadData('users');
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.deleteClass = async (id) => {
        if (!confirm('클래스를 삭제할까요? 하위 데이터도 모두 삭제됩니다.')) return;
        try {
            await api.classes.delete(id);
            showToast('삭제되었습니다.', 'success');
            loadData('classes');
        } catch (e) { showToast(e.message, 'error'); }
    };

});
