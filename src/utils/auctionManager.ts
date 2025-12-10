/**
 * 경매장 정보 관리 클래스
 * 서버에서 받아온 데이터의 auction_name을 기반으로 메모리에서 경매장 정보를 관리합니다.
 */

/** 경매장 정보 인터페이스 */
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

/** 필터 모드 타입 */
export type FilterMode = 'vehicleType' | 'fuel';

/** 차량 데이터 Row 타입 */
interface VehicleRow {
    auction_name?: string;
    vehicleType?: string;
    usage?: string;
    type?: string;
    purpose?: string;
    fuel?: string;
    region?: string;
    /** 추가 필드 허용 (AuctionItem 호환) */
    [key: string]: string | number | boolean | null | undefined;
}

/** 내부 통계 수집용 타입 */
interface AuctionStats {
    name: string;
    count: number;
    vehicleTypes: Set<string>;
    fuelTypes: Set<string>;
    regions: Set<string>;
    hasLogo: boolean;
}

/** 로고 맵 타입 */
type LogoMap = Record<string, boolean>;

class AuctionManager {
    /** 경매장 데이터 맵 */
    auctionData: Map<string, AuctionInfo>;
    /** 초기화 상태 */
    isInitialized: boolean;

    constructor() {
        this.auctionData = new Map();
        this.isInitialized = false;
    }

    /**
     * 서버 데이터를 기반으로 경매장 정보를 초기화합니다.
     * @param data - 서버에서 받아온 데이터 배열
     */
    initializeFromData(data: VehicleRow[]): void {
        console.log('[AuctionManager] 초기화 시작:', {
            previousInitialized: this.isInitialized,
            previousAuctionCount: this.auctionData.size,
            previousAuctions: Array.from(this.auctionData.keys()),
            newDataLength: Array.isArray(data) ? data.length : 0
        });

        if (!Array.isArray(data)) {
            console.warn('[AuctionManager] 유효하지 않은 데이터입니다.');
            this.isInitialized = false;
            this.auctionData.clear();
            return;
        }

        if (data.length === 0) {
            console.warn('[AuctionManager] 빈 데이터 배열입니다.');
            this.isInitialized = false;
            this.auctionData.clear();
            return;
        }

        // 기존 데이터 완전 초기화
        this.isInitialized = false;
        this.auctionData.clear();
        console.log('[AuctionManager] 기존 데이터 초기화 완료');

        // auction_name별로 정보 수집
        const auctionStats = new Map<string, AuctionStats>();

        data.forEach(row => {
            const auctionName = row.auction_name;
            if (!auctionName) return;

            if (!auctionStats.has(auctionName)) {
                auctionStats.set(auctionName, {
                    name: auctionName,
                    count: 0,
                    vehicleTypes: new Set(),
                    fuelTypes: new Set(),
                    regions: new Set(),
                    hasLogo: this.checkLogoAvailability(auctionName)
                });
            }

            const stats = auctionStats.get(auctionName)!;
            stats.count++;

            // 차량 용도 정보 수집
            const vehicleType = row.vehicleType || row.usage || row.type || row.purpose;
            if (vehicleType) stats.vehicleTypes.add(vehicleType);

            // 연료 정보 수집
            if (row.fuel) stats.fuelTypes.add(row.fuel);

            // 지역 정보 수집
            if (row.region) stats.regions.add(row.region);
        });

        // Set을 Array로 변환하여 저장
        auctionStats.forEach((stats, name) => {
            this.auctionData.set(name, {
                ...stats,
                vehicleTypes: Array.from(stats.vehicleTypes),
                fuelTypes: Array.from(stats.fuelTypes),
                regions: Array.from(stats.regions)
            });
        });

        this.isInitialized = true;

        console.log('[AuctionManager] 경매장 정보 초기화 완료:', {
            auctionNames: this.getAuctionNames(),
            totalVehicles: this.getTotalVehicleCount(),
            filterMode: this.getFilterMode(),
            hasAutoHub: this.hasAutoHubAuction(),
            auctionCounts: this.getVehicleCountsByAuction()
        });
    }

    /**
     * AuctionManager를 완전히 초기화합니다.
     */
    reset(): void {
        console.log('[AuctionManager] 명시적 초기화 시작');
        this.isInitialized = false;
        this.auctionData.clear();
        console.log('[AuctionManager] 명시적 초기화 완료');
    }

    /**
     * 경매장명에 대한 로고 파일 존재 여부 확인
     * @param auctionName - 경매장명
     * @returns 로고 파일 존재 여부
     */
    checkLogoAvailability(auctionName: string): boolean {
        const logoMap: LogoMap = {
            "현대 경매장": true,
            "롯데 경매장": true,
            "오토허브 경매장": true,
            "SK렌터카 경매장": true
        };
        return logoMap[auctionName] || false;
    }

    /**
     * 모든 경매장명 목록을 반환합니다.
     * @returns 경매장명 배열
     */
    getAuctionNames(): string[] {
        return Array.from(this.auctionData.keys());
    }

    /**
     * 로고 파일이 있는 경매장명만 반환합니다.
     * @returns 로고가 있는 경매장명 배열
     */
    getAuctionNamesWithLogo(): string[] {
        return this.getAuctionNames().filter(name =>
            this.auctionData.get(name)?.hasLogo
        );
    }

    /**
     * 특정 경매장의 상세 정보를 반환합니다.
     * @param auctionName - 경매장명
     * @returns 경매장 정보 객체
     */
    getAuctionInfo(auctionName: string): AuctionInfo | null {
        return this.auctionData.get(auctionName) || null;
    }

    /**
     * 오토허브 경매장이 포함되어 있는지 확인합니다.
     * @returns 오토허브 경매장 포함 여부
     */
    hasAutoHubAuction(): boolean {
        return this.auctionData.has("오토허브 경매장");
    }

    /**
     * 현재 데이터 상황에 따른 필터 모드를 결정합니다.
     * @returns 필터 모드
     */
    getFilterMode(): FilterMode {
        return this.hasAutoHubAuction() ? 'vehicleType' : 'fuel';
    }

    /**
     * 전체 차량 개수를 반환합니다.
     * @returns 전체 차량 개수
     */
    getTotalVehicleCount(): number {
        let total = 0;
        this.auctionData.forEach(info => {
            total += info.count;
        });
        return total;
    }

    /**
     * 경매장별 차량 개수 정보를 반환합니다.
     * @returns 경매장명 -> 개수 매핑
     */
    getVehicleCountsByAuction(): Record<string, number> {
        const result: Record<string, number> = {};
        this.auctionData.forEach((info, name) => {
            result[name] = info.count;
        });
        return result;
    }

    /**
     * 초기화 상태를 확인합니다.
     * @returns 초기화 여부
     */
    isReady(): boolean {
        return this.isInitialized && this.auctionData.size > 0;
    }

    /**
     * 디버깅용 정보를 출력합니다.
     */
    debugInfo(): void {
        console.group('[AuctionManager] 디버그 정보');
        console.log('초기화 상태:', this.isInitialized);
        console.log('경매장 개수:', this.auctionData.size);
        console.log('총 차량 개수:', this.getTotalVehicleCount());
        console.log('필터 모드:', this.getFilterMode());
        console.log('경매장별 정보:');
        this.auctionData.forEach((info, name) => {
            console.log(`  ${name}:`, info);
        });
        console.groupEnd();
    }
}

// 싱글톤 인스턴스 생성
export const auctionManager = new AuctionManager();

export default auctionManager;
