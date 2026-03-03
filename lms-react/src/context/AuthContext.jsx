'use client';

import { createContext, useState, useEffect } from 'react';
import { api } from '@/lib/api/api';
import { useRouter } from 'next/navigation';

export const AuthContext = createContext(null);

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

    const login = async (username, password) => {
        try {
            const userData = await api.auth.login(username, password);
            setUser(userData);
            localStorage.setItem('lms_current_user', JSON.stringify(userData));

            // 권한별 라우팅
            if (userData.role === 'admin') router.push('/admin');
            else if (userData.role === 'prof') router.push('/professor');
            else if (userData.role === 'student') router.push('/student');

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

    const requireAuth = (allowedRoles = []) => {
        if (!user) {
            router.push('/');
            return false;
        }
        if (user.role === 'admin') return true;
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
