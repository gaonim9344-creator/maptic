// 시설 데이터 타입 정의
export interface Facility {
    id: string;
    name: string;           // 시설명
    address: string;        // 주소
    category: string;       // 종목
    price_daily: number;    // 일일권 가격
    price_monthly: number;  // 월 이용권 가격
    price_yearly: number;   // 연 이용권 가격
    description: string;    // 시설 설명
    features: string[];     // 편의시설 (샤워실, 주차, 운동복)
    images: FacilityImage[]; // 시설 사진 (최대 5장)
    createdAt: string;      // 생성일
    updatedAt: string;      // 수정일
}

// 시설 이미지 타입
export interface FacilityImage {
    uid: string;
    name: string;
    url: string;  // base64 또는 URL
}

// 시설 생성/수정 시 사용할 타입 (id, createdAt, updatedAt 제외)
export type FacilityFormData = Omit<Facility, 'id' | 'createdAt' | 'updatedAt'>;

// 50개 대표 스포츠 종목
export const SPORTS_CATEGORIES = [
    '축구', '농구', '야구', '배구', '테니스',
    '탁구', '배드민턴', '골프', '수영', '볼링',
    '유도', '태권도', '합기도', '주짓수', '복싱',
    '킥복싱', '무에타이', '레슬링', '검도', '우슈',
    '스쿼시', '라켓볼', '핸드볼', '럭비', '풋살',
    '필라테스', '요가', '크로스핏', '웨이트트레이닝', '에어로빅',
    '댄스', '발레', '줌바', '스피닝', '클라이밍',
    '스케이트', '스키', '스노보드', '서핑', '카약',
    '펜싱', '양궁', '사격', '승마', '트라이애슬론',
    '마라톤', '사이클링', '트레일러닝', '스키점프', '봅슬레이'
] as const;

// 편의시설 옵션
export const FACILITY_FEATURES = [
    { label: '샤워실', value: '샤워실' },
    { label: '주차', value: '주차' },
    { label: '운동복', value: '운동복' },
] as const;
