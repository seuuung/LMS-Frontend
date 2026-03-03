'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/**
 * 전역 네비게이션 바 컴포넌트 (Header)
 * 현재 로그인 상태와 권한에 따라 홈 버튼 URL을 분기 처리하고 사용자 이름과 로그아웃 버튼을 표시합니다.
 * 강의 시청 페이지(/lecture)에서는 돌아가기 버튼을 추가로 표시합니다.
 * @returns {JSX.Element}
 */
export default function Header() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const isLecturePage = pathname === '/lecture' || pathname === '/lecture_stats' || pathname.includes('/upload');

    const getHomeLink = () => {
        if (!user) return '/';
        if (user.role === 'admin') return '/admin';
        if (user.role === 'prof') return '/professor';
        return '/student';
    };

    return (
        <nav className="navbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href={getHomeLink()} className="navbar-brand">
                    LMS Platform
                </Link>
                {isLecturePage && (
                    <button
                        className="btn btn-back"
                        style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem' }}
                        onClick={() => router.back()}
                    >
                        &larr; 돌아가기
                    </button>
                )}
            </div>
            <div className="nav-links">
                {user ? (
                    <>
                        <span className="user-info" style={{ fontWeight: 600 }}>
                            {user.name} 님 ({user.role})
                        </span>
                        <button
                            onClick={logout}
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                        >
                            로그아웃
                        </button>
                    </>
                ) : null}
            </div>
        </nav>
    );
}
