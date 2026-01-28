import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { facilityAPI } from '../utils/api';
import './FacilityDashboard.css';

function FacilityDashboard({ user }) {
    const navigate = useNavigate();
    const [facilities, setFacilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/signin');
            return;
        }
        fetchMyFacilities();
    }, [user, navigate]);

    const fetchMyFacilities = async () => {
        try {
            const response = await facilityAPI.getMy();
            setFacilities(response.data);
        } catch (err) {
            console.error('Failed to fetch facilities', err);
            setError('시설 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('정말로 이 시설을 삭제하시겠습니까?')) return;
        try {
            await facilityAPI.delete(id);
            setFacilities(facilities.filter(f => f.id !== id));
        } catch (err) {
            alert('삭제 실패: ' + (err.response?.data?.error || err.message));
        }
    };

    if (loading) return <div className="partner-loading"><div className="spinner"></div></div>;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>내 시설 관리</h2>
                <button
                    className="btn btn-primary add-btn"
                    onClick={() => navigate('/partner/new')}
                >
                    + 새 시설 등록
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {facilities.length === 0 ? (
                <div className="empty-state">
                    <p>등록된 시설이 없습니다.</p>
                    <p>새로운 시설을 등록하여 홍보를 시작해보세요!</p>
                </div>
            ) : (
                <div className="facility-grid">
                    {facilities.map(facility => (
                        <div key={facility.id} className="facility-card">
                            <div className="facility-image-preview">
                                {facility.images && facility.images.length > 0 ? (
                                    <img src={facility.images[0].url} alt={facility.name} />
                                ) : (
                                    <div className="no-image-placeholder">{facility.category}</div>
                                )}
                            </div>
                            <div className="facility-info">
                                <h3>{facility.name}</h3>
                                <p className="facility-address">{facility.address}</p>
                                <span className="facility-category">{facility.category}</span>
                                <div className="facility-actions">
                                    <button
                                        className="btn-edit"
                                        onClick={() => navigate(`/partner/edit/${facility.id}`)}
                                    >
                                        수정
                                    </button>
                                    <button
                                        className="btn-delete"
                                        onClick={() => handleDelete(facility.id)}
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default FacilityDashboard;
