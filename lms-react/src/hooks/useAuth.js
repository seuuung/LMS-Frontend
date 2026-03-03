'use client';

/**
 * 전역 로그인 상태 관리를 위한 커스텀 훅
 * AuthContext에 접근하여 현재 로그인된 유저 정보 및 로그인/로그아웃 기능을 제공합니다.
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * @returns {Object} { user, login, logout, isLoading }
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
