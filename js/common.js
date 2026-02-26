/**
 * common.js
 * 전역으로 사용되는 공통 UI 스크립트 및 인증 상태 체크 유틸리티
 */

// 현재 로그인한 유저 정보 가져오기
export const getCurrentUser = () => {
    const userStr = localStorage.getItem('lms_current_user');
    return userStr ? JSON.parse(userStr) : null;
};

// 로그인 상태 저장
export const setCurrentUser = (user) => {
    localStorage.setItem('lms_current_user', JSON.stringify(user));
};

// 로그아웃
export const logout = () => {
    localStorage.removeItem('lms_current_user');
    window.location.href = 'index.html';
};

// 권한별 접근 제어 (라우팅 대용)
export const requireAuth = (allowedRoles = []) => {
    const user = getCurrentUser();
    if (!user) {
        alert('로그인이 필요합니다.');
        window.location.href = 'index.html';
        return null;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        alert('접근 권한이 없습니다.');
        window.location.href = 'index.html';
        return null;
    }
    return user;
};

// 네비게이션 바 렌더링
export const renderNavbar = () => {
    const user = getCurrentUser();
    const nav = document.createElement('nav');
    nav.className = 'navbar';

    nav.innerHTML = `
        <div class="navbar-brand">LMS Platform</div>
        <div class="nav-links">
            ${user ? `
                <span style="font-weight:600;">${user.name} 님 (${user.role})</span>
                <button id="logoutBtn" class="btn btn-primary" style="padding: 0.4rem 1rem; font-size: 0.9rem;">로그아웃</button>
            ` : ''}
        </div>
    `;

    document.body.prepend(nav);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
};

// 간단한 Toast 메시지 구현 (모던 UI)
export const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '15px 25px';
    toast.style.backgroundColor = type === 'error' ? 'var(--danger-color)' : (type === 'success' ? 'var(--success-color)' : 'var(--card-bg)');
    toast.style.color = type === 'info' ? 'var(--text-main)' : '#fff';
    toast.style.boxShadow = 'var(--shadow-lg)';
    toast.style.borderRadius = 'var(--radius-md)';
    toast.style.zIndex = '9999';
    toast.style.transition = 'opacity 0.3s ease-in-out';
    toast.style.opacity = '0';
    toast.textContent = message;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => toast.style.opacity = '1', 10);

    // Remove after 3s
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};
