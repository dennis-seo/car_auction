/**
 * 경매장 정보 인터페이스
 */
export interface AuctionInfo {
    /** 경매장명 */
    name: string;
    /** 차량 개수 */
    count: number;
    /** 차량 용도 목록 */
    vehicleTypes: string[];
    /** 연료 종류 목록 */
    fuelTypes: string[];
    /** 지역 목록 */
    regions: string[];
    /** 로고 파일 존재 여부 */
    hasLogo: boolean;
}

/**
 * 필터 모드 타입
 */
export type FilterMode = 'vehicleType' | 'fuel';

/**
 * 경매장 정보 관리 클래스
 * 서버에서 받아온 데이터의 auction_name을 기반으로 메모리에서 경매장 정보를 관리합니다.
 */
declare class AuctionManager {
    /** 경매장 데이터 맵 */
    auctionData: Map<string, AuctionInfo>;
    /** 초기화 상태 */
    isInitialized: boolean;

    constructor();

    /**
     * 서버 데이터를 기반으로 경매장 정보를 초기화합니다.
     * @param data - 서버에서 받아온 데이터 배열
     */
    initializeFromData(data: unknown[]): void;

    /**
     * AuctionManager를 완전히 초기화합니다.
     */
    reset(): void;

    /**
     * 경매장명에 대한 로고 파일 존재 여부 확인
     * @param auctionName - 경매장명
     * @returns 로고 파일 존재 여부
     */
    checkLogoAvailability(auctionName: string): boolean;

    /**
     * 모든 경매장명 목록을 반환합니다.
     * @returns 경매장명 배열
     */
    getAuctionNames(): string[];

    /**
     * 로고 파일이 있는 경매장명만 반환합니다.
     * @returns 로고가 있는 경매장명 배열
     */
    getAuctionNamesWithLogo(): string[];

    /**
     * 특정 경매장의 상세 정보를 반환합니다.
     * @param auctionName - 경매장명
     * @returns 경매장 정보 객체
     */
    getAuctionInfo(auctionName: string): AuctionInfo | null;

    /**
     * 오토허브 경매장이 포함되어 있는지 확인합니다.
     * @returns 오토허브 경매장 포함 여부
     */
    hasAutoHubAuction(): boolean;

    /**
     * 현재 데이터 상황에 따른 필터 모드를 결정합니다.
     * @returns 필터 모드
     */
    getFilterMode(): FilterMode;

    /**
     * 전체 차량 개수를 반환합니다.
     * @returns 전체 차량 개수
     */
    getTotalVehicleCount(): number;

    /**
     * 경매장별 차량 개수 정보를 반환합니다.
     * @returns 경매장명 -> 개수 매핑
     */
    getVehicleCountsByAuction(): Record<string, number>;

    /**
     * 초기화 상태를 확인합니다.
     * @returns 초기화 여부
     */
    isReady(): boolean;

    /**
     * 디버깅용 정보를 출력합니다.
     */
    debugInfo(): void;
}

/** 싱글톤 인스턴스 */
export const auctionManager: AuctionManager;
export default auctionManager;
