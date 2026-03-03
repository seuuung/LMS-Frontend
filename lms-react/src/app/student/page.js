'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/api';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';

/**
 * 학습자 전용 대시보드 컴포넌트
 * '클래스 탐색(전체 클래스 조회)' 및 '내 학습 공간(수강 중인 클래스 목록)' 탭을 제공합니다.
 * 수강 신청 로직과 등록된 클래스로 진입하는 라우팅을 담당합니다.
 * @returns {JSX.Element|null}
 */
export default function StudentDashboard() {
    const { requireAuth, user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('exploreClasses');
    const [allClasses, setAllClasses] = useState([]);
    const [myClassIds, setMyClassIds] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [myClasses, setMyClasses] = useState([]);

    useEffect(() => {
        if (!requireAuth(['student', 'admin'])) return;
        loadData();
    }, [user]);

    /**
     * 대시보드 전체 데이터 로드
     * 전체 클래스, 수강 중인 클래스, 사용자 정보 등을 병렬 패치합니다.
     */
    const loadData = async () => {
        try {
            if (!user) return;

            const [fetchedAllClasses, fetchedMyEnrolls, fetchedAllUsers] = await Promise.all([
                api.classes.getAll(),
                api.enrollments.getByStudent(user.id),
                api.users.getAll()
            ]);

            const enrolledIds = fetchedMyEnrolls.map(e => e.classId);

            setAllClasses(fetchedAllClasses);
            setMyClassIds(enrolledIds);
            setAllUsers(fetchedAllUsers);

            // Compute myClasses list
            const myJoinedClasses = fetchedMyEnrolls
                .map(e => fetchedAllClasses.find(c => c.id === e.classId))
                .filter(Boolean);
            setMyClasses(myJoinedClasses);

        } catch (err) {
            showToast(err.message || '데이터를 불러오는 데 실패했습니다.', 'error');
        }
    };

    const handleEnroll = async (classId) => {
        try {
            await api.enrollments.create(classId, user.id);
            showToast('수강 신청이 완료되었습니다.', 'success');
            loadData(); // Reload data to update UI
        } catch (err) {
            showToast(err.message || '오류가 발생했습니다.', 'error');
        }
    };

    if (!user) return null; // Prevent showing UI before redirect

    return (
        <div className="dashboard-grid">
            <aside className="sidebar">
                <h3 style={{ padding: '0 1rem', marginBottom: '1rem' }}>Student Menu</h3>
                <div
                    className={`nav-item ${activeTab === 'exploreClasses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('exploreClasses')}
                >
                    클래스 탐색
                </div>
                <div
                    className={`nav-item ${activeTab === 'myClasses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('myClasses')}
                >
                    내 학습 공간
                </div>
            </aside>

            <div className="content">
                {activeTab === 'exploreClasses' && (
                    <section className="card">
                        <h2>새로운 클래스 탐색</h2>
                        <div className="class-grid mt-4">
                            {allClasses.length === 0 ? (
                                <p>개설된 클래스가 없습니다.</p>
                            ) : (
                                allClasses.map(c => {
                                    const isEnrolled = myClassIds.includes(c.id);
                                    const profName = allUsers.find(u => u.id === c.profId)?.name || c.profId;

                                    return (
                                        <div className="class-card" key={c.id}>
                                            <h3>{c.title}</h3>
                                            <p>{c.description}</p>
                                            <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '1rem' }}>
                                                교수자: {profName}
                                            </small>
                                            {isEnrolled ? (
                                                <button className="btn" style={{ background: '#e2e8f0', width: '100%', cursor: 'not-allowed' }} disabled>
                                                    수강 중
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ width: '100%' }}
                                                    onClick={() => handleEnroll(c.id)}
                                                >
                                                    수강 신청
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>
                )}

                {activeTab === 'myClasses' && (
                    <section className="card">
                        <h2>내 학습 공간</h2>
                        <div className="class-grid mt-4">
                            {myClasses.length === 0 ? (
                                <p>수강 중인 클래스가 없습니다.</p>
                            ) : (
                                myClasses.map(c => (
                                    <div
                                        className="class-card cursor-pointer"
                                        key={c.id}
                                        onClick={() => router.push(`/student/class/${c.id}`)}
                                    >
                                        <h3>{c.title}</h3>
                                        <p>{c.description}</p>
                                        <button className="btn btn-primary mt-4" style={{ width: '100%' }}>학습 시작</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
