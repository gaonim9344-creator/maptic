import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getSportEmoji, SPORTS_LIST } from '../utils/sportsData';
import { searchAPI } from '../utils/api';
import './Home.css';

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
    const currentInfoWindowRef = useRef(null); // Track currently open InfoWindow

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

        // Add modern user location marker
        new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(location.lat, location.lng),
            map: map,
            title: '현재 위치',
            icon: {
                content: `
                    <div style="
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <!-- Outer pulse ring -->
                        <div style="
                            position: absolute;
                            width: 60px;
                            height: 60px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            border-radius: 50%;
                            opacity: 0.3;
                            animation: pulse 2s ease-out infinite;
                        "></div>
                        <!-- Inner marker -->
                        <div style="
                            position: relative;
                            width: 40px;
                            height: 40px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            border-radius: 50%;
                            border: 4px solid white;
                            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.6), 0 0 0 4px rgba(102, 126, 234, 0.2);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 18px;
                            z-index: 1;
                        ">
                            📍
                        </div>
                    </div>
                    <style>
                        @keyframes pulse {
                            0% { transform: scale(0.8); opacity: 0.5; }
                            50% { transform: scale(1.2); opacity: 0.2; }
                            100% { transform: scale(1.5); opacity: 0; }
                        }
                    </style>
                `,
                anchor: new window.naver.maps.Point(30, 30)
            }
        });

        setMapLoaded(true);

        // Load initial markers will be done by the useEffect below
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
                orders: [window.naver.maps.Service.OrderType.ADDR, window.naver.maps.Service.OrderType.ROAD_ADDR].join(',')
            }, (status, response) => {
                if (status === window.naver.maps.Service.Status.OK) {
                    const result = response.v2.address;
                    resolve({
                        area1: result.jibunAddress ? result.jibunAddress.split(' ')[0] : '', // 시/도
                        area2: result.jibunAddress ? result.jibunAddress.split(' ')[1] : '', // 시/군/구
                        area3: result.jibunAddress ? result.jibunAddress.split(' ')[2] : '', // 동/읍/면
                    });
                } else {
                    resolve(null);
                }
            });
        });
    };

    // Load facilities based on user preferences or search
    const loadFacilities = async (location, selectedSports = null) => {
        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        setIsSearching(true);
        setSearchError(null);

        if (!selectedSports || selectedSports.length === 0) {
            // Default to popular sports for better initial results
            selectedSports = ['축구', '농구', '수영', '헬스', '요가', '필라테스', '태권도', '유도'];
        }

        console.log('🔍 Starting facility search with sports:', selectedSports);
        console.log('📍 Search location:', location);

        // Helper to expand keyword into instructional/educational search terms
        // Balanced Patch: Recovered essential keywords like 'FC', 'Club'
        const getExpandedKeywords = (sport) => {
            const s = sport.replace(/장$/g, '').replace(/교실$/g, '').trim();

            // Priority: Core keywords + Sport associations
            if (s === '축구') return [`${s}교실`, `${s}아카데미`, `${s}클럽`, 'FC', s];
            if (s === '농구') return [`${s}교실`, `${s}아카데미`, `${s}클럽`, s];
            if (s === '수영') return [`${s}강습`, `${s}교실`, `${s}클럽`, s];
            if (s === '유도') return [`${s}관`, `${s}장`, `${s}교실`, `${s}도장`, `${s}체육관`, s];
            if (s === '태권도') return [`${s}도장`, `${s}관`, s];
            if (s === '복싱') return [`${s}체육관`, '복싱짐', s];
            if (s === '주짓수') return [`${s}아카데미`, `${s}도장`, s];

            // Default expansion
            return [`${s}교실`, `${s}아카데미`, s];
        };

        try {
            // 1. Identify all relevant nearby regions (Parallel Geocoding)
            const checkPoints = [
                { lat: location.lat, lng: location.lng }, // Center
                { lat: location.lat + 0.045, lng: location.lng }, // North
                { lat: location.lat - 0.045, lng: location.lng }, // South
                { lat: location.lat, lng: location.lng + 0.056 }, // East
                { lat: location.lat, lng: location.lng - 0.056 }, // West
                { lat: location.lat + 0.032, lng: location.lng + 0.040 }, // NE
                { lat: location.lat + 0.032, lng: location.lng - 0.040 }, // NW
                { lat: location.lat - 0.032, lng: location.lng + 0.040 }, // SE
                { lat: location.lat - 0.032, lng: location.lng - 0.040 }, // SW
                // Additional checkpoints for border areas (Jagok-dong etc)
                { lat: location.lat + 0.022, lng: location.lng }, // N-Mid
                { lat: location.lat - 0.022, lng: location.lng }, // S-Mid
                { lat: location.lat, lng: location.lng + 0.028 }, // E-Mid
                { lat: location.lat, lng: location.lng - 0.028 }  // W-Mid
            ];

            const regions = (await Promise.all(
                checkPoints.map(point => getRegionFromCoords(point.lat, point.lng))
            )).filter(region => region && region.area1 && region.area2);

            // Deduplicate regions with high granularity (area1 area2 area3)
            const uniqueRegions = regions.reduce((acc, current) => {
                const key = `${current.area1} ${current.area2} ${current.area3 || ''}`.trim();
                if (!acc.find(r => `${r.area1} ${r.area2} ${r.area3 || ''}`.trim() === key)) {
                    acc.push(current);
                }
                return acc;
            }, []);

            console.log('🗺️ Search Targets (Nearby Regions):', uniqueRegions.map(r => `${r.area1} ${r.area2}`));

            const allResults = [];

            // 2. Prepare ultra-precise queries (Interleaved for multi-sport accuracy)
            const queriesBySport = {};
            for (const sport of selectedSports) {
                queriesBySport[sport] = [];
                const keywords = getExpandedKeywords(sport);
                for (const keyword of keywords) {
                    for (const region of uniqueRegions) {
                        if (region.area3) queriesBySport[sport].push({ query: `${region.area1} ${region.area2} ${region.area3} ${keyword}`, sport });
                        queriesBySport[sport].push({ query: `${region.area1} ${region.area2} ${keyword}`, sport });
                    }
                    if (uniqueRegions.length === 0 && currentRegion) {
                        queriesBySport[sport].push({ query: `${currentRegion.area1} ${currentRegion.area2} ${keyword}`, sport });
                    }
                }
            }

            // Interleave queries: [SportA-Q1, SportB-Q1, SportA-Q2, SportB-Q2...]
            const interleavedQueries = [];
            let maxLen = Math.max(...Object.values(queriesBySport).map(q => q.length || 0));
            for (let i = 0; i < maxLen; i++) {
                for (const sport of selectedSports) {
                    if (queriesBySport[sport][i]) interleavedQueries.push(queriesBySport[sport][i]);
                }
            }
            const uniqueQueryTasks = Array.from(new Map(interleavedQueries.map(t => [t.query, t])).values());

            console.log(`🚀 Parallel searching for ${uniqueQueryTasks.length} queries...`);

            // 3. Execute queries in batches of 3 (Speed optimized)
            const batchSize = 3;
            let stopAll = false;

            for (let i = 0; i < uniqueQueryTasks.length && !stopAll; i += batchSize) {
                const batch = uniqueQueryTasks.slice(i, i + batchSize);

                await Promise.all(batch.map(async (task) => {
                    let start = 1;
                    let hasMore = true;
                    const MAX_PER_QUERY = 100;
                    let retryCount = 0;

                    while (hasMore && start <= MAX_PER_QUERY && !stopAll) {
                        try {
                            const response = await searchAPI.searchLocal(task.query, location.lat, location.lng, start);
                            const items = response.data.items || [];

                            if (items.length > 0) {
                                allResults.push(...items.map(item => ({ ...item, sport: task.sport })));
                                if (items.length < 100) hasMore = false; // Backend returns up to 100
                                else start += 100;
                            } else {
                                hasMore = false;
                            }
                            retryCount = 0; // Reset on success
                            await new Promise(r => setTimeout(r, 150));
                        } catch (e) {
                            console.error(`API fail for ${task.query}:`, e.message);
                            if (e.message.includes('012') || e.message.includes('limit')) {
                                if (retryCount < 2) {
                                    console.warn(`⏳ Rate limit hit for ${task.query}. Retrying (${retryCount + 1}/2)...`);
                                    retryCount++;
                                    await new Promise(r => setTimeout(r, 2000 * retryCount));
                                    continue; // Retry this page
                                }
                                console.warn('🛑 API Rate limit reached. High protection pause.');
                                await new Promise(r => setTimeout(r, 3000));
                            }
                            hasMore = false;
                        }
                    }
                }));
                if (!stopAll) await new Promise(r => setTimeout(r, 300)); // Optimization: 300ms batch gap
            }

            if (stopAll && allResults.length === 0) {
                setSearchError('검색 요청이 너무 많습니다. 1분 후에 다시 시도해주세요.');
                return;
            }


            console.log('📊 Total search results:', allResults.length);

            if (allResults.length === 0) {
                console.error('❌ No facilities found');
                setSearchError(`주변 50km 이내에서 스포츠 시설을 찾을 수 없습니다. 다른 지역을 검색해보세요.`);
                return;
            }

            // Enhanced Instructional Facilities Filtering 🎓
            const includeKeywords = [
                '교실', '아카데미', '클럽', '도장', '학원', '스쿨', '강습', '관', '센터', '회관',
                '꿈나무', '어린이', '유소년', '주니어', '짐', 'GYM', 'FC', '스포츠', '멀티짐', '공간'
            ];
            const excludeKeywords = [
                '유도등', '비상구', '소방', '화재', '경보기', '탐지', '피난', '안전', // Safety items
                '경기장', '운동장', '공원', '스타디움', '스탠드', '동네', '간이', // Mere facilities (Keep '풋살장' as academies use them)
                '매점', '편의점', '식당', '카페' // Non-sports items
            ];

            const filteredResults = allResults.filter(item => {
                // Remove HTML tags and convert entities (like &amp; to &) for robust matching
                const rawTitle = item.title.replace(/<[^>]*>/g, '');
                const title = rawTitle.replace(/&amp;/g, '&').toLowerCase();

                // 1. Check for negative keywords (Exclude if found)
                const hasNegative = excludeKeywords.some(keyword => title.includes(keyword));
                if (hasNegative) {
                    console.log(`🚫 Excluded (Implicit Facility/Safety):`, rawTitle);
                    return false;
                }

                // 2. MUST have instructional context OR be a clear sports facility
                const hasInstructional = includeKeywords.some(keyword => title.includes(keyword));

                // Flexible Match: If it has 'FC', 'Club', 'Academy' or is a specific sport studio, it's a pass
                const isClearSportsFacility =
                    title.includes('fc') ||
                    title.includes('클럽') ||
                    title.includes('스포츠') ||
                    title.includes('헬스') || title.includes('휘트니스') || title.includes('피트니스') ||
                    title.includes('필라테스') || title.includes('요가') || title.includes('골프') ||
                    title.includes('도장') || title.includes('체육관') ||
                    title.includes('유도') || title.includes('주짓수') || title.includes('태권도') ||
                    title.includes('검도') || title.includes('복싱');

                if (hasInstructional || isClearSportsFacility) {
                    return true;
                }

                console.log(`⚠️ Excluded (No Instructional Keyword):`, rawTitle);
                return false;
            });

            console.log(`✂️ Filtered ${allResults.length - filteredResults.length} irrelevant results. Remaining: ${filteredResults.length}`);

            if (filteredResults.length === 0) {
                setSearchError(`관련 시설을 찾을 수 없습니다.`);
                return;
            }

            // 2. Smart Multi-sport Merging
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

            // 3. Geocode and Create markers for ALL items
            const bounds = new window.naver.maps.LatLngBounds();
            let markerCount = 0;

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

            // Collection array for sorting
            const validFacilities = [];

            await Promise.all(uniqueItems.map(async (item) => {
                let latlng = null;
                try {

                    // Geocode address if coordinates missing
                    if (item.address) {
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
                    }
                } catch (e) {
                    console.warn('Coordinate conversion failed:', e);
                }

                if (latlng) {
                    // Filter by distance (5km)
                    const targetLat = typeof latlng.lat === 'function' ? latlng.lat() : latlng.y;
                    const targetLng = typeof latlng.lng === 'function' ? latlng.lng() : latlng.x;

                    // Debug: Log coordinates for first item
                    if (validFacilities.length === 0) {
                        console.log('🎯 First item coordinates:', {
                            userLat: location.lat,
                            userLng: location.lng,
                            facilityLat: targetLat,
                            facilityLng: targetLng,
                            title: item.title.replace(/<[^>]*>/g, '')
                        });
                    }

                    const distance = getDistanceFromLatLonInKm(
                        location.lat, location.lng,
                        targetLat, targetLng
                    );

                    // Debug log for distance calculation
                    if (validFacilities.length < 10) {
                        console.log(`📏 Distance: ${item.title.replace(/<[^>]*>/g, '')} - ${distance.toFixed(2)}km ${distance <= 5 ? '✅' : '❌'}`);
                    }

                    // Distance check: Relax to 10km for specific sporting keywords to ensure border areas like Jagok-dong appear
                    const cleanTitle = item.title.replace(/<[^>]*>/g, '').toLowerCase();
                    const isStrongMatch =
                        cleanTitle.includes('교실') || cleanTitle.includes('아카데미') ||
                        cleanTitle.includes('도장') || cleanTitle.includes('유도관') || cleanTitle.includes('축구교실') ||
                        cleanTitle.includes('클럽') || cleanTitle.includes('fc');

                    const maxDist = isStrongMatch ? 10 : 5;

                    if (distance <= maxDist) {
                        validFacilities.push({ ...item, latlng, distance });
                    }
                }
            }));

            // Sort by distance (closest first) - show ALL facilities within 5km
            validFacilities.sort((a, b) => a.distance - b.distance);

            console.log(`✅ Found ${validFacilities.length} valid facilities within 5km`);
            if (validFacilities.length > 0) {
                console.log('🎯 Displaying ALL facilities:', validFacilities.map(f => ({ name: f.title.replace(/<[^>]*>?/gm, ''), distance: f.distance.toFixed(2) + 'km', sport: f.sport })));
            }

            validFacilities.forEach(facility => {
                // For multi-sport facilities, show the first sport's emoji or a combined one
                const sports = Array.isArray(facility.sport) ? facility.sport : [facility.sport];
                const emoji = getSportEmoji(sports[0]);
                createMarker(facility.latlng, emoji, facility, sports);
                bounds.extend(facility.latlng);
                markerCount++;
            });

            console.log(`🗺️ Created ${markerCount} markers on the map`);

            // 4. Fit map to show all markers
            if (markerCount > 0 && naverMapRef.current) {
                naverMapRef.current.fitBounds(bounds, {
                    top: 50, bottom: 50, left: 20, right: 20
                });
            }

        } catch (error) {
            console.error('Failed to load facilities:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                const guidance = error.response?.data?.guidance;
                setSearchError(guidance ? `서비스 인증 실패: ${guidance}` : `인증 오류가 발생했습니다.`);
            } else {
                setSearchError(`시설을 불러오는 중 오류가 발생했습니다.`);
            }
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
    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchQuery.trim() || !userLocation) return;

        // Search for specific facilities
        const searchResults = SPORTS_LIST.filter(sport =>
            sport.name.includes(searchQuery) ||
            sport.keywords.some(k => k.includes(searchQuery.toLowerCase()))
        );

        if (searchResults.length > 0) {
            const sportsNames = searchResults.map(s => s.name);
            loadFacilities(userLocation, sportsNames);
        } else {
            // Generic search - add " 근처" to make it more like a real place search
            loadFacilities(userLocation, [searchQuery]);
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
                style={{
                    position: 'absolute',
                    bottom: '30px',
                    right: '20px',
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontSize: '24px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.5), 0 6px 16px rgba(0, 0, 0, 0.25)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)';
                }}
            >
                🎯
            </button>

            {
                !mapLoaded && (
                    <div className="map-loading">
                        <div className="spinner"></div>
                        <p>지도를 불러오는 중...</p>
                    </div>
                )
            }
        </div >
    );
}

export default Home;
