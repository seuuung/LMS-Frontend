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

    const handleMenuClick = (tabKey) => {
        // 현재 경로가 베이스 라우트와 다르면 베이스 라우트로 이동하면서 쿼리 탭 추가
        if (pathname !== getBaseRoute()) {
            router.push(`${getBaseRoute()}?tab=${tabKey}`);
        } else {
            // 이미 베이스 라우트이면(대시보드 메인) 쿼리 파라미터만 교체 (혹은 부모에게 onClick 등을 위임할 수도 있지만, 
            // 컴포넌트 내부에서 URL 갱신 방식을 강제)
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
