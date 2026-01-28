import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PartnerHome.css';

function PartnerHome({ user }) {
    const navigate = useNavigate();

    const handleStart = () => {
        if (!user) {
            alert('로그인이 필요합니다.');
            navigate('/signin');
            return;
        }
        navigate('/partner/dashboard');
    };

    return (
        <div className="partner-home-container">
            <div className="partner-hero">
                <div className="partner-hero-content fade-in">
                    <h1 className="partner-title">Maptic <span className="highlight-text">Business</span></h1>
                    <p className="partner-subtitle">사장님의 시설을 맵틱에 등록하고 더 많은 회원을 만나보세요.</p>

                    <div className="feature-grid">
                        <div className="feature-card">
                            <div className="feature-icon">📍</div>
                            <h3>지도 노출</h3>
                            <p>내 주변 잠재 고객에게 시설 위치를 알리세요.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">💰</div>
                            <h3>가격 투명화</h3>
                            <p>일일권, 정기권 가격을 등록하여 신뢰도를 높이세요.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">✨</div>
                            <h3>시설 홍보</h3>
                            <p>시설 사진과 상세 정보를 매력적으로 보여주세요.</p>
                        </div>
                    </div>

                    <button className="btn btn-primary start-btn" onClick={handleStart}>
                        지금 시작하기
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PartnerHome;
