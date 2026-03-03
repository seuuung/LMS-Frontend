'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/api';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import Link from 'next/link';

import Modal from '@/components/ui/Modal';
import TabBar from '@/components/ui/TabBar';
import LectureList from '@/components/ui/LectureList';
import ResourceList from '@/components/ui/ResourceList';
import ResourceForm from '@/components/ui/ResourceForm';
import QnaList from '@/components/ui/QnaList';
import EnrollmentList from '@/components/ui/EnrollmentList';

/** 
 * 교수자 클래스 상세 대시보드
 * 특정 클래스의 강의 목록, 자료, QnA, 수강생 통계 현황을 탭으로 조회하고 관리합니다.
 * @returns {JSX.Element|null}
 */
export default function ProfessorClassDashboard() {
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

    const [isResFormOpen, setIsResFormOpen] = useState(false);

    // 클래스 수정 모달용 상태
    const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
    const [editClassForm, setEditClassForm] = useState({ title: '', description: '' });

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
                const [fetchedLectures, fetchedResources] = await Promise.all([
                    api.lectures.getByClass(classId),
                    api.resources.getByClass(classId)
                ]);
                setLectures(fetchedLectures);
                setResources(fetchedResources);
            } else if (type === 'qna') {
                const [fetchedQnas, fetchedUsers] = await Promise.all([
                    api.qnas.getByClass(classId),
                    api.users.getAll()
                ]);
                setQnas(fetchedQnas);
                setAllUsers(fetchedUsers);
            } else if (type === 'enroll') {
                const [fetchedEnrolls, fetchedLectures, fetchedViews, fetchedUsers] = await Promise.all([
                    api.enrollments.getByClass(classId),
                    api.lectures.getByClass(classId),
                    api.lectureViews.getByClass(classId),
                    api.users.getAll()
                ]);
                setEnrolls(fetchedEnrolls);
                setLectures(fetchedLectures);
                setAllViews(fetchedViews);
                setAllUsers(fetchedUsers);
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
        if (!title || !file) {
            showToast('제목과 파일을 선택하세요.', 'error');
            return;
        }
        try {
            await api.resources.create(classId, title, desc, file.name);
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

    if (!user || !currentClass) return null;

    return (
        <div className="dashboard-grid">
            <aside className="sidebar">
                <h3 style={{ padding: '0 1rem', marginBottom: '1rem' }}>Professor Menu</h3>
                <div className="nav-item active">클래스 관리</div>
            </aside>

            <div className="content">
                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Link href={user.role === 'admin' ? '/admin' : '/professor'} className="btn btn-back" style={{ whiteSpace: 'nowrap' }}>&larr; 클래스 목록</Link>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <h2 style={{ margin: 0 }}>{currentClass.title} - 대시보드</h2>
                                <button
                                    className="action-btn"
                                    onClick={() => {
                                        setEditClassForm({ title: currentClass.title, description: currentClass.description || '' });
                                        setIsEditClassModalOpen(true);
                                    }}
                                >수정</button>
                            </div>
                        </div>
                    </div>

                    <div id="learningArea">
                        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

                        {/* 클래스 소개 탭 */}
                        {activeTab === 'info' && (
                            <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '150px', marginTop: '1.5rem' }}>
                                <h4 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>강좌 소개</h4>
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
                                <ResourceList resources={resources} onDelete={handleDeleteResource} />
                            </div>
                        )}

                        {/* QnA 게시판 탭 */}
                        {activeTab === 'qna' && (
                            <div>
                                <h4 style={{ marginBottom: '1rem' }}>QnA 관리</h4>
                                <QnaList qnas={qnas} allUsers={allUsers} onDelete={handleDeleteQna} />
                            </div>
                        )}

                        {/* 수강생 관리 탭 */}
                        {activeTab === 'enroll' && (
                            <div>
                                <h4 style={{ marginBottom: '1rem' }}>수강생 현황</h4>
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
        </div>
    );
}
