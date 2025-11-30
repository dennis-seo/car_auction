import { useMemo } from 'react';
import { filterData, sortFilteredData } from '../utils/dataUtils';

/**
 * 데이터 필터링 및 정렬을 위한 커스텀 훅
 * @param {Array} data - 원본 데이터
 * @param {Object} activeFilters - 활성화된 필터
 * @param {string} searchQuery - 검색어
 * @param {Object} budgetRange - 예산 범위
 * @param {Array} yearRange - 연식 범위
 * @param {string} lastSortedFilter - 마지막 정렬 필터
 * @param {Object} filterIds - ID 기반 필터 (manufacturerId, modelId, trimId)
 * @returns {Array} 필터링 및 정렬된 데이터
 */
export const useFilteredData = (
    data,
    activeFilters,
    searchQuery,
    budgetRange,
    yearRange,
    lastSortedFilter,
    filterIds = null
) => {
    return useMemo(() => {
        if (!data || data.length === 0) {
            return [];
        }

        const filtered = filterData(data, activeFilters, searchQuery, budgetRange, yearRange, filterIds);
        const sorted = sortFilteredData(filtered, activeFilters, budgetRange, yearRange, lastSortedFilter);

        return sorted;
    }, [data, activeFilters, searchQuery, budgetRange, yearRange, lastSortedFilter, filterIds]);
};
