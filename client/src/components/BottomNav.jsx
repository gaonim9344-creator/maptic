import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNav.css';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="bottom-nav">
            <div className="bottom-nav-item" onClick={() => navigate('/')}>
                <div className={`nav-icon ${isActive('/') ? 'active' : ''}`}>🏠</div>
                <span className={`nav-label ${isActive('/') ? 'active' : ''}`}>홈</span>
            </div>
            <div className="bottom-nav-item" onClick={() => navigate('/list')}>
                <div className={`nav-icon ${isActive('/list') ? 'active' : ''}`}>🏋️</div>
                <span className={`nav-label ${isActive('/list') ? 'active' : ''}`}>스포츠시설</span>
            </div>
            <div className="bottom-nav-item" onClick={() => navigate('/profile')}>
                <div className={`nav-icon ${isActive('/profile') ? 'active' : ''}`}>👤</div>
                <span className={`nav-label ${isActive('/profile') ? 'active' : ''}`}>프로필</span>
            </div>
        </nav>
    );
};

export default BottomNav;
