'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/api';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import Link from 'next/link';

import TabBar from '@/components/ui/TabBar';
import Sidebar from '@/components/ui/Sidebar';
import StatusBadge from '@/components/ui/StatusBadge';
import ResourceList from '@/components/ui/ResourceList';
import EmptyState from '@/components/ui/EmptyState';
import QnaList from '@/components/ui/qna/QnaList';

/** 
 * 학생 클래스 학습 모바/데스크탑 대시보드
 * 등록된 클래스의 강의 목록 시청, 자료 다운로드, QnA 게시판 조회를 지원합니다.
 * @returns {JSX.Element|null}
 */
export default function StudentClassDashboard() {
    const { requireAuth, user } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const router = useRouter();
    const params = useParams();
    const classId = params.classId;

    const [activeTab, setActiveTab] = useState('lec');
    const [currentClass, setCurrentClass] = useState(null);

    // 데이터 상태
    const [lectures, setLectures] = useState([]);
    const [views, setViews] = useState([]);
    const [resources, setResources] = useState([]);
    const [qnas, setQnas] = useState([]);
    const [allUsers, setAllUsers] = useState([]);

    // 탭 정의
    const tabs = [
        { key: 'info', label: '클래스 소개' },
        { key: 'lec', label: '강의 목록' },
        { key: 'res', label: '자료실' },
        { key: 'qna', label: 'QnA' },
    ];

    useEffect(() => {
        if (!requireAuth(['student', 'admin'])) return;
        if (!classId) return;

        api.classes.getById(classId).then(cls => {
            if (!cls) {
                showToast('클래스를 찾을 수 없습니다.', 'error');
                router.push('/student');
                return;
            }
            setCurrentClass(cls);
            loadClassContent(activeTab);
        });
    }, [user, classId, activeTab]);

    /**
     * 활성화된 탭(type)에 따라 데이터를 패칭
     * 학생의 경우 강의 시청률(views) 정보도 불러와 StatusBadge 연산 시 사용합니다.
     * @param {string} type - 'lec', 'res', 'qna' 중 하나
     */
    const loadClassContent = async (type) => {
        try {
            if (type === 'lec') {
                const [fetchedLectures, fetchedViews] = await Promise.all([
                    api.lectures.getByClass(classId),
                    api.lectureViews.getByClassAndStudent(classId, user.userId)
                ]);
                setLectures(fetchedLectures);
                setViews(fetchedViews);
            } else if (type === 'res') {
                const fetchedResources = await api.resources.getByClass(classId);
                setResources(fetchedResources);
            } else if (type === 'qna') {
                const [fetchedQnas, fetchedUsers] = await Promise.all([
                    api.qnas.getByClass(classId),
                    api.users.getAll()
                ]);
                setQnas(fetchedQnas);
                setAllUsers(fetchedUsers);
            }
        } catch (err) {
            showToast(err.message || '데이터를 불러오는 데 실패했습니다.', 'error');
        }
    };

    const handleCreateQna = async (title, content, isPrivate) => {
        try {
            await api.qnas.create(classId, user.userId, title, content, isPrivate);
            showToast('질문이 등록되었습니다.', 'success');
            loadClassContent('qna');
        } catch (err) {
            showToast(err.message || '오류가 발생했습니다.', 'error');
        }
    };

    const handleDeleteQna = async (qnaId) => {
        if (!await confirm('삭제하시겠습니까?')) return;
        try {
            await api.qnas.delete(qnaId);
            showToast('삭제되었습니다', 'success');
            loadClassContent('qna');
        } catch (err) {
            showToast(err.message || '오류가 발생했습니다.', 'error');
        }
    };

    // onAddReply, onDeleteReply for Student (Read-only for replies, so they are just empty stubs or handled properly to prevent error)
    const handleAddReply = async (qnaId, authorId, content) => {
        showToast('학생은 답변을 달 수 없습니다.', 'error');
    };
    const handleDeleteReply = async (qnaId, replyId) => {
        showToast('권한이 없습니다.', 'error');
    };

    if (!user || !currentClass) return null;

    return (
        <div className="dashboard-grid">
            <Sidebar />

            <div className="content">
                <section className="card">
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <Link href="/student" className="btn btn-back" style={{ whiteSpace: 'nowrap' }}>&larr; 내 학습 공간</Link>
                        </div>
                        <h2 style={{ margin: 0 }}>{currentClass.title}</h2>
                    </div>

                    <div id="learningArea">
                        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

                        {/* 강의 탭 */}
                        {activeTab === 'lec' && (
                            <div>
                                <h4>강의 목록</h4>
                                <div className="list-container">
                                    {lectures.length === 0 ? (
                                        <EmptyState message="업로드된 강의가 없습니다." />
                                    ) : (
                                        lectures.map(l => {
                                            const viewInfo = views.find(v => String(v.lectureId) === String(l.id));
                                            const currentRate = viewInfo ? (viewInfo.progressRate || 0) : 0;
                                            return (
                                                <div className="list-item" key={l.id}>
                                                    <div>
                                                        <strong>{l.title}</strong>
                                                        <p style={{ margin: 0, fontSize: '0.9rem' }}>{l.description}</p>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <StatusBadge rate={currentRate} />
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                                                            onClick={() => router.push(`/lecture?classId=${classId}&lectureId=${l.id}`)}
                                                        >
                                                            시청
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 자료실 탭 */}
                        {activeTab === 'res' && (
                            <div>
                                <h4>자료 목록</h4>
                                <ResourceList
                                    resources={resources}
                                    onDownload={(r) => showToast(`[${r.filename}] 다운로드를 시작합니다.`, 'success')}
                                />
                            </div>
                        )}

                        {/* QnA 탭 */}
                        {activeTab === 'qna' && (
                            <QnaList
                                qnas={qnas}
                                allUsers={allUsers || []}
                                currentUser={user}
                                onDelete={handleDeleteQna}
                                onAddReply={handleAddReply}
                                onDeleteReply={handleDeleteReply}
                                onCreateQna={handleCreateQna}
                            />
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
