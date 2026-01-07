import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NavBar.css';

function NavBar({ user, onLogout }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        onLogout();
        navigate('/');
    };

    return (
        <nav className="navbar glass-container">
            <div className="container flex items-center justify-between">
                <a href="/" className="navbar-brand">
                    <span className="brand-text">maptic</span>
                </a>

                <div className="navbar-links flex items-center gap-md">
                    <Link to="/" className="nav-link">홈</Link>

                    {user ? (
                        <>
                            <Link to="/profile" className="nav-link">프로필</Link>
                            <button onClick={handleLogout} className="btn btn-ghost">
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/signin" className="btn btn-secondary">
                                로그인
                            </Link>
                            <Link to="/signup" className="btn btn-primary">
                                회원가입
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default NavBar;
