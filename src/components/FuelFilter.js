import React, { useMemo, useCallback } from 'react';
import { FUEL_GROUPS } from '../utils/fuelGroups';

/**
 * 연료 필터 아이콘 버튼 컴포넌트
 * - 바닐라 index.html/js의 아이콘/그룹화 로직을 참고하여 구현
 */
const FuelFilter = ({ data, activeFilters, onUpdateFilter }) => {
  // 원본 연료 타입별 개수 집계
  const rawFuelCounts = useMemo(() => {
    const counts = {};
    (data || []).forEach(row => {
      const fuel = row?.fuel;
      if (!fuel) return;
      counts[fuel] = (counts[fuel] || 0) + 1;
    });
    return counts;
  }, [data]);

  // 그룹 정의 (공유 유틸 사용)
  const definedFuelTypes = useMemo(() => FUEL_GROUPS, []);

  const fuelIcons = useMemo(() => ({
    '가솔린': '⛽',
    '디젤': '🚛',
    '하이브리드': '🔋',
    'LPG': '💨',
    '전기': '🔌',
    '기타': '🌿'
  }), []);

  // 버튼에 보여줄 그룹별 개수 산출
  const groupsWithCounts = useMemo(() => {
    const result = {};
    // 사전 정의 그룹 합산
    Object.keys(definedFuelTypes).forEach(group => {
      const variants = definedFuelTypes[group];
      const count = variants.reduce((sum, v) => sum + (rawFuelCounts[v] || 0), 0);
      if (count > 0) result[group] = count;
    });
    // 기타 그룹
    const allDefinedVariants = Object.values(definedFuelTypes).flat();
    const others = Object.keys(rawFuelCounts).filter(v => !allDefinedVariants.includes(v));
    if (others.length > 0) {
      const otherCount = others.reduce((sum, v) => sum + (rawFuelCounts[v] || 0), 0);
      if (otherCount > 0) result['기타'] = otherCount;
    }
    return result;
  }, [definedFuelTypes, rawFuelCounts]);

  // Memoize active fuel values to avoid creating a new array on each render
  const activeFuelValues = useMemo(() => {
    return Array.isArray(activeFilters?.fuel) ? activeFilters.fuel : [];
  }, [activeFilters]);

  const isGroupActive = useCallback((groupLabel) => {
    if (groupLabel === '전체') return activeFuelValues.length === 0;
    const allDefined = Object.values(definedFuelTypes).flat();
    if (groupLabel === '기타') {
      const others = Object.keys(rawFuelCounts).filter(v => !allDefined.includes(v));
      return others.some(v => activeFuelValues.includes(v));
    }
    const variants = definedFuelTypes[groupLabel] || [groupLabel];
    return variants.some(v => activeFuelValues.includes(v));
  }, [activeFuelValues, definedFuelTypes, rawFuelCounts]);

  const handleToggleGroup = useCallback((groupLabel) => {
    // 전체는 별도 처리
    if (groupLabel === '전체') {
      onUpdateFilter('fuel', [], 'set');
      return;
    }

    const allDefined = Object.values(definedFuelTypes).flat();
    let variants = [];
    if (groupLabel === '기타') {
      variants = Object.keys(rawFuelCounts).filter(v => !allDefined.includes(v));
    } else {
      variants = definedFuelTypes[groupLabel] || [groupLabel];
    }

    // 그룹 토글 정책
    // - 모든 변형이 활성화되어 있으면 해당 변형들만 제거
    // - 아니면 현재 활성 값에 변형들을 합집합으로 추가
    const allActive = variants.length > 0 && variants.every(v => activeFuelValues.includes(v));
    if (allActive) {
      variants.forEach(v => onUpdateFilter('fuel', v, 'toggle'));
    } else {
      const union = Array.from(new Set([...(activeFuelValues || []), ...variants]));
      onUpdateFilter('fuel', union, 'set');
    }
  }, [activeFuelValues, definedFuelTypes, rawFuelCounts, onUpdateFilter]);

  // 버튼 목록 구성 (전체 + 그룹들)
  const buttons = useMemo(() => {
    const arr = [];
    // 전체 버튼
    arr.push({ label: '전체', count: (data || []).length });
    // 가시성 있는 그룹만 추가(개수 있는 그룹)
    Object.keys(groupsWithCounts).forEach(label => {
      arr.push({ label, count: groupsWithCounts[label] });
    });
    return arr;
  }, [groupsWithCounts, data]);

  return (
    <div className="fuel-filter-section" aria-label="연료 필터">
      <div className="fuel-title">
        <span className="fuel-icon">⛽</span>
        <h4>무슨 연료의 차량을 원하시나요?</h4>
      </div>
      <div className="fuel-filter-options" id="fuel-type-buttons">
        {buttons.map(({ label, count }) => {
          const active = isGroupActive(label);
          const icon = fuelIcons[label] || '❓';
          return (
            <button
              key={label}
              type="button"
              className={`fuel-option${active ? ' active' : ''}`}
              onClick={() => handleToggleGroup(label)}
            >
              <span className="fuel-option-icon" aria-hidden="true">{icon}</span>
              <span className="fuel-option-label">{label}</span>
              {count != null && (
                <span className="fuel-option-count">{count.toLocaleString('ko-KR')}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FuelFilter;
