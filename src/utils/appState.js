// 앱 전역 상태 관리
export const columnMapping = {
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

export const mileageRanges = {
    "3만km 이하": "0-30000",
    "3만km ~ 5만km": "30000-50000",
    "5만km ~ 10만km": "50000-100000",
    "10만km ~ 15만km": "100000-150000",
    "15만km ~ 20만km": "150000-200000",
    "20만km 이상": "200000-Infinity"
};

export const priceRanges = {
    "500만원 이하": "0-500",
    "500 ~ 1,000만원": "500-1000",
    "1,000 ~ 2,000만원": "1000-2000",
    "2,000 ~ 3,000만원": "2000-3000",
    "3,000만원 이상": "3000-Infinity"
};

// 사전 파싱된 범위 객체 (성능 최적화)
export const parsedMileageRanges = Object.fromEntries(
    Object.entries(mileageRanges).map(([key, val]) => {
        const [min, max] = val.split('-');
        return [key, { min: parseInt(min, 10), max: max === 'Infinity' ? Infinity : parseInt(max, 10) }];
    })
);

export const parsedPriceRanges = Object.fromEntries(
    Object.entries(priceRanges).map(([key, val]) => {
        const [min, max] = val.split('-');
        return [key, { min: parseInt(min, 10), max: max === 'Infinity' ? Infinity : parseInt(max, 10) }];
    })
);

// 앱 상태 - React용으로 수정
export const appState = {
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