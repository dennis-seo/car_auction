import { appState, parsedMileageRanges, parsedPriceRanges } from './appState';
import { API_ENDPOINTS } from './apiConfig';
import auctionManager from './auctionManager';

// 상수 정의
const DATE_FORMATS = {
    YYMMDD: /^\d{6}$/,
    YYYYMMDD: /^\d{8}$/,
    YYYY_MM_DD: /^(\d{4})[.-](\d{2})[.-](\d{2})$/
};

const DEFAULT_YEAR_RANGE = { min: 2000, max: 2026 };

const CACHE_CONFIG = { cache: 'no-cache' };

// 공용 정적 데이터 경로 - 라우트가 바뀌어도 항상 앱 루트 기준으로 로드되도록 PUBLIC_URL을 사용
const SEARCH_TREE_URL = `${process.env.PUBLIC_URL || ''}/data/search_tree.json`;

// 제조사 목록 캐시
let cachedBrandList = null;
let cachedSearchTree = null;

// 유틸리티 함수들
/**
 * 안전한 정수 파싱 (NaN 대신 기본값 반환)
 */
function safeParseInt(value, defaultValue = 0) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 범위 체크 유틸리티
 */
function isInRange(value, min, max) {
    return value >= min && (max === Infinity || value <= max);
}

/**
 * 날짜 문자열을 yymmdd로 정규화하는 헬퍼 함수
 */
function normalizeDateString(dateStr) {
    const digits = dateStr.replace(/\D/g, '');
    if (DATE_FORMATS.YYMMDD.test(digits)) return digits;     // yymmdd
    if (DATE_FORMATS.YYYYMMDD.test(digits)) return digits.slice(2); // yyyymmdd -> yymmdd
    return null;
}

/**
 * 배열에서 유효한 날짜만 추출하고 정규화
 */
function extractValidDates(dates) {
    return dates
        .map(d => String(d ?? '').trim())
        .map(normalizeDateString)
        .filter(Boolean);
}

/**
 * GitHub Pages에서 사용 가능한 날짜 목록을 가져옵니다.
 * @returns {Promise<Array>} 정규화된 날짜 배열
 */
export async function fetchAvailableDates() {
    // 1) 우선순위: 제공된 API에서 날짜 목록 조회
    const primaryApi = API_ENDPOINTS.dates;
    try {
        const res = await fetch(primaryApi, CACHE_CONFIG);
        if (!res.ok) throw new Error(`API 호출 실패: ${res.status}`);
        const payload = await res.json();

        // 다양한 응답 형태를 허용
        let dates = Array.isArray(payload) ? payload
            : Array.isArray(payload?.dates) ? payload.dates
            : Array.isArray(payload?.data) ? payload.data
            : null;
        if (!Array.isArray(dates)) throw new Error('예상치 못한 응답 형식');

        // yymmdd로 정규화 후 유효한 값만 사용
        const normalized = extractValidDates(dates);
        const sortedDates = normalized.sort().reverse();

        // appState는 여전히 업데이트하지만 값도 반환
        appState.availableDates = sortedDates;
        return sortedDates;
    } catch (error) {
        console.warn('[dates] API 호출 실패', error);
        // 실패 시 명시적으로 비워두고 호출자에게 오류를 전달
        appState.availableDates = [];
        throw error;
    }
}

/**
 * 데이터 로드 후 필터링 옵션을 초기화합니다.
 * @param {Array} data - 초기화할 데이터
 * @returns {Object} 초기화된 필터 및 옵션 정보
 */
