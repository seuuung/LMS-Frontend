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
    window.location.href = '../index.html';
};

// 권한별 접근 제어 (라우팅 대용)
export const requireAuth = (allowedRoles = []) => {
    const user = getCurrentUser();
    if (!user) {
        alert('로그인이 필요합니다.');
        window.location.href = '../index.html';
        return null;
    }

    // admin 사용자는 모든 권한 제어를 무시하고 pass (최고 관리자)
    if (user.role === 'admin') {
        return user;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        alert('접근 권한이 없습니다.');
        window.location.href = '../index.html';
        return null;
    }
    return user;
};

// 네비게이션 바 렌더링
export const renderNavbar = () => {
    // 이미 네비게이션이 있다면 중복 렌더링 방지
    if (document.querySelector('.navbar')) return;

    const user = getCurrentUser();
    const nav = document.createElement('nav');
    nav.className = 'navbar';

    // 메인 페이지(역할별)로 이동하는 로고 링크 동적 생성
    const homeLink = user
        ? (user.role === 'admin' ? 'admin.html' : user.role === 'prof' ? 'professor.html' : 'student.html')
        : '../index.html';

    nav.innerHTML = `
        <a href="${homeLink}" class="navbar-brand">LMS Platform</a>
        <div class="nav-links">
            ${user ? `
                <span class="user-info" style="font-weight:600;">${user.name} 님 (${user.role})</span>
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

// 푸터 렌더링
export const renderFooter = () => {
    // 이미 푸터가 있다면 중복 렌더링 방지
    if (document.querySelector('.footer')) return;

    const footer = document.createElement('footer');
    footer.className = 'footer';

    footer.innerHTML = `
        <div class="container">
            <p class="footer-text">&copy; ${new Date().getFullYear()} LMS Platform. All rights reserved.</p>
        </div>
    `;

    document.body.appendChild(footer);
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

// 전역 로딩 스피너 관리
let loadingCount = 0;
export const showLoading = () => {
    loadingCount++;
    if (loadingCount === 1) {
        let overlay = document.getElementById('global-loading');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'global-loading';
            overlay.innerHTML = `
                <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.7); display:flex; justify-content:center; align-items:center; z-index:99999;">
                    <div style="width:40px; height:40px; border:4px solid var(--border-color, #e2e8f0); border-top:4px solid var(--primary-color, #2563eb); border-radius:50%; animation:spin 1s linear infinite;"></div>
                </div>
                <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
            `;
            document.body.appendChild(overlay);
        } else {
            overlay.style.display = 'flex';
        }
    }
};

export const hideLoading = () => {
    loadingCount--;
    if (loadingCount <= 0) {
        loadingCount = 0;
        const overlay = document.getElementById('global-loading');
        if (overlay) overlay.style.display = 'none';
    }
};

// HTML 이스케이프 (XSS 방지)
export const escapeHtml = (str) => {
    if (str == null) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
};

// 유튜브 링크에서 Video ID 추출 (lecture.js, professor_upload.js 공통)
export const extractVideoId = (link) => {
    if (!link) return '';
    if (link.includes('youtu.be/')) return link.split('youtu.be/')[1].split('?')[0];
    if (link.includes('watch?v=')) return link.split('watch?v=')[1].split('&')[0];
    if (link.includes('embed/')) return link.split('embed/')[1].split('?')[0];
    if (link.includes('shorts/')) return link.split('shorts/')[1].split('?')[0];
    if (link.length === 11 && !link.includes('/')) return link;
    return '';
};

// 수강 상태 뱃지 HTML 생성 (lecture.js, student_class.js, professor_class.js 공통)
export const renderStatusBadge = (rate, options = {}) => {
    const { asElement = false } = options;

    let text, className;
    if (rate >= 95) {
        text = '수강 완료 (100%)';
        className = 'badge badge-complete';
    } else if (rate > 0) {
        text = `수강 중 (${rate}%)`;
        className = 'badge badge-progress';
    } else {
        text = '미수강 (0%)';
        className = 'badge badge-none';
    }

    if (asElement) {
        const span = document.createElement('span');
        span.className = className;
        span.textContent = text;
        return span;
    }
    return `<span class="${className}">${escapeHtml(text)}</span>`;
};

// 탭 전환 초기화 (professor_class.js, student_class.js, admin.js 공통)
export const initTabs = (tabConfig, onTabChange) => {
    const tabs = {};
    Object.keys(tabConfig).forEach(key => {
        tabs[key] = {
            btn: document.getElementById(tabConfig[key].btnId),
            area: tabConfig[key].areaId ? document.getElementById(tabConfig[key].areaId) : null
        };
    });

    Object.keys(tabs).forEach(key => {
        if (!tabs[key].btn) return;
        tabs[key].btn.addEventListener('click', () => {
            Object.values(tabs).forEach(t => {
                t.btn.classList.remove('active');
                if (t.area) t.area.style.display = 'none';
            });
            tabs[key].btn.classList.add('active');
            if (tabs[key].area) tabs[key].area.style.display = 'block';

            if (onTabChange) onTabChange(key);
        });
    });

    return tabs;
};

// 에러 핸들링 통합 (API 호출 실패 시 일관된 처리)
export const handleApiError = (e, fallbackMsg = '오류가 발생했습니다.') => {
    const message = (e && e.message) ? e.message : fallbackMsg;
    showToast(message, 'error');
    console.error(e);
};

// 2단계 액션 확인 유틸리티 (커스텀 모달) - 삭제 등 위험 작업용 또는 범용
export const confirmDelete = (message = '이 항목을 삭제하시겠습니까?', options = {}) => {
    return new Promise((resolve) => {
        const { title = '삭제 확인', confirmText = '삭제', confirmBtnClass = 'btn-delete' } = options;

        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'custom-modal';

        modal.innerHTML = `
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(message)}</p>
            <div class="custom-modal-actions">
                <button class="btn btn-cancel" id="customModalCancel">취소</button>
                <button class="btn ${confirmBtnClass}" id="customModalConfirm">${escapeHtml(confirmText)}</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // 애니메이션 효과
        setTimeout(() => {
            overlay.style.opacity = '1';
            modal.style.transform = 'translateY(0)';
        }, 10);

        const cleanup = (result) => {
            overlay.style.opacity = '0';
            modal.style.transform = 'translateY(20px)';
            setTimeout(() => {
                overlay.remove();
                resolve(result);
            }, 200); // transition duration
        };

        document.getElementById('customModalCancel').addEventListener('click', () => cleanup(false));
        document.getElementById('customModalConfirm').addEventListener('click', () => cleanup(true));

        // 오버레이 클릭 시 취소 처리
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup(false);
        });
    });
};
