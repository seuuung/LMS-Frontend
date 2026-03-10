'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import { api } from '@/lib/api/api';
import Modal from '@/components/ui/Modal';
import Sidebar from '@/components/ui/Sidebar';
import ActivityLogModal from '@/components/ui/ActivityLogModal';
import Pagination from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import ClassCard from '@/components/ui/ClassCard';
import CardDropdownMenu from '@/components/ui/CardDropdownMenu';
import { useLectureCounts } from '@/hooks/useLectureCounts';

/**
 * 교수자 전용 대시보드 컴포넌트
 * 로그인한 교수자가 개설한 클래스(My Classes) 목록을 보여주고,
 * 새로운 클래스를 생성하거나 삭제하는 기능을 제공합니다.
 * @returns {JSX.Element|null} Role이 'prof'가 아니면 null 반환
 */
export default function ProfessorDashboard() {
    const { requireAuth, user, updateUser } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const router = useRouter();
    const searchParams = useSearchParams();

    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabParam === 'myInfo' ? 'myInfo' : 'myClasses');
    const [isCreatingClass, setIsCreatingClass] = useState(false);
    const [myClasses, setMyClasses] = useState([]);
    const [logs, setLogs] = useState([]);
    const [logModalContext, setLogModalContext] = useState(null);
    const [activeDropdownId, setActiveDropdownId] = useState(null);
    const lectureCounts = useLectureCounts(myClasses);

    // Form state
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');



    // Edit Form state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editClassForm, setEditClassForm] = useState({ id: null, title: '', description: '' });

    const {
        currentData: classesToDisplay,
        currentPage: classCurrentPage,
        totalPages: classTotalPages,
        prevPage: classPrevPage,
        nextPage: classNextPage,
        setCurrentPage: setClassCurrentPage
    } = usePagination(myClasses, 10);

    // --- 사이드 이펙트 ---
    useEffect(() => {
        // 유저 정보가 없으면 로직을 실행하지 않음 (AuthContext 복구 대기)
        if (!user) return;
        
        if (!requireAuth(['prof'])) return;
        loadMyClasses();

        setActiveTab('myClasses');
    }, [user, searchParams]);


    /**
     * 내 클래스 목록 로드
     * 전체 클래스 목록 중 현재 로그인한 교수자의 ID(profId)와 일치하는 항목만 필터링합니다.
     */
    const loadMyClasses = async () => {
        try {
            if (!user) return;
            const [allClasses, logsData] = await Promise.all([
                api.classes.getAll(),
                api.logs.getAll()
            ]);
            const filteredClasses = allClasses.filter(c => c.profId === user.id);
            setMyClasses(filteredClasses);

            // 실제 서버 연동 시 백엔드에서 교수자 권한에 맞는 로그만 반환됨
            setLogs(logsData || []);
        } catch (err) {
            showToast(err.message || '데이터를 불러오는 데 실패했습니다.', 'error');
        }
    };

    const handleCreateClass = async () => {
        // --- 디버그 로깅: 생성 전 상태 확인 ---
        console.log('[Debug] Class Creation Start', {
            userId: user?.id,
            userRole: user?.role,
            newTitle,
            newDesc
        });

        if (!user || user.role !== 'prof') {
            showToast('권한이 없거나 유저 정보가 유실되었습니다. 다시 로그인해주세요.', 'error');
            return;
        }
        if (!newTitle) {
            showToast('제목을 입력하세요', 'error');
            return;
        }
        try {
            await api.classes.create(newTitle, newDesc, user.id, user.role);
            showToast('클래스가 생성되었습니다.', 'success');
            setNewTitle('');
            setNewDesc('');
            setIsCreatingClass(false);
            loadMyClasses();
        } catch (err) {
            showToast(err.message || '오류가 발생했습니다.', 'error');
        }
    };

    const handleDeleteClass = async (id) => {
        if (!await confirm('클래스를 삭제하시겠습니까?')) return;
        try {
            await api.classes.delete(id);
            showToast('삭제되었습니다.', 'success');
            loadMyClasses();
        } catch (err) {
            showToast(err.message || '오류가 발생했습니다.', 'error');
        }
    };

    const handleSaveClass = async (e) => {
        e.preventDefault();
        const { id, title, description } = editClassForm;
        if (!title.trim()) return showToast('클래스 제목을 입력하세요.', 'error');

        try {
            await api.classes.update(id, { title: title.trim(), description: description.trim() });
            showToast('클래스 정보가 수정되었습니다.', 'success');
            setIsEditModalOpen(false);
            loadMyClasses();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    if (!user) return null;

    return (
        <div className="dashboard-grid">
            <Sidebar activeMenu={activeTab} />

            <div className="content">



                {activeTab === 'myClasses' && !isCreatingClass && (
                    <section className="card" id="myClassesListWrapper">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2>내 클래스 목록</h2>
                            <button className="btn btn-primary" onClick={() => setIsCreatingClass(true)}>새 클래스 개설</button>
                        </div>

                        <div className="class-grid mt-4">
                            {classesToDisplay.length === 0 ? (
                                <p>개설한 클래스가 없습니다.</p>
                            ) : (
                                classesToDisplay.map(c => {
                                    const classLogs = logs.filter(l => l.classId === c.id || (l.entityType === 'class' && l.entityId === c.id));
                                    const lastActivity = classLogs.length > 0 ? new Date(classLogs[0].timestamp).toLocaleDateString() : '-';
                                    return (
                                        <ClassCard
                                            key={c.id}
                                            classData={c}
                                            lectureCount={lectureCounts[c.id]}
                                            onClick={() => router.push(`/professor/class/${c.id}`)}
                                            actionButton={
                                                <CardDropdownMenu
                                                    isOpen={activeDropdownId === c.id}
                                                    onToggle={() => setActiveDropdownId(activeDropdownId === c.id ? null : c.id)}
                                                    items={[
                                                        { label: '강의정보수정', onClick: () => { setEditClassForm({ id: c.id, title: c.title, description: c.description || '' }); setIsEditModalOpen(true); } },
                                                        { label: '로그보기', onClick: () => { setLogModalContext({ entityType: 'class', entityId: c.id, title: `클래스 '${c.title}' 전체 활동 이력` }); } },
                                                        { label: '삭제', danger: true, onClick: () => handleDeleteClass(c.id) }
                                                    ]}
                                                />
                                            }
                                            footer={
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                        <small style={{ color: '#64748b', fontSize: '0.75rem' }}>생성일: {new Date(c.createdAt).toLocaleDateString()}</small>
                                                        <small style={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: '500' }}>최근 활동: {lastActivity}</small>
                                                    </div>
                                                    <span style={{ color: 'var(--primary-color)', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                        강의실 입장 <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>&rarr;</span>
                                                    </span>
                                                </div>
                                            }
                                        />
                                    );
                                })
                            )}
                        </div>
                        <Pagination
                            currentPage={classCurrentPage}
                            totalPages={classTotalPages}
                            onPrev={classPrevPage}
                            onNext={classNextPage}
                            onPageChange={setClassCurrentPage}
                        />
                    </section>
                )}

                {activeTab === 'myClasses' && isCreatingClass && (
                    <section className="card" id="createClassWrapper">
                        <h2>새 클래스 개설</h2>
                        <div style={{ marginTop: '1.5rem', maxWidth: '600px' }}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="newClassTitle">클래스명</label>
                                <input type="text" id="newClassTitle" className="form-control" placeholder="예: [2024년도 1학기] 컴퓨터 과학 개론" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label" htmlFor="newClassDesc">클래스 설명 (선택)</label>
                                <textarea id="newClassDesc" className="form-control" placeholder="최대 300자 입력 가능" style={{ minHeight: '120px' }} value={newDesc} onChange={(e) => setNewDesc(e.target.value)}></textarea>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button className="btn btn-cancel" onClick={() => { setIsCreatingClass(false); setNewTitle(''); setNewDesc(''); }}>취소</button>
                                <button className="btn btn-primary" onClick={handleCreateClass}>생성하기</button>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* Edit Class Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="클래스 정보 수정">
                <form onSubmit={handleSaveClass}>
                    <div className="form-group">
                        <label className="form-label">클래스명</label>
                        <input
                            type="text"
                            className="form-control"
                            value={editClassForm.title}
                            onChange={(e) => setEditClassForm({ ...editClassForm, title: e.target.value })}
                            placeholder="변경할 클래스명 입력"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">클래스 설명</label>
                        <textarea
                            className="form-control"
                            value={editClassForm.description}
                            onChange={(e) => setEditClassForm({ ...editClassForm, description: e.target.value })}
                            placeholder="변경할 클래스 설명 (선택)"
                            style={{ minHeight: '100px' }}
                        ></textarea>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-cancel" onClick={() => setIsEditModalOpen(false)}>취소</button>
                        <button type="submit" className="btn btn-primary">수정 완료</button>
                    </div>
                </form>
            </Modal>

            {/* 활동 내역 모달 */}
            <ActivityLogModal
                isOpen={!!logModalContext}
                onClose={() => setLogModalContext(null)}
                logs={logModalContext ? logs.filter(l =>
                    (logModalContext.entityType === 'class' && (l.classId === logModalContext.entityId || (l.entityType === 'class' && l.entityId === logModalContext.entityId))) ||
                    (logModalContext.entityType !== 'class' && l.entityType === logModalContext.entityType && l.entityId === logModalContext.entityId)
                ) : []}
                title={logModalContext?.title}
            />
        </div>
    );
}
