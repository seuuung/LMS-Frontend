'use client';

import { useRouter } from 'next/navigation';
import EmptyState from './EmptyState';

/**
 * 강의 목록 컴포넌트 (관리자/교수자 공용)
 * 강의 목록을 표시하고, 영상 보기/통계/삭제 기능을 제공합니다.
 * 
 * @param {Array<Object>} lectures - 강의 데이터 배열
 * @param {string} classId - 대상 클래스 ID
 * @param {string} uploadPath - 강의 업로드 페이지 경로 (예: '/admin/class/123/upload')
 * @param {function(string): void} onDelete - 강의 삭제 핸들러 (lectureId를 인자로 전달)
 * @param {Array<Object>} [logs=[]] - 전체 또는 분류된 로그 배열
 * @param {function(string, string): void} [onViewLog] - 로그 모달을 여는 콜백 함수 (lectureId, title)
 * @returns {JSX.Element}
 */
export default function LectureList({ lectures, classId, uploadPath, onDelete, logs = [], onViewLog }) {
    const router = useRouter();

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4>강의 목록</h4>
                <button className="btn btn-primary" onClick={() => router.push(uploadPath)}>
                    새 강의 업로드
                </button>
            </div>
            <div className="list-container mt-4">
                {lectures.length === 0 ? (
                    <EmptyState message="등록된 강의가 없습니다." />
                ) : (
                    lectures.map(l => {
                        const lectureLogs = logs.filter(log => log.entityType === 'lecture' && log.entityId === l.id);
                        const lastActivity = lectureLogs.length > 0 ? new Date(lectureLogs[0].timestamp).toLocaleDateString() : '-';
                        return (
                            <div className="list-item" key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>
                                    <strong>{l.title}</strong>
                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: '0.5rem' }}>최근 활동: {lastActivity}</span>
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button className="btn" style={{ background: '#e2e8f0', color: '#0f172a', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => router.push(`/lecture?classId=${classId}&lectureId=${l.id}`)}>영상 보기</button>
                                    <button className="btn" style={{ background: '#eff6ff', color: '#3b82f6', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => router.push(`/lecture_stats?classId=${classId}&lectureId=${l.id}`)}>수강률 통계</button>
                                    {onViewLog && <button className="btn" style={{ background: '#f1f5f9', color: '#475569', padding: '0.3rem 0.6rem', fontSize: '0.8rem', border: '1px solid #cbd5e1' }} onClick={() => onViewLog(l.id, l.title)}>로그 보기</button>}
                                    <button className="action-btn del" onClick={() => onDelete(l.id)}>삭제</button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
}
