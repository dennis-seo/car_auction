// --- 상수 및 상태 관리 ---
export const columnMapping = {
    "sell_number": "출품번호", 
    "title": "차종", 
    "price": "가격<br>(만)", 
    "year": "연식", 
    "km": "주행거리", 
    "fuel": "연료", 
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

// 앱 상태
export const appState = {
    allData: [],
    fuelTypes: [],
    carBrands: [],
    isParsing: false,
    activeFilters: {}
};

// --- 데이터 처리 함수 ---
export function initializeFiltersAndOptions() {
    appState.activeFilters = {
        title: 'all', price: 'all', km: 'all', fuel: 'all'
    };
    appState.fuelTypes = [...new Set(appState.allData.map(row => row.fuel).filter(Boolean))].sort();
    appState.carBrands = [...new Set(appState.allData.map(row => {
        const match = row.title ? row.title.match(/\[(.*?)\]/) : null;
        return match ? match[1] : null;
    }).filter(Boolean))].sort();
}

// 날짜 관련 상수 및 함수
export const SOURCES_PATH = '/Users/jeffrey.bbongs/web_test/sources/';

export async function fetchAvailableDates() {
    try {
        const response = await fetch('/api/dates');  // 실제 API 엔드포인트로 수정 필요
        const dates = await response.json();
        return dates.sort((a, b) => b.localeCompare(a));  // 날짜 내림차순 정렬
    } catch (error) {
        console.error('날짜 목록을 가져오는데 실패했습니다:', error);
        return [];
    }
}

export async function loadCSVForDate(date) {
    try {
        const response = await fetch(`/sources/${date}/auction_data.csv`);
        const csvText = await response.text();
        return csvText;
    } catch (error) {
        console.error('CSV 파일을 로드하는데 실패했습니다:', error);
        return null;
    }
}