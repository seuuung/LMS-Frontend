/**
 * 수강 상태 뱃지 컴포넌트
 * 수강률(rate)에 따라 완료/진행중/미수강 상태를 시각적으로 표시합니다.
 * admin/professor/student 클래스 대시보드에서 공용으로 사용됩니다.
 */
export default function StatusBadge({ rate }) {
    if (rate >= 95) return <span className="badge badge-complete">수강 완료 (100%)</span>;
    if (rate > 0) return <span className="badge badge-progress">수강 중 ({rate}%)</span>;
    return <span className="badge badge-none">미수강 (0%)</span>;
}
