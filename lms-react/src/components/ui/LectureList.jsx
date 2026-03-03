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
 * @returns {JSX.Element}
 */
export default function LectureList({ lectures, classId, uploadPath, onDelete }) {
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
                    lectures.map(l => (
                        <div className="list-item" key={l.id}>
                            <span>
                                <strong>{l.title}</strong>
                                <button className="btn" style={{ background: '#e2e8f0', color: '#0f172a', padding: '0.2rem 0.5rem', fontSize: '0.8rem', marginLeft: '0.5rem' }} onClick={() => router.push(`/lecture?classId=${classId}&lectureId=${l.id}`)}>영상 보기</button>
                                <button className="btn" style={{ background: '#eff6ff', color: '#3b82f6', padding: '0.2rem 0.5rem', fontSize: '0.8rem', marginLeft: '0.5rem' }} onClick={() => router.push(`/lecture_stats?classId=${classId}&lectureId=${l.id}`)}>수강률 통계</button>
                            </span>
                            <button className="action-btn del" onClick={() => onDelete(l.id)}>삭제</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
