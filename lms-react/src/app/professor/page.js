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

    // Form state
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');

    const [infoName, setInfoName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [infoPassword, setInfoPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Edit Form state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editClassForm, setEditClassForm] = useState({ id: null, title: '', description: '' });

    // --- 사이드 이펙트 ---
    useEffect(() => {
        if (!requireAuth(['prof'])) return;
        loadMyClasses();
        if (user) {
            setInfoName(user.name || '');
        }

        const tab = searchParams.get('tab');
        if (tab === 'myInfo') setActiveTab('myInfo');
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
        if (!newTitle) {
            showToast('제목을 입력하세요', 'error');
            return;
        }
        try {
            await api.classes.create(newTitle, newDesc, user.id);
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

                {activeTab === 'myClasses' && !isCreatingClass && (
                    <section className="card" id="myClassesListWrapper">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2>내 클래스 목록</h2>
                            <button className="btn btn-primary" onClick={() => setIsCreatingClass(true)}>새 클래스 개설</button>
                        </div>

                        <div className="class-grid mt-4">
                            {myClasses.length === 0 ? (
                                <p>개설한 클래스가 없습니다.</p>
                            ) : (
                                myClasses.map(c => {
                                    const classLogs = logs.filter(l => l.classId === c.id || (l.entityType === 'class' && l.entityId === c.id));
                                    const lastActivity = classLogs.length > 0 ? new Date(classLogs[0].timestamp).toLocaleDateString() : '-';
                                    return (
                                        <div className="class-card cursor-pointer" key={c.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                                            <div style={{ marginBottom: '1rem' }} onClick={() => router.push(`/professor/class/${c.id}`)}>
                                                <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', wordBreak: 'keep-all' }}>{c.title}</h3>
                                                <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{c.description}</p>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '1rem' }}>
                                                    <small style={{ color: '#94a3b8' }}>생성일: {new Date(c.createdAt).toLocaleDateString()}</small>
                                                    <small style={{ color: '#3b82f6' }}>최근 활동: {lastActivity}</small>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: 'auto' }}>
                                                <button className="btn" style={{ border: '1px solid #94a3b8', color: '#475569', background: 'transparent', padding: '0.75rem 0', borderRadius: '0.5rem', fontWeight: 'bold' }} onClick={(e) => { e.stopPropagation(); setLogModalContext({ entityType: 'class', entityId: c.id, title: `클래스 '${c.title}' 전체 활동 이력` }); }}>
                                                    로그 보기
                                                </button>
                                                <button className="btn btn-primary" style={{ padding: '0.75rem 0', borderRadius: '0.5rem', fontWeight: 'bold' }} onClick={(e) => { e.stopPropagation(); router.push(`/professor/class/${c.id}`); }}>
                                                    관리
                                                </button>
                                                <button className="btn" style={{ border: '1px solid var(--primary-color)', color: 'var(--primary-color)', background: 'transparent', padding: '0.75rem 0', borderRadius: '0.5rem', fontWeight: 'bold' }} onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditClassForm({ id: c.id, title: c.title, description: c.description || '' });
                                                    setIsEditModalOpen(true);
                                                }}>
                                                    수정
                                                </button>
                                                <button className="btn" style={{ border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', padding: '0.75rem 0', borderRadius: '0.5rem', fontWeight: 'bold' }} onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id); }}>
                                                    삭제
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
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
