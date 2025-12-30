import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import './Auth.css';

function SignIn({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('이메일과 비밀번호를 입력해주세요');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.signin(email, password);
            onLogin(response.data.user, response.data.token);

            // If user hasn't selected sports yet, go to onboarding
            if (!response.data.user.selectedSports || response.data.user.selectedSports.length === 0) {
                navigate('/onboarding');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.error || '로그인에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="container">
                <div className="auth-container fade-in">
                    <div className="auth-header text-center">
                        <h1 className="auth-title">로그인</h1>
                        <p className="auth-subtitle">다시 만나서 반갑습니다!</p>
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
                                placeholder="비밀번호를 입력하세요"
                                disabled={loading}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                            {loading ? '로그인 중...' : '로그인'}
                        </button>
                    </form>

                    <div className="auth-footer text-center">
                        <p>
                            계정이 없으신가요?{' '}
                            <Link to="/signup" className="auth-link">회원가입</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignIn;
