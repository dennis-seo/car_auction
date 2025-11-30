// 앱 전역 상태 관리

// 타입 정의
export interface Range {
    min: number;
    max: number;
}

export interface ActiveFilters {
    title: string[];
    model: string[];
    submodel: string[];
    price: string[];
    km: string[];
    fuel: string[];
    auction_name: string[];
    region: string[];
    year: number[];
}

export interface AppState {
    allData: unknown[];
    fuelTypes: string[];
    carBrands: string[];
    availableDates: string[];
    activeFilters: ActiveFilters;
    yearMin: number | null;
    yearMax: number | null;
    searchQuery: string;
    budgetRange: Range | null;
    lastSortedFilter: string | null;
}

// 컬럼 매핑
export const columnMapping: Record<string, string> = {
    "sell_number": "출품번호",
    "title": "차종",
    "price": "가격(만)",
    "year": "연식",
    "km": "주행거리",
    "fuel": "연료",
    "auction_name": "경매장",
    "region": "지역",
    "details": "기타"
};

// 주행거리 범위
export const mileageRanges: Record<string, string> = {
    "3만km 이하": "0-30000",
    "3만km ~ 5만km": "30000-50000",
    "5만km ~ 10만km": "50000-100000",
    "10만km ~ 15만km": "100000-150000",
    "15만km ~ 20만km": "150000-200000",
    "20만km 이상": "200000-Infinity"
};

// 가격 범위
export const priceRanges: Record<string, string> = {
    "500만원 이하": "0-500",
    "500 ~ 1,000만원": "500-1000",
    "1,000 ~ 2,000만원": "1000-2000",
    "2,000 ~ 3,000만원": "2000-3000",
    "3,000만원 이상": "3000-Infinity"
};

// 사전 파싱된 범위 객체 (성능 최적화)
export const parsedMileageRanges: Record<string, Range> = Object.fromEntries(
    Object.entries(mileageRanges).map(([key, val]) => {
        const [min, max] = val.split('-');
        return [key, { min: parseInt(min, 10), max: max === 'Infinity' ? Infinity : parseInt(max, 10) }];
    })
);

export const parsedPriceRanges: Record<string, Range> = Object.fromEntries(
    Object.entries(priceRanges).map(([key, val]) => {
        const [min, max] = val.split('-');
        return [key, { min: parseInt(min, 10), max: max === 'Infinity' ? Infinity : parseInt(max, 10) }];
    })
);

// 앱 상태 - React용으로 수정
export const appState: AppState = {
    allData: [],
    fuelTypes: [],
    carBrands: [],
    availableDates: [],
    activeFilters: {
        title: [],
        model: [],
        submodel: [],
        price: [],
        km: [],
        fuel: [],
        auction_name: [],
        region: [],
        year: []
    },
    yearMin: null,
    yearMax: null,
    searchQuery: '',
    budgetRange: null,
    lastSortedFilter: null
};