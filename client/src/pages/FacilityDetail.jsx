import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { facilityAPI } from '../utils/api';
import { getSportEmoji } from '../utils/sportsData';
import './FacilityDetail.css';

const FacilityDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [facility, setFacility] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFacility = async () => {
            try {
                const response = await facilityAPI.getOne(id);
                setFacility(response.data);
            } catch (err) {
                console.error('Failed to fetch facility:', err);
                setError('시설 정보를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchFacility();
    }, [id]);

    if (loading) {
        return (
            <div className="detail-loading">
                <div className="spinner"></div>
                <p>시설 정보를 불러오는 중...</p>
            </div>
        );
    }

    if (error || !facility) {
        return (
            <div className="detail-error">
                <p>{error || '시설을 찾을 수 없습니다.'}</p>
                <button onClick={() => navigate(-1)} className="back-btn">뒤로 가기</button>
            </div>
        );
    }

    const emoji = getSportEmoji(facility.category);

    return (
        <div className="facility-detail-page fade-in">
            <div className="detail-container glass-container">
                <button className="close-btn" onClick={() => navigate('/')}>
                    <span className="material-icons">close</span>
                </button>

                <div className="detail-header">
                    <div className="category-badge">
                        <span className="emoji">{emoji}</span>
                        <span className="category-name">{facility.category}</span>
                    </div>
                    <h1 className="facility-name">{facility.name}</h1>
                    <p className="facility-address">
                        <span className="material-icons">place</span> {facility.address}
                    </p>
                </div>

                {facility.images && facility.images.length > 0 && (
                    <div className="image-gallery">
                        {facility.images.map((img, idx) => (
                            <img key={idx} src={img.url} alt={`${facility.name} ${idx + 1}`} className="gallery-image" />
                        ))}
                    </div>
                )}

                <div className="detail-content">
                    <section className="info-section">
                        <h3><span className="material-icons">info</span> 시설 소개</h3>
                        <p className="description">{facility.description || '소개 정보가 없습니다.'}</p>
                    </section>

                    <section className="price-section">
                        <h3><span className="material-icons">payments</span> 이용 가격</h3>
                        <div className="price-cards">
                            {facility.price_daily && (
                                <div className="price-card">
                                    <span className="label">1일 이용권</span>
                                    <span className="value">{facility.price_daily.toLocaleString()}원</span>
                                </div>
                            )}
                            {facility.price_monthly && (
                                <div className="price-card highlight">
                                    <span className="label">1개월 회원권</span>
                                    <span className="value">{facility.price_monthly.toLocaleString()}원</span>
                                </div>
                            )}
                            {facility.price_yearly && (
                                <div className="price-card">
                                    <span className="label">1년 회원권</span>
                                    <span className="value">{facility.price_yearly.toLocaleString()}원</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {facility.features && facility.features.length > 0 && (
                        <section className="features-section">
                            <h3><span className="material-icons">star</span> 편의 시설 및 특징</h3>
                            <div className="feature-tags">
                                {facility.features.map((feature, idx) => (
                                    <span key={idx} className="feature-tag">{feature}</span>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <div className="detail-footer">
                    <button className="contact-btn primary-btn">문의하기</button>
                    <button className="reserve-btn secondary-btn">예약하기</button>
                </div>
            </div>
        </div>
    );
};

export default FacilityDetail;
