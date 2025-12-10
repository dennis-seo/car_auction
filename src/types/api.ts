/**
 * API 응답 타입 정의
 * /api/auction/{date} 및 /api/vehicles 엔드포인트 응답 스키마
 */

// ============================================
// 차량 경매 아이템 타입
// ============================================

/**
 * 경매 차량 데이터
 * API: /api/auction/{date}
 */
export interface AuctionItem {
  /** 출품번호 */
  sell_number: string;

  /** 차종 (예: "[현대] 그랜저 IG") */
  title: string;

  /** 부제목/상세 트림 */
  subtitle?: string;

  /** 가격 (만원 단위) */
  price: number;

  /** 연식 (예: 2021) */
  year: number;

  /** 주행거리 (km) */
  km: number;

  /** 연료 타입 (예: "가솔린", "디젤", "전기") */
  fuel: string;

  /** 경매장 이름 (예: "현대 글로비스", "오토허브 경매장") */
  auction_name: string;

  /** 지역 (예: "서울", "경기") */
  region: string;

  /** 차량 이미지 URL */
  image?: string;

  /** 차량번호 */
  car_number?: string;

  /** 평가 점수 (예: "A4", "B2") */
  score?: string;

  /** 제조사 ID (필터링용) */
  manufacturer_id?: string;

  /** 모델 ID (필터링용) */
  model_id?: string;

  /** 트림 ID (필터링용) */
  trim_id?: string;

  /** 차량 용도 (오토허브 경매장용) */
  vehicleType?: string;

  /** 차량 용도 대체 필드 */
  usage?: string;

  /** 차량 타입 대체 필드 */
  type?: string;

  /** 차량 목적 대체 필드 */
  purpose?: string;

  /** 경매 일자 (YYYY-MM-DD 형식) */
  auction_date?: string;

  /** 추가 필드 허용 (API 확장성) */
  [key: string]: string | number | boolean | null | undefined;
}

// ============================================
// API 응답 타입
// ============================================

/**
 * 경매 데이터 API 응답
 * GET /api/auction/{date}
 */
export interface AuctionResponse {
  /** 요청한 날짜 */
  date: string;

  /** 소스 파일명 */
  source_filename?: string;

  /** 총 데이터 수 */
  row_count: number;

  /** 차량 목록 */
  items: AuctionItem[];
}

/**
 * 날짜 목록 API 응답
 * GET /api/dates
 */
export interface DatesResponse {
  /** 사용 가능한 날짜 배열 (yymmdd 또는 yyyymmdd 형식) */
  dates?: string[];

  /** 대체 데이터 필드 */
  data?: string[];
}

/**
 * 차량 히스토리 API 응답
 * GET /api/vehicles
 */
export interface VehicleHistoryResponse {
  /** 총 결과 수 */
  total: number;

  /** 페이지당 개수 */
  limit: number;

  /** 오프셋 */
  offset: number;

  /** 차량 히스토리 목록 */
  items: AuctionItem[];
}

// ============================================
// 필터 관련 타입
// ============================================

/**
 * 활성화된 필터 상태
 */
export interface ActiveFilters {
  /** 브랜드/제조사 필터 */
  title: string[];

  /** 모델 필터 */
  model: string[];

  /** 서브모델/트림 필터 */
  submodel: string[];

  /** 가격 범위 필터 */
  price: string[];

  /** 주행거리 범위 필터 */
  km: string[];

  /** 연료 타입 필터 */
  fuel: string[];

  /** 차량 용도 필터 (오토허브용) */
  vehicleType?: string[];

  /** 경매장 필터 */
  auction_name: string[];

  /** 지역 필터 */
  region: string[];

  /** 연식 범위 필터 [min, max] */
  year: number[];
}

/**
 * ID 기반 필터
 */
export interface FilterIds {
  /** 제조사 ID */
  manufacturerId: string | null;

  /** 모델 ID */
  modelId: string | null;

  /** 트림 ID */
  trimId: string | null;
}

/**
 * 예산 범위
 */
export interface BudgetRange {
  /** 최소 가격 (만원) */
  min: number;

  /** 최대 가격 (만원) */
  max: number;
}

// ============================================
// 검색 트리 타입 (search_tree.json)
// ============================================

/**
 * 트림/서브모델 정보
 */
export interface TrimInfo {
  /** 트림 ID */
  id: string;

  /** 트림명 */
  label: string;

  /** 영문 코드 */
  value: string;
}

/**
 * 모델 정보
 */
export interface ModelInfo {
  /** 모델 ID */
  id: string;

  /** 모델명 */
  label: string;

  /** 영문 코드 */
  value: string;

  /** 트림 목록 */
  trims?: TrimInfo[];
}

/**
 * 브랜드 정보
 */
export interface BrandInfo {
  /** 브랜드 ID */
  id: string;

  /** 브랜드명 (예: "현대", "기아") */
  label: string;

  /** 영문 코드 (예: "hyundai", "kia") */
  value: string;

  /** 모델 목록 */
  models: ModelInfo[];
}

/**
 * 검색 트리 구조
 */
export interface SearchTree {
  /** 국산 브랜드 목록 */
  domestic: BrandInfo[];

  /** 수입 브랜드 목록 */
  import: BrandInfo[];
}

// ============================================
// 페이지네이션 타입
// ============================================

/**
 * 페이지네이션 상태
 */
export interface Pagination {
  /** 총 결과 수 */
  total: number;

  /** 페이지당 개수 */
  limit: number;

  /** 현재 오프셋 */
  offset: number;

  /** 더 많은 데이터 존재 여부 */
  hasMore: boolean;
}

// ============================================
// 유틸리티 타입
// ============================================

/**
 * 정렬 필터 타입
 */
export type SortFilterType = 'price' | 'km' | 'year' | 'budget' | null;

/**
 * 필터 액션 타입
 */
export type FilterAction = 'toggle' | 'set' | 'clear';

/**
 * 컬럼 매핑 키
 */
export type ColumnKey =
  | 'sell_number'
  | 'title'
  | 'price'
  | 'year'
  | 'km'
  | 'fuel'
  | 'auction_name'
  | 'region'
  | 'details';