import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { facilitiesAPI } from '../utils/api';
import backArrow from '../assets/back-arrow.png';
import './FacilityList.css';

const FilterChip = ({ label, active, onClick }) => (
    <div className={`filter-chip ${active ? 'active' : ''}`} onClick={onClick}>
        {label}
    </div>
);

const FacilityListItem = ({ facility, onClick }) => (
    <div className="list-item-card" onClick={onClick}>
        <div className="item-image-wrapper">
            {facility.images && facility.images.length > 0 ? (
                <img src={facility.images[0]} alt={facility.name} />
            ) : (
                <div className="item-image-placeholder">
                    <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#adb5bd' }}>&#xeb43;</span>
                </div>
            )}
            <div className="item-badge">{facility.category}</div>
        </div>
        <div className="item-content">
            <div className="item-header">
                <h3 className="item-name">{facility.name}</h3>
                <div className="item-rating">
                    <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: '#ffc107' }}>&#xe838;</span>
                    <span className="score">4.9</span>
                    <span className="review-count">(120+)</span>
                </div>
            </div>
            <p className="item-address">
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', verticalAlign: 'middle', marginRight: '2px' }}>&#xe55f;</span>
                {facility.address}
            </p>
            <div className="item-tags">
                {(facility.features || []).slice(0, 3).map((f, i) => (
                    <span key={i} className="tag">#{f}</span>
                ))}
            </div>
            <div className="item-footer">
                <div className="item-price">
                    <span className="price-label">월 최저</span>
                    <span className="price-value">{facility.price_monthly ? facility.price_monthly.toLocaleString() : '가격문의'}</span>
                    <span className="price-unit">원~</span>
                </div>
                <div className="item-distance">800m</div>
            </div>
        </div>
    </div>
);

function FacilityList({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [facilities, setFacilities] = useState([]);
    const [filteredFacilities, setFilteredFacilities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('전체');

    const categories = ['전체', '유도', '주짓수', '헬스', '복싱', '필라테스', '요가', '크로스핏'];

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const query = params.get('query');
        const category = params.get('category');

        if (query) setSearchQuery(query);
        if (category) setActiveCategory(category);

        loadFacilities();
    }, [location.search]);

    const loadFacilities = async () => {
        setIsLoading(true);
        try {
            const response = await facilitiesAPI.getAll();
            if (response.data) {
                setFacilities(response.data);
            }
        } catch (error) {
            console.error("Failed to load facilities:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let filtered = [...facilities];

        if (activeCategory !== '전체') {
            filtered = filtered.filter(f => f.category === activeCategory);
        }

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(f =>
                f.name.toLowerCase().includes(lowerQuery) ||
                f.address.toLowerCase().includes(lowerQuery) ||
                f.category.toLowerCase().includes(lowerQuery)
            );
        }

        setFilteredFacilities(filtered);
    }, [facilities, activeCategory, searchQuery]);

    return (
        <div className="facility-list-page">
            <header className="list-header sticky-header">
                <div className="header-top">
                    <button className="back-btn-img" onClick={() => navigate('/')}>
                        <img src={backArrow} alt="뒤로가기" />
                    </button>
                    <div className="search-box">
                        <span className="material-symbols-outlined search-icon" style={{ fontSize: '1.2rem', color: '#adb5bd' }}>&#xe8b6;</span>
                        <input
                            type="text"
                            placeholder="시설 이름이나 지역 검색"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="category-scroll">
                    {categories.map(cat => (
                        <FilterChip
                            key={cat}
                            label={cat}
                            active={activeCategory === cat}
                            onClick={() => setActiveCategory(cat)}
                        />
                    ))}
                </div>
            </header>

            <div className="list-content">
                <div className="list-toolbar">
                    <span className="total-count">총 <strong>{filteredFacilities.length}</strong>곳</span>
                    <div className="sort-options">
                        <span>추천순</span>
                        <span className="arrow-down">▼</span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>시설 정보를 불러오는 중...</p>
                    </div>
                ) : filteredFacilities.length > 0 ? (
                    <div className="items-container">
                        {filteredFacilities.map(f => (
                            <FacilityListItem
                                key={f._id}
                                facility={f}
                                onClick={() => navigate(`/facility/${f._id}`)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#dee2e6', marginBottom: '16px' }}>&#xe92d;</div>
                        <p>검색 결과가 없습니다.</p>
                        <p className="sub-text">다른 검색어 또는 카테고리를 선택해 보세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FacilityList;
