'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';

/**
 * 전역 애플리케이션 진입점 (Home)
 * 사용자의 로그인 및 회원가입 화면을 렌더링하고, 이미 로그인된 경우 역할(Role)에 맞는 대시보드로 자동 리다이렉션합니다.
 * @returns {JSX.Element|null} 초기 리다이렉션 시 깜빡임 방지용 null 반환 가능
 */
export default function Home() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { user, login, register } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'prof') router.push('/professor');
      else if (user.role === 'student') router.push('/student');
    }
  }, [user, router]);

  /**
   * 로그인 폼 제출 핸들러
   * 폼 데이터를 파싱하여 useAuth의 login 함수를 호출합니다.
   * 인증 성공 시 AuthContext 내부에서 라우팅이 이뤄집니다.
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      setIsLoading(true);
      await login(username, password);
      showToast('로그인 성공', 'success');
      // note: routing is handled inside AuthContext.login 
    } catch (error) {
      showToast(error.message || '로그인 실패', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData.entries());

    try {
      setIsLoading(true);
      await register({
        username: userData.reg_username,
        password: userData.reg_password,
        name: userData.reg_name,
        role: userData.reg_role,
      });
      showToast('회원가입 성공, 로그인해주세요.', 'success');

      // Navigate to login view
      e.target.reset();
      setIsLoginView(true);
    } catch (error) {
      showToast(error.message || '회원가입 실패', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (user) return null; // Prevent flicker during redirect

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="auth-container">
        <style jsx>{`
          .auth-container {
            width: 100%;
            max-width: 400px;
          }
          .auth-card {
            padding: 3rem 2.5rem;
            animation: fadeIn 0.5s ease-out forwards;
          }
          .brand-title {
            text-align: center;
            font-size: 1.75rem;
            color: var(--primary-color);
            margin-bottom: 2rem;
            letter-spacing: -0.5px;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .form-select {
            width: 100%;
            padding: 0.75rem 1rem;
            font-size: 1rem;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            background-color: var(--card-bg);
            color: var(--text-main);
            outline: none;
          }
          .form-select:focus {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          }
        `}</style>

        {isLoginView ? (
          <div className="card auth-card">
            <h1 className="brand-title">LMS Platform</h1>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label" htmlFor="username">아이디</label>
                <input type="text" id="username" name="username" className="form-control" placeholder="아이디를 입력하세요" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="password">비밀번호</label>
                <input type="password" id="password" name="password" className="form-control" placeholder="비밀번호를 입력하세요" required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isLoading}>
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </form>
            <p className="text-center mt-4" style={{ fontSize: '0.9rem' }}>
              계정이 없으신가요? <a href="#" onClick={(e) => { e.preventDefault(); setIsLoginView(false); }}>회원가입</a>
            </p>
          </div>
        ) : (
          <div className="card auth-card">
            <h1 className="brand-title">LMS 회원가입</h1>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">역할</label>
                <select name="reg_role" id="reg_role" className="form-select">
                  <option value="student">학습자</option>
                  <option value="prof">교수자</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">이름</label>
                <input type="text" name="reg_name" className="form-control" placeholder="홍길동" required />
              </div>
              <div className="form-group">
                <label className="form-label">아이디</label>
                <input type="text" name="reg_username" className="form-control" placeholder="아이디" required />
              </div>
              <div className="form-group">
                <label className="form-label">비밀번호</label>
                <input type="password" name="reg_password" className="form-control" placeholder="비밀번호" required />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isLoading}>
                {isLoading ? '가입 중...' : '가입하기'}
              </button>
            </form>
            <p className="text-center mt-4" style={{ fontSize: '0.9rem' }}>
              이미 계정이 있으신가요? <a href="#" onClick={(e) => { e.preventDefault(); setIsLoginView(true); }}>로그인</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
