'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/api';
import { useToast } from '@/hooks/useToast';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';

/**
 * 학습자 전용 대시보드 컴포넌트
 * '클래스 탐색(전체 클래스 조회)' 및 '내 학습 공간(수강 중인 클래스 목록)' 탭을 제공합니다.
 * 수강 신청 로직과 등록된 클래스로 진입하는 라우팅을 담당합니다.
 * @returns {JSX.Element|null}
 */
export default function StudentDashboard() {
    const { requireAuth, user, updateUser } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabParam === 'myInfo' ? 'myInfo' : tabParam === 'exploreClasses' ? 'exploreClasses' : 'myClasses');

    const [allClasses, setAllClasses] = useState([]);
    const [myClassIds, setMyClassIds] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [myClasses, setMyClasses] = useState([]);
    const [enrollmentCode, setEnrollmentCode] = useState('');

    // 수동 선택 모달 상태 관리
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClassToEnroll, setSelectedClassToEnroll] = useState(null);
    const [modalEnrollCode, setModalEnrollCode] = useState('');

    const [infoName, setInfoName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [infoPassword, setInfoPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (!requireAuth(['student', 'admin'])) return;
        loadData();
        if (user) {
            setInfoName(user.name || '');
        }

        const tab = searchParams.get('tab');
        if (tab === 'myInfo') setActiveTab('myInfo');
        else if (tab === 'exploreClasses') setActiveTab('exploreClasses');
        else setActiveTab('myClasses');

    }, [user, searchParams]);

    const handleSaveInfo = async (e) => {
        e.preventDefault();
        try {
            if (infoName.trim() && infoName !== user.name) {
                await api.users.update(user.id, { name: infoName.trim() });
            }
            if (infoPassword.trim()) {
                if (!currentPassword.trim()) {
                    showToast('기존 비밀번호를 입력해주세요.', 'error');
                    return;
                }
                if (infoPassword !== confirmPassword) {
                    showToast('새 비밀번호가 일치하지 않습니다.', 'error');
                    return;
                }
                await api.users.updatePassword(user.id, currentPassword.trim(), infoPassword.trim());
            }
            showToast('내 정보가 성공적으로 수정되었습니다.', 'success');
            if (infoName.trim() && infoName !== user.name) {
                updateUser({ name: infoName.trim() });
            }
            setCurrentPassword('');
            setInfoPassword('');
            setConfirmPassword('');
        } catch (err) {
            showToast(err.message || '정보 수정에 실패했습니다.', 'error');
        }
    };

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

    const handleEnroll = async (e) => {
        e.preventDefault();
        if (!enrollmentCode.trim()) {
            showToast('참여 코드를 입력하세요.', 'error');
            return;
        }
        try {
            await api.enrollments.joinWithCode(enrollmentCode, user.id);
            showToast('수강 신청이 완료되었습니다.', 'success');
            setEnrollmentCode('');
            loadData(); // Reload data to update UI
            setActiveTab('myClasses');
        } catch (err) {
            showToast(err.message || '오류가 발생했습니다.', 'error');
        }
    };

    const openEnrollModal = (classObj) => {
        setSelectedClassToEnroll(classObj);
        setModalEnrollCode('');
        setIsModalOpen(true);
    };

    const handleModalSubmit = async (e) => {
        e.preventDefault();
        if (!modalEnrollCode.trim()) {
            showToast('참여 코드를 입력하세요.', 'error');
            return;
        }
        try {
            await api.enrollments.joinWithCode(modalEnrollCode, user.id);
            showToast('수강 신청이 완료되었습니다.', 'success');
            setIsModalOpen(false);
            setModalEnrollCode('');
            setSelectedClassToEnroll(null);
            loadData(); // Reload data to update UI
            setActiveTab('myClasses');
        } catch (err) {
            showToast(err.message || '유효하지 않은 코드입니다.', 'error');
        }
    };

    if (!user) return null; // Prevent showing UI before redirect

    return (
        <div className="dashboard-grid">
            <Sidebar activeMenu={activeTab} />

            <div className="content">
                {activeTab === 'myInfo' && (
                    <section className="card">
                        <h2>내 정보 수정</h2>
                        <div style={{ marginTop: '1.5rem', maxWidth: '500px' }}>
                            <form onSubmit={handleSaveInfo}>
                                <div className="form-group">
                                    <label className="form-label">아이디</label>
                                    <input type="text" className="form-control" value={user.username} disabled style={{ backgroundColor: '#f1f5f9' }} />
                                    <small style={{ color: 'var(--text-muted)' }}>아이디는 변경할 수 없습니다.</small>
                                </div>
                                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                    <label className="form-label">이름</label>
                                    <input type="text" className="form-control" value={infoName} onChange={e => setInfoName(e.target.value)} required />
                                </div>
                                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                    <label className="form-label">기존 비밀번호</label>
                                    <input type="password" className="form-control" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="현재 비밀번호를 입력하세요" />
                                </div>
                                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                    <label className="form-label">새 비밀번호</label>
                                    <input type="password" className="form-control" value={infoPassword} onChange={e => setInfoPassword(e.target.value)} placeholder="새 비밀번호를 입력하세요" />
                                </div>
                                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                    <label className="form-label">새 비밀번호 확인</label>
                                    <input type="password" className="form-control" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="새 비밀번호를 다시 입력하세요" />
                                    {confirmPassword && (
                                        <small style={{ color: infoPassword === confirmPassword ? '#22c55e' : '#ef4444', fontWeight: 600, marginTop: '0.4rem', display: 'block' }}>
                                            {infoPassword === confirmPassword ? '✅ 비밀번호가 일치합니다.' : '❌ 비밀번호가 일치하지 않습니다.'}
                                        </small>
                                    )}
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ marginTop: '2rem', width: '100%' }}>정보 업데이트</button>
                            </form>
                        </div>
                    </section>
                )}

                {activeTab === 'exploreClasses' && (
                    <section className="card">
                        <h2>코드로 수강 참여</h2>
                        <div className="mt-4" style={{ maxWidth: '500px' }}>
                            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>교수자에게 안내받은 참여 코드를 등록하여 바로 수강하세요.</p>
                            <form onSubmit={handleEnroll} style={{ display: 'flex', gap: '0.8rem' }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="참여 코드 직접 입력 (예: A7X9WQ)"
                                    value={enrollmentCode}
                                    onChange={e => setEnrollmentCode(e.target.value.toUpperCase())}
                                    style={{ flex: 1 }}
                                    maxLength={10}
                                />
                                <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>참여하기</button>
                            </form>
                        </div>

                        <div style={{ marginTop: '3rem', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>전체 클래스 탐색</h3>
                            <div className="class-grid">
                                {allClasses.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)' }}>현재 수강 가능한 강좌가 없습니다.</p>
                                ) : (
                                    allClasses.map(c => {
                                        const isEnrolled = myClassIds.includes(c.id);
                                        return (
                                            <div className="class-card" key={c.id} style={{
                                                display: 'flex', flexDirection: 'column',
                                                ...(isEnrolled ? { border: '1px solid #cbd5e1', background: '#f8fafc' } : {})
                                            }}>
                                                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    {c.title}
                                                    {isEnrolled && <span className="badge badge-complete" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>수강 중</span>}
                                                </h4>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</p>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', flex: 1 }}>
                                                    담당 교수: {allUsers.find(u => u.id === c.profId)?.name || '알 수 없음'}
                                                </div>
                                                {isEnrolled ? (
                                                    <button
                                                        className="btn"
                                                        style={{ width: '100%', padding: '0.5rem', background: '#e2e8f0', color: '#334155', fontWeight: '600', marginTop: 'auto' }}
                                                        onClick={() => router.push(`/student/class/${c.id}`)}
                                                    >
                                                        학습 공간으로 이동
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ width: '100%', padding: '0.5rem', marginTop: 'auto' }}
                                                        onClick={() => openEnrollModal(c)}
                                                    >
                                                        수강 신청
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
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
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0 1rem' }}>
                                            담당 교수: {allUsers.find(u => u.id === c.profId)?.name || '알 수 없음'}
                                        </div>
                                        <button className="btn btn-primary mt-4" style={{ width: '100%' }}>학습 시작</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}
            </div>

            {/* 수강 신청 참여 코드 입력 모달 */}
            {isModalOpen && selectedClassToEnroll && (
                <div className="custom-modal-overlay" style={{ opacity: 1 }}>
                    <div className="custom-modal">
                        <h3>{selectedClassToEnroll.title} 수강 신청</h3>
                        <p style={{ marginBottom: '1rem' }}>해당 강좌에 배정된 <b>참여 코드 6자리</b>를 입력해주세요.</p>
                        <form onSubmit={handleModalSubmit}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="참여 코드 입력"
                                value={modalEnrollCode}
                                onChange={e => setModalEnrollCode(e.target.value.toUpperCase())}
                                style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px' }}
                                maxLength={10}
                                autoFocus
                            />
                            <div className="custom-modal-actions">
                                <button type="button" className="btn btn-cancel" onClick={() => setIsModalOpen(false)}>취소</button>
                                <button type="submit" className="btn btn-primary">수강 승인</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
