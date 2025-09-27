/**
 * 필터 그룹 유틸리티 모듈
 * 
 * 차량 필터링과 관련된 고급 유틸리티 함수들을 제공합니다.
 * 이 모듈은 fuelGroups.js의 기본 기능을 확장하여 더 복잡한 필터링 로직을 구현합니다.
 * 
 * @module FilterGroupUtils
 */

import {
  VEHICLE_TYPE_GROUPS,
  FUEL_GROUPS,
  FILTER_TYPES,
  findGroupLabel
} from './fuelGroups';

/**
 * 제목에서 연료 정보를 추출하는 고급 파서
 * @param {string} title - 차량 제목
 * @returns {string|null} 추출된 연료 타입 또는 null
 */
export const extractFuelFromTitle = (title) => {
  if (!title || typeof title !== 'string') return null;
  
  const lowerTitle = title.toLowerCase();
  
  // 연료 타입별 키워드 매핑
  const fuelKeywords = {
    '가솔린': ['가솔린', '휘발유', 'gasoline', 'petrol'],
    '디젤': ['디젤', '경유', 'diesel'],
    '하이브리드': ['하이브리드', 'hybrid', 'hev'],
    'LPG': ['lpg', '엘피지'],
    '전기': ['전기', 'ev', 'electric', '전동']
  };
  
  for (const [fuelType, keywords] of Object.entries(fuelKeywords)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      return fuelType;
    }
  }
  
  return null;
};

/**
 * 차량 데이터에서 여러 필드를 통해 차량 용도를 추출합니다.
 * @param {Object} carData - 차량 데이터 객체
 * @returns {string|null} 차량 용도 또는 null
 */
