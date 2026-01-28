import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { facilityAPI } from '../utils/api';
import { SPORTS_LIST } from '../utils/sportsData';
import './FacilityForm.css';

function FacilityForm({ user }) {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        name: '',
        category: '헬스',
        address: '',
        price_daily: '',
        price_monthly: '',
        price_yearly: '',
        description: '',
        features: [],
        images: []
    });

    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(isEdit);

    const availableFeatures = ['샤워실', '주차', '운동복'];

    useEffect(() => {
        if (!user) {
            navigate('/signin');
            return;
        }

        if (isEdit) {
            fetchFacility();
        }
    }, [user, id]);

    const fetchFacility = async () => {
        try {
            const response = await facilityAPI.getOne(id);
            const data = response.data;
            setFormData({
                name: data.name,
                category: data.category,
                address: data.address,
                price_daily: data.price_daily,
                price_monthly: data.price_monthly,
                price_yearly: data.price_yearly,
                description: data.description,
                features: data.features || [],
                images: data.images || []
            });
        } catch (error) {
            alert('시설 정보를 불러오는데 실패했습니다.');
            navigate('/partner/dashboard');
        } finally {
            setInitializing(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFeatureToggle = (feature) => {
        setFormData(prev => {
            const features = prev.features.includes(feature)
                ? prev.features.filter(f => f !== feature)
                : [...prev.features, feature];
            return { ...prev, features };
        });
    };

    // Simple image handling: User enters URL for now (MVP)
    const handleAddImage = () => {
        const url = prompt('이미지 URL을 입력하세요 (예: https://example.com/image.jpg)');
        if (url) {
            const newImage = {
                uid: Date.now().toString(),
                name: 'image-' + Date.now(),
                url: url
            };
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, newImage]
            }));
        }
    };

    const handleRemoveImage = (uid) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter(img => img.uid !== uid)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEdit) {
                await facilityAPI.update(id, formData);
                alert('수정되었습니다.');
            } else {
                await facilityAPI.create(formData);
                alert('등록되었습니다.');
            }
            navigate('/partner/dashboard');
        } catch (error) {
            console.error('Submit error:', error);
            const msg = error.response?.data?.error || '저장에 실패했습니다.';
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    if (initializing) return <div className="partner-loading"><div className="spinner"></div></div>;

    return (
        <div className="form-container">
            <h2 className="form-title">{isEdit ? '시설 수정' : '새 시설 등록'}</h2>

            <form onSubmit={handleSubmit} className="facility-form">
                <div className="form-group">
                    <label>시설명</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="예: 강남 스파르타 짐"
                    />
                </div>

                <div className="form-group">
                    <label>카테고리</label>
                    <select name="category" value={formData.category} onChange={handleChange} required>
                        {SPORTS_LIST.map(sport => (
                            <option key={sport.name} value={sport.name}>{sport.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>주소</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        placeholder="도로명 주소를 입력해주세요 (예: 서울특별시 강남구 테헤란로 123)"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>일일권 가격 (원)</label>
                        <input
                            type="number"
                            name="price_daily"
                            value={formData.price_daily}
                            onChange={handleChange}
                            required
                            min="0"
                        />
                    </div>
                    <div className="form-group">
                        <label>1개월 가격 (원)</label>
                        <input
                            type="number"
                            name="price_monthly"
                            value={formData.price_monthly}
                            onChange={handleChange}
                            required
                            min="0"
                        />
                    </div>
                    <div className="form-group">
                        <label>1년 가격 (원)</label>
                        <input
                            type="number"
                            name="price_yearly"
                            value={formData.price_yearly}
                            onChange={handleChange}
                            required
                            min="0"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>시설 소개</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows="5"
                        placeholder="시설에 대한 자세한 설명을 적어주세요."
                    ></textarea>
                </div>

                <div className="form-group">
                    <label>편의 시설</label>
                    <div className="features-checkbox-group">
                        {availableFeatures.map(feature => (
                            <label key={feature} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.features.includes(feature)}
                                    onChange={() => handleFeatureToggle(feature)}
                                />
                                {feature}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>이미지</label>
                    <div className="image-preview-list">
                        {formData.images.map(img => (
                            <div key={img.uid} className="image-preview-item">
                                <img src={img.url} alt="preview" />
                                <button type="button" onClick={() => handleRemoveImage(img.uid)}>X</button>
                            </div>
                        ))}
                        <button type="button" className="add-image-btn" onClick={handleAddImage}>
                            + 이미지 URL 추가
                        </button>
                    </div>
                    <p className="help-text">* 현재는 이미지 URL 입력만 지원합니다 (추후 파일 업로드 지원 예정)</p>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => navigate('/partner/dashboard')}>취소</button>
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? '저장 중...' : (isEdit ? '수정하기' : '등록하기')}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default FacilityForm;
