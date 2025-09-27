import React, { useMemo, useCallback } from 'react';
import { 
  VEHICLE_TYPE_GROUPS, 
  ALL_VEHICLE_TYPE_VARIANTS, 
  FUEL_GROUPS, 
  ALL_FUEL_VARIANTS,
  FILTER_TYPES
} from '../utils/fuelGroups';
import { calculateAdvancedGroupCounts } from '../utils/filterGroupUtils';
import auctionManager from '../utils/auctionManager';

// 차량 용도별 아이콘 (오토허브용)
const VEHICLE_TYPE_ICONS = {
  '렌터카': '🚗',
  '자가용': '🏠',
  '업무용': '💼',
  '영업용': '🚕',
  '기타': '🔧'
};

// 연료별 아이콘 (기타 경매장용)
const FUEL_ICONS = {
  '가솔린': '⛽',
  '디젤': '🚛',
  '하이브리드': '🔋',
  'LPG': '💨',
  '전기': '🔌',
  '기타': '🌿'
};

/**
 * 필터 설정 구성 객체를 생성합니다.
 * @param {string} filterMode - 필터 모드 ('vehicleType' 또는 'fuel')
 * @returns {Object} 필터 설정 객체
 */
const createFilterConfig = (filterMode) => {
  const isVehicleMode = filterMode === FILTER_TYPES.VEHICLE_TYPE;
  
  return Object.freeze({
    groups: isVehicleMode ? VEHICLE_TYPE_GROUPS : FUEL_GROUPS,
    allVariants: isVehicleMode ? ALL_VEHICLE_TYPE_VARIANTS : ALL_FUEL_VARIANTS,
    icons: isVehicleMode ? VEHICLE_TYPE_ICONS : FUEL_ICONS,
    filterKey: filterMode,
    title: isVehicleMode ? '어떤 용도의 차량을 찾고 계신가요?' : '무슨 연료의 차량을 원하시나요?',
    titleIcon: isVehicleMode ? '🚙' : '⛽',
    sectionClass: isVehicleMode ? 'vehicle-type-filter-section' : 'fuel-filter-section',
    optionsClass: isVehicleMode ? 'vehicle-type-filter-options' : 'fuel-filter-options',
    buttonClass: isVehicleMode ? 'vehicle-type-option' : 'fuel-option',
    titleClass: isVehicleMode ? 'vehicle-type-title' : 'fuel-title',
    iconClass: isVehicleMode ? 'vehicle-type-icon' : 'fuel-icon',
    labelClass: isVehicleMode ? 'vehicle-type-option-label' : 'fuel-option-label',
    countClass: isVehicleMode ? 'vehicle-type-option-count' : 'fuel-option-count'
  });
};

/**
 * 기타 그룹에 속하는 값들을 찾습니다.
 * @param {Record<string, number>} groupCounts - 그룹별 개수
 * @param {string[]} allVariants - 정의된 모든 변형 목록
 * @returns {string[]} 기타 그룹에 속하는 값들
 */
const getOtherGroupValues = (groupCounts, allVariants) => {
  return Object.keys(groupCounts).filter(type => !allVariants.includes(type));
};

/**
 * 동적 필터 컴포넌트
 * - 오토허브 경매장: 차량 용도별 필터링 (렌터카, 자가용, 업무용, 영업용, 기타)
 * - 기타 경매장: 연료별 필터링 (가솔린, 디젤, 하이브리드, LPG, 전기, 기타)
 * AuctionManager와 리팩토링된 FilterGroups를 통해 필터 모드를 결정합니다.
 */
