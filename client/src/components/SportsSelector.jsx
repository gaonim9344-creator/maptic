import React, { useState } from 'react';
import { SPORTS_LIST } from '../utils/sportsData';
import './SportsSelector.css';

function SportsSelector({ selectedSports, onChange, showSearch = true }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSports = searchTerm
        ? SPORTS_LIST.filter(sport =>
            sport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sport.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : SPORTS_LIST;

    const handleToggle = (sportName) => {
        const newSelected = selectedSports.includes(sportName)
            ? selectedSports.filter(s => s !== sportName)
            : [...selectedSports, sportName];
        onChange(newSelected);
    };

    const handleSelectAll = () => {
        onChange(filteredSports.map(s => s.name));
    };

    const handleClearAll = () => {
        onChange([]);
    };

    return (
        <div className="sports-selector">
            {showSearch && (
                <div className="selector-header">
                    <input
                        type="text"
                        id="sports-search"
                        name="searchTerm"
                        className="search-input"
                        placeholder="스포츠 검색... (예: 축구, soccer)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="selector-actions flex gap-sm mt-md">
                        <button onClick={handleSelectAll} className="btn btn-secondary btn-sm">
                            전체 선택
                        </button>
                        <button onClick={handleClearAll} className="btn btn-ghost btn-sm">
                            선택 해제
                        </button>
                        <span className="selected-count">
                            선택됨: <strong>{selectedSports.length}</strong>개
                        </span>
                    </div>
                </div>
            )}

            <div className="sports-grid">
                {filteredSports.map((sport) => {
                    const isSelected = selectedSports.includes(sport.name);
                    return (
                        <label
                            key={sport.id}
                            className={`sport-item ${isSelected ? 'selected' : ''}`}
                        >
                            <input
                                type="checkbox"
                                id={`sport-${sport.id}`}
                                name={`sport-${sport.id}`}
                                checked={isSelected}
                                onChange={() => handleToggle(sport.name)}
                            />
                            <span className="sport-name">{sport.name}</span>
                        </label>
                    );
                })}
            </div>

            {filteredSports.length === 0 && (
                <div className="no-results text-center p-xl">
                    <p className="text-muted">검색 결과가 없습니다.</p>
                </div>
            )}
        </div>
    );
}

export default SportsSelector;
