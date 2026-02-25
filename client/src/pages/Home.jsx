import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { facilitiesAPI } from '../utils/api';
import './Home.css';

// Components required for Da-Gym style
const BannerCard = ({ title, subtitle, bgGradient, linkText, onClick }) => (
    <div className="banner-card" style={{ background: bgGradient }} onClick={onClick}>
        <div className="banner-text">
            <h4>{title}</h4>
            <p>{subtitle}</p>
        </div>
        {linkText && (
            <div className="banner-action">
                <button className="btn">{linkText}</button>
            </div>
        )}
    </div>
);

const CategoryItem = ({ icon, label, onClick }) => (
    <div className="category-item" onClick={onClick}>
        <div className="category-icon glass-container">
            {icon}
        </div>
        <span className="category-label">{label}</span>
    </div>
);

const FacilityCard = ({ facility, onClick }) => (
    <div className="facility-card-horizontal" onClick={onClick}>
        <div className="facility-image-container">
            {facility.images && facility.images.length > 0 ? (
                <img src={facility.images[0]} alt={facility.name} />
            ) : (
                <div className="facility-image-placeholder">
                    <span>{facility.category === '유도' ? '🥋' : '💪'}</span>
                </div>
            )}
        </div>
        <div className="facility-info">
            <div className="facility-header">
                <span className="facility-category">{facility.category}</span>
                <h4 className="facility-name">{facility.name}</h4>
            </div>
            <div className="facility-details">
                <span className="facility-address">📍 {facility.address}</span>
            </div>
            <div className="facility-price-tag">
                <span className="price-label">월</span>
                <span className="price-value">{facility.price_monthly ? facility.price_monthly.toLocaleString() : '가격문의'}</span>
                <span className="price-unit">원~</span>
            </div>
        </div>
    </div>
);

function Home({ user }) {
    const navigate = useNavigate();
    const [userLocation, setUserLocation] = useState(null);
    const [currentRegion, setCurrentRegion] = useState({ area1: '서울', area2: '', area3: '강남구' });
    const [facilities, setFacilities] = useState([]);
    const [filteredFacilities, setFilteredFacilities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // 1. Get Location & Load Internal Data
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = { lat: position.coords.latitude, lng: position.coords.longitude };
                    setUserLocation(location);
                    loadInternalFacilities();
                },
                () => {
                    const defaultLoc = { lat: 37.4979, lng: 127.0276 }; // Gangnam Station
                    setUserLocation(defaultLoc);
                    loadInternalFacilities();
                }
            );
        } else {
            const defaultLoc = { lat: 37.4979, lng: 127.0276 };
            setUserLocation(defaultLoc);
            loadInternalFacilities();
        }
    }, []);

    const loadInternalFacilities = async () => {
        setIsLoading(true);
        try {
            const response = await facilitiesAPI.getAll();
            if (response.data) {
                setFacilities(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch internal facilities:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Filter facilities based on user preferences
    useEffect(() => {
        if (facilities.length > 0) {
            if (user?.selectedSports && user.selectedSports.length > 0) {
                const filtered = facilities.filter(f =>
                    user.selectedSports.some(sport =>
                        (f.category && f.category.includes(sport)) ||
                        (f.name && f.name.includes(sport)) ||
                        (f.description && f.description.includes(sport))
                    )
                );
                setFilteredFacilities(filtered);
            } else {
                // If no preference, show latest 5
                setFilteredFacilities(facilities.slice(0, 5));
            }
        }
    }, [facilities, user]);

    const handleCategoryClick = (sport) => {
        console.log("Navigating to list for:", sport);
        navigate(`/map?query=${sport}`);
    };

    return (
        <div className="home-page-v2">
            <div className="home-content-container">
                <main className="landing-view">

                    {/* Header Area */}
                    <header className="hero-section">
                        <div className="location-selector" onClick={() => console.log('Change location')}>
                            <span className="location-text">{currentRegion.area3}</span>
                            <span className="material-symbols-outlined icon" style={{ fontSize: '1.2rem', marginLeft: '2px' }}>📍</span>
                        </div>

                        <form className="landing-search-form" onSubmit={(e) => {
                            e.preventDefault();
                            const query = e.target.elements.search.value;
                            navigate(`/map?query=${query}`);
                        }}>
                            <div className="search-input-wrapper">
                                <span className="material-symbols-outlined search-icon">🔍</span>
                                <input
                                    name="search"
                                    type="text"
                                    placeholder="어떤 운동을 찾고 계신가요?"
                                />
                            </div>
                        </form>
                    </header>

                    {/* Category Grid */}
                    <section className="category-section">
                        <div className="category-grid">
                            <CategoryItem icon="⛳" label="골프" onClick={() => handleCategoryClick('골프')} />
                            <CategoryItem icon="🏸" label="배드민턴" onClick={() => handleCategoryClick('배드민턴')} />
                            <CategoryItem icon="🧘‍♀️" label="요가" onClick={() => handleCategoryClick('요가')} />
                            <CategoryItem icon="🏊‍♂️" label="수영" onClick={() => handleCategoryClick('수영')} />
                            <CategoryItem icon="🥊" label="복싱" onClick={() => handleCategoryClick('복싱')} />
                            <CategoryItem icon="🥋" label="주짓수/유도" onClick={() => handleCategoryClick('주짓수')} />
                            <CategoryItem icon="⚽" label="축구/풋살" onClick={() => handleCategoryClick('축구')} />
                            <CategoryItem icon="🎾" label="테니스" onClick={() => handleCategoryClick('테니스')} />
                        </div>
                    </section>

                    <div style={{ padding: '0 20px', margin: '15px 0' }}>
                        <BannerCard
                            title="주변 운동시설 찾기"
                            subtitle="내 주변 등록된 시설을 한 눈에 확인하세요 💡"
                            bgGradient="linear-gradient(135deg, #48bb78 0%, #38b2ac 100%)"
                            linkText="지도 보기"
                            onClick={() => navigate('/map')}
                        />
                    </div>

                    {/* Recommended Facilities Section */}
                    <section className="recommendation-section">
                        <div className="section-header" style={{ padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                                {user?.selectedSports?.length > 0
                                    ? `선호하시는 '${user.selectedSports[0]}' 시설 🌟`
                                    : '추천 운동시설 ⭐'}
                            </h3>
                            <button className="text-btn" onClick={() => navigate('/map')} style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                전체보기
                            </button>
                        </div>

                        <div className="facility-list-horizontal">
                            {isLoading ? (
                                <div className="loading-placeholder" style={{ padding: '40px', textAlign: 'center' }}>데이터를 불러오는 중...</div>
                            ) : filteredFacilities.length > 0 ? (
                                filteredFacilities.map(facility => (
                                    <FacilityCard
                                        key={facility._id}
                                        facility={facility}
                                        onClick={() => navigate(`/map?query=${facility.name}`)}
                                    />
                                ))
                            ) : (
                                <div className="empty-placeholder" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    주변에 추천할 만한 시설이 아직 없어요.
                                </div>
                            )}
                        </div>
                    </section>


                </main>
            </div>

        </div>
    );
}

export default Home;
