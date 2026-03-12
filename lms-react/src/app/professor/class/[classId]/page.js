'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/api';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import Link from 'next/link';

import Modal from '@/components/ui/Modal';
import TabBar from '@/components/ui/TabBar';
import Sidebar from '@/components/ui/Sidebar';
import LectureList from '@/components/ui/LectureList';
import ResourceList from '@/components/ui/ResourceList';
import ResourceForm from '@/components/ui/ResourceForm';
import QnaList from '@/components/ui/qna/QnaList';
import EnrollmentList from '@/components/ui/EnrollmentList';
import ActivityLogModal from '@/components/ui/ActivityLogModal';

/** 
 * 교수자 클래스 상세 대시보드 (본문)
 * useSearchParams()를 사용하여 빌드 시 Suspense Boundary가 필요하므로 별도 컴포넌트로 분리합니다.
 */
function ProfessorClassDashboardContent() {
    const { requireAuth, user } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const router = useRouter();
    const params = useParams();
    const classId = params.classId;

    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'lec';
    const [activeTab, setActiveTab] = useState(initialTab);

    // 탭 변경 시 URL 쿼리도 함께 갱신 (뒤로가기 시 탭 상태 보존)
    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
        const url = new URL(window.location);
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url);
    }, []);
    const [currentClass, setCurrentClass] = useState(null);

    // 데이터 상태
    const [lectures, setLectures] = useState([]);
    const [resources, setResources] = useState([]);
    const [qnas, setQnas] = useState([]);
    const [enrolls, setEnrolls] = useState([]);
    const [allViews, setAllViews] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [logs, setLogs] = useState([]);

    const [isResFormOpen, setIsResFormOpen] = useState(false);
    const [logModalContext, setLogModalContext] = useState(null);

    // 클래스 수정 모달용 상태
    const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
    const [editClassForm, setEditClassForm] = useState({ title: '', description: '' });

    // 수동 수강생 추가 로직 상태
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [studentSearchResults, setStudentSearchResults] = useState([]);

    // 탭 정의
    const tabs = [
        { key: 'info', label: '클래스 소개' },
        { key: 'lec', label: '강의 목록' },
        { key: 'res', label: '자료실' },
        { key: 'qna', label: 'QnA 게시판' },
        { key: 'enroll', label: '수강생 관리' },
    ];

    useEffect(() => {
        if (!requireAuth(['prof', 'admin'])) return;
        if (!classId) return;

        api.classes.getById(classId).then(cls => {
            if (!cls) {
                showToast('클래스를 찾을 수 없습니다.', 'error');
                router.push(user.role === 'admin' ? '/admin' : '/professor');
                return;
            }
            setCurrentClass(cls);
            loadData(activeTab);
        });
    }, [user, classId, activeTab]);

    /**
     * 활성화된 탭(type)에 따라 강의, 자료, QnA 혹은 수강생 통계 데이터를 병렬 패칭합니다.
     * @param {string} type - 'lec', 'res', 'qna' 중 하나
     */
    const loadData = async (type) => {
        try {
            if (type === 'lec' || type === 'res') {
                const [fetchedLectures, fetchedResources, fetchedLogs] = await Promise.all([
                    api.lectures.getByClass(classId),
                    api.resources.getByClass(classId),
                    api.logs.getAll()
                ]);
                setLectures(fetchedLectures);
                setResources(fetchedResources);
                setLogs(fetchedLogs);
            } else if (type === 'qna') {
                const [fetchedQnas, fetchedUsers] = await Promise.all([
                    api.qnas.getByClass(classId),
                    api.users.getAll()
                ]);
                setQnas(fetchedQnas);
                setAllUsers(fetchedUsers);
            } else if (type === 'enroll') {
                const [fetchedEnrolls, fetchedLectures, fetchedViews, fetchedUsers, fetchedLogs] = await Promise.all([
                    api.enrollments.getByClass(classId),
                    api.lectures.getByClass(classId),
                    api.lectureViews.getByClass(classId),
                    api.users.getAll(),
                    api.logs.getAll()
                ]);
                setEnrolls(fetchedEnrolls);
                setLectures(fetchedLectures);
                setAllViews(fetchedViews);
                setAllUsers(fetchedUsers);
                setLogs(fetchedLogs);
            }
        } catch (err) {
            showToast(err.message || '데이터를 불러오는 데 실패했습니다.', 'error');
        }
    };

    // --- 이벤트 핸들러 ---
    const handleDeleteLecture = async (id) => {
        if (!await confirm('정말로 이 강의를 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.')) return;
        try {
            await api.lectures.delete(id);
            showToast('삭제되었습니다.', 'success');
            loadData('lec');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleDeleteResource = async (id) => {
        if (!await confirm('이 자료를 삭제하시겠습니까?')) return;
        try {
            await api.resources.delete(id);
            showToast('삭제되었습니다.', 'success');
            loadData('res');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleCreateResource = async ({ title, desc, file }) => {
        if (!file) {
            showToast('파일을 선택하세요.', 'error');
            return;
        }
        const finalTitle = title.trim() || file.name.split('.')[0];
        try {
            await api.resources.create(classId, finalTitle, desc, file);
            showToast('자료가 등록되었습니다.', 'success');
            setIsResFormOpen(false);
            loadData('res');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleDeleteQna = async (id) => {
        if (!await confirm('질문을 삭제하시겠습니까?')) return;
        try {
            await api.qnas.delete(id);
            showToast('삭제되었습니다.', 'success');
            loadData('qna');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleCreateQna = async (title, content, isPrivate) => {
        try {
            await api.qnas.create(classId, user.userId, title, content, isPrivate);
            showToast('게시글이 등록되었습니다.', 'success');
            loadData('qna');
        } catch (err) {
            showToast(err.message || '오류가 발생했습니다.', 'error');
        }
    };

    const handleAddReply = async (qnaId, authorId, content) => {
        try {
            await api.qnas.addReply(qnaId, authorId, content);
            showToast('답변이 등록되었습니다.', 'success');
            loadData('qna');
        } catch (err) {
            showToast(err.message || '오류가 발생했습니다.', 'error');
        }
    };

    const handleDeleteReply = async (qnaId, replyId) => {
        if (!await confirm('답변을 삭제하시겠습니까?')) return;
        try {
            await api.qnas.deleteReply(qnaId, replyId);
            showToast('답변이 삭제되었습니다.', 'success');
            loadData('qna');
        } catch (err) {
            showToast(err.message || '오류가 발생했습니다.', 'error');
        }
    };

    const handleSaveClassInfo = async (e) => {
        e.preventDefault();
        try {
            const updated = await api.classes.update(classId, editClassForm);
            setCurrentClass(updated);
            showToast('클래스 정보가 수정되었습니다.', 'success');
            setIsEditClassModalOpen(false);
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleSearchStudent = async () => {
        if (!studentSearchQuery.trim()) {
            showToast('검색어를 입력하세요.', 'error');
            return;
        }
        try {
            const results = await api.users.search(studentSearchQuery);
            setStudentSearchResults(results.filter(u => u.role === 'student'));
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleAddStudent = async (studentId) => {
        try {
            await api.enrollments.create(classId, studentId);
            showToast('수강생이 추가되었습니다.', 'success');
            setIsAddStudentModalOpen(false);
            setStudentSearchQuery('');
            setStudentSearchResults([]);
            loadData('enroll');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    if (!user || !currentClass) return null;

    return (
        <div className="dashboard-grid">
            <Sidebar />

            <div className="content">
                <section className="card">
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <Link href={user.role === 'admin' ? '/admin' : '/professor'} className="btn btn-back" style={{ whiteSpace: 'nowrap' }}>&larr; 클래스 목록</Link>
                            <div style={{ background: '#e0e7ff', color: '#4338ca', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem' }}>
                                참여 코드: {currentClass.enrollmentCode || '발급안됨'}
                            </div>
                        </div>
                        <h2 style={{ margin: 0 }}>{currentClass.title}</h2>
                    </div>

                    <div id="learningArea">
                        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

                        {/* 클래스 소개 탭 */}
                        {activeTab === 'info' && (
                            <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '150px', marginTop: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: 0, color: 'var(--primary-color)' }}>강좌 소개</h4>
                                    <button
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
                                        onClick={() => {
                                            setEditClassForm({ title: currentClass.title, description: currentClass.description || '' });
                                            setIsEditClassModalOpen(true);
                                        }}
                                        title="강좌 정보 수정"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 20h9"></path>
                                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                        </svg>
                                    </button>
                                </div>
                                {currentClass.description ? (
                                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text-color)' }}>
                                        {currentClass.description}
                                    </p>
                                ) : (
                                    <p style={{ color: 'var(--text-muted)' }}>등록된 소개 내용이 없습니다.</p>
                                )}
                            </div>
                        )}

                        {/* 강의 탭 */}
                        {activeTab === 'lec' && (
                            <LectureList
                                lectures={lectures}
                                classId={classId}
                                uploadPath={`/professor/class/${classId}/upload`}
                                onDelete={handleDeleteLecture}
                                logs={logs}
                                onViewLog={(id, title) => setLogModalContext({ entityType: 'lecture', entityId: id, title: `강의 '${title}' 수정 이력` })}
                            />
                        )}

                        {/* 자료실 탭 */}
                        {activeTab === 'res' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4>자료 목록</h4>
                                    <button className="btn btn-primary" onClick={() => setIsResFormOpen(!isResFormOpen)}>
                                        자료 추가
                                    </button>
                                </div>
                                {isResFormOpen && (
                                    <ResourceForm
                                        onSubmit={handleCreateResource}
                                        onCancel={() => setIsResFormOpen(false)}
                                    />
                                )}
                                <ResourceList 
                                    resources={resources} 
                                    onDelete={handleDeleteResource}
                                    onDownload={async (r) => {
                                        try {
                                            showToast(`[${r.filename}] 다운로드를 시작합니다.`, 'success');
                                            await api.resources.download(r.id, r.filename);
                                        } catch (err) {
                                            showToast(err.message || '다운로드에 실패했습니다.', 'error');
                                        }
                                    }}
                                />
                            </div>
                        )}

                        {/* QnA 게시판 탭 */}
                        {activeTab === 'qna' && (
                            <QnaList
                                qnas={qnas}
                                allUsers={allUsers}
                                currentUser={user}
                                onDelete={handleDeleteQna}
                                onAddReply={handleAddReply}
                                onDeleteReply={handleDeleteReply}
                                onCreateQna={handleCreateQna}
                            />
                        )}

                        {/* 수강생 관리 탭 */}
                        {activeTab === 'enroll' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: 0 }}>수강생 현황</h4>
                                    <button className="btn btn-primary" onClick={() => setIsAddStudentModalOpen(true)}>
                                        + 수동 등록
                                    </button>
                                </div>
                                <EnrollmentList
                                    enrolls={enrolls}
                                    allUsers={allUsers}
                                    lectures={lectures}
                                    allViews={allViews}
                                    classId={classId}
                                    basePath="/professor"
                                />
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* 클래스 수정용 Modal (대시보드 내부) */}
            <Modal isOpen={isEditClassModalOpen} onClose={() => setIsEditClassModalOpen(false)} title="클래스 정보 수정">
                <form onSubmit={handleSaveClassInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

            {/* 수강생 수동 추가 Modal */}
            <Modal isOpen={isAddStudentModalOpen} onClose={() => { setIsAddStudentModalOpen(false); setStudentSearchQuery(''); setStudentSearchResults([]); }} title="수강생 수동 등록">
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="이름 또는 아이디로 검색"
                        value={studentSearchQuery}
                        onChange={e => setStudentSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearchStudent()}
                    />
                    <button className="btn btn-primary" onClick={handleSearchStudent}>검색</button>
                </div>
                <div className="list-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {studentSearchResults.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>검색 결과가 없습니다.</p>
                    ) : (
                        studentSearchResults.map(student => {
                            const isEnrolled = enrolls.some(e => e.studentId === student.userId);
                            return (
                                <div className="list-item" key={student.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong>{student.name}</strong> <small style={{ color: 'var(--text-muted)' }}>({student.username})</small>
                                    </div>
                                    <button
                                        className="btn"
                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: isEnrolled ? '#e2e8f0' : '#3b82f6', color: isEnrolled ? '#64748b' : '#fff', cursor: isEnrolled ? 'not-allowed' : 'pointer', border: 'none' }}
                                        onClick={() => !isEnrolled && handleAddStudent(student.userId)}
                                        disabled={isEnrolled}
                                    >
                                        {isEnrolled ? '등록됨' : '등록'}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </Modal>

            {/* 활동 내역 모달 */}
            <ActivityLogModal
                isOpen={!!logModalContext}
                onClose={() => setLogModalContext(null)}
                logs={logModalContext ? logs.filter(l => l.entityType === logModalContext.entityType && l.entityId === logModalContext.entityId) : []}
                title={logModalContext?.title}
            />
        </div>
    );
}

/**
 * 최종 ProfessorClassDashboard 컴포넌트
 * useSearchParams()를 사용하는 하위 컴포넌트를 Suspense로 감싸서 빌드 시 에러를 방지합니다.
 */
export default function ProfessorClassDashboard() {
    return (
        <Suspense fallback={<div className="content-loading">Loading...</div>}>
            <ProfessorClassDashboardContent />
        </Suspense>
    );
}
