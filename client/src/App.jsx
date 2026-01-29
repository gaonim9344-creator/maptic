import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authAPI } from './utils/api';

// Pages
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';

// Partner Pages
import PartnerHome from './pages/PartnerHome';
import FacilityDashboard from './pages/FacilityDashboard';
import FacilityForm from './pages/FacilityForm';
import FacilityDetail from './pages/FacilityDetail';

// Components
import NavBar from './components/NavBar';

// Styles
import './styles/index.css';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await authAPI.getMe();
                setUser(response.data.user);
            } catch (error) {
                console.error('Auth check failed:', error);
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    };

    const handleLogin = (userData, token) => {
        localStorage.setItem('token', token);
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ height: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="app">
                <NavBar user={user} onLogout={handleLogout} />
                <Routes>
                    <Route path="/" element={<Home user={user} />} />
                    <Route
                        path="/onboarding"
                        element={
                            user ? <Onboarding user={user} setUser={setUser} /> : <Navigate to="/signin" />
                        }
                    />
                    <Route
                        path="/signin"
                        element={
                            !user ? <SignIn onLogin={handleLogin} /> : <Navigate to="/" />
                        }
                    />
                    <Route
                        path="/signup"
                        element={
                            !user ? <SignUp onLogin={handleLogin} /> : <Navigate to="/" />
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            user ? <Profile user={user} setUser={setUser} onLogout={handleLogout} /> : <Navigate to="/signin" />
                        }
                    />

                    {/* Partner Routes */}
                    <Route path="/partner" element={<PartnerHome user={user} />} />
                    <Route
                        path="/partner/dashboard"
                        element={user ? <FacilityDashboard user={user} /> : <Navigate to="/signin" />}
                    />
                    <Route
                        path="/partner/new"
                        element={user ? <FacilityForm user={user} /> : <Navigate to="/signin" />}
                    />
                    <Route
                        path="/partner/edit/:id"
                        element={user ? <FacilityForm user={user} /> : <Navigate to="/signin" />}
                    />
                    <Route path="/facility/:id" element={<FacilityDetail />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
