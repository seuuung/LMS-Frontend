'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api/api';
import StatusBadge from '@/components/ui/StatusBadge';

/**
 * 수강생 상세 진도 페이지 공통 컴포넌트
 * 특정 학생의 강의별 시청 진도율을 테이블 형태로 상세히 보여줍니다.
 *
 * @param {string} classId - 클래스 ID
 * @param {string} studentId - 학생 ID
 * @param {string} backPath - 뒤로가기 경로
 * @param {Array<string>} allowedRoles - 접근 가능한 역할
 */
export default function StudentDetail({ classId, studentId, backPath, allowedRoles }) {
    const { requireAuth, user } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();

    const [student, setStudent] = useState(null);
    const [currentClass, setCurrentClass] = useState(null);
    const [lectures, setLectures] = useState([]);
    const [views, setViews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!requireAuth(allowedRoles)) return;
        if (!classId || !studentId) return;
        loadData();
    }, [user, classId, studentId]);

    const loadData = async () => {
        try {
            const [cls, users, fetchedLectures, fetchedViews] = await Promise.all([
                api.classes.getById(classId),
                api.users.getAll(),
                api.lectures.getByClass(classId),
                api.lectureViews.getByClass(classId)
            ]);

            if (!cls) {
                showToast('클래스를 찾을 수 없습니다.', 'error');
                router.push(backPath);
                return;
            }

            const targetStudent = users.find(u => u.id === studentId);
            setStudent(targetStudent || { id: studentId, name: studentId });
            setCurrentClass(cls);
            setLectures(fetchedLectures);
            setViews(fetchedViews.filter(v => v.studentId === studentId));
        } catch (err) {
            showToast(err.message || '데이터를 불러오는 데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!user || loading) return null;
    if (!student || !currentClass) return null;

    // 전체 평균 진도율 계산
    let avgProgress = 0;
    if (lectures.length > 0) {
        const totalRate = lectures.reduce((sum, lec) => {
            const view = views.find(v => v.lectureId === lec.id);
            return sum + (view ? (view.progressRate || 0) : 0);
        }, 0);
        avgProgress = Math.round(totalRate / lectures.length);
    }

    const completedCount = lectures.filter(lec => {
        const view = views.find(v => v.lectureId === lec.id);
        return view && view.progressRate >= 95;
    }).length;

    return (
        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="content">
                <section className="card">
                    {/* 헤더 */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <button className="btn btn-back" style={{ whiteSpace: 'nowrap' }} onClick={() => router.back()}>&larr; 돌아가기</button>
                        </div>
                        <h2 style={{ margin: 0 }}>{student.name} - 수강 진도 상세</h2>
                        <p style={{ margin: '0.3rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            클래스: {currentClass.title}
                        </p>
                    </div>

                    {/* 요약 카드 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '1.2rem', background: '#f0f9ff', borderRadius: '10px', textAlign: 'center', border: '1px solid #bae6fd' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0284c7' }}>{avgProgress}%</div>
                            <div style={{ fontSize: '0.85rem', color: '#0369a1', marginTop: '0.3rem' }}>전체 평균 진도율</div>
                        </div>
                        <div style={{ padding: '1.2rem', background: '#f0fdf4', borderRadius: '10px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#16a34a' }}>{completedCount}/{lectures.length}</div>
                            <div style={{ fontSize: '0.85rem', color: '#15803d', marginTop: '0.3rem' }}>수강 완료 강의</div>
                        </div>
                        <div style={{ padding: '1.2rem', background: '#fefce8', borderRadius: '10px', textAlign: 'center', border: '1px solid #fde68a' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ca8a04' }}>{lectures.length - completedCount}</div>
                            <div style={{ fontSize: '0.85rem', color: '#a16207', marginTop: '0.3rem' }}>미완료 강의</div>
                        </div>
                    </div>

                    {/* 강의별 상세 테이블 */}
                    <h4 style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e2e8f0' }}>강의별 수강 현황</h4>
                    {lectures.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>등록된 강의가 없습니다.</p>
                    ) : (
                        <table className="data-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>No.</th>
                                    <th>강의명</th>
                                    <th style={{ width: '200px', textAlign: 'center' }}>진도율</th>
                                    <th style={{ width: '100px', textAlign: 'center' }}>상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lectures.map((lec, idx) => {
                                    const view = views.find(v => v.lectureId === lec.id);
                                    const rate = view ? (view.progressRate || 0) : 0;

                                    return (
                                        <tr key={lec.id}>
                                            <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                                            <td>
                                                <strong>{lec.title}</strong>
                                                {lec.description && (
                                                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lec.description}</p>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <div style={{ flex: 1, maxWidth: '120px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <div style={{
                                                            width: `${rate}%`,
                                                            height: '100%',
                                                            background: rate >= 95 ? '#22c55e' : rate > 0 ? '#3b82f6' : '#e2e8f0',
                                                            borderRadius: '4px',
                                                            transition: 'width 0.3s'
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '40px', textAlign: 'right' }}>{rate}%</span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <StatusBadge rate={rate} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </section>
            </div>
        </div>
    );
}
