import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { preferencesAPI } from '../utils/api';
import SportsSelector from '../components/SportsSelector';
import './Onboarding.css';

function Onboarding({ user, setUser }) {
    const [selectedSports, setSelectedSports] = useState(user?.selectedSports || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSave = async () => {
        if (selectedSports.length === 0) {
            setError('최소 1개 이상의 스포츠를 선택해주세요');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await preferencesAPI.update(selectedSports);
            setUser({ ...user, selectedSports });
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || '저장에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-page">
            <div className="container">
                <div className="onboarding-container fade-in">
                    <div className="onboarding-header text-center">
                        <h1 className="onboarding-title">좋아하는 스포츠를 선택하세요</h1>
                        <p className="onboarding-subtitle">
                            선택하신 스포츠를 기반으로 주변 시설을 추천해드립니다
                        </p>
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="sports-selection-container">
                        <SportsSelector
                            selectedSports={selectedSports}
                            onChange={setSelectedSports}
                            showSearch={true}
                        />
                    </div>

                    <div className="onboarding-footer">
                        <button
                            onClick={handleSave}
                            className="btn btn-primary btn-lg"
                            disabled={loading || selectedSports.length === 0}
                        >
                            {loading ? '저장 중...' : `선택 완료 (${selectedSports.length}개)`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Onboarding;
