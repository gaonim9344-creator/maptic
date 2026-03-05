import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { facilitiesAPI, reviewsAPI } from '../utils/api';
import { getSportEmoji } from '../utils/sportsData';
import backArrow from '../assets/back-arrow.png';
import './FacilityDetail.css';

const FacilityDetail = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const mapRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const [facility, setFacility] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPrice, setSelectedPrice] = useState('monthly');
    const [activeTab, setActiveTab] = useState('info');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Refs for scrolling
    const infoRef = useRef(null);
    const priceRef = useRef(null);
    const reviewRef = useRef(null);
    const locationRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [facRes, revRes] = await Promise.all([
                    facilitiesAPI.getById(id),
                    reviewsAPI.getByFacility(id)
                ]);
                setFacility(facRes.data);
                setReviews(revRes.data);
            } catch (err) {
                console.error('Failed to fetch data:', err);
                setError('정보를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    useEffect(() => {
        if (!loading && facility && activeTab === 'location' && mapRef.current) {
            initMap();
        }
    }, [loading, facility, activeTab]);

    const initMap = () => {
        const renderMap = () => {
            if (!facility.address || !mapRef.current) return;

            window.naver.maps.Service.geocode({ query: facility.address }, (status, response) => {
                if (status === window.naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
                    const addr = response.v2.addresses[0];
                    const pos = new window.naver.maps.LatLng(addr.y, addr.x);

                    const mapOptions = {
                        center: pos,
                        zoom: 16,
                        minZoom: 10,
                        draggable: true,
                        scrollWheel: false
                    };

                    const map = new window.naver.maps.Map(mapRef.current, mapOptions);

                    new window.naver.maps.Marker({
                        position: pos,
                        map: map,
                        title: facility.name
                    });
                }
            });
        };

        if (!window.naver || !window.naver.maps || !window.naver.maps.Service) {
            const clientId = 'qk5p9qijo2';
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
            script.async = true;
            script.onload = () => {
                if (window.naver && window.naver.maps) {
                    window.naver.maps.onJSContentLoaded = renderMap;
                    // If geocoder is not immediately available, wait a bit
                    if (!window.naver.maps.Service) {
                        setTimeout(renderMap, 500);
                    } else {
                        renderMap();
                    }
                }
            };
            document.head.appendChild(script);
        } else {
            renderMap();
        }
    };

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
        // Special case for location to trigger map render
        if (tabId === 'location') {
            // Map will render via useEffect
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('댓글을 작성하려면 로그인이 필요합니다.');
            return;
        }
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await reviewsAPI.create({
                facility: id,
                content: newComment,
                rating: 5
            });
            setReviews([response.data, ...reviews]);
            setNewComment('');
        } catch (err) {
            console.error('Failed to post comment:', err);
            alert('댓글 작성에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="detail-loading">
            <div className="spinner"></div>
            <p>다짐 스타일로 불러오는 중...</p>
        </div>
    );

    if (error || !facility) return (
        <div className="detail-error">
            <p>{error || '시설을 찾을 수 없습니다.'}</p>
            <button onClick={() => navigate(-1)} className="back-btn">뒤로 가기</button>
        </div>
    );

    const emoji = getSportEmoji(facility.category);
    const images = facility.images && facility.images.length > 0 ? facility.images : [{ url: 'https://via.placeholder.com/800x500?text=이미지+없음' }];

    const pricingOptions = [
        { id: 'daily', name: '1일권', price: facility.price_daily, monthly: facility.price_daily },
        { id: 'monthly', name: '1개월권', price: facility.price_monthly, monthly: facility.price_monthly },
        { id: '3months', name: '3개월권', price: facility.price_3months, monthly: Math.round(facility.price_3months / 3) },
        { id: 'yearly', name: '12개월권', price: facility.price_yearly, monthly: Math.round(facility.price_yearly / 12) }
    ];

    const getSelectedPriceName = () => {
        const option = pricingOptions.find(opt => opt.id === selectedPrice);
        return option ? option.name : '회원권';
    };

    return (
        <div className="facility-detail-page fade-in">
            {/* Sticky Header */}
            <header className="detail-nav-header">
                <div className="nav-top-bar">
                    <button className="back-icon-btn" onClick={() => navigate(-1)}>
                        <img src={backArrow} alt="뒤로가기" className="back-arrow-img" />
                    </button>
                    <span className="nav-title">{facility.name}</span>
                    <button className="share-icon-btn">
                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>&#xe80d;</span>
                    </button>
                </div>
                <nav className="nav-tabs">
                    <div className={`nav-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => handleTabClick('info')}>시설정보</div>
                    <div className={`nav-tab ${activeTab === 'price' ? 'active' : ''}`} onClick={() => handleTabClick('price')}>가격정책</div>
                    <div className={`nav-tab ${activeTab === 'review' ? 'active' : ''}`} onClick={() => handleTabClick('review')}>후기</div>
                    <div className={`nav-tab ${activeTab === 'location' ? 'active' : ''}`} onClick={() => handleTabClick('location')}>위치</div>
                </nav>
            </header>

            <main className="detail-main-container">
                {/* Image Slider Section */}
                {activeTab === 'info' && (
                    <section className="detail-image-slider">
                        <img
                            src={images[currentImageIndex].url}
                            alt={facility.name}
                            className="slider-image"
                        />
                        <div className="image-counter">
                            {currentImageIndex + 1} / {images.length}
                        </div>
                    </section>
                )}

                <div className="tab-content">
                    {activeTab === 'info' && (
                        <section className="detail-section info-tab-content">
                            <div className="facility-intro-card">
                                <div className="main-info">
                                    <div className="badge-row">
                                        <span className="category-tag">
                                            <span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '4px' }}>&#xeb43;</span>
                                            {facility.category}
                                        </span>
                                    </div>
                                    <h1>{facility.name}</h1>
                                    <div className="addr-row">
                                        <span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '4px' }}>&#xe55f;</span>
                                        <span>{facility.address}</span>
                                    </div>
                                </div>

                                <div className="section-head">
                                    <h2>시설 소개</h2>
                                </div>
                                <p className="description-text">{facility.description || '시설에 대한 상세 정보가 준비 중입니다.'}</p>

                                <div className="feature-grid">
                                    {(facility.features || []).map((f, i) => (
                                        <div key={i} className="feature-item">
                                            <span className="material-symbols-outlined feature-icon" style={{ fontSize: '1.2rem', color: '#666' }}>
                                                {f === '주차' ? '&#xe54c;' : f === '샤워실' ? '&#xef3e;' : f === '운동복' ? '&#xf024;' : '&#xe838;'}
                                            </span>
                                            <span>{f}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === 'price' && (
                        <section className="detail-section price-tab-content">
                            <div className="section-head">
                                <h2>이용권 가격</h2>
                            </div>
                            <div className="pricing-list">
                                {pricingOptions.map(opt => (
                                    <div
                                        key={opt.id}
                                        className={`price-item-card ${selectedPrice === opt.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedPrice(opt.id)}
                                    >
                                        <div className="period">
                                            <span className="name">{opt.name}</span>
                                            {opt.id !== 'daily' && (
                                                <span className="monthly-calc">월 {opt.monthly.toLocaleString()}원</span>
                                            )}
                                        </div>
                                        <div className="price-info">
                                            <span className="total-price">{opt.price.toLocaleString()}원</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {activeTab === 'review' && (
                        <section className="detail-section review-tab-content">
                            <div className="section-head">
                                <h2>센터 후기</h2>
                            </div>

                            <div className="review-summary">
                                <div className="rating-big">
                                    <span className="score">4.9</span>
                                    <div className="stars">★★★★★</div>
                                </div>
                                <div className="review-count">
                                    평가 {reviews.length}개
                                </div>
                            </div>

                            <form className="comment-form" onSubmit={handleCommentSubmit}>
                                <div className="comment-input-group">
                                    <textarea
                                        className="comment-input"
                                        placeholder={user ? "다짐 회원들을 위해 솔직한 후기를 남겨주세요." : "로그인 후 후기를 작성할 수 있습니다."}
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        disabled={!user || isSubmitting}
                                    />
                                    <button
                                        type="submit"
                                        className="submit-comment-btn"
                                        disabled={!user || isSubmitting || !newComment.trim()}
                                    >
                                        {isSubmitting ? '저장 중...' : '후기 등록'}
                                    </button>
                                </div>
                            </form>

                            <div className="comments-list">
                                {reviews.length > 0 ? (
                                    reviews.map((review) => (
                                        <div key={review._id} className="review-card">
                                            <div className="review-user-info">
                                                <span className="user-name">{review.userName}</span>
                                                <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="review-body">{review.content}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-comments">아직 작성된 후기가 없습니다. 첫 번째 후기를 남겨보세요!</div>
                                )}
                            </div>
                        </section>
                    )}

                    {activeTab === 'location' && (
                        <section className="detail-section location-tab-content">
                            <div className="section-head">
                                <h2>위치 안내</h2>
                            </div>
                            <div className="location-card">
                                <div ref={mapRef} className="map-view">
                                    <div className="map-placeholder">지도를 불러오고 있습니다...</div>
                                </div>
                                <div className="address-detail">
                                    <span className="address-text">{facility.address}</span>
                                    <p className="addr-row" style={{ justifyContent: 'flex-start' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#888' }}>&#xe88e;</span>
                                        <span style={{ fontSize: '0.85rem', color: '#888' }}>정확한 위치는 지도를 참고해 주세요.</span>
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </main>

            {/* Fixed Bottom Action Bar */}
            <div className="detail-bottom-actions">
                <button className="inquiry-btn">문의하기</button>
                <button className="purchase-btn" onClick={() => alert(`${getSelectedPriceName()} 상품 결제 페이지로 이동합니다. (준비 중)`)}>
                    회원권 결제하기
                </button>
            </div>
        </div>
    );
};

export default FacilityDetail;
