import { appState, mileageRanges, priceRanges } from './appState';

// 공용 정적 데이터 경로 - 라우트가 바뀌어도 항상 앱 루트 기준으로 로드되도록 PUBLIC_URL을 사용
const SEARCH_TREE_URL = `${process.env.PUBLIC_URL || ''}/data/search_tree.json`;

// 제조사 목록 캐시
let cachedBrandList = null;
let cachedSearchTree = null;

/**
 * GitHub Pages에서 사용 가능한 날짜 목록을 가져옵니다.
 */
export async function fetchAvailableDates() {
    // 1) 우선순위: 제공된 API에서 날짜 목록 조회
    const primaryApi = 'https://car-auction-849074372493.asia-northeast3.run.app/api/dates';
    try {
        const res = await fetch(primaryApi, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`API 호출 실패: ${res.status}`);
        const payload = await res.json();
        
        // 다양한 응답 형태를 허용
        let dates = Array.isArray(payload) ? payload
            : Array.isArray(payload?.dates) ? payload.dates
            : Array.isArray(payload?.data) ? payload.data
            : null;
        if (!Array.isArray(dates)) throw new Error('예상치 못한 응답 형식');
        
        // yymmdd로 정규화 후 유효한 값만 사용
        const normalized = dates
            .map(d => String(d ?? '').trim())
            .map(d => {
                const digits = d.replace(/\D/g, '');
                if (/^\d{6}$/.test(digits)) return digits;     // yymmdd
                if (/^\d{8}$/.test(digits)) return digits.slice(2); // yyyymmdd -> yymmdd
                return null;
            })
            .filter(Boolean);
        appState.availableDates = normalized.sort().reverse();
        if (appState.availableDates.length > 0) return; // 성공 시 반환
    } catch (error) {
        console.warn('[dates] API 호출 실패, 정적 JSON으로 폴백합니다.', error);
    }
    
    // 2) 폴백: 정적 JSON(/sources/dates.json)
    try {
        const response = await fetch('/sources/dates.json', { cache: 'no-cache' });
        if (response.ok) {
            const dates = await response.json();
            const normalized = (Array.isArray(dates) ? dates : [])
                .map(d => String(d ?? '').trim())
                .map(d => {
                    const digits = d.replace(/\D/g, '');
                    if (/^\d{6}$/.test(digits)) return digits;
                    if (/^\d{8}$/.test(digits)) return digits.slice(2);
                    return null;
                })
                .filter(Boolean)
                .sort()
                .reverse();
            appState.availableDates = normalized;
            return;
        }
    } catch (error) {
        console.warn('dates.json을 찾을 수 없습니다. 기본 목록을 사용합니다.');
    }
    
    // 3) 최종 폴백: 하드코딩된 날짜 목록 (개발용)
    const hardcodedDates = ['250825', '250822', '250821', '250820', '250819', '250818', '250814', '250813', '250811', '250809'];
    appState.availableDates = hardcodedDates;
}

/**
 * 데이터 로드 후 필터링 옵션을 초기화합니다.
 */
export function initializeFiltersAndOptions() {
    appState.activeFilters = {
        // 기본 필터 초기화
        title: [],
        model: [],
        submodel: [],
        price: [],
        km: [],
        fuel: [],
        auction_name: [],
        region: [],
        year: []
    };
    
    // 연료 타입 추출
    appState.fuelTypes = [...new Set(appState.allData.map(row => row.fuel).filter(Boolean))].sort();
    
    // 차량 브랜드 추출 (제목에서 [브랜드] 패턴)
    appState.carBrands = [...new Set(appState.allData.map(row => {
        const match = row.title ? row.title.match(/\[(.*?)\]/) : null;
        return match ? match[1] : null;
    }).filter(Boolean))].sort();
    
    // 연식 범위 계산
    const years = appState.allData.map(row => parseInt(row.year, 10)).filter(v => !isNaN(v));
    appState.yearMin = years.length > 0 ? Math.min(...years) : 2000;
    appState.yearMax = years.length > 0 ? Math.max(...years) : 2026;
}

/**
 * 브랜드 목록을 로드합니다.
 */
