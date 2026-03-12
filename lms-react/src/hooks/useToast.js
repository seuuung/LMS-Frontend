'use client';

/**
 * 전역 토스트 알림을 위한 커스텀 훅
 * 성공, 에러, 일반 메시지 등을 화면 우하단에 띄우기 위해 사용합니다.
 */

import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext';

/**
 * @returns {Object} { showToast } - showToast(message, type) 함수 제공
 */
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