export function initializeFiltersAndOptions(data) {
    // AuctionManager 초기화
    auctionManager.initializeFromData(data);

    // 연료 타입 추출
    const fuelTypes = [...new Set(data.map(row => row.fuel).filter(Boolean))].sort();

    // 차량 용도 타입 추출 (오토허브 경매장용)
    const vehicleTypes = [...new Set(data.map(row =>
        row.vehicleType || row.usage || row.type || row.purpose || row.fuel
    ).filter(Boolean))].sort();

    // 차량 브랜드 추출 (제목에서 [브랜드] 패턴)
    const carBrands = [...new Set(data.map(row => {
        const match = row.title ? row.title.match(/\[(.*?)\]/) : null;
        return match ? match[1] : null;
    }).filter(Boolean))].sort();

    // 연식 범위 계산
    const years = data
        .map(row => safeParseInt(row.year))
        .filter(year => year > 0);

    const yearMin = years.length > 0 ? Math.min(...years) : DEFAULT_YEAR_RANGE.min;
    const yearMax = years.length > 0 ? Math.max(...years) : DEFAULT_YEAR_RANGE.max;

    // appState는 여전히 업데이트 (하위 호환성)
    appState.fuelTypes = fuelTypes;
    appState.vehicleTypes = vehicleTypes;
    appState.carBrands = carBrands;
    appState.yearMin = yearMin;
    appState.yearMax = yearMax;
    appState.activeFilters = {
        title: [],
        model: [],
        submodel: [],
        price: [],
        km: [],
        fuel: [],
        vehicleType: [],
        auction_name: [],
        region: [],
        year: []
    };

    // AuctionManager 디버그 정보 출력
    if (process.env.NODE_ENV === 'development') {
        auctionManager.debugInfo();
    }

    // 초기화된 값들을 반환
    return {
        fuelTypes,
        vehicleTypes,
        carBrands,
        yearMin,
        yearMax
    };
}

/**
 * 브랜드 목록을 로드합니다.
 */
export async function loadBrandList() {
    if (cachedBrandList) return cachedBrandList;
    try {
        // 앱이 서브 경로나 동적 라우트 하위에서 실행될 때 상대 경로가 깨지는 문제를 예방
        const res = await fetch(SEARCH_TREE_URL, CACHE_CONFIG);
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
        const res = await fetch(SEARCH_TREE_URL, CACHE_CONFIG);
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
    if (DATE_FORMATS.YYMMDD.test(str)) return str;
    // yyyymmdd -> yymmdd
    if (DATE_FORMATS.YYYYMMDD.test(str)) return str.slice(2);
    // yyyy.mm.dd 또는 yyyy-mm-dd
    const m = str.match(DATE_FORMATS.YYYY_MM_DD);
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
 * 데이터를 필터링합니다. (최적화 버전)
 */
export function filterData(data, activeFilters, searchQuery, budgetRange, yearRange) {
    // 사전 처리: 검색어 소문자 변환 (한 번만)
    const lowerQuery = (searchQuery || '').toLowerCase();

    // 사전 처리: 모델/서브모델 정규식 결과 캐싱
    const modelArr = activeFilters.model || [];
    const cleanedModels = modelArr.map(val => val.replace(/\s*\([^)]*\)\s*/g, '').trim());

    const submodelArr = activeFilters.submodel || [];
    const cleanedSubmodels = submodelArr.map(val => val.replace(/\s*\([^)]*\)\s*$/, '').trim());

    // 필터 배열 사전 추출 (반복 접근 최소화)
    const titleArr = activeFilters.title || [];
    const auctionArr = activeFilters.auction_name || [];
    const regionArr = activeFilters.region || [];
    const fuelArr = activeFilters.fuel || [];
    const vehicleTypeArr = activeFilters.vehicleType || [];
    const kmArr = activeFilters.km || [];
    const priceArr = activeFilters.price || [];
    const yearArr = activeFilters.year || [];

    // 빠른 종료 조건들
    const hasYearFilter = Array.isArray(yearArr) && yearArr.length === 2;
    const hasYearRange = yearRange && Array.isArray(yearRange) && yearRange.length === 2;
    const hasBudget = !!budgetRange;
    const hasSearch = lowerQuery !== '';

    return data.filter(row => {
        // 연식 필터 (가장 빠른 체크)
        if (hasYearFilter) {
            const year = safeParseInt(row.year);
            if (year < yearArr[0] || year > yearArr[1]) return false;
        }
        if (hasYearRange) {
            const year = safeParseInt(row.year);
            if (year < yearRange[0] || year > yearRange[1]) return false;
        }

        // 경매장/지역 필터 (단순 includes 체크)
        if (auctionArr.length > 0 && !auctionArr.includes(row.auction_name)) return false;
        if (regionArr.length > 0 && !regionArr.includes(row.region)) return false;

        // 연료/차량용도 필터
        if (fuelArr.length > 0 && !fuelArr.includes(row.fuel)) return false;
        if (vehicleTypeArr.length > 0) {
            const vehicleType = row.vehicleType || row.usage || row.type || row.purpose || row.fuel;
            if (!vehicleTypeArr.includes(vehicleType)) return false;
        }

        // 브랜드/모델/서브모델 필터
        if (titleArr.length > 0 && !(row.title && titleArr.some(val => row.title.includes(val)))) return false;
        if (cleanedModels.length > 0 && !(row.title && cleanedModels.some(val => row.title.includes(val)))) return false;
        if (cleanedSubmodels.length > 0 && !(row.title && cleanedSubmodels.some(val => row.title.includes(val)))) return false;

        // 검색어 필터
        if (hasSearch) {
            const titleLower = row.title ? String(row.title).toLowerCase() : '';
            const subtitleLower = row.subtitle ? String(row.subtitle).toLowerCase() : '';
            const regionLower = row.region ? String(row.region).toLowerCase() : '';
            const auctionLower = row.auction_name ? String(row.auction_name).toLowerCase() : '';
            const carNumLower = row.car_number ? String(row.car_number).toLowerCase() : '';

            if (!titleLower.includes(lowerQuery) &&
                !subtitleLower.includes(lowerQuery) &&
                !regionLower.includes(lowerQuery) &&
                !auctionLower.includes(lowerQuery) &&
                !carNumLower.includes(lowerQuery)) {
                return false;
            }
        }

        // 주행거리 필터
        if (kmArr.length > 0) {
            const kmValue = safeParseInt(row.km);
            const kmMatch = kmArr.some(rangeKey => {
                const range = parsedMileageRanges[rangeKey];
                return range && isInRange(kmValue, range.min, range.max);
            });
            if (!kmMatch) return false;
        }

        // 가격 필터
        if (priceArr.length > 0) {
            const priceValue = safeParseInt(row.price);
            const priceMatch = priceArr.some(rangeKey => {
                const range = parsedPriceRanges[rangeKey];
                return range && isInRange(priceValue, range.min, range.max);
            });
            if (!priceMatch) return false;
        }

        // 예산 필터
        if (hasBudget) {
            const priceValue = safeParseInt(row.price);
            if (!isInRange(priceValue, budgetRange.min, budgetRange.max)) return false;
        }

        return true;
    });
}

