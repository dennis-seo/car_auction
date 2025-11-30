/**
 * dataUtils.js 타입 선언 파일
 * JS 파일이 TypeScript로 변환되기 전까지 사용
 */

import type { AuctionItem, ActiveFilters, FilterIds, BudgetRange, SortFilterType } from '../types';

/**
 * 데이터 필터링 함수
 */
export function filterData(
    data: AuctionItem[],
    activeFilters: ActiveFilters,
    searchQuery: string,
    budgetRange: BudgetRange | null,
    yearRange: [number, number] | null,
    filterIds?: FilterIds | null
): AuctionItem[];

/**
 * 필터링된 데이터 정렬 함수
 */
export function sortFilteredData(
    data: AuctionItem[],
    activeFilters: ActiveFilters,
    budgetRange: BudgetRange | null,
    yearRange: [number, number] | null,
    lastSortedFilter: SortFilterType
): AuctionItem[];

/**
 * 검색 트리 로드 함수
 */
export function loadSearchTree(): Promise<import('../types').SearchTree | null>;

/**
 * YYMMDD 형식 날짜를 레이블로 변환
 */
export function formatYYMMDDToLabel(date: string): string;

/**
 * API에서 사용 가능한 날짜 목록 로드
 */
export function loadAvailableDates(): Promise<string[]>;

/**
 * 특정 날짜의 경매 데이터 로드
 */
export function loadAuctionData(date: string): Promise<AuctionItem[]>;