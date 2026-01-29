import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import koKR from 'antd/locale/ko_KR';
import FacilityManager from '@/pages/FacilityManager';
import './index.css';

const App: React.FC = () => {
    return (
        <ConfigProvider
            locale={koKR}
            theme={{
                token: {
                    colorPrimary: '#667eea',
                    borderRadius: 8,
                    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                },
            }}
        >
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/facilities" replace />} />
                    <Route path="/facilities" element={<FacilityManager />} />
                </Routes>
            </BrowserRouter>
        </ConfigProvider>
    );
};

export default App;
