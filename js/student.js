import { api } from './api.js';
import { requireAuth, renderNavbar, showToast, escapeHtml, handleApiError } from './common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth(['student', 'admin']);
    if (!user) return;
    renderNavbar();

    // 사이드바 탭 전환 로직
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
                if (target === 'myClasses') loadMyClasses();
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
            const profName = allUsers.find(u => u.id === c.profId)?.name || c.profId;
            return `
            <div class="class-card">
                <h3>${escapeHtml(c.title)}</h3>
                <p>${escapeHtml(c.description)}</p>
                <small style="color:var(--text-muted); display:block; margin-bottom:1rem;">교수자: ${escapeHtml(profName)}</small>
                ${isEnrolled
                    ? `<button class="btn" style="background:#e2e8f0; width:100%; cursor:not-allowed;" disabled>수강 중</button>`
                    : `<button class="btn btn-primary" style="width:100%;" data-action="enroll" data-id="${c.id}">수강 신청</button>`
                }
            </div>
            `;
        }).join('');

        // 이벤트 위임: 수강 신청
        container.onclick = async (e) => {
            const btn = e.target.closest('[data-action="enroll"]');
            if (!btn) return;
            try {
                await api.enrollments.create(btn.dataset.id, user.id);
                showToast('수강 신청이 완료되었습니다.', 'success');
                loadExploreClasses();
            } catch (err) {
                handleApiError(err);
            }
        };
    }

    // ========== 2. 내 학습 공간 (클래스 목록) ==========
    async function loadMyClasses() {
        const container = document.getElementById('myClassesList');
        const myEnrolls = await api.enrollments.getByStudent(user.id);
        const allClasses = await api.classes.getAll();
        const myClasses = myEnrolls.map(e => allClasses.find(c => c.id === e.classId)).filter(Boolean);

        if (myClasses.length === 0) {
            container.innerHTML = '<p>수강 중인 클래스가 없습니다.</p>';
            return;
        }

        container.innerHTML = myClasses.map(c => `
            <div class="class-card cursor-pointer" data-action="go-class" data-id="${c.id}">
                <h3>${escapeHtml(c.title)}</h3>
                <p>${escapeHtml(c.description)}</p>
                <button class="btn btn-primary mt-4" style="width:100%;">학습 시작</button>
            </div>
        `).join('');

        // 이벤트 위임: 클래스 이동
        container.onclick = (e) => {
            const card = e.target.closest('[data-action="go-class"]');
            if (!card) return;
            location.href = `student_class.html?classId=${card.dataset.id}`;
        };
    }

    // 초기 실행
    loadExploreClasses();
});
