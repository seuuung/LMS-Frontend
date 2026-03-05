'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import MyInfoModal from '@/components/ui/MyInfoModal';

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

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMyInfoOpen, setIsMyInfoOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div ref={dropdownRef} style={{ position: 'relative' }}>
                            <div
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    cursor: 'pointer', padding: '0.3rem 0.5rem',
                                    borderRadius: '6px'
                                }}
                            >
                                <span className="user-info" style={{ fontWeight: 600, margin: 0 }}>
                                    {user.name} 님 ({user.role})
                                </span>
                                <span style={{ fontSize: '0.7rem', color: '#64748b', transition: 'transform 0.2s', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                                    ▼
                                </span>
                            </div>

                            {isDropdownOpen && (
                                <div style={{
                                    position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem',
                                    backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                    minWidth: '150px', zIndex: 1000, overflow: 'hidden'
                                }}>
                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            setIsMyInfoOpen(true);
                                        }}
                                        style={{
                                            display: 'block', width: '100%', padding: '0.75rem 1rem',
                                            textAlign: 'left', backgroundColor: 'transparent',
                                            border: 'none', cursor: 'pointer', fontSize: '0.95rem',
                                            color: '#334155', fontWeight: 500
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                        내 정보 수정
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={logout}
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                        >
                            로그아웃
                        </button>

                        <MyInfoModal isOpen={isMyInfoOpen} onClose={() => setIsMyInfoOpen(false)} />
                    </div>
                ) : null}
            </div>
        </nav>
    );
}
