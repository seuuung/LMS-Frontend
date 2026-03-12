'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api/api';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';

export default function LectureStatsPage() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem' }}>Loading Stats...</div>}>
            <LectureStats />
        </Suspense>
    );
}

/**
 * 개별 강의 수강 통계(Stats) 페이지 컴포넌트
 * 교수자와 관리자 전용 뷰로, 해당 클래스를 수강 중인 전체 학생들의 진도율을 백분율 막대 그래프와 수치로 목록화하여 보여줍니다.
 * @returns {JSX.Element|null}
 */
function LectureStats() {
    const { requireAuth, user } = useAuth();
    const searchParams = useSearchParams();
    const classId = searchParams.get('classId');
    const lectureId = searchParams.get('lectureId');
    const router = useRouter();
    const { showToast } = useToast();

    const [lecture, setLecture] = useState(null);
    const [stats, setStats] = useState([]);
    const [loadingError, setLoadingError] = useState(false);

    useEffect(() => {
        if (!requireAuth(['prof', 'admin'])) return;
        if (!classId || !lectureId) {
            showToast('필수 정보가 누락되었습니다.', 'error');
            router.back();
            return;
        }
        loadStats();
    }, [user, classId, lectureId]);

    /**
     * 통계 데이터 로드
     * 특정 강의(lectureId)에 대한 정보, 전체 학생, 수강 등록 정보, 시청 기록을 병렬로 불러온 후 필요한 학생만 필터링합니다.
     */
    const loadStats = async () => {
        try {
            const [fetchedLec, students, enrollments, allViews] = await Promise.all([
                api.lectures.getById(lectureId),
                api.users.getAll(),
                api.enrollments.getByClass(classId),
                api.lectureViews.getByClass(classId)
            ]);
            setLecture(fetchedLec);

            // 해당 클래스에 등록된 역할이 'student'인 사용자만 필터링
            const enrolledUsers = students.filter(u =>
                enrollments.some(e => e.studentId === u.userId) && u.role === 'student'
            );

            const calculatedStats = enrolledUsers.map(u => {
                const view = allViews.find(v => String(v.lectureId) === String(lectureId) && String(v.studentId) === String(u.userId));
                const rate = view ? Number(view.progressRate || 0) : 0;
                return {
                    user: u,
                    rate: Math.round(rate)
                };
            });

            setStats(calculatedStats);
        } catch (err) {
            setLoadingError(true);
            showToast(err.message || '데이터 로드 중 오류가 발생했습니다.', 'error');
        }
    };


    if (!user || (!lecture && !loadingError)) return null;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <button className="btn btn-back" onClick={() => router.back()}>&larr; 돌아가기</button>
                </div>
                <h2 style={{ margin: 0 }}>[{lecture?.title || '강의'}] 수강률 통계</h2>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

                {/* 사이드바 (강의 기본 정보) */}
                <aside className="card" style={{ flex: '1 1 250px' }}>
                    <h4>{lecture?.title}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{lecture?.description}</p>
                </aside>

                {/* 본문 (통계 테이블) */}
                <div className="card" style={{ flex: '3 1 500px' }}>
                    <div className="table-responsive">
                        <table className="stats-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '20%' }}>이름</th>
                                    <th style={{ width: '25%' }}>아이디</th>
                                    <th style={{ width: '40%' }}>수강 진도율</th>
                                    <th style={{ width: '15%' }}>상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingError ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>데이터 로드 중 오류가 발생했습니다.</td></tr>
                                ) : stats.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>수강 신청한 학생이 없습니다.</td></tr>
                                ) : (
                                    stats.map((s, idx) => (
                                        <tr key={idx}>
                                            <td><strong>{s.user.name}</strong></td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.user.username}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                                                    <div className="progress-bar-bg" style={{ flex: 1, background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <div className="progress-bar-fill" style={{ width: `${s.rate}%`, background: '#3b82f6', height: '100%', transition: 'width 0.3s ease' }}></div>
                                                    </div>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '35px' }}>{s.rate}%</span>
                                                </div>
                                            </td>
                                            <td><StatusBadge rate={s.rate} /></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
