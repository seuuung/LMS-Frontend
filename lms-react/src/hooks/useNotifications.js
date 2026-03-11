'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/api';
import { useAuth } from './useAuth';

/**
 * 전역 알림 관리 커스텀 훅
 * 로그인한 사용자의 알림 목록과 읽지 않은 알림 수를 관리합니다.
 * @returns {Object} { notifications, unreadCount, markAsRead, markAllAsRead, refresh }
 */
export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const [list, count] = await Promise.all([
                api.notifications.getAll(user.userId, { skipLoading: true }),
                api.notifications.getUnreadCount(user.userId, { skipLoading: true })
            ]);
            setNotifications(list);
            setUnreadCount(count);
        } catch (err) {
            console.error('알림을 불러오는 중 오류가 발생했습니다:', err);
        }
    }, [user]);

    // 초기 로드 및 주기적 폴링 (30초마다)
    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user, fetchNotifications]);

    const markAsRead = async (id) => {
        try {
            await api.notifications.markAsRead(id);
            await fetchNotifications();
        } catch (err) {
            console.error('알림 읽음 처리 중 오류가 발생했습니다:', err);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        try {
            await api.notifications.markAllAsRead(user.userId);
            await fetchNotifications();
        } catch (err) {
            console.error('모든 알림 읽음 처리 중 오류가 발생했습니다:', err);
        }
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications
    };
}
