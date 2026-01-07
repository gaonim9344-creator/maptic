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

        console.log('🔍 Starting facility search with sports:', selectedSports);
        console.log('📍 Search location:', center);

        // Helper to expand keyword into instructional/educational search terms
        const getExpandedKeywords = (sport) => {
            const s = sport.replace(/장$/g, '').replace(/교실$/g, '').trim();
            // Instructional keywords take priority to find learning facilities
            const learningKeywords = [`${s}교실`, `${s}아카데미`, `${s}클럽`, `${s}학원`, `${s}학교`];
            const baseKeywords = [s, `${s}센터`, `${s}체육관`];

            if (s === '유도') return [`${s}관`, `${s}도장`, `${s}교실`, `${s}아카데미`, `${s}클럽`, `${s}학원`, `${s}학교`, '대한유도', '유도장'].filter(Boolean);
            if (s === '태권도') return [`${s}도장`, `${s}관`, `${s}교실`, `${s}아카데미`, `${s}클럽`, `${s}학원`, `${s}학교`].filter(Boolean);
            if (s === '복싱') return ['복싱짐', '권투', ...learningKeywords, ...baseKeywords].filter(Boolean);
            if (s === '헬스') return ['피트니스', '휘트니스', ...baseKeywords, 'gx', ...learningKeywords].filter(Boolean);
            if (s === '수영') return ['수영장', '강습', ...learningKeywords, ...baseKeywords].filter(Boolean);

            return [...learningKeywords, ...baseKeywords].filter(Boolean);
        };

        try {
            // Updated Checkpoints for variable search distance - More comprehensive grid
            const checkPoints = [];
            // Use 1.2x the search distance to ensure we capture facilities at the edge
            const searchBuffer = effectiveDistance * 1.2;
            const radiusDeg = searchBuffer * 0.009; // Approx degrees for km
            // More dense grid for accurate coverage
            const steps = effectiveDistance <= 2 ? 2 : (effectiveDistance <= 3 ? 3 : 4);
            const stepLat = radiusDeg / steps;
            const stepLng = (radiusDeg * 1.2) / steps; // Longitude is slightly wider in Korea

            for (let i = -steps; i <= steps; i++) {
                for (let j = -steps; j <= steps; j++) {
                    checkPoints.push({
                        lat: center.lat + (i * stepLat),
                        lng: center.lng + (j * stepLng)
                    });
                }
            }

            console.log(`🔍 Searching with ${checkPoints.length} checkpoints for ${effectiveDistance}km radius`);


            const regions = (await Promise.all(
                checkPoints.map(point => getRegionFromCoords(point.lat, point.lng))
            )).filter(region => region && region.area1 && region.area2);

            const uniqueRegions = regions.reduce((acc, current) => {
                const key = `${current.area1} ${current.area2} ${current.area3 || ''}`.trim();
                if (!acc.find(r => `${r.area1} ${r.area2} ${r.area3 || ''}`.trim() === key)) {
                    acc.push(current);
                }
                return acc;
            }, []);

            const allResults = [];
            const queriesBySport = {};
            for (const sport of selectedSports) {
                queriesBySport[sport] = [];
                const keywords = getExpandedKeywords(sport);

                // If search query looks like a specific place name (long), add it directly first
                if (searchQuery.length > 5 && searchQuery.includes(sport)) {
                    queriesBySport[sport].push({ query: searchQuery, sport });
                }

                for (const keyword of keywords) {
                    for (const region of uniqueRegions) {
                        // Prioritize area3 (Dong) for hyper-local accuracy
                        if (region.area3) queriesBySport[sport].push({ query: `${region.area1} ${region.area2} ${region.area3} ${keyword}`, sport });
                        queriesBySport[sport].push({ query: `${region.area1} ${region.area2} ${keyword}`, sport });
                    }
                    // Capture local keyword without region to find places like "Daehan Judo관" anywhere
                    if (keyword.length >= 2) queriesBySport[sport].push({ query: keyword, sport });
                }
            }

            const interleavedQueries = [];
            let maxLen = Math.max(...Object.values(queriesBySport).map(q => q.length || 0));
            for (let i = 0; i < maxLen; i++) {
                for (const sport of selectedSports) {
                    if (queriesBySport[sport] && queriesBySport[sport][i]) interleavedQueries.push(queriesBySport[sport][i]);
                }
            }

            // High Priority: If user manually searched, ensure the raw string is searched FIRST
            if (searchQuery && searchQuery.length >= 2) {
                // Remove duplicates and put raw query at the very beginning
                interleavedQueries.unshift({ query: searchQuery, sport: selectedSports[0] || searchQuery });
            }

            // Optimized batch for thorough searching (Increased to 200)
            const uniqueQueryTasks = Array.from(new Map(interleavedQueries.map(t => [t.query, t])).values()).slice(0, 200);


            const batchSize = 1; // Sequential processing to prevent rate limits
            let validEstimatedCount = 0;

            for (let i = 0; i < uniqueQueryTasks.length; i += batchSize) {
                // Smart Stop: Only stop if we have a healthy number of results ALREADY FILTERED or too many raw items
                // Increased threshold to 50 to ensure we don't stop too early for mixed sports
                if (validEstimatedCount > 50 || allResults.length > 800) {
                    console.log(`🛑 Smart Stop: ${validEstimatedCount} valid facilities found (${allResults.length} raw). Stopping.`);
                    break;
                }

                const batch = uniqueQueryTasks.slice(i, i + batchSize);
                await Promise.all(batch.map(async (task) => {
                    try {
                        const response = await searchAPI.searchLocal(task.query, center.lat, center.lng, 1);
                        const items = response.data.items || [];
                        allResults.push(...items.map(item => ({ ...item, sport: task.sport })));

                        // Update valid estimate (rough check)
                        const newValids = items.filter(item => {
                            const title = item.title.replace(/<[^>]*>/g, '').toLowerCase();
                            return title.includes(task.sport.toLowerCase().replace(/관$/, '').replace(/도장$/, ''));
                        }).length;
                        validEstimatedCount += newValids;

                        // Dynamic delay based on query priority
                        const delay = i < 5 ? 100 : 250;
                        await new Promise(r => setTimeout(r, delay));
                    } catch (e) {
                        if (e.response?.data?.errorCode === '012' || e.response?.status === 429) {
                            console.warn('⚠️ Rate limit hit (012). Waiting longer...');
                            await new Promise(r => setTimeout(r, 1000)); // 1s cooldown
                        } else {
                            console.error(`API fail for ${task.query}:`, e.message);
                        }
                    }
                }));
            }

            // Enhanced Junk Filtering 🛑
            const excludeKeywords = [
                '누수', '방수', '설비', '철거', '인테리어', '주차장', '빌라', '원룸', '아파트',
                '유도등', '비상구', '소방', '화재', '안전', '탐지', '피난', '전문업체', '주방',
                '매점', '편의점', '식당', '카페', '술집', '병원', '약국', '공인중개사', '부동산'
            ];

            const filteredResults = allResults.filter(item => {
                const rawTitle = item.title.replace(/<[^>]*>/g, '');
                const title = rawTitle.replace(/&amp;/g, '&').toLowerCase();
                const address = (item.address + ' ' + item.roadAddress).toLowerCase();
                const category = (item.category || '').toLowerCase();

                // 1. Strict Exclusions
                if (excludeKeywords.some(key => title.includes(key) || category.includes(key))) {
                    console.log(`🚫 Strongly Excluded: ${rawTitle}`);
                    return false;
                }

                // 2. Category Check (Prioritize sports related categories)
                const isSportsCategory = category.includes('스포츠') || category.includes('체육') ||
                    category.includes('학원') || category.includes('강습') ||
                    category.includes('격투기') || category.includes('무술') ||
                    category.includes('유도') || category.includes('태권도') ||
                    category.includes('헬스') || category.includes('휘트니스') ||
                    category.includes('요가') || category.includes('필라테스') ||
                    category.includes('주짓수') || category.includes('골프');

                // 3. Keyword Context Check & Instructional Filtering
                const sports = Array.isArray(item.sport) ? item.sport : [item.sport];
                const instructionalTerms = ['교실', '아카데미', '학원', '클럽', 'fc', '유소년', '어린이', '강습', '지도', '도장', '관', 'gym', '유도', '스포츠', '체육관', '센터'];

                const isInstructional = instructionalTerms.some(term => title.includes(term) || category.includes(term));

                // For soccer, we still want to be careful about generic fields
                if (sports.includes('축구') || sports.includes('풋살')) {
                    const isGenericField = (title.includes('축구장') || title.includes('풋살장') || title.includes('경기장')) &&
                        !(title.includes('교실') || title.includes('아카데미') || title.includes('클럽') || title.includes('fc'));
                    if (isGenericField) return false;
                }

                // Check if any of the target sports are mentioned in title OR if it's a specific manual search
                const hasSportKeyword = sports.some(s => {
                    const baseSport = s.toLowerCase().replace(/동$/, '').replace(/점$/, '').trim();
                    return title.includes(baseSport) ||
                        (s === 'mma' && (title.includes('격투기') || title.includes('주짓수') || title.includes('킥복싱')));
                });

                // If the user's manual search string is a literal match for the title, keep it regardless
                if (searchQuery && title.includes(searchQuery.toLowerCase().trim())) return true;

                return (hasSportKeyword && isInstructional) || isSportsCategory;
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
                            searchCenterLat: center.lat,
                            searchCenterLng: center.lng,
                            facilityLat: targetLat,
                            facilityLng: targetLng,
                            title: item.title.replace(/<[^>]*>/g, '')
                        });
                    }

                    const distance = getDistanceFromLatLonInKm(
                        center.lat, center.lng,
                        targetLat, targetLng
                    );

                    // Debug log for distance calculation
                    if (validFacilities.length < 10) {
                        console.log(`📏 Distance: ${item.title.replace(/<[^>]*>/g, '')} - ${distance.toFixed(2)}km ${distance <= 5 ? '✅' : '❌'}`);
                    }

                    // Distance check based on effectiveDistance
                    const maxDist = effectiveDistance;
                    if (distance <= maxDist) {
                        validFacilities.push({ ...item, latlng, distance });
                    }
                }
            }));

            // Sort by distance (closest first)
            validFacilities.sort((a, b) => a.distance - b.distance);

            console.log(`✅ Found ${validFacilities.length} valid facilities within ${effectiveDistance}km`);
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

            // 4. Fit map to show all markers (only if requested)
            if (shouldFitBounds && markerCount > 0 && naverMapRef.current) {
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="3"></circle>
                    <line x1="12" y1="2" x2="12" y2="5"></line>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                    <line x1="2" y1="12" x2="5" y2="12"></line>
                    <line x1="19" y1="12" x2="22" y2="12"></line>
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
