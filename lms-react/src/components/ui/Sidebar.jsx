'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/**
 * 전역 공통 사이드바 컴포넌트
 * 접속한 사용자의 역할(Admin, Professor, Student)에 따라 
 * 항상 동일한 좌측 메뉴 네비게이션을 제공합니다.
 * @param {string} [activeMenu] - 부모 컴포넌트에서 강제로 활성화할 메뉴 키 (예: 'myInfo', 'exploreClasses', 'manageUsers')
 *                                주어지지 않을 경우 pathname 기반으로 활성화 상태를 추론합니다.
 */
export default function Sidebar({ activeMenu }) {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    if (!user) return null;

    // 현재 URL의 Path를 기반으로 베이스 메뉴를 판단
    const isAdmin = user.role === 'admin';
    const isProf = user.role === 'prof';
    const isStudent = user.role === 'student';

    const getBaseRoute = () => {
        if (isAdmin) return '/admin';
        if (isProf) return '/professor';
        return '/student';
    };

    /**
     * 메뉴 클릭 핸들러
     * 1. 현재 대시보드 외의 페이지(예: 강의 시청 중)라면 push를 통해 대시보드로 이동합니다.
     * 2. 이미 대시보드 내에 있다면 replace를 통해 URL 히스토리를 쌓지 않고 탭만 전환합니다.
     * 3. 쿼리 스트링(?tab=...)을 통해 대시보드 내부의 활성 탭을 제어합니다.
     */
    const handleMenuClick = (tabKey) => {
        if (pathname !== getBaseRoute()) {
            router.push(`${getBaseRoute()}?tab=${tabKey}`);
        } else {
            router.replace(`${getBaseRoute()}?tab=${tabKey}`);
        }
    };

    // 활성화 상태 판별 유틸
    const isActive = (key) => {
        if (activeMenu) return activeMenu === key;
        const currentTab = searchParams.get('tab');
        if (currentTab) return currentTab === key;

        // 기본 탭 추론
        if (key === 'users' && isAdmin) return true;
        if (key === 'myClasses' && isProf) return true;
        if (key === 'myClasses' && isStudent) return true;
        return false;
    };

    return (
        <aside className="sidebar">
            <h3 style={{ padding: '0 1rem', marginBottom: '1rem' }}>
                {isAdmin ? 'Admin Menu' : isProf ? 'Professor Menu' : 'Student Menu'}
            </h3>

            {/* 공통: 내 정보 (모두) */}
            <div
                className={`nav-item ${isActive('myInfo') ? 'active' : ''}`}
                onClick={() => handleMenuClick('myInfo')}
            >
                내 정보
            </div>

            {/* 역할별 분기 */}
            {isAdmin && (
                <>
                    <div
                        className={`nav-item ${isActive('users') ? 'active' : ''}`}
                        onClick={() => handleMenuClick('users')}
                    >
                        사용자 관리
                    </div>
                    <div
                        className={`nav-item ${isActive('classes') ? 'active' : ''}`}
                        onClick={() => handleMenuClick('classes')}
                    >
                        전체 클래스 관리
                    </div>
                </>
            )}

            {isProf && (
                <div
                    className={`nav-item ${isActive('myClasses') ? 'active' : ''}`}
                    onClick={() => handleMenuClick('myClasses')}
                >
                    내 클래스 관리
                </div>
            )}

            {isStudent && (
                <>
                    <div
                        className={`nav-item ${isActive('exploreClasses') ? 'active' : ''}`}
                        onClick={() => handleMenuClick('exploreClasses')}
                    >
                        클래스 목록
                    </div>
                    <div
                        className={`nav-item ${isActive('myClasses') ? 'active' : ''}`}
                        onClick={() => handleMenuClick('myClasses')}
                    >
                        내 학습 공간
                    </div>
                </>
            )}
        </aside>
    );
}
