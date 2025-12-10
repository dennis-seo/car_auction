/**
 * 중앙 API 설정 파일
 * 메인 도메인을 환경변수로 관리합니다. (CRA: 변수명은 REACT_APP_ 접두사 필수)
 */

export const API_BASE_URL: string =
  process.env.REACT_APP_API_BASE_URL ||
  'https://car-auction-849074372493.asia-northeast3.run.app';

export interface ApiEndpoints {
  /** 경매 날짜 목록 조회 */
  dates: string;
  /** 특정 날짜의 경매 데이터 조회 */
  auctionsByDate: (date: string) => string;
  /** 차량 검색 API (트림 기준 히스토리 조회용) */
  vehicles: string;
  /** 차량 시세 히스토리 집계 API */
  vehicleHistoryAggregated: string;
}

export const API_ENDPOINTS: ApiEndpoints = {
  dates: `${API_BASE_URL}/api/dates`,
  // 서버 DB에서 경매 데이터를 가져오는 엔드포인트 (JSON 형식)
  auctionsByDate: (date: string): string => `${API_BASE_URL}/api/auction/${date}`,
  // 차량 검색 API (트림 기준 히스토리 조회용)
  vehicles: `${API_BASE_URL}/api/vehicles`,
  // 차량 시세 히스토리 집계 API (날짜별 분산 데이터)
  vehicleHistoryAggregated: `${API_BASE_URL}/api/vehicle-history/aggregated`,
};