const DynamicFilter = ({ data, activeFilters, onUpdateFilter }) => {
  // AuctionManager를 통해 필터 모드 결정
  const filterMode = useMemo(() => {
    // AuctionManager가 초기화된 경우 해당 결과 사용
    if (auctionManager.isReady()) {
      const mode = auctionManager.getFilterMode();
      console.log('[DynamicFilter] AuctionManager에서 결정된 필터 모드:', mode);
      return mode;
    }
    
    // 백업: 기존 로직 사용
    console.log('[DynamicFilter] AuctionManager 미초기화, 백업 로직 사용');
    return data && data.some(row => row.auction_name === "오토허브 경매장") 
      ? FILTER_TYPES.VEHICLE_TYPE 
      : FILTER_TYPES.FUEL;
  }, [data]);

  // 필터 모드에 따른 설정값들
  const config = useMemo(() => createFilterConfig(filterMode), [filterMode]);

  // 고급 그룹 개수 계산을 사용하여 더 정확한 분류
  const groupCounts = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return {};
    
    const counts = calculateAdvancedGroupCounts(data, filterMode);
    console.log(`[DynamicFilter] ${filterMode} 모드 그룹 개수:`, counts);
    
    return counts;
  }, [data, filterMode]);

  // 활성화된 필터 값들
  const activeValues = useMemo(() => 
    activeFilters?.[config.filterKey] || [], 
    [activeFilters, config.filterKey]
  );

  // 그룹 활성화 상태 확인
  const isGroupActive = useCallback((groupLabel) => {
    if (groupLabel === '전체') {
      return activeValues.length === 0;
    }
    
    if (groupLabel === '기타') {
      const otherValues = getOtherGroupValues(groupCounts, config.allVariants);
      return otherValues.some(value => activeValues.includes(value));
    }
    
    const variants = config.groups[groupLabel] || [groupLabel];
    return variants.some(variant => activeValues.includes(variant));
  }, [activeValues, groupCounts, config.allVariants, config.groups]);

  // 그룹의 모든 변형이 활성화되어 있는지 확인
  const isGroupFullyActive = useCallback((groupLabel) => {
    if (groupLabel === '기타') {
      const otherValues = getOtherGroupValues(groupCounts, config.allVariants);
      return otherValues.length > 0 && otherValues.every(value => activeValues.includes(value));
    }
    
    const variants = config.groups[groupLabel] || [groupLabel];
    return variants.length > 0 && variants.every(variant => activeValues.includes(variant));
  }, [activeValues, groupCounts, config.allVariants, config.groups]);

  // 그룹 토글 처리
  const handleToggleGroup = useCallback((groupLabel) => {
    console.log(`[DynamicFilter] 그룹 토글: ${groupLabel}`);
    
    if (groupLabel === '전체') {
      onUpdateFilter(config.filterKey, [], 'set');
      return;
    }

    let variants = [];
    if (groupLabel === '기타') {
      variants = getOtherGroupValues(groupCounts, config.allVariants);
    } else {
      variants = config.groups[groupLabel] || [groupLabel];
    }

    if (variants.length === 0) {
      console.warn(`[DynamicFilter] 그룹 '${groupLabel}'에 변형이 없습니다.`);
      return;
    }

    // 그룹의 모든 변형이 활성화되어 있으면 제거, 아니면 추가
    if (isGroupFullyActive(groupLabel)) {
      console.log(`[DynamicFilter] 그룹 '${groupLabel}' 비활성화`);
      variants.forEach(variant => onUpdateFilter(config.filterKey, variant, 'toggle'));
    } else {
      console.log(`[DynamicFilter] 그룹 '${groupLabel}' 활성화`);
      const newValues = Array.from(new Set([...activeValues, ...variants]));
      onUpdateFilter(config.filterKey, newValues, 'set');
    }
  }, [activeValues, groupCounts, config, onUpdateFilter, isGroupFullyActive]);

  // 렌더링할 버튼 목록 생성
  const filterButtons = useMemo(() => {
    const buttons = [
      { label: '전체', count: data?.length || 0 }
    ];
    
    // 개수가 있는 그룹만 추가 (내림차순 정렬)
    const sortedGroups = Object.entries(groupCounts)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a);
    
    sortedGroups.forEach(([label, count]) => {
      buttons.push({ label, count });
    });
    
    return buttons;
  }, [groupCounts, data?.length]);

  // 빈 데이터 처리
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className={config.sectionClass} aria-label={`${filterMode === FILTER_TYPES.VEHICLE_TYPE ? '차량 용도' : '연료'} 필터`}>
        <div className={config.titleClass}>
          <span className={config.iconClass}>{config.titleIcon}</span>
          <h4>{config.title}</h4>
        </div>
        <div className={config.optionsClass}>
          <p style={{ textAlign: 'center', color: '#888', padding: '1rem' }}>
            데이터가 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={config.sectionClass} aria-label={`${filterMode === FILTER_TYPES.VEHICLE_TYPE ? '차량 용도' : '연료'} 필터`}>
      <div className={config.titleClass}>
        <span className={config.iconClass}>{config.titleIcon}</span>
        <h4>{config.title}</h4>
      </div>
      <div className={config.optionsClass} id={`${filterMode}-buttons`}>
        {filterButtons.map(({ label, count }) => {
          const isActive = isGroupActive(label);
          const icon = config.icons[label] || '❓';
          
          return (
            <button
              key={label}
              type="button"
              className={`${config.buttonClass}${isActive ? ' active' : ''}`}
              onClick={() => handleToggleGroup(label)}
              title={`${label} 필터 ${isActive ? '해제' : '적용'}`}
            >
              <span className={`${config.buttonClass}-icon`} aria-hidden="true">
                {icon}
              </span>
              <span className={config.labelClass}>{label}</span>
              <span className={config.countClass}>
                {count.toLocaleString('ko-KR')}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* 디버그 정보 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ fontSize: '0.8em', color: '#666', padding: '0.5rem' }}>
          필터 모드: {filterMode} | 활성 필터: {activeValues.length}개
        </div>
      )}
    </div>
  );
};

export default DynamicFilter;
