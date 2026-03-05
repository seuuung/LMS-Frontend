import { BookIcon, ProfessorIcon } from './Icons';

/**
 * ClassCard.jsx
 * 
 * 시스템 전반(학생, 어드민, 교수)에서 사용되는 공통 강좌 카드 컴포넌트입니다.
 * 
 * @param {Object} classData - 클래스 데이터 객체 (title 등)
 * @param {number} lectureCount - 콘텐츠 수
 * @param {string} professorName - 담당 교수 이름
 * @param {Function} onClick - 카드 클릭 핸들러
 * @param {JSX.Element} actionButton - 우상단 드롭다운 메뉴나 커스텀 버튼
 * @param {JSX.Element} badge - 카드 제목 옆에 들어갈 뱃지 (예: 수강 중)
 * @param {JSX.Element} footer - 하단 추가 정보 영역 (생성일, 참여버튼 등)
 * @param {boolean} isEnrolled - 학생의 경우 수강 여부에 따른 배경 스타일 부여용
 */
export default function ClassCard({
    classData,
    lectureCount,
    professorName,
    onClick,
    actionButton,
    badge,
    footer,
    isEnrolled
}) {
    const cardStyle = {
        position: 'relative',
        ...(isEnrolled ? { border: '1px solid #cbd5e1', background: '#f8fafc' } : {})
    };

    return (
        <div className="class-card cursor-pointer" style={cardStyle} onClick={onClick}>
            {/* 이미지 및 플레이스홀더 영역 */}
            <div className="class-card-image">
                {actionButton}
                <div className="placeholder-circle">
                    <BookIcon />
                </div>
            </div>

            {/* 카드 본문 콘텐츠 */}
            <div className="class-card-content">
                {/* 뱃지가 있으면 flex 컨트롤, 없으면 단순 렌더링 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 className="class-card-title" style={{ margin: 0 }}>
                        {classData.title}
                    </h3>
                    {badge}
                </div>

                <div className="class-card-meta">
                    <span className="class-card-muted">콘텐츠 수 : {lectureCount ?? 0}</span>
                    {professorName && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <ProfessorIcon />
                            <span>담당교수 : {professorName}</span>
                        </div>
                    )}
                </div>

                {/* 하단 푸터 영역 (생성일, 바로가기 버튼 등) */}
                {footer && (
                    <div className="class-card-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
