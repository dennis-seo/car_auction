/**
 * 차량 필터 그룹 정의 모듈
 * 
 * 이 모듈은 차량 필터링에 사용되는 그룹 정의와 유틸리티를 제공합니다.
 * - 차량 용도 그룹 (오토허브 경매장용)
 * - 연료 타입 그룹 (일반 경매장용)
 * - 그룹 매핑 및 검증 유틸리티
 * 
 * @module FilterGroups
 */

// ===== 상수 정의 =====

/**
 * 차량 용도별 그룹 정의 (오토허브 경매장용)
 * @type {Record<string, string[]>}
 */
export const VEHICLE_TYPE_GROUPS = Object.freeze({
  '렌터카': ['렌터카', '렌트카', 'RENT', '대여', '렌탈'],
  '자가용': ['자가용', '개인', '일반', 'PRIVATE', '승용'],
  '업무용': ['업무용', '사업용', 'BUSINESS', '법인'],
  '영업용': ['영업용', '택시', '화물', '운송업'],
  '기타': ['기타', '수출용', '폐차', 'ETC', '특수']
});

/**
 * 연료별 그룹 정의 (일반 경매장용)
 * @type {Record<string, string[]>}
 */
export const FUEL_GROUPS = Object.freeze({
  '가솔린': ['가솔린', '휘발유'],
  '디젤': ['디젤', '경유'],
  '하이브리드': ['하이브리드', '가솔린하이브리드'],
  'LPG': ['LPG'],
  '전기': ['전기']
});

/**
 * 모든 차량 용도 변형 목록
 * @type {ReadonlyArray<string>}
 */
export const ALL_VEHICLE_TYPE_VARIANTS = Object.freeze(
  Object.values(VEHICLE_TYPE_GROUPS).flat()
);

/**
 * 모든 연료 타입 변형 목록
 * @type {ReadonlyArray<string>}
 */
export const ALL_FUEL_VARIANTS = Object.freeze(
  Object.values(FUEL_GROUPS).flat()
);

/**
 * 필터 타입 열거형
 * @enum {string}
 */
export const FILTER_TYPES = Object.freeze({
  VEHICLE_TYPE: 'vehicleType',
  FUEL: 'fuel'
});

// ===== 그룹 매핑 유틸리티 =====

/**
 * 특정 그룹에서 값이 속하는 그룹 라벨을 찾습니다.
 * @param {string} value - 검색할 값
 * @param {Record<string, string[]>} groups - 그룹 정의
 * @returns {string|null} 해당하는 그룹 라벨 또는 null
 */
export const findGroupLabel = (value, groups) => {
  if (!value || typeof value !== 'string') return null;
  
  const normalizedValue = value.trim();
  
  for (const [label, variants] of Object.entries(groups)) {
    if (variants.includes(normalizedValue)) {
      return label;
    }
  }
  
  return null;
};

/**
 * 차량 용도 값에서 그룹 라벨을 찾습니다.
 * @param {string} vehicleType - 차량 용도 값
 * @returns {string} 그룹 라벨 (찾지 못하면 '기타')
 */
export const getVehicleTypeGroup = (vehicleType) => {
  return findGroupLabel(vehicleType, VEHICLE_TYPE_GROUPS) || '기타';
};

/**
 * 연료 타입 값에서 그룹 라벨을 찾습니다.
 * @param {string} fuelType - 연료 타입 값
 * @returns {string} 그룹 라벨 (찾지 못하면 '기타')
 */
export const getFuelTypeGroup = (fuelType) => {
  return findGroupLabel(fuelType, FUEL_GROUPS) || '기타';
};

// ===== 그룹 검증 유틸리티 =====

/**
 * 값이 특정 그룹에 속하는지 확인합니다.
 * @param {string} value - 확인할 값
 * @param {string} groupLabel - 그룹 라벨
 * @param {Record<string, string[]>} groups - 그룹 정의
 * @returns {boolean} 해당 그룹 포함 여부
 */
export const isValueInGroup = (value, groupLabel, groups) => {
  const variants = groups[groupLabel];
  return variants ? variants.includes(value) : false;
};

/**
 * 값이 차량 용도 그룹에 속하는지 확인합니다.
 * @param {string} value - 확인할 값
 * @param {string} groupLabel - 차량 용도 그룹 라벨
 * @returns {boolean} 해당 그룹 포함 여부
 */
export const isVehicleTypeInGroup = (value, groupLabel) => {
  return isValueInGroup(value, groupLabel, VEHICLE_TYPE_GROUPS);
};

