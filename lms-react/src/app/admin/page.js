'use client';

import { useState, useEffect, Suspense } from 'react';
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

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem' }}>Loading Admin...</div>}>
            <AdminDashboard />
        </Suspense>
    );
}

/**
 * 관리자 대시보드 컴포넌트
 * 이 컴포넌트는 크게 '사용자 관리'와 '전체 클래스 관리' 2가지 탭 뷰로 나뉩니다.
 * api_mock.js(또는 api_server.js)를 통해 전체 데이터를 요청하고 인라인 생성, 수정, 삭제 기능을 제공합니다.
 * @returns {JSX.Element|null}
 */
function AdminDashboard() {
    const { requireAuth, user, updateUser } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const router = useRouter();
    const searchParams = useSearchParams();

    // 탭 파라미터 연동
    const tabParam = searchParams.get('tab') || searchParams.get('t');
    const [activeTab, setActiveTab] = useState(tabParam === 'classes' ? 'classes' : tabParam === 'myInfo' ? 'myInfo' : 'users');

    const [allUsers, setAllUsers] = useState([]);
    const [allClasses, setAllClasses] = useState([]);
    const [logs, setLogs] = useState([]);
    const [logModalContext, setLogModalContext] = useState(null);
    const [classSearch, setClassSearch] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [activeDropdownId, setActiveDropdownId] = useState(null);
    const lectureCounts = useLectureCounts(allClasses);


    // --- Create User Modal State ---
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ username: '', name: '', password: '', role: 'student' });

    // --- Edit User Modal State ---
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [editUserForm, setEditUserForm] = useState({ id: null, name: '', password: '', role: 'student' });

    // --- Edit Class Modal State ---
    const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
    const [editClassForm, setEditClassForm] = useState({ id: null, title: '', description: '' });

    // Create class state
    const [isCreatingClass, setIsCreatingClass] = useState(false);
    const [newClassTitle, setNewClassTitle] = useState('');
    const [newClassDesc, setNewClassDesc] = useState('');
    const [newClassProfId, setNewClassProfId] = useState('');

    // --- Admin Dashboard UI State ---
    const [roleFilter, setRoleFilter] = useState('all');

    // --- 데이터 초기화 및 패칭 ---
    useEffect(() => {
        if (!requireAuth(['admin'])) return;

        const tab = searchParams.get('tab') || searchParams.get('t');
        if (tab === 'classes') setActiveTab('classes');
        else setActiveTab('users');

        loadData();
    }, [user, searchParams]);

    /**
     * 컴포넌트 데이터 불어오기 (병렬 요청 처리)
     * 유저 목록과 전체 클래스 목록을 동시에 요청하여 상태에 반영합니다.
     */
    const loadData = async () => {
        try {
            const [users, classes, logsData] = await Promise.all([
                api.users.getAll(),
                api.classes.getAll(),
                api.logs.getAll()
            ]);
            setAllUsers(users);
            setAllClasses(classes);
            setLogs(logsData || []);
        } catch (err) {
            showToast(err.message, 'error');
        }
    };



    // --- User Management ---
    const handleAddUser = async (e) => {
        e.preventDefault();
        const { username, name, password, role } = newUserForm;

        if (!username || !name || !password) {
            return showToast('모든 필드를 입력해주세요.', 'error');
        }

        try {
            await api.auth.register({ username, password, name, role });
            showToast('유저가 추가되었습니다.', 'success');
            setIsUserModalOpen(false);
            setNewUserForm({ username: '', name: '', password: '', role: 'student' });
            loadData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!await confirm('정말 삭제하시겠습니까?')) return;
        try {
            await api.users.delete(id);
            showToast('삭제되었습니다.', 'success');
            loadData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        const { id, name, password, role } = editUserForm;
        if (!name.trim()) return showToast('이름을 입력하세요.', 'error');

        try {
            await api.users.update(id, { name: name.trim() });

            // 비밀번호 변경이 있는 경우
            if (password && password.trim() !== '') {
                await api.users.updatePassword(id, password.trim());
            }

            // 모달 안에서 역할(Role)도 수정할 수 있다면:
            // (Mock API 구조상 role 수정 기능이 제공된다면 반영, 기본적으로 users 업데이트 활용)
            if (role) {
                await api.users.update(id, { role });
            }

            showToast('유저 정보가 수정되었습니다.', 'success');
            setIsEditUserModalOpen(false);
            loadData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    // --- Class Management ---
    const handleDeleteClass = async (id) => {
        if (!await confirm('클래스를 삭제할까요? 하위 데이터도 모두 삭제됩니다.')) return;
        try {
            await api.classes.delete(id);
            showToast('삭제되었습니다.', 'success');
            loadData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleSaveClass = async (e) => {
        e.preventDefault();
        const { id, title, description } = editClassForm;
        if (!title.trim()) return showToast('클래스 제목을 입력하세요.', 'error');

        try {
            await api.classes.update(id, { title: title.trim(), description: description.trim() });
            showToast('클래스 정보가 수정되었습니다.', 'success');
            setIsEditClassModalOpen(false);
            loadData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleCreateClass = async () => {
        if (!newClassTitle.trim()) return showToast('클래스 제목을 입력하세요.', 'error');
        if (!newClassProfId) return showToast('담당 교수자를 선택하세요.', 'error');

        try {
            await api.classes.create(newClassTitle.trim(), newClassDesc.trim(), newClassProfId);
            showToast('클래스가 생성되었습니다.', 'success');
            setIsCreatingClass(false);
            setNewClassTitle('');
            setNewClassDesc('');
            setNewClassProfId('');
            loadData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const filteredClasses = allClasses.filter(c =>
        c.title.toLowerCase().includes(classSearch.toLowerCase())
    );
    const {
        currentData: classesToDisplay,
        currentPage: classCurrentPage,
        totalPages: classTotalPages,
        prevPage: classPrevPage,
        nextPage: classNextPage,
        setCurrentPage: setClassCurrentPage
    } = usePagination(filteredClasses, 10);

    useEffect(() => {
        setClassCurrentPage(1);
    }, [classSearch, setClassCurrentPage]);

    const filteredUsers = allUsers.filter(u => {
        const matchesSearch = u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
            (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase()));
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const {
        currentData: usersToDisplay,
        currentPage: userCurrentPage,
        totalPages: userTotalPages,
        prevPage: userPrevPage,
        nextPage: userNextPage,
        setCurrentPage: setUserCurrentPage
    } = usePagination(filteredUsers, 20);

    useEffect(() => {
        setUserCurrentPage(1);
    }, [userSearch, roleFilter, setUserCurrentPage]);

    const profUsers = allUsers.filter(u => u.role === 'prof');

    if (!user || user.role !== 'admin') return null;

    return (
        <div className="dashboard-grid">
            <Sidebar activeMenu={activeTab} />

            <div className="content">



                {activeTab === 'users' && (
                    <section className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <h2>사용자 통합 관리</h2>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <select
                                    className="form-control"
                                    style={{ width: 'auto', minWidth: '120px' }}
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                >
                                    <option value="all">전체</option>
                                    <option value="admin">관리자</option>
                                    <option value="prof">교수자</option>
                                    <option value="student">학습자</option>
                                </select>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="사용자명/아이디 검색..."
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                />
                                <button className="btn btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={() => setIsUserModalOpen(true)}>+ 유저 추가</button>
                            </div>
                        </div>

                        <div className="table-responsive" style={{ marginTop: '1.5rem' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>아이디</th>
                                        <th>이름</th>
                                        <th>권한(역할)</th>
                                        <th>최초 생성일</th>
                                        <th>최근 변경일</th>
                                        <th style={{ textAlign: 'center' }}>관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersToDisplay.map(u => {
                                        const createdDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-';
                                        const updatedDate = u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : '-';
                                        return (
                                            <tr key={u.id}>
                                                <td>{u.username}</td>
                                                <td>{u.name}</td>
                                                <td>
                                                    {u.role === 'admin' && '관리자'}
                                                    {u.role === 'prof' && '교수자'}
                                                    {u.role === 'student' && '학습자'}
                                                    {!(u.role === 'admin' || u.role === 'prof' || u.role === 'student') && u.role}
                                                </td>
                                                <td>{createdDate}</td>
                                                <td>{updatedDate}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button className="action-btn" onClick={() => setLogModalContext({ entityType: 'user', entityId: u.id, title: `사용자 '${u.name}' 수정 이력` })}>로그 보기</button>
                                                        <button className="action-btn" onClick={() => {
                                                            setEditUserForm({ id: u.id, name: u.name, password: '', role: u.role });
                                                            setIsEditUserModalOpen(true);
                                                        }}>수정</button>
                                                        <button className="action-btn del" onClick={() => handleDeleteUser(u.id)}>삭제</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>조건에 맞는 사용자가 없습니다.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={userCurrentPage}
                            totalPages={userTotalPages}
                            onPrev={userPrevPage}
                            onNext={userNextPage}
                            onPageChange={setUserCurrentPage}
                        />
                    </section>
                )}

                {activeTab === 'classes' && (
                    <section className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2>전체 클래스 관리</h2>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="클래스명 검색..."
                                    value={classSearch}
                                    onChange={(e) => setClassSearch(e.target.value)}
                                />
                                <button className="btn btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={() => setIsCreatingClass(!isCreatingClass)}>+ 새 클래스 개설</button>
                            </div>
                        </div>



                        <div className="class-grid mt-4">
                            {classesToDisplay.length === 0 ? (
                                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>클래스가 없습니다.</p>
                            ) : (
                                classesToDisplay.map(c => {
                                    const prof = allUsers.find(u => u.id === c.profId);
                                    const classLogs = logs.filter(l => l.classId === c.id || (l.entityType === 'class' && l.entityId === c.id));
                                    const lastActivity = classLogs.length > 0 ? new Date(classLogs[0].timestamp).toLocaleDateString() : '-';
                                    return (
                                        <ClassCard
                                            key={c.id}
                                            classData={c}
                                            lectureCount={lectureCounts[c.id]}
                                            professorName={prof ? prof.name : c.profId}
                                            onClick={() => router.push(`/admin/class/${c.id}`)}
                                            actionButton={
                                                <CardDropdownMenu
                                                    isOpen={activeDropdownId === c.id}
                                                    onToggle={() => setActiveDropdownId(activeDropdownId === c.id ? null : c.id)}
                                                    items={[
                                                        { label: '강의정보수정', onClick: () => { setEditClassForm({ id: c.id, title: c.title, description: c.description || '' }); setIsEditClassModalOpen(true); } },
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
                                                        관리 <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>&rarr;</span>
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
            </div>

            {/* 유저 추가용 Modal */}
            <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="신규 사용자 추가">
                <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">아이디</label>
                        <input
                            type="text"
                            className="form-control"
                            value={newUserForm.username}
                            onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                            placeholder="아이디를 입력하세요"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">이름</label>
                        <input
                            type="text"
                            className="form-control"
                            value={newUserForm.name}
                            onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                            placeholder="실명을 입력하세요"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">비밀번호</label>
                        <input
                            type="password"
                            className="form-control"
                            value={newUserForm.password}
                            onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                            placeholder="초기 가입 비밀번호"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">권한(역할)</label>
                        <select
                            className="form-control"
                            value={newUserForm.role}
                            onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                        >
                            <option value="student">학습자</option>
                            <option value="prof">교수자</option>
                            <option value="admin">관리자</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-cancel" onClick={() => setIsUserModalOpen(false)}>취소</button>
                        <button type="submit" className="btn btn-primary">등록하기</button>
                    </div>
                </form>
            </Modal>

            {/* 유저 수정용 Modal */}
            <Modal isOpen={isEditUserModalOpen} onClose={() => setIsEditUserModalOpen(false)} title="사용자 정보 수정">
                <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">이름</label>
                        <input
                            type="text"
                            className="form-control"
                            value={editUserForm.name}
                            onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                            placeholder="실명을 입력하세요"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">비밀번호</label>
                        <input
                            type="password"
                            className="form-control"
                            value={editUserForm.password}
                            onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                            placeholder="변경할 비밀번호 (빈칸이면 유지)"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">권한(역할)</label>
                        <select
                            className="form-control"
                            value={editUserForm.role}
                            onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                        >
                            <option value="student">학습자</option>
                            <option value="prof">교수자</option>
                            <option value="admin">관리자</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-cancel" onClick={() => setIsEditUserModalOpen(false)}>취소</button>
                        <button type="submit" className="btn btn-primary">수정 완료</button>
                    </div>
                </form>
            </Modal>

            {/* 클래스 수정용 Modal */}
            <Modal isOpen={isEditClassModalOpen} onClose={() => setIsEditClassModalOpen(false)} title="클래스 이름 수정">
                <form onSubmit={handleSaveClass} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                        <button type="button" className="btn btn-cancel" onClick={() => setIsEditClassModalOpen(false)}>취소</button>
                        <button type="submit" className="btn btn-primary">수정 완료</button>
                    </div>
                </form>
            </Modal>
            {/* 새 클래스 개설용 Modal */}
            <Modal isOpen={isCreatingClass} onClose={() => setIsCreatingClass(false)} title="새 클래스 개설">
                <form onSubmit={(e) => { e.preventDefault(); handleCreateClass(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">클래스명</label>
                        <input
                            type="text"
                            className="form-control"
                            value={newClassTitle}
                            onChange={e => setNewClassTitle(e.target.value)}
                            placeholder="변경할 클래스명 입력"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">담당 교수자 지정</label>
                        <select className="form-control" value={newClassProfId} onChange={e => setNewClassProfId(e.target.value)} required>
                            <option value="">-- 담당 교수자 선택 --</option>
                            {profUsers.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.username})</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">클래스 설명</label>
                        <textarea
                            className="form-control"
                            value={newClassDesc}
                            onChange={(e) => setNewClassDesc(e.target.value)}
                            placeholder="변경할 클래스 설명 (선택)"
                            style={{ minHeight: '100px' }}
                        ></textarea>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-cancel" onClick={() => setIsCreatingClass(false)}>취소</button>
                        <button type="submit" className="btn btn-primary">생성하기</button>
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
