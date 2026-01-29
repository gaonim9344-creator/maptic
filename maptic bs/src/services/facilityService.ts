import { Facility, FacilityFormData } from '@/types';

// API 기본 URL - maptic 백엔드 서버
const API_BASE_URL = 'http://localhost:5001/api/facilities';

// 시설 서비스 - 실제 API 연동
export const facilityService = {
    // 전체 시설 목록 조회
    async getFacilities(): Promise<Facility[]> {
        try {
            const response = await fetch(API_BASE_URL);
            if (!response.ok) {
                throw new Error('시설 목록을 불러오는데 실패했습니다');
            }
            return await response.json();
        } catch (error) {
            console.error('시설 목록 조회 오류:', error);
            throw error;
        }
    },

    // 단일 시설 조회
    async getFacilityById(id: string): Promise<Facility | undefined> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`);
            if (response.status === 404) {
                return undefined;
            }
            if (!response.ok) {
                throw new Error('시설 정보를 불러오는데 실패했습니다');
            }
            return await response.json();
        } catch (error) {
            console.error('시설 조회 오류:', error);
            throw error;
        }
    },

    // 시설 등록
    async createFacility(data: FacilityFormData): Promise<Facility> {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '시설 등록에 실패했습니다');
            }
            return await response.json();
        } catch (error) {
            console.error('시설 등록 오류:', error);
            throw error;
        }
    },

    // 시설 수정
    async updateFacility(id: string, data: FacilityFormData): Promise<Facility | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (response.status === 404) {
                return null;
            }
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '시설 수정에 실패했습니다');
            }
            return await response.json();
        } catch (error) {
            console.error('시설 수정 오류:', error);
            throw error;
        }
    },

    // 시설 삭제
    async deleteFacility(id: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE',
            });
            if (response.status === 404) {
                return false;
            }
            if (!response.ok) {
                throw new Error('시설 삭제에 실패했습니다');
            }
            return true;
        } catch (error) {
            console.error('시설 삭제 오류:', error);
            throw error;
        }
    },
};
