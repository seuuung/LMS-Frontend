'use client';

/**
 * 전역 확인(Confirm) 모달을 위한 커스텀 훅
 * 삭제나 완료 등 중요한 액션 직전에 사용자의 최종 의사를 물어볼 때 사용합니다.
 */

import { useContext } from 'react';
import { ConfirmContext } from '../context/ConfirmContext';

/**
 * @returns {Object} { confirm } - confirm(message) 콜 시 비동기 Promise(boolean) 반환
 */
export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
}
