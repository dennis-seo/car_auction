/**
 * 경매장 정보 관리 클래스
 * 서버에서 받아온 데이터의 auction_name을 기반으로 메모리에서 경매장 정보를 관리합니다.
 */
class AuctionManager {
    constructor() {
        this.auctionData = new Map(); // auction_name을 키로 하는 경매장 정보
        this.isInitialized = false;
    }

    /**
     * 서버 데이터를 기반으로 경매장 정보를 초기화합니다.
     * @param {Array} data - 서버에서 받아온 데이터 배열
     */
    initializeFromData(data) {
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
        const auctionStats = new Map();
        
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
            
            const stats = auctionStats.get(auctionName);
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
    reset() {
        console.log('[AuctionManager] 명시적 초기화 시작');
        this.isInitialized = false;
        this.auctionData.clear();
        console.log('[AuctionManager] 명시적 초기화 완료');
    }

    /**
     * 경매장명에 대한 로고 파일 존재 여부 확인
     * @param {string} auctionName - 경매장명
     * @returns {boolean} 로고 파일 존재 여부
     */
    checkLogoAvailability(auctionName) {
        const logoMap = {
            "현대 경매장": true,
            "롯데 경매장": true,
            "오토허브 경매장": true,
            "SK렌터카 경매장": true
        };
        return logoMap[auctionName] || false;
    }

    /**
     * 모든 경매장명 목록을 반환합니다.
     * @returns {Array<string>} 경매장명 배열
     */
    getAuctionNames() {
        return Array.from(this.auctionData.keys());
    }

    /**
     * 로고 파일이 있는 경매장명만 반환합니다.
     * @returns {Array<string>} 로고가 있는 경매장명 배열
     */
    getAuctionNamesWithLogo() {
        return this.getAuctionNames().filter(name => 
            this.auctionData.get(name)?.hasLogo
        );
    }

    /**
     * 특정 경매장의 상세 정보를 반환합니다.
     * @param {string} auctionName - 경매장명
     * @returns {Object|null} 경매장 정보 객체
     */
    getAuctionInfo(auctionName) {
        return this.auctionData.get(auctionName) || null;
    }

    /**
     * 오토허브 경매장이 포함되어 있는지 확인합니다.
     * @returns {boolean} 오토허브 경매장 포함 여부
     */
    hasAutoHubAuction() {
        return this.auctionData.has("오토허브 경매장");
    }

    /**
     * 현재 데이터 상황에 따른 필터 모드를 결정합니다.
     * @returns {'vehicleType'|'fuel'} 필터 모드
     */
    getFilterMode() {
        return this.hasAutoHubAuction() ? 'vehicleType' : 'fuel';
    }

    /**
     * 전체 차량 개수를 반환합니다.
     * @returns {number} 전체 차량 개수
     */
    getTotalVehicleCount() {
        let total = 0;
        this.auctionData.forEach(info => {
            total += info.count;
        });
        return total;
    }

    /**
     * 경매장별 차량 개수 정보를 반환합니다.
     * @returns {Object} 경매장명 -> 개수 매핑
     */
    getVehicleCountsByAuction() {
        const result = {};
        this.auctionData.forEach((info, name) => {
            result[name] = info.count;
        });
        return result;
    }

    /**
     * 초기화 상태를 확인합니다.
     * @returns {boolean} 초기화 여부
     */
    isReady() {
        return this.isInitialized && this.auctionData.size > 0;
    }

    /**
     * 디버깅용 정보를 출력합니다.
     */
    debugInfo() {
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