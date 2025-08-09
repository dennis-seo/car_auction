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
    availableDates: [], // 사용 가능한 날짜(폴더명) 목록
    activeFilters: {}
};

/**
 * GitHub API를 호출하여 sources 폴더 아래의 날짜 폴더 목록을 실제로 가져옵니다.
 */
export async function fetchAvailableDates() {
    // 깃허브 사용자 이름과 저장소 이름을 여기에 입력하세요.
    const owner = "dennis-seo"; // 님의 GitHub 사용자 이름
    const repo = "car_auction";  // 님의 저장소 이름

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/sources`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`GitHub API 호출 실패: ${response.status}`);
        }
        const contents = await response.json();
        
        // 가져온 내용 중에서 '폴더(dir)'인 것만 필터링하여 이름(날짜)을 추출합니다.
        const dateFolders = contents
            .filter(item => item.type === 'dir')
            .map(item => item.name);
            
        // appState에 실제 폴더 목록을 저장합니다.
        appState.availableDates = dateFolders.sort().reverse(); // 최신순으로 정렬
        
    } catch (error) {
        console.error("폴더 목록을 가져오는 데 실패했습니다:", error);
        // 에러 발생 시 사용자에게 알림
        alert("경매 날짜 목록을 불러오는 데 실패했습니다. 저장소 상태를 확인해주세요.");
        // 에러가 발생해도 앱이 멈추지 않도록 빈 배열을 반환합니다.
        appState.availableDates = [];
    }
}

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