/**
 * 가격 기준 오름차순 정렬
 */
function sortByPriceAsc(list) {
    return [...list].sort((a, b) => {
        const ap = safeParseInt(a.price);
        const bp = safeParseInt(b.price);
        return ap - bp;
    });
}

/**
 * 연식 기준 내림차순 정렬
 */
function sortByYearDesc(list) {
    return [...list].sort((a, b) => {
        const ay = safeParseInt(a.year);
        const by = safeParseInt(b.year);
        return by - ay;
    });
}

/**
 * 주행거리 기준 오름차순 정렬
 */
function sortByKmAsc(list) {
    return [...list].sort((a, b) => safeParseInt(a.km) - safeParseInt(b.km));
}

/**
 * 필터링된 데이터를 정렬합니다.
 */
export function sortFilteredData(filteredData, activeFilters, budgetRange, yearRange, lastSortedFilter) {
    const priceArr = activeFilters.price || [];
    const kmArr = activeFilters.km || [];
    
    // 새로운 요구사항: 예산/연식 정렬 우선
    const budgetActive = !!budgetRange;
    const yearActive = (Array.isArray(activeFilters.year) && activeFilters.year.length === 2)
        || (Array.isArray(yearRange) && yearRange.length === 2);
    
    // 예산과 연식이 모두 활성화된 경우
    if (budgetActive && yearActive) {
        if (lastSortedFilter === 'budget') {
            return sortByPriceAsc(filteredData);
        } else if (lastSortedFilter === 'year') {
            return sortByYearDesc(filteredData);
        }
        // 기본값: 예산 기준
        return sortByPriceAsc(filteredData);
    }
    
    // 개별 필터 우선순위
    if (budgetActive) {
        return sortByPriceAsc(filteredData);
    }
    
    if (yearActive) {
        return sortByYearDesc(filteredData);
    }
    
    // 기존 테이블 헤더 정렬 로직 유지
    if (priceArr.length > 0 && kmArr.length > 0 && lastSortedFilter) {
        if (lastSortedFilter === 'price') {
            return sortByPriceAsc(filteredData);
        } else if (lastSortedFilter === 'km') {
            return sortByKmAsc(filteredData);
        }
    } else if (priceArr.length > 0) {
        return sortByPriceAsc(filteredData);
    } else if (kmArr.length > 0) {
        return sortByKmAsc(filteredData);
    }
    
    return filteredData;
}