export const extractVehicleType = (carData) => {
  if (!carData || typeof carData !== 'object') return null;
  
  // 우선순위에 따라 필드 확인
  const fields = ['vehicleType', 'usage', 'type', 'purpose'];
  
  for (const field of fields) {
    const value = carData[field];
    if (value && typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  
  // 제목에서 용도 정보 추출 시도
  return extractVehicleTypeFromTitle(carData.title);
};

/**
 * 제목에서 차량 용도를 추출하는 함수
 * @param {string} title - 차량 제목
 * @returns {string|null} 차량 용도 또는 null
 */
export const extractVehicleTypeFromTitle = (title) => {
  if (!title || typeof title !== 'string') return null;
  
  const lowerTitle = title.toLowerCase();
  
  // 차량 용도별 키워드 매핑
  const typeKeywords = {
    '렌터카': ['렌터카', '렌트카', 'rent', '대여', '렌탈'],
    '자가용': ['자가용', '개인', '일반', 'private', '승용'],
    '업무용': ['업무용', '사업용', 'business', '법인'],
    '영업용': ['영업용', '택시', '화물', '운송업']
  };
  
  for (const [vehicleType, keywords] of Object.entries(typeKeywords)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      return vehicleType;
    }
  }
  
  return null;
};

/**
 * 차량 데이터에서 연료 정보를 추출합니다.
 * @param {Object} carData - 차량 데이터 객체
 * @returns {string|null} 연료 타입 또는 null
 */
export const extractFuelType = (carData) => {
  if (!carData || typeof carData !== 'object') return null;
  
  // fuel 필드가 있으면 우선 사용
  if (carData.fuel && typeof carData.fuel === 'string') {
    return carData.fuel.trim();
  }
  
  // 제목에서 연료 정보 추출
  return extractFuelFromTitle(carData.title);
};

/**
 * 고급 그룹별 개수 계산 함수
 * 여러 필드와 제목 파싱을 통한 정확한 분류를 수행합니다.
 * @param {Array} data - 차량 데이터 배열
 * @param {string} filterMode - 필터 모드 ('vehicleType' 또는 'fuel')
 * @returns {Record<string, number>} 그룹별 개수
 */
export const calculateAdvancedGroupCounts = (data, filterMode) => {
  if (!Array.isArray(data) || data.length === 0) return {};
  
  const isVehicleMode = filterMode === FILTER_TYPES.VEHICLE_TYPE;
  const groups = isVehicleMode ? VEHICLE_TYPE_GROUPS : FUEL_GROUPS;
  const extractFunction = isVehicleMode ? extractVehicleType : extractFuelType;
  
  const groupCounts = {};
  const unknownValues = new Set();
  
  // 그룹별 개수 초기화
  Object.keys(groups).forEach(label => {
    groupCounts[label] = 0;
  });
  
  // 데이터 분석
  data.forEach(row => {
    const value = extractFunction(row);
    if (!value) return;
    
    const groupLabel = findGroupLabel(value, groups);
    if (groupLabel) {
      groupCounts[groupLabel]++;
    } else {
      unknownValues.add(value);
      groupCounts['기타'] = (groupCounts['기타'] || 0) + 1;
    }
  });
  
  // 개수가 0인 그룹 제거
  Object.keys(groupCounts).forEach(label => {
    if (groupCounts[label] === 0) {
      delete groupCounts[label];
    }
  });
  
  // 디버그 정보
  if (unknownValues.size > 0) {
    console.log(`[FilterGroupUtils] 미분류된 ${isVehicleMode ? '차량 용도' : '연료'} 값들:`, 
                Array.from(unknownValues));
  }
  
  return groupCounts;
};

/**
 * 필터 값이 활성 필터와 일치하는지 확인하는 고급 매처
 * @param {string} value - 확인할 값
 * @param {string[]} activeFilters - 활성 필터 목록
 * @param {string} filterMode - 필터 모드
 * @returns {boolean} 일치 여부
 */
export const matchesActiveFilters = (value, activeFilters, filterMode) => {
  if (!activeFilters || activeFilters.length === 0) return true;
  if (!value) return false;
  
  const groups = filterMode === FILTER_TYPES.VEHICLE_TYPE ? VEHICLE_TYPE_GROUPS : FUEL_GROUPS;
  const groupLabel = findGroupLabel(value, groups) || '기타';
  
  return activeFilters.includes(groupLabel) || activeFilters.includes(value);
};

/**
 * 필터 상태를 분석하여 통계를 제공합니다.
 * @param {Array} data - 차량 데이터 배열
 * @param {string} filterMode - 필터 모드
 * @returns {Object} 필터 통계 객체
 */
export const analyzeFilterStats = (data, filterMode) => {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      totalItems: 0,
      groupCounts: {},
      mostCommonGroup: null,
      uniqueValues: [],
      coverage: 0
    };
  }
  
  const isVehicleMode = filterMode === FILTER_TYPES.VEHICLE_TYPE;
  const groups = isVehicleMode ? VEHICLE_TYPE_GROUPS : FUEL_GROUPS;
  const extractFunction = isVehicleMode ? extractVehicleType : extractFuelType;
  
  const groupCounts = calculateAdvancedGroupCounts(data, filterMode);
  const uniqueValues = new Set();
  let classifiedCount = 0;
  
  data.forEach(row => {
    const value = extractFunction(row);
    if (value) {
      uniqueValues.add(value);
      const groupLabel = findGroupLabel(value, groups);
      if (groupLabel) {
        classifiedCount++;
      }
    }
  });
  
  // 가장 많은 그룹 찾기
  const mostCommonGroup = Object.entries(groupCounts).reduce((max, [label, count]) => {
    return count > (max?.count || 0) ? { label, count } : max;
  }, null);
  
  const coverage = data.length > 0 ? (classifiedCount / data.length) * 100 : 0;
  
  return {
    totalItems: data.length,
    groupCounts,
    mostCommonGroup,
    uniqueValues: Array.from(uniqueValues),
    coverage: Math.round(coverage * 100) / 100
  };
};

/**
 * 필터 그룹 설정을 검증합니다.
 * @param {Object} groups - 그룹 정의 객체
 * @returns {Object} 검증 결과
 */
export const validateGroupConfiguration = (groups) => {
  const issues = [];
  const allVariants = new Set();
  const duplicates = new Set();
  
  Object.entries(groups).forEach(([groupLabel, variants]) => {
    if (!Array.isArray(variants)) {
      issues.push(`그룹 '${groupLabel}'의 변형이 배열이 아닙니다.`);
      return;
    }
    
    variants.forEach(variant => {
      if (allVariants.has(variant)) {
        duplicates.add(variant);
      } else {
        allVariants.add(variant);
      }
    });
    
    if (variants.length === 0) {
      issues.push(`그룹 '${groupLabel}'에 변형이 없습니다.`);
    }
  });
  
  return {
    isValid: issues.length === 0 && duplicates.size === 0,
    issues,
    duplicates: Array.from(duplicates),
    totalVariants: allVariants.size,
    totalGroups: Object.keys(groups).length
  };
};

// 기본 내보내기
const FilterGroupUtils = {
  extractFuelFromTitle,
  extractVehicleType,
  extractVehicleTypeFromTitle,
  extractFuelType,
  calculateAdvancedGroupCounts,
  matchesActiveFilters,
  analyzeFilterStats,
  validateGroupConfiguration
};

export default FilterGroupUtils;