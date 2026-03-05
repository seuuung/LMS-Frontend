/**
 * useLectureCounts.js
 * 
 * 클래스 목록을 받아 각 클래스의 강의(콘텐츠) 개수를 조회하는 커스텀 훅입니다.
 * 클래스 목록이 변경될 때마다 자동으로 재조회합니다.
 */
import { useState, useEffect } from 'react';
import { api } from '@/lib/api/api';

/**
 * @param {Array} classes - 클래스 객체 배열 (각 객체에 id 필드 필요)
 * @returns {{ [classId: string]: number }} 클래스ID별 강의 수 맵
 */
export function useLectureCounts(classes) {
    const [lectureCounts, setLectureCounts] = useState({});

    useEffect(() => {
        if (!classes || classes.length === 0) {
            setLectureCounts({});
            return;
        }

        const fetchCounts = async () => {
            const counts = {};
            await Promise.all(
                classes.map(async (c) => {
                    try {
                        const lectures = await api.lectures.getByClass(c.id, { skipLoading: true });
                        counts[c.id] = lectures.length;
                    } catch {
                        counts[c.id] = 0;
                    }
                })
            );
            setLectureCounts(counts);
        };

        fetchCounts();
    }, [classes]);

    return lectureCounts;
}
