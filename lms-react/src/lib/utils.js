/**
 * LMS 공용 유틸리티 함수 모듈
 * 프로젝트 전역에서 사용되는 헬퍼 함수들을 관리합니다.
 */

/**
 * 유튜브 URL에서 영상 ID를 추출합니다.
 * youtu.be, watch?v=, embed/, shorts/ 형식을 지원합니다.
 * @param {string} link - 유튜브 URL 또는 영상 ID
 * @returns {string} 추출된 영상 ID (실패 시 빈 문자열)
 */
export const extractVideoId = (link) => {
    if (!link) return '';
    if (link.includes('youtu.be/')) return link.split('youtu.be/')[1].split('?')[0];
    if (link.includes('watch?v=')) return link.split('watch?v=')[1].split('&')[0];
    if (link.includes('embed/')) return link.split('embed/')[1].split('?')[0];
    if (link.includes('shorts/')) return link.split('shorts/')[1].split('?')[0];
    if (link.length === 11 && !link.includes('/')) return link;
    return '';
};

/**
 * Date 객체 또는 ISO 문자열을 'YYYY. MM. DD' 형식의 로컬 날짜 문자열로 변환합니다.
 * @param {string|Date} date - 변환할 날짜
 * @returns {string} 포맷된 날짜 문자열
 */
export const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
};
