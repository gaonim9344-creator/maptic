import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getSportEmoji, SPORTS_LIST } from '../utils/sportsData';
import { searchAPI } from '../utils/api';
import './Home.css';

// Haversine formula to calculate distance between two points
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

function Home({ user }) {
    const mapRef = useRef(null);
    const naverMapRef = useRef(null);
    const markersRef = useRef([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [currentRegion, setCurrentRegion] = useState({ area1: '서울', area2: '', area3: '' }); // Default to Seoul
    const [isSearching, setIsSearching] = useState(false);
    const [lastSearchCenter, setLastSearchCenter] = useState(null);
    const [searchDistance, setSearchDistance] = useState(3); // Default to 3km
    const currentInfoWindowRef = useRef(null); // Track currently open InfoWindow
    const userMarkerRef = useRef(null); // Track user marker for easy updates
    const searchDebounceRef = useRef(null);

    useEffect(() => {
        const loadNaverScript = () => {
            return new Promise((resolve, reject) => {
                if (window.naver && window.naver.maps) {
                    resolve(window.naver.maps);
                    return;
                }

                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=qk5p9qijo2&submodules=geocoder`;
                script.async = true;
                script.onload = () => {
                    // Wait for the geocoder submodule if requested via submodules param
                    window.naver.maps.onJSContentLoaded = () => resolve(window.naver.maps);
                    // Fallback if the event doesn't fire or for different versions
                    setTimeout(() => resolve(window.naver.maps), 500);
                };
                script.onerror = (err) => reject(new Error('네이버 지도 스크립트 로드 실패'));
                document.head.appendChild(script);
            });
        };

        const init = async () => {
            try {
                // 1. Load Script
                await loadNaverScript();

                // 2. Get Location
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const location = { lat: position.coords.latitude, lng: position.coords.longitude };
                            setUserLocation(location);
                            initializeMap(location);
                        },
                        () => {
                            const defaultLoc = { lat: 37.5665, lng: 126.9780 };
                            setUserLocation(defaultLoc);
                            initializeMap(defaultLoc);
                        }
                    );
                } else {
                    const defaultLoc = { lat: 37.5665, lng: 126.9780 };
                    setUserLocation(defaultLoc);
                    initializeMap(defaultLoc);
                }
            } catch (error) {
                console.error('Initialization error:', error);
                setSearchError('지도를 불러오는데 실패했습니다. 네트워크 상태를 확인해주세요.');
            }
        };

        init();

        return () => {
            markersRef.current.forEach(marker => marker.setMap(null));
        };
    }, []);

    // Get current region name for better search results
    useEffect(() => {
        if (userLocation && window.naver?.maps?.Service) {
            window.naver.maps.Service.reverseGeocode({
                coords: new window.naver.maps.LatLng(userLocation.lat, userLocation.lng),
            }, (status, response) => {
                if (status === window.naver.maps.Service.Status.OK) {
                    const items = response.v2.results;
                    if (items.length > 0) {
                        const region = items[0].region;
                        // Use a more specific region if available (city + district)
                        setCurrentRegion({
                            area1: region.area1.name,
                            area2: region.area2.name,
                            area3: region.area3.name
                        });
                    }
                }
            });
        }
    }, [userLocation]);

    const initializeMap = (location) => {
        const mapOptions = {
            center: new window.naver.maps.LatLng(location.lat, location.lng),
            zoom: 14, // Slightly closer than example but standard for facilities
            zoomControl: true
        };

        const map = new window.naver.maps.Map(mapRef.current, mapOptions);
        naverMapRef.current = map;

        // Close InfoWindow when clicking on the map
        window.naver.maps.Event.addListener(map, 'click', () => {
            if (currentInfoWindowRef.current) {
                currentInfoWindowRef.current.close();
                currentInfoWindowRef.current = null;
            }
        });

        // Add Naver-style user location marker
        const userMarker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(location.lat, location.lng),
            map: map,
            title: '현재 위치',
            icon: {
                content: `
                    <div class="naver-location-marker">
                        <div class="naver-location-dot"></div>
                        <div class="naver-location-pulse"></div>
                    </div>
                `,
                anchor: new window.naver.maps.Point(11, 11)
            }
        });
        userMarkerRef.current = userMarker;

        setMapLoaded(true);

        // Add 'idle' event listener for auto-refresh on move
        window.naver.maps.Event.addListener(map, 'idle', () => {
            handleMapIdle(map);
        });
    };

    // Handle map idle to trigger auto-refresh
    const handleMapIdle = (map) => {
        if (!map || !mapLoaded) return;

        const center = map.getCenter();
        const currentCenter = { lat: center.lat(), lng: center.lng() };

        // If it's the first time or we've moved significantly (> 1.5km), refresh
        if (!lastSearchCenter) {
            setLastSearchCenter(currentCenter);
            return; // Don't trigger on initial load as it's handled by useEffect
        }

        const distance = getDistanceFromLatLonInKm(
            lastSearchCenter.lat, lastSearchCenter.lng,
            currentCenter.lat, currentCenter.lng
        );

        if (distance > 1.5) {
            console.log(`🗺️ Map moved ${distance.toFixed(2)}km. Triggering auto-refresh.`);

            // Debounce the search to prevent API flooding
            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
            searchDebounceRef.current = setTimeout(() => {
                setLastSearchCenter(currentCenter);
                loadFacilities(currentCenter, user?.selectedSports, false); // false means 'don't fit bounds'
            }, 1000);
        }
    };

    // Re-load facilities when user profile interests change (but not on region update to avoid excessive API calls)
    useEffect(() => {
        if (mapLoaded && userLocation) {
            console.log('🔄 Reloading facilities due to dependency change');
            loadFacilities(userLocation, user?.selectedSports);
        }
    }, [user?.selectedSports, mapLoaded, userLocation]);

    // Helper to get region from coordinates
    const getRegionFromCoords = (lat, lng) => {
        return new Promise((resolve) => {
            window.naver.maps.Service.reverseGeocode({
                coords: new window.naver.maps.LatLng(lat, lng),
            }, (status, response) => {
                if (status === window.naver.maps.Service.Status.OK && response.v2.results.length > 0) {
                    const region = response.v2.results[0].region;
                    resolve({
                        area1: region.area1.name,
                        area2: region.area2.name,
                        area3: region.area3.name
                    });
                } else {
                    resolve(null);
                }
            });
        });
    };

    // Load facilities based on user preferences or search
    // overrideDistance allows direct distance passing (useful when state hasn't updated yet)
    const loadFacilities = async (center, selectedSports = null, shouldFitBounds = true, overrideDistance = null) => {
        const effectiveDistance = overrideDistance !== null ? overrideDistance : searchDistance;
        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        setIsSearching(true);
        setSearchError(null);

        if (!selectedSports || selectedSports.length === 0) {
            // Default to popular sports for better initial results
            selectedSports = ['축구', '농구', '수영', '헬스', '요가', '필라테스', '태권도', '유도'];
        }

        console.log('🔍 Deep Scanning started with sports:', selectedSports);
        console.log('📍 Search location:', center);

        // Notify user of deep scan
        setSearchError(`🔍 꼼꼼히 검색 중... (반경 ${effectiveDistance}km 내 모든 동 조회)`);


        // Helper to expand keyword into instructional/educational search terms
        const getExpandedKeywords = (sport) => {
            const s = sport.replace(/장$/g, '').replace(/교실$/g, '').trim();
            // Instructional keywords take priority to find learning facilities
            const learningKeywords = [`${s}교실`, `${s}아카데미`, `${s}클럽`, `${s}학원`, `${s}학교`];
            const baseKeywords = [s, `${s}센터`, `${s}체육관`];

            if (s === '유도') return [`${s}관`, `${s}도장`, `${s}교실`, `${s}아카데미`, `${s}클럽`, '대한유도', '유도장'].filter(Boolean);
            if (s === '태권도') return [`${s}도장`, `${s}관`, `${s}교실`, `${s}아카데미`, `${s}클럽`].filter(Boolean);
            if (s === '복싱') return ['복싱짐', '권투', ...learningKeywords].filter(Boolean);
            if (s === '헬스') return ['피트니스', '휘트니스', ...baseKeywords, 'gx'].filter(Boolean);
            if (s === '수영') return ['수영장', '강습', ...learningKeywords].filter(Boolean);

            return [...learningKeywords, ...baseKeywords].filter(Boolean);
        };

        try {
            // 1. Generate Dense Grid to Capture All Administrative Areas (Dongs)
            // Use 300m interval to ensure we don't skip any small Dong
            const checkPoints = [];
            const searchBuffer = effectiveDistance * 1.1; // 10% buffer
            const gridIntervalKm = 0.3; // 300m
            const radiusDeg = searchBuffer * 0.009;
            const steps = Math.ceil(searchBuffer / gridIntervalKm);

            const stepLat = gridIntervalKm * 0.009;
            const stepLng = gridIntervalKm * 0.009 * 1.2;

            for (let i = -steps; i <= steps; i++) {
                for (let j = -steps; j <= steps; j++) {
                    const lat = center.lat + (i * stepLat);
                    const lng = center.lng + (j * stepLng);

                    // Check if point is roughly within circular radius
                    if (getDistanceFromLatLonInKm(center.lat, center.lng, lat, lng) <= searchBuffer) {
                        checkPoints.push({ lat, lng });
                    }
                }
            }

            console.log(`📡 Analyzing ${checkPoints.length} grid points for administrative areas...`);

            // 2. Reverse Geocode Limit Processing (Batching to avoid browser freeze)
            // Naver JS Geocoder is client-side but still good to batch
            const uniqueRegions = new Map();
            const processBatchSize = 20;

            for (let i = 0; i < checkPoints.length; i += processBatchSize) {
                const batch = checkPoints.slice(i, i + processBatchSize);
                await Promise.all(batch.map(async (point) => {
                    const region = await getRegionFromCoords(point.lat, point.lng);
                    if (region && region.area3) {
                        // Key: "Seoul Gangnam-gu Yeoksam-dong"
                        const key = `${region.area1} ${region.area2} ${region.area3}`;
                        uniqueRegions.set(key, region);
                    }
                }));
            }

            const targetAreas = Array.from(uniqueRegions.values());
            console.log(`🎯 Found ${targetAreas.length} target administrative areas (Dongs):`, targetAreas.map(r => r.area3));
            setSearchError(`📍 ${targetAreas.length}개 동을 발견했습니다. 정밀 검색을 시작합니다...`);


            // 3. Build Detailed Queries: "Area + Sport"
            const finalQueries = [];

            // Add direct user query if exists
            if (searchQuery && searchQuery.length >= 2) {
                finalQueries.push({ query: searchQuery, sport: '검색' });
            }

            for (const sport of selectedSports) {
                const keywords = getExpandedKeywords(sport);

                for (const area of targetAreas) {
                    // Create specific location-based queries
                    // e.g. "서울시 강남구 역삼동 유도"
                    // Also add simpler one: "역삼동 유도" (Naver handles local context well usually, but full string is safer)

                    // We pick just ONE best query per Dong/Sport combo to avoid explosion, 
                    // relying on the specific keyword suffixes to match titles.
                    // Actually, "Yeoksam-dong Judo" covers most. 

                    // Use the most common suffix for the query itself
                    const suffix = keywords[0] || sport;
                    finalQueries.push({
                        // Query: "Yeoksam-dong Judo" - very specific
                        query: `${area.area3} ${sport}`,
                        sport: sport,
                        area: area.area3
                    });
                    // Backup: "Gangnam-gu Judo" (for border areas, but we have dense grid so maybe overkill? Let's stick to Dong for precision)
                }
            }

            console.log(`🚀 Executing ${finalQueries.length} deep search queries...`);

            // 4. Execution with rate limiting
            const allResults = [];
            const queryBatchSize = 3; // Conservative batch size for API
            let completedQueries = 0;

            for (let i = 0; i < finalQueries.length; i += queryBatchSize) {
                const batch = finalQueries.slice(i, i + queryBatchSize);

                // Update progress UI every few batches
                if (i % 6 === 0) {
                    const progress = Math.round((completedQueries / finalQueries.length) * 100);
                    const processingArea = batch[0]?.area || '주변';
                    setSearchError(`🔎 ${processingArea} 등 검색 중... (${progress}%)`);
                }

                await Promise.all(batch.map(async (task) => {
                    try {
                        const response = await searchAPI.searchLocal(task.query, center.lat, center.lng, 5); // display 5
                        const items = response.data.items || [];
                        allResults.push(...items.map(item => ({ ...item, sport: task.sport })));

                        // We do NOT stop early. We want coverage.
                        await new Promise(r => setTimeout(r, 100)); // Small delay between calls
                    } catch (e) {
                        // Ignore errors to keep going
                        console.warn(`Query failed: ${task.query}`);
                    }
                }));
                completedQueries += batch.length;
            }

            // 5. Post-processing & Filtering
            setSearchError(`✨ 결과 정리 중...`);

            // Enhanced Junk Filtering 🛑
            const excludeKeywords = [
                '누수', '방수', '설비', '철거', '인테리어', '주차장', '빌라', '원룸', '아파트',
                '유도등', '비상구', '소방', '화재', '안전', '탐지', '피난', '전문업체', '주방',
                '매점', '편의점', '식당', '카페', '술집', '병원', '약국', '공인중개사', '부동산'
            ];

            const filteredResults = allResults.filter(item => {
                const rawTitle = item.title.replace(/<[^>]*>/g, '');
                const title = rawTitle.replace(/&amp;/g, '&').toLowerCase();
                const category = (item.category || '').toLowerCase();

                // 1. Strict Exclusions
                if (excludeKeywords.some(key => title.includes(key) || category.includes(key))) {
                    return false;
                }

                // 2. Relaxed inclusion: If title has sport name, accept it.
                // This maximizes "showing everything".
                const sports = Array.isArray(item.sport) ? item.sport : [item.sport];
                const hasSportInTitle = sports.some(s => {
                    const base = s.replace(/장$/, '').replace(/교실$/, '').trim();
                    return title.includes(base);
                });

                if (hasSportInTitle) return true;

                // 3. Fallback to category check
                const isSportsCategory = category.includes('스포츠') || category.includes('체육') ||
                    category.includes('학원') || category.includes('강습') ||
                    category.includes('도장') || category.includes('관');

                return isSportsCategory;
            });

            // Dedup
            const finalResultsMap = new Map();
            filteredResults.forEach(item => {
                const key = `${item.title.replace(/<[^>]*>/g, '')}-${item.address}`;
                if (finalResultsMap.has(key)) {
                    const existing = finalResultsMap.get(key);
                    const sports = Array.isArray(existing.sport) ? existing.sport : [existing.sport];
                    if (!sports.includes(item.sport)) {
                        existing.sport = [...sports, item.sport];
                    }
                } else {
                    finalResultsMap.set(key, { ...item, sport: [item.sport] });
                }
            });

            const uniqueItems = Array.from(finalResultsMap.values());

            // Geocode & Distance Check
            const bounds = new window.naver.maps.LatLngBounds();
            let markerCount = 0;
            const validFacilities = [];

            await Promise.all(uniqueItems.map(async (item) => {
                if (!item.address) return;

                let latlng = null;
                // Try to get coords from item if available (Naver search result usually lacks this, need geocode)
                // Wait, we need to geocode.
                try {
                    const geocodeRes = await new Promise((resolve) => {
                        window.naver.maps.Service.geocode({ query: item.address }, (status, response) => {
                            if (status === window.naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
                                const addr = response.v2.addresses[0];
                                resolve(new window.naver.maps.LatLng(addr.y, addr.x));
                            } else {
                                resolve(null);
                            }
                        });
                    });
                    if (geocodeRes) latlng = geocodeRes;
                } catch (e) {
                    console.warn('Geocode failed', e);
                }

                if (latlng) {
                    const targetLat = latlng.lat();
                    const targetLng = latlng.lng();
                    const dist = getDistanceFromLatLonInKm(center.lat, center.lng, targetLat, targetLng);

                    if (dist <= effectiveDistance) {
                        validFacilities.push({ ...item, latlng, distance: dist });
                    }
                }
            }));

            validFacilities.sort((a, b) => a.distance - b.distance);

            console.log(`✅ Deep Scan Complete. Found ${validFacilities.length} valid facilities.`);

            if (validFacilities.length === 0) {
                setSearchError(`반경 ${effectiveDistance}km 내에 발견된 시설이 없습니다.`);
            } else {
                setSearchError(null); // Clear loading/error message

                validFacilities.forEach(facility => {
                    const sports = Array.isArray(facility.sport) ? facility.sport : [facility.sport];
                    const emoji = getSportEmoji(sports[0]);
                    createMarker(facility.latlng, emoji, facility, sports);
                    bounds.extend(facility.latlng);
                    markerCount++;
                });

                if (shouldFitBounds && markerCount > 0 && naverMapRef.current) {
                    // Fit bounds but with padding
                    setTimeout(() => {
                        naverMapRef.current.fitBounds(bounds, {
                            top: 50, bottom: 50, left: 20, right: 20
                        });
                    }, 100);
                }
            }

        } catch (error) {
            console.error('Deep scan error:', error);
            setSearchError(`검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.`);
        } finally {
            setIsSearching(false);
        }
    };

    const createMarker = (latlng, emoji, item, sports) => {
        // Generate a consistent pastel color string from a string
        const stringToColor = (str) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
            return '#' + '00000'.substring(0, 6 - c.length) + c;
        };

        // Define some nice colors for common sports
        const sportColors = {
            '축구': '#e53e3e', // Red
            '농구': '#dd6b20', // Orange
            '유도': '#3182ce', // Blue
            '태권도': '#38a169', // Green
            '수영': '#0bc5ea', // Cyan
            '복싱': '#d53f8c', // Pink
            '주짓수': '#805ad5', // Purple
        };

        const primarySport = Array.isArray(sports) ? sports[0] : sports;
        const markerColor = sportColors[primarySport] || stringToColor(primarySport);
        const sportLabel = Array.isArray(sports) ? sports.join(',') : sports;

        const marker = new window.naver.maps.Marker({
            position: latlng,
            map: naverMapRef.current,
            title: item.title.replace(/<[^>]*>?/gm, ''),
            icon: {
                content: `
                    <div class="custom-marker" style="
                        position: relative;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 44px;
                        height: 44px;
                        background: white;
                        border-radius: 50%;
                        border: 3px solid ${markerColor};
                        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                        cursor: pointer;
                        transition: transform 0.2s;
                    ">
                        <div style="font-size: 24px; line-height: 1;">${emoji}</div>
                        <div style="
                            position: absolute;
                            bottom: -5px;
                            background: ${markerColor};
                            color: white;
                            font-size: 10px;
                            padding: 2px 6px;
                            border-radius: 10px;
                            font-weight: bold;
                            white-space: nowrap;
                            max-width: 60px;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        ">${sportLabel}</div>
                    </div>
                `,
                anchor: new window.naver.maps.Point(22, 22)
            }
        });

        const infoWindow = new window.naver.maps.InfoWindow({
            content: `
                <div style="padding: 15px; background: #1a202c; color: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); min-width: 250px; border: 1px solid rgba(255,255,255,0.1);">
                    <h4 style="margin: 0 0 10px 0; font-size: 1.15rem; color: #4299e1; font-weight: 800;">${item.title.replace(/<[^>]*>?/gm, '')}</h4>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <p style="margin: 0; font-size: 0.95rem; color: #e2e8f0; display: flex; align-items: center; gap: 5px;">
                            <span style="color: #4299e1;">🏢</span> <strong>운영 종목:</strong> ${Array.isArray(sports) ? sports.map(s => getSportEmoji(s) + ' ' + s).join(', ') : sports}
                        </p>
                        <p style="margin: 0; font-size: 0.9rem; color: #cbd5e0; line-height: 1.4;">
                            <span style="color: #4299e1;">📍</span> <strong>위치:</strong> ${item.address}
                        </p>
                    </div>
                    <a href="https://search.naver.com/search.naver?query=${encodeURIComponent(item.title.replace(/<[^>]*>?/gm, ''))}" target="_blank" style="display: inline-block; margin-top: 15px; background: #4299e1; color: white; padding: 8px 15px; border-radius: 8px; text-decoration: none; font-size: 0.85rem; font-weight: 600; text-align: center; transition: background 0.2s;">상세보기 (네이버 검색)</a>
                </div>
            `,
            backgroundColor: "transparent",
            borderWidth: 0,
            disableAnchor: true
        });

        window.naver.maps.Event.addListener(marker, 'click', () => {
            // Close previous InfoWindow if exists
            if (currentInfoWindowRef.current) {
                currentInfoWindowRef.current.close();
            }
            // Open new InfoWindow
            infoWindow.open(naverMapRef.current, marker);
            currentInfoWindowRef.current = infoWindow;
            naverMapRef.current.panTo(latlng, { duration: 500 });
        });

        markersRef.current.push(marker);
    };

    // Removed generateMockFacilities as we are now using real data

    // Handle search
    const handleSearch = async (e) => {
        e.preventDefault();
        const trimmedQuery = searchQuery.trim();
        if (!trimmedQuery || !window.naver?.maps?.Service) return;

        setIsSearching(true);
        setSearchError(null);

        try {
            // 1. First, check if the query is a location (Geocoding)
            const geocodeResult = await new Promise((resolve) => {
                window.naver.maps.Service.geocode({ query: trimmedQuery }, (status, response) => {
                    if (status === window.naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
                        const addr = response.v2.addresses[0];
                        resolve({ lat: parseFloat(addr.y), lng: parseFloat(addr.x) });
                    } else {
                        resolve(null);
                    }
                });
            });

            if (geocodeResult) {
                console.log('📍 Geocoded location found for:', trimmedQuery, geocodeResult);

                // Move map to the found location
                const newCenter = new window.naver.maps.LatLng(geocodeResult.lat, geocodeResult.lng);
                naverMapRef.current.setCenter(newCenter);
                naverMapRef.current.setZoom(14);

                // Re-search around this new location
                // Check if the query also contains sport keywords
                const sportsKeywords = SPORTS_LIST.filter(sport =>
                    trimmedQuery.includes(sport.name) ||
                    sport.keywords.some(k => trimmedQuery.toLowerCase().includes(k.toLowerCase()))
                );

                if (sportsKeywords.length > 0) {
                    await loadFacilities(geocodeResult, sportsKeywords.map(s => s.name));
                } else {
                    // Just the location? Search for current selected sports or default ones at this new location
                    await loadFacilities(geocodeResult, user?.selectedSports);
                }
            } else {
                // 2. Not a direct location? Search by sport keywords around CURRENT location
                const sportSearchResults = SPORTS_LIST.filter(sport =>
                    trimmedQuery.includes(sport.name) ||
                    sport.name.includes(trimmedQuery) ||
                    sport.keywords.some(k => trimmedQuery.toLowerCase().includes(k.toLowerCase()))
                );

                if (sportSearchResults.length > 0) {
                    const sportsNames = sportSearchResults.map(s => s.name);
                    await loadFacilities(userLocation, sportsNames);
                } else {
                    // Generic search - pass original query
                    await loadFacilities(userLocation, [trimmedQuery]);
                }
            }
        } catch (error) {
            console.error('Search error:', error);
            setSearchError('검색 중 오류가 발생했습니다.');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="home-page">
            {/* Fullscreen Map */}
            <div ref={mapRef} className="map-fullscreen">
                {(searchError || isSearching) && (
                    <div className="search-error-overlay glass-container">
                        {isSearching ? (
                            <div className="flex items-center gap-md">
                                <div className="spinner-small"></div>
                                <span>주변 시설을 찾는 중...</span>
                            </div>
                        ) : (
                            <p>{searchError}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Distance Filter Controls */}
            <div className="distance-filter-controls fade-in">
                {[2, 3, 5].map(dist => (
                    <button
                        key={dist}
                        className={`distance-btn ${searchDistance === dist ? 'active' : ''}`}
                        onClick={() => {
                            setSearchDistance(dist);
                            // Get current map center for search
                            const searchCenter = naverMapRef.current
                                ? { lat: naverMapRef.current.getCenter().lat(), lng: naverMapRef.current.getCenter().lng() }
                                : userLocation;
                            // Pass new distance directly since setState is async
                            loadFacilities(searchCenter, user?.selectedSports, true, dist);
                        }}
                    >
                        {dist}km
                    </button>
                ))}
            </div>



            {/* Floating Search Bar */}
            <div className="search-floating glass-container fade-in">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        id="search-input-home"
                        name="searchQuery"
                        className="search-input-home"
                        placeholder={
                            user?.selectedSports?.length > 0
                                ? `근처 ${user.selectedSports[0]} 검색...`
                                : "근처 스포츠 시설 검색..."
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary search-btn">
                        찾기
                    </button>
                </form>
            </div>

            <button
                className="my-location-btn"
                onClick={() => userLocation && naverMapRef.current.panTo(new window.naver.maps.LatLng(userLocation.lat, userLocation.lng))}
                title="내 위치로 이동"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                    <line x1="12" y1="0" x2="12" y2="4" stroke="currentColor" strokeWidth="2" />
                    <line x1="12" y1="20" x2="12" y2="24" stroke="currentColor" strokeWidth="2" />
                    <line x1="0" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="2" />
                    <line x1="20" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="2" />
                </svg>
            </button>

            {!mapLoaded && (
                <div className="map-loading">
                    <div className="spinner"></div>
                    <p>지도를 불러오는 중...</p>
                </div>
            )}
        </div >
    );
}

export default Home;
