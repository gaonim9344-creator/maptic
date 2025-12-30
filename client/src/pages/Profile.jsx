import React, { useState } from 'react';
import { preferencesAPI } from '../utils/api';
import SportsSelector from '../components/SportsSelector';
import './Profile.css';

function Profile({ user, setUser, onLogout }) {
    const [selectedSports, setSelectedSports] = useState(user?.selectedSports || []);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSave = async () => {
        if (selectedSports.length === 0) {
            setError('최소 1개 이상의 스포츠를 선택해주세요');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await preferencesAPI.update(selectedSports);
            setUser({ ...user, selectedSports });
            setIsEditing(false);
            setSuccess('스포츠 선호도가 업데이트되었습니다!');
        } catch (err) {
            setError(err.response?.data?.error || '저장에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setSelectedSports(user?.selectedSports || []);
        setIsEditing(false);
        setError('');
        setSuccess('');
    };

    return (
        <div className="profile-page">
            <div className="container">
                <div className="profile-container fade-in">
                    <div className="profile-header">
                        <h1 className="profile-title">프로필</h1>
                        <p className="profile-subtitle">계정 정보 및 스포츠 선호도 관리</p>
                    </div>

                    <div className="profile-card card">
                        <h3>계정 정보</h3>
                        <div className="profile-info">
                            <div className="info-row">
                                <span className="info-label">이메일</span>
                                <span className="info-value">{user?.email}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-card card">
                        <div className="card-header flex justify-between items-center">
                            <h3>선호하는 스포츠</h3>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn btn-secondary"
                                >
                                    재설정
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="error-message mt-md">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="success-message mt-md">
                                {success}
                            </div>
                        )}

                        {isEditing ? (
                            <div className="sports-edit-container mt-lg">
                                <SportsSelector
                                    selectedSports={selectedSports}
                                    onChange={setSelectedSports}
                                    showSearch={true}
                                />
                                <div className="edit-actions flex gap-md mt-lg">
                                    <button
                                        onClick={handleSave}
                                        className="btn btn-primary"
                                        disabled={loading || selectedSports.length === 0}
                                    >
                                        {loading ? '저장 중...' : '저장'}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="btn btn-ghost"
                                        disabled={loading}
                                    >
                                        취소
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="sports-display mt-lg">
                                {user?.selectedSports && user.selectedSports.length > 0 ? (
                                    <div className="sports-tags">
                                        {user.selectedSports.map((sport, index) => (
                                            <span key={index} className="sport-tag">
                                                {sport}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted">선택된 스포츠가 없습니다</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="profile-actions">
                        <button onClick={onLogout} className="btn btn-ghost btn-danger">
                            로그아웃
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
