import { useMemo } from 'react';
import { filterData, sortFilteredData } from '../utils/dataUtils';
import type { AuctionItem, ActiveFilters, FilterIds, BudgetRange, SortFilterType } from '../types';

/**
 * 연식 범위 타입 [최소연식, 최대연식]
 */
export type YearRange = [number, number] | null;

/**
 * 데이터 필터링 및 정렬을 위한 커스텀 훅
 *
 * @param data - 원본 차량 데이터 배열
 * @param activeFilters - 활성화된 필터 상태
 * @param searchQuery - 검색어
 * @param budgetRange - 예산 범위 (min, max)
 * @param yearRange - 연식 범위 [min, max]
 * @param lastSortedFilter - 마지막 정렬 필터 타입
 * @param filterIds - ID 기반 필터 (manufacturerId, modelId, trimId)
 * @returns 필터링 및 정렬된 차량 데이터 배열
 */
export const useFilteredData = (
    data: AuctionItem[],
    activeFilters: ActiveFilters,
    searchQuery: string,
    budgetRange: BudgetRange | null,
    yearRange: YearRange,
    lastSortedFilter: SortFilterType,
    filterIds: FilterIds | null = null
): AuctionItem[] => {
    return useMemo(() => {
        if (!data || data.length === 0) {
            return [];
        }

        const filtered = filterData(data, activeFilters, searchQuery, budgetRange, yearRange, filterIds);
        const sorted = sortFilteredData(filtered, activeFilters, budgetRange, yearRange, lastSortedFilter);

        return sorted;
    }, [data, activeFilters, searchQuery, budgetRange, yearRange, lastSortedFilter, filterIds]);
};

export default useFilteredData;