'use client';

/**
 * 전역 푸터(Footer) 영역 컴포넌트
 * 공통 카피라이트 정보를 표시합니다.
 * @returns {JSX.Element}
 */
export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <p className="footer-text">
                    &copy; {new Date().getFullYear()} LMS Platform. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
