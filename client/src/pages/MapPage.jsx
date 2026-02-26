import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { facilitiesAPI } from '../utils/api';
import './MapPage.css';

function MapPage({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const mapRef = useRef(null);
    const naverMapRef = useRef(null);
    const markersRef = useRef([]);
    const [userLocation, setUserLocation] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [facilities, setFacilities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // 1. Initial location setup
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                    setUserLocation(loc);
                    initMap(loc);
                },
                () => {
                    const defaultLoc = { lat: 37.4979, lng: 127.0276 };
                    setUserLocation(defaultLoc);
                    initMap(defaultLoc);
                }
            );
        } else {
            const defaultLoc = { lat: 37.4979, lng: 127.0276 };
            setUserLocation(defaultLoc);
            initMap(defaultLoc);
        }
    }, []);

    // 2. Query synchronization
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const query = params.get('query');

        if (query) {
            setSearchQuery(query);
        } else if (user?.selectedSports && user.selectedSports.length > 0) {
            // Use the first preferred sport (e.g., '유도')
            setSearchQuery(user.selectedSports[0]);
        } else {
            setSearchQuery('');
        }
    }, [user, location.search]);

    // 3. Data loading trigger
    useEffect(() => {
        if (mapLoaded) {
            loadInternalFacilities();
        }
    }, [mapLoaded, searchQuery]);

    const initMap = (center) => {
        const loadNaverScript = () => {
            return new Promise((resolve, reject) => {
                if (window.naver && window.naver.maps) {
                    resolve(window.naver.maps);
                    return;
                }

                // Try to get from env, fallback to the one in local .env
                const clientId = import.meta.env.VITE_NAVER_CLIENT_ID || '8exFo5vqukHyWhMjNTUc';
                console.log("Initializing Naver Maps with Client ID:", clientId);

                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
                script.async = true;
                script.onerror = () => reject(new Error("Failed to load Naver Maps script"));
                script.onload = () => {
                    if (window.naver && window.naver.maps) {
                        window.naver.maps.onJSContentLoaded = () => resolve(window.naver.maps);
                        setTimeout(() => resolve(window.naver.maps), 500);
                    } else {
                        reject(new Error("Naver Maps object not found after script load"));
                    }
                };
                document.head.appendChild(script);
            });
        };

        loadNaverScript()
            .then(() => {
                const mapOptions = {
                    center: new window.naver.maps.LatLng(center.lat, center.lng),
                    zoom: 14,
                    zoomControl: true
                };
                const map = new window.naver.maps.Map(mapRef.current, mapOptions);
                naverMapRef.current = map;
                setMapLoaded(true);
            })
            .catch(err => {
                console.error("Map initialization failed:", err);
            });
    };

    const loadInternalFacilities = async () => {
        setIsLoading(true);
        try {
            console.log("Fetching facilities from:", facilitiesAPI.getAll);
            const response = await facilitiesAPI.getAll();
            if (response.data) {
                console.log(`Successfully fetched ${response.data.length} facilities`);
                let filteredData = response.data;

                // Use the latest searchQuery state
                if (searchQuery) {
                    const lowerQuery = searchQuery.toLowerCase();
                    filteredData = response.data.filter(f =>
                        (f.name && f.name.toLowerCase().includes(lowerQuery)) ||
                        (f.category && f.category.toLowerCase().includes(lowerQuery)) ||
                        (f.address && f.address.toLowerCase().includes(lowerQuery))
                    );
                }

                setFacilities(filteredData);
                updateMarkers(filteredData);
            } else {
                console.warn("No data received from facilities API");
            }
        } catch (error) {
            console.error("Failed to load facilities:", error);
            // More detailed error logging for debugging
            if (error.response) {
                console.error("Response data:", error.response.data);
                console.error("Response status:", error.response.status);
            } else if (error.request) {
                console.error("No response received from server. Is the backend running?");
            } else {
                console.error("Error setting up request:", error.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const updateMarkers = (data) => {
        if (!naverMapRef.current) return;

        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        const bounds = new window.naver.maps.LatLngBounds();
        let geocodeCount = 0;

        data.forEach(facility => {
            window.naver.maps.Service.geocode({ query: facility.address }, (status, response) => {
                if (status === window.naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
                    const addr = response.v2.addresses[0];
                    const pos = new window.naver.maps.LatLng(addr.y, addr.x);

                    const marker = new window.naver.maps.Marker({
                        position: pos,
                        map: naverMapRef.current,
                        title: facility.name
                    });

                    // Add info window
                    const infoWindow = new window.naver.maps.InfoWindow({
                        content: `
                            <div style="padding: 10px; min-width: 150px;">
                                <h4 style="margin: 0 0 5px 0;">${facility.name}</h4>
                                <p style="margin: 0; font-size: 0.85rem; color: #666;">${facility.category}</p>
                                <p style="margin: 5px 0 0 0; font-size: 0.9rem; font-weight: bold; color: var(--primary);">
                                    월 ${facility.price_monthly ? facility.price_monthly.toLocaleString() : '가격문의'}원
                                </p>
                            </div>
                        `
                    });

                    window.naver.maps.Event.addListener(marker, 'click', () => {
                        infoWindow.open(naverMapRef.current, marker);
                    });

                    markersRef.current.push(marker);
                    bounds.extend(pos);
                    geocodeCount++;

                    if (geocodeCount === data.length) {
                        naverMapRef.current.fitBounds(bounds, { top: 50, right: 20, bottom: 20, left: 20 });
                    }
                }
            });
        });
    };

    return (
        <div className="map-page">
            <header className="map-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="search-bar-container">
                    <span className="material-symbols-outlined search-icon">search</span>
                    <input
                        type="text"
                        placeholder="시설 이름이나 지역 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </header>

            <div ref={mapRef} className="map-container">
                {!mapLoaded && <div className="map-loading-overlay">지도를 불러오는 중...</div>}
            </div>

            <button
                className="current-loc-btn"
                onClick={() => {
                    if (userLocation && naverMapRef.current) {
                        naverMapRef.current.panTo(new window.naver.maps.LatLng(userLocation.lat, userLocation.lng));
                    }
                }}
            >
                <span className="material-symbols-outlined">my_location</span>
            </button>
        </div>
    );
}

export default MapPage;
