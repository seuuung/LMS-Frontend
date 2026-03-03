'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import { api } from '@/lib/api/api';
import Modal from '@/components/ui/Modal';

/**
 * 교수자 전용 대시보드 컴포넌트
 * 로그인한 교수자가 개설한 클래스(My Classes) 목록을 보여주고,
 * 새로운 클래스를 생성하거나 삭제하는 기능을 제공합니다.
 * @returns {JSX.Element|null} Role이 'prof'가 아니면 null 반환
 */
export default function ProfessorDashboard() {
    const { requireAuth, user } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const router = useRouter();

    const [isCreatingClass, setIsCreatingClass] = useState(false);
    const [myClasses, setMyClasses] = useState([]);

    // Form state
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');

    // Edit Form state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editClassForm, setEditClassForm] = useState({ id: null, title: '', description: '' });

    // --- 사이드 이펙트 ---
    useEffect(() => {
        if (!requireAuth(['prof'])) return;
        loadMyClasses();
    }, [user]);

    /**
     * 내 클래스 목록 로드
     * 전체 클래스 목록 중 현재 로그인한 교수자의 ID(profId)와 일치하는 항목만 필터링합니다.
     */
    const loadMyClasses = async () => {
        try {
            if (!user) return;
            const allClasses = await api.classes.getAll();
            const filteredClasses = allClasses.filter(c => c.profId === user.id);
            setMyClasses(filteredClasses);
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
            <aside className="sidebar">
                <h3 style={{ padding: '0 1rem', marginBottom: '1rem' }}>Professor Menu</h3>
                <div className="nav-item active">내 클래스 관리</div>
            </aside>

            <div className="content">
                {!isCreatingClass ? (
                    <section className="card" id="myClassesListWrapper">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2>내 클래스 목록</h2>
                            <button className="btn btn-primary" onClick={() => setIsCreatingClass(true)}>새 클래스 개설</button>
                        </div>

                        <div className="class-grid mt-4">
                            {myClasses.length === 0 ? (
                                <p>개설한 클래스가 없습니다.</p>
                            ) : (
                                myClasses.map(c => (
                                    <div className="class-card cursor-pointer" key={c.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                                        <div style={{ marginBottom: '1rem' }} onClick={() => router.push(`/professor/class/${c.id}`)}>
                                            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', wordBreak: 'keep-all' }}>{c.title}</h3>
                                            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{c.description}</p>
                                            <small style={{ color: '#94a3b8' }}>생성일: {new Date(c.createdAt).toLocaleDateString()}</small>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }} onClick={(e) => { e.stopPropagation(); router.push(`/professor/class/${c.id}`); }}>
                                                관리
                                            </button>
                                            <button className="btn" style={{ flex: 1, border: '1px solid var(--primary-color)', color: 'var(--primary-color)', background: 'transparent', padding: '0.5rem' }} onClick={(e) => {
                                                e.stopPropagation();
                                                setEditClassForm({ id: c.id, title: c.title, description: c.description || '' });
                                                setIsEditModalOpen(true);
                                            }}>
                                                수정
                                            </button>
                                            <button className="btn" style={{ flex: 1, border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', padding: '0.5rem' }} onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id); }}>
                                                삭제
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                ) : (
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
        </div>
    );
}
