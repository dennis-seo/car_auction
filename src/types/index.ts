/**
 * 타입 정의 중앙 export
 *
 * 사용법:
 * import { AuctionItem, AuctionResponse } from '../types';
 * 또는
 * import type { AuctionItem } from '../types';
 */

export type {
  // 차량 데이터
  AuctionItem,
  AuctionResponse,
  DatesResponse,
  VehicleHistoryResponse,

  // 집계 API 타입
  AggregatedTrade,
  AggregatedDateData,
  AggregatedSummary,
  VehicleHistoryAggregatedResponse,

  // 필터 관련
  ActiveFilters,
  FilterIds,
  BudgetRange,

  // 검색 트리
  TrimInfo,
  ModelInfo,
  BrandInfo,
  SearchTree,

  // 페이지네이션
  Pagination,

  // 유틸리티 타입
  SortFilterType,
  FilterAction,
  ColumnKey,
} from './api';