/**
 * 값이 연료 타입 그룹에 속하는지 확인합니다.
 * @param {string} value - 확인할 값
 * @param {string} groupLabel - 연료 타입 그룹 라벨
 * @returns {boolean} 해당 그룹 포함 여부
 */
export const isFuelTypeInGroup = (value, groupLabel) => {
  return isValueInGroup(value, groupLabel, FUEL_GROUPS);
};

// ===== 데이터 분석 유틸리티 =====

/**
 * 데이터에서 그룹별 개수를 계산합니다.
 * @param {Array} data - 차량 데이터 배열
 * @param {string} fieldName - 분석할 필드명
 * @param {Record<string, string[]>} groups - 사용할 그룹 정의
 * @returns {Record<string, number>} 그룹별 개수
 */
export const calculateGroupCounts = (data, fieldName, groups) => {
  if (!Array.isArray(data)) return {};
  
  const groupCounts = {};
  const otherValues = new Set();
  
  // 정의된 그룹별 개수 초기화
  Object.keys(groups).forEach(label => {
    groupCounts[label] = 0;
  });
  
  // 데이터 순회하며 개수 계산
  data.forEach(row => {
    const value = row?.[fieldName];
    if (!value) return;
    
    const groupLabel = findGroupLabel(value, groups);
    if (groupLabel) {
      groupCounts[groupLabel]++;
    } else {
      otherValues.add(value);
    }
  });
  
  // 기타 그룹 처리
  if (otherValues.size > 0) {
    groupCounts['기타'] = otherValues.size;
  }
  
  // 개수가 0인 그룹 제거
  Object.keys(groupCounts).forEach(label => {
    if (groupCounts[label] === 0) {
      delete groupCounts[label];
    }
  });
  
  return groupCounts;
};

/**
 * 차량 데이터에서 차량 용도별 개수를 계산합니다.
 * @param {Array} data - 차량 데이터 배열
 * @returns {Record<string, number>} 차량 용도별 개수
 */
export const getVehicleTypeCounts = (data) => {
  // 여러 필드에서 차량 용도 정보를 찾아서 계산
  const vehicleTypeData = data.map(row => ({
    vehicleType: row?.vehicleType || row?.usage || row?.type || row?.purpose
  }));
  
  return calculateGroupCounts(vehicleTypeData, 'vehicleType', VEHICLE_TYPE_GROUPS);
};

/**
 * 차량 데이터에서 연료 타입별 개수를 계산합니다.
 * @param {Array} data - 차량 데이터 배열
 * @returns {Record<string, number>} 연료 타입별 개수
 */
export const getFuelTypeCounts = (data) => {
  return calculateGroupCounts(data, 'fuel', FUEL_GROUPS);
};

// ===== 호환성 유지를 위한 Deprecated 함수들 =====

/**
 * @deprecated AuctionManager.hasAutoHubAuction() 사용을 권장합니다.
 * 데이터에 오토허브 경매장이 포함되어 있는지 확인하는 함수
 */
export const isAutoHubAuction = (data) => {
  console.warn('isAutoHubAuction() is deprecated. Use AuctionManager.hasAutoHubAuction() instead.');
  if (!Array.isArray(data) || data.length === 0) return false;
  return data.some(row => row.auction_name === "오토허브 경매장");
};

/**
 * @deprecated AuctionManager.getFilterMode() 사용을 권장합니다.
 * 현재 데이터 상황에 따라 사용해야 할 필터 그룹을 결정하는 함수
 */
export const getFilterMode = (data) => {
  console.warn('getFilterMode() is deprecated. Use AuctionManager.getFilterMode() instead.');
  return isAutoHubAuction(data) ? FILTER_TYPES.VEHICLE_TYPE : FILTER_TYPES.FUEL;
};

// ===== 기본 내보내기 =====

/**
 * 필터 그룹 관련 모든 기능을 포함하는 객체
 */
const FilterGroupUtils = {
  // 상수
  VEHICLE_TYPE_GROUPS,
  FUEL_GROUPS,
  ALL_VEHICLE_TYPE_VARIANTS,
  ALL_FUEL_VARIANTS,
  FILTER_TYPES,
  
  // 그룹 매핑
  findGroupLabel,
  getVehicleTypeGroup,
  getFuelTypeGroup,
  
  // 그룹 검증
  isValueInGroup,
  isVehicleTypeInGroup,
  isFuelTypeInGroup,
  
  // 데이터 분석
  calculateGroupCounts,
  getVehicleTypeCounts,
  getFuelTypeCounts,
  
  // Deprecated (호환성용)
  isAutoHubAuction,
  getFilterMode
};

export default FilterGroupUtils;
