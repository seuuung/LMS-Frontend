'use client';

import Link from 'next/link';
import EmptyState from './EmptyState';
import StatusBadge from './StatusBadge';

/**
 * 수강생 현황 컴포넌트 (관리자/교수자 공용)
 * 수강생 목록과 각 학생의 평균 수강 진도율을 표시합니다.
 * "상세보기" 버튼을 통해 학생별 강의 진도 상세 페이지로 이동할 수 있습니다.
 * 
 * @param {Array<Object>} enrolls - 수강 등록 데이터 배열
 * @param {Array<Object>} allUsers - 전체 사용자 목록 (학생 이름 조회용)
 * @param {Array<Object>} lectures - 강의 데이터 배열 (진도율 계산용)
 * @param {Array<Object>} allViews - 전체 수강 기록 배열
 * @param {string} classId - 클래스 ID
 * @param {string} basePath - 역할별 기본 경로 (예: '/admin', '/professor')
 */
export default function EnrollmentList({ enrolls, allUsers, lectures, allViews, classId, basePath }) {
    return (
        <div className="list-container">
            {enrolls.length === 0 ? (
                <EmptyState message="수강생이 없습니다." />
            ) : (
                enrolls.map(e => {
                    const student = allUsers.find(u => u.userId === e.studentId);
                    const studentName = student ? student.name : e.studentId;

                    // 각 학생별 평균 수강률 계산: 전체 강의 중 시청 완료한 비율의 산술 평균
                    let avgProgress = 0;
                    if (lectures.length > 0) {
                        const studentViews = allViews.filter(v => String(v.studentId) === String(e.studentId));
                        const totalRate = lectures.reduce((sum, lec) => {
                            const view = studentViews.find(v => String(v.lectureId) === String(lec.id));
                            return sum + (view ? Number(view.progressRate || 0) : 0);
                        }, 0);
                        avgProgress = Math.round(totalRate / lectures.length);
                    }

                    return (
                        <div className="list-item" style={{ alignItems: 'center' }} key={e.id}>
                            <div>
                                <strong>{studentName}</strong>
                                <small style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({e.studentId})</small>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <StatusBadge rate={avgProgress} />
                                <Link
                                    href={`${basePath}/class/${classId}/student/${e.studentId}`}
                                    className="btn"
                                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem', background: '#eff6ff', color: '#3b82f6', fontWeight: 600, borderRadius: '6px', textDecoration: 'none' }}
                                >
                                    상세보기
                                </Link>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
