'use client';

import { createContext, useState, useEffect } from 'react';
import { api } from '@/lib/api/api';
import { useRouter } from 'next/navigation';

export const AuthContext = createContext(null);

/**
 * 역할별 초기 진입 경로 설정 객체
 * 새로운 역할이 추가되거나 대시보드 경로가 변경될 경우 이 객체만 수정하면 됩니다.
 */
const ROLE_ROUTES = {
    admin: '/admin',       // 관리자: 유저 및 클래스 통합 관리
    prof: '/professor',    // 교수자: 강좌 및 수강생 관리
    student: '/student'    // 학습자: 내 학습 공간 및 클래스 탐색
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // 앱 진입 시 로컬스토리지에서 로그인 상태 복구
        const savedUser = localStorage.getItem('lms_current_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    /**
     * 로그인 처리 함수
     * 1. API를 통해 사용자 인증 정보를 가져옵니다.
     * 2. 인증 성공 시 전역 상태(user)와 로컬스토리지에 저장하여 세션을 유지합니다.
     * 3. ROLE_ROUTES 설정에 따라 해당 역할의 대시보드로 자동 리다이렉션합니다.
     */
    const login = async (username, password) => {
        try {
            const userData = await api.auth.login(username, password);
            setUser(userData);
            localStorage.setItem('lms_current_user', JSON.stringify(userData));

            // 권한별 라우팅 (설정 객체 참조 방식으로 개선됨)
            const targetPath = ROLE_ROUTES[userData.role] || '/';
            router.push(targetPath);

            return userData;
        } catch (error) {
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const res = await api.auth.register(userData);
            return res;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('lms_current_user');
        router.push('/');
    };

    /**
     * 권한 검증 및 페이지 접근 제어 함수
     * @param {string[]} allowedRoles - 접근 가능한 역할 배열 (비어있을 경우 로그인 여부만 확인)
     * @returns {boolean} - 접근 허용 여부
     */
    const requireAuth = (allowedRoles = []) => {
        if (!user) {
            router.push('/');
            return false;
        }
        // 관리자는 모든 페이지 접근 허용 (슈퍼유저)
        if (user.role === 'admin') return true;

        // 특정 역할 제한이 있는 경우 체크
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            router.push('/');
            return false;
        }
        return true;
    };

    // 사용자 정보 업데이트 (정보 수정 후 컨텍스트 및 로컬스토리지 반영)
    const updateUser = (updates) => {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('lms_current_user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, requireAuth, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}