export async function loadBrandList() {
    if (cachedBrandList) return cachedBrandList;
    try {
        // 앱이 서브 경로나 동적 라우트 하위에서 실행될 때 상대 경로가 깨지는 문제를 예방
        const res = await fetch(SEARCH_TREE_URL, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`search_tree.json fetch failed: ${res.status}`);
        const json = await res.json();
        
        const domestic = json.domestic?.map(brand => brand.label) || [];
        const import_brands = json.import?.map(brand => brand.label) || [];
        
        cachedBrandList = { domestic, import: import_brands };
        return cachedBrandList;
    } catch (err) {
        console.error('[브랜드 목록 로드 실패]', err);
        cachedBrandList = { domestic: [], import: [] };
        return cachedBrandList;
    }
}

/**
 * 검색 트리를 로드합니다.
 */
export async function loadSearchTree() {
    if (cachedSearchTree) return cachedSearchTree;
    try {
        // 앱 라우트가 바뀌어도 올바른 정적 파일 경로를 보장
        const res = await fetch(SEARCH_TREE_URL, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`search_tree.json fetch failed: ${res.status}`);
        const json = await res.json();
        cachedSearchTree = json;
        return cachedSearchTree;
    } catch (err) {
        console.error('[검색 트리 로드 실패]', err);
        cachedSearchTree = { domestic: [], import: [] };
        return cachedSearchTree;
    }
}

/**
 * 브랜드명으로 브랜드 정보를 찾습니다.
 */
export function findBrandByLabel(brandLabel) {
    if (!cachedSearchTree) return null;
    
    const allBrands = [...(cachedSearchTree.domestic || []), ...(cachedSearchTree.import || [])];
    return allBrands.find(brand => brand.label === brandLabel);
}

/**
 * yymmdd 형식으로 날짜 문자열을 정규화합니다.
 */
export function normalizeDateToYYMMDD(input) {
    if (!input) return '';
    const str = String(input).trim();
    // 이미 yymmdd 형식
    if (/^\d{6}$/.test(str)) return str;
    // yyyymmdd -> yymmdd
    if (/^\d{8}$/.test(str)) return str.slice(2);
    // yyyy.mm.dd 또는 yyyy-mm-dd
    const m = str.match(/^(\d{4})[.-](\d{2})[.-](\d{2})$/);
    if (m) {
        const yy = m[1].slice(2);
        const mm = m[2];
        const dd = m[3];
        return `${yy}${mm}${dd}`;
    }
    // 기타 형식은 숫자만 추출해 6자리/8자리 처리
    const digits = str.replace(/\D/g, '');
    if (digits.length === 8) return digits.slice(2);
    if (digits.length === 6) return digits;
    return str;
}

/**
 * yymmdd를 표시용 'yy년 mm월 dd일'로 변환합니다.
 */
export function formatYYMMDDToLabel(input) {
    if (!input) return '';
    const str = String(input).trim();
    const digits = str.replace(/\D/g, '');
    let yy, mm, dd;
    if (digits.length === 6) {
        yy = digits.slice(0, 2);
        mm = digits.slice(2, 4);
        dd = digits.slice(4, 6);
    } else if (digits.length === 8) {
        yy = digits.slice(2, 4);
        mm = digits.slice(4, 6);
        dd = digits.slice(6, 8);
    } else {
        return str;
    }
    return `${yy}년 ${mm}월 ${dd}일`;
}

/**
 * 데이터를 필터링합니다.
 */
