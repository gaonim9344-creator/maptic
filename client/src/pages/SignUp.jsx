import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import './Auth.css';

function SignUp({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!email || !password || !confirmPassword) {
            setError('모든 필드를 입력해주세요');
            return;
        }

        if (password.length < 6) {
            setError('비밀번호는 최소 6자 이상이어야 합니다');
            return;
        }

        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.signup(email, password);
            onLogin(response.data.user, response.data.token);
            navigate('/onboarding');
        } catch (err) {
            setError(err.response?.data?.error || '회원가입에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="container">
                <div className="auth-container fade-in">
                    <div className="auth-header text-center">
                        <h1 className="auth-title">회원가입</h1>
                        <p className="auth-subtitle">maptic에 오신 것을 환영합니다</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="email">이메일</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="이메일을 입력하세요"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">비밀번호</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="비밀번호 (최소 6자)"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">비밀번호 확인</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="비밀번호를 다시 입력하세요"
                                disabled={loading}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                            {loading ? '가입 중...' : '회원가입'}
                        </button>
                    </form>

                    <div className="auth-footer text-center">
                        <p>
                            이미 계정이 있으신가요?{' '}
                            <Link to="/signin" className="auth-link">로그인</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignUp;
