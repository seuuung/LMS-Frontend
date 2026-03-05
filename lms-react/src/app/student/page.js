'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/api';
import { useToast } from '@/hooks/useToast';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import Pagination from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import ClassCard from '@/components/ui/ClassCard';
import { useLectureCounts } from '@/hooks/useLectureCounts';

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
    const lectureCounts = useLectureCounts(allClasses);

    // 수동 선택 모달 상태 관리
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClassToEnroll, setSelectedClassToEnroll] = useState(null);
    const [modalEnrollCode, setModalEnrollCode] = useState('');

    // 내 정보 모달로 분리되어 관련 폼 상태 제외됨
    const {
        currentData: myClassesToDisplay,
        currentPage: myClassCurrentPage,
        totalPages: myClassTotalPages,
        prevPage: myClassPrevPage,
        nextPage: myClassNextPage,
        setCurrentPage: setMyClassCurrentPage,
    } = usePagination(myClasses, 10);

    const {
        currentData: allClassesToDisplay,
        currentPage: exploreCurrentPage,
        totalPages: exploreTotalPages,
        prevPage: explorePrevPage,
        nextPage: exploreNextPage,
        setCurrentPage: setExploreCurrentPage,
    } = usePagination(allClasses, 10);

    useEffect(() => {
        if (!requireAuth(['student', 'admin'])) return;
        loadData();

        const tab = searchParams.get('tab');
        if (tab === 'exploreClasses') setActiveTab('exploreClasses');
        else setActiveTab('myClasses');

    }, [user, searchParams]);



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
                                {allClassesToDisplay.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)' }}>현재 수강 가능한 강좌가 없습니다.</p>
                                ) : (
                                    allClassesToDisplay.map(c => {
                                        const isEnrolled = myClassIds.includes(c.id);
                                        return (
                                            <ClassCard
                                                key={c.id}
                                                classData={c}
                                                lectureCount={lectureCounts[c.id]}
                                                professorName={allUsers.find(u => u.id === c.profId)?.name || '알 수 없음'}
                                                isEnrolled={isEnrolled}
                                                onClick={() => isEnrolled ? router.push(`/student/class/${c.id}`) : openEnrollModal(c)}
                                                badge={isEnrolled && <span className="badge badge-complete" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>수강 중</span>}
                                                footer={
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                                                        {isEnrolled ? (
                                                            <button
                                                                className="btn-purple"
                                                                onClick={(e) => { e.stopPropagation(); router.push(`/student/class/${c.id}`); }}
                                                            >
                                                                강의실 입장
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="btn-purple"
                                                                onClick={(e) => { e.stopPropagation(); openEnrollModal(c); }}
                                                            >
                                                                참여하기
                                                            </button>
                                                        )}
                                                    </div>
                                                }
                                            />
                                        );
                                    })
                                )}
                            </div>
                            <Pagination
                                currentPage={exploreCurrentPage}
                                totalPages={exploreTotalPages}
                                onPrev={explorePrevPage}
                                onNext={exploreNextPage}
                                onPageChange={setExploreCurrentPage}
                            />
                        </div>
                    </section>
                )}

                {activeTab === 'myClasses' && (
                    <section className="card">
                        <h2>내 학습 공간</h2>
                        <div className="class-grid mt-4">
                            {myClassesToDisplay.length === 0 ? (
                                <p>수강 중인 클래스가 없습니다.</p>
                            ) : (
                                myClassesToDisplay.map(c => (
                                    <ClassCard
                                        key={c.id}
                                        classData={c}
                                        lectureCount={lectureCounts[c.id]}
                                        professorName={allUsers.find(u => u.id === c.profId)?.name || '알 수 없음'}
                                        onClick={() => router.push(`/student/class/${c.id}`)}
                                        footer={
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                                                <button className="btn-purple">
                                                    강의실 입장
                                                </button>
                                            </div>
                                        }
                                    />
                                ))
                            )}
                        </div>
                        <Pagination
                            currentPage={myClassCurrentPage}
                            totalPages={myClassTotalPages}
                            onPrev={myClassPrevPage}
                            onNext={myClassNextPage}
                            onPageChange={setMyClassCurrentPage}
                        />
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