export function filterData(data, activeFilters, searchQuery, budgetRange, yearRange) {
    return data.filter(row => {
        // 연식 필터 (activeFilters의 year 배열)
        if (Array.isArray(activeFilters.year) && activeFilters.year.length === 2) {
            const year = parseInt(row.year, 10);
            const [minYear, maxYear] = activeFilters.year;
            if (isNaN(year) || year < minYear || year > maxYear) return false;
        }
        
        // 연식 범위 슬라이더 필터 (yearRange)
        if (yearRange && Array.isArray(yearRange) && yearRange.length === 2) {
            const year = parseInt(row.year, 10);
            const [minYear, maxYear] = yearRange;
            if (isNaN(year) || year < minYear || year > maxYear) return false;
        }
        
        // 경매장 필터
        const auctionArr = activeFilters.auction_name || [];
        const auctionMatch = auctionArr.length === 0
            ? true
            : auctionArr.includes(row.auction_name);

        // 지역 필터
        const regionArr = activeFilters.region || [];
        const regionMatch = regionArr.length === 0
            ? true
            : regionArr.includes(row.region);
        
        // 제조사(차종) 필터
        const titleArr = activeFilters.title || [];
        const brandMatch = titleArr.length === 0
            || (row.title && titleArr.some(val => row.title.includes(`[${val}]`)));
            
        // 모델 필터
        const modelArr = activeFilters.model || [];
        const modelMatch = modelArr.length === 0
            || (row.title && modelArr.some(val => row.title.includes(val)));
            
        // 세부 트림 필터
        const submodelArr = activeFilters.submodel || [];
        const submodelMatch = submodelArr.length === 0
            || (row.title && submodelArr.some(val => {
                const cleanTrimName = val.replace(/\s*\([^)]*\)\s*/g, '').trim();
                return row.title.includes(cleanTrimName);
            }));
            
        // 자유 검색어 필터
        const query = (searchQuery || '').toLowerCase();
        const searchMatch = query === ''
            || (
                (row.title && String(row.title).toLowerCase().includes(query))
                || (row.subtitle && String(row.subtitle).toLowerCase().includes(query))
                || (row.region && String(row.region).toLowerCase().includes(query))
                || (row.auction_name && String(row.auction_name).toLowerCase().includes(query))
                || (row.car_number && String(row.car_number).toLowerCase().includes(query))
            );
            
        // 연료 필터
        const fuelArr = activeFilters.fuel || [];
        const fuelMatch = fuelArr.length === 0 || fuelArr.includes(row.fuel);
        
        // 주행거리 필터
        let kmArr = activeFilters.km || [];
        let kmMatch = true;
        if (kmArr.length > 0) {
            const kmValue = parseInt(row.km, 10);
            kmMatch = kmArr.some(rangeKey => {
                const range = mileageRanges[rangeKey].split('-');
                const min = parseInt(range[0], 10);
                const max = range[1] === 'Infinity' ? Infinity : parseInt(range[1], 10);
                return !isNaN(kmValue) && kmValue >= min && kmValue < max;
            });
        }
        
        // 가격 필터
        let priceArr = activeFilters.price || [];
        let priceMatch = true;
        if (priceArr.length > 0) {
            const priceValue = parseInt(row.price, 10);
            priceMatch = priceArr.some(rangeKey => {
                const range = priceRanges[rangeKey].split('-');
                const min = parseInt(range[0], 10);
                const max = range[1] === 'Infinity' ? Infinity : parseInt(range[1], 10);
                return !isNaN(priceValue) && (max === Infinity ? priceValue >= min : (priceValue >= min && priceValue < max));
            });
        }
        
        // 예산 필터링
        if (budgetRange) {
            const budgetMin = budgetRange.min;
            const budgetMax = budgetRange.max;
            const priceValue = parseInt(row.price, 10);
            if (isNaN(priceValue) || priceValue < budgetMin || (budgetMax !== Infinity && priceValue > budgetMax)) {
                return false;
            }
        }
        
        return (
            brandMatch &&
            modelMatch &&
            submodelMatch &&
            auctionMatch &&
            regionMatch &&
            searchMatch &&
            fuelMatch &&
            kmMatch &&
            priceMatch
        );
    });
}

/**
 * 필터링된 데이터를 정렬합니다.
 */
export function sortFilteredData(filteredData, activeFilters, lastSortedFilter) {
    const priceArr = activeFilters.price || [];
    const kmArr = activeFilters.km || [];
    
    if (priceArr.length > 0 && kmArr.length > 0 && lastSortedFilter) {
        const sorted = [...filteredData];
        if (lastSortedFilter === 'price') {
            sorted.sort((a, b) => (parseInt(a.price, 10) || 0) - (parseInt(b.price, 10) || 0));
        } else if (lastSortedFilter === 'km') {
            sorted.sort((a, b) => (parseInt(a.km, 10) || 0) - (parseInt(b.km, 10) || 0));
        }
        return sorted;
    } else if (priceArr.length > 0) {
        return [...filteredData].sort((a, b) => (parseInt(a.price, 10) || 0) - (parseInt(b.price, 10) || 0));
    } else if (kmArr.length > 0) {
        return [...filteredData].sort((a, b) => (parseInt(a.km, 10) || 0) - (parseInt(b.km, 10) || 0));
    }
    
    return filteredData;
}