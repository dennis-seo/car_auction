import React from 'react';
import { getAuctionLogo } from '../utils/getAuctionLogo';
import auctionManager from '../utils/auctionManager';
import type { AuctionItem } from '../types';

/** 경매장 정보 타입 (auctionManager.getAuctionInfo 반환값) */
interface AuctionInfo {
    name: string;
    count: number;
    vehicleTypes: string[];
    fuelTypes: string[];
    regions: string[];
    hasLogo: boolean;
}

/**
 * AuctionLogo 컴포넌트 Props
 */
interface AuctionLogoProps {
    /** 차량 데이터 배열 (현재 미사용, 향후 확장용) */
    data?: AuctionItem[];
}

/**
 * 경매장 로고 표시 컴포넌트
 * AuctionManager에서 관리되는 경매장 정보를 기반으로 로고를 표시합니다.
 */
const AuctionLogo: React.FC<AuctionLogoProps> = ({ data }) => {
    // AuctionManager가 초기화되지 않은 경우 빈 컨테이너 반환
    if (!auctionManager.isReady()) {
        return <div id="auction-logo-container" aria-hidden="true"></div>;
    }

    // 로고가 있는 경매장만 가져오기
    const displayAuctionNames = auctionManager.getAuctionNamesWithLogo();

    // 디버깅을 위해 경매장 정보를 콘솔에 출력
    console.log('[AuctionLogo] 로고 표시 가능한 경매장:', displayAuctionNames);
    console.log('[AuctionLogo] 경매장별 차량 개수:', auctionManager.getVehicleCountsByAuction());

    if (displayAuctionNames.length === 0) {
        return <div id="auction-logo-container" aria-hidden="true"></div>;
    }

    return (
        <div id="auction-logo-container" aria-hidden="true">
            {displayAuctionNames.map(name => {
                const logoPath = getAuctionLogo(name);
                const auctionInfo: AuctionInfo | null = auctionManager.getAuctionInfo(name);

                console.log(`[AuctionLogo] ${name}: 로고경로=${logoPath}, 차량수=${auctionInfo?.count}`);

                return (
                    <img
                        key={name}
                        src={logoPath}
                        alt={`${name} 로고`}
                        title={`${name} (${auctionInfo?.count || 0}대)`}
                        onError={(e) => {
                            console.error(`[AuctionLogo] 로고 로드 실패 - ${name}: ${logoPath}`);
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        onLoad={() => {
                            console.log(`[AuctionLogo] 로고 로드 성공 - ${name}: ${logoPath}`);
                        }}
                        style={{
                            maxWidth: '120px',
                            maxHeight: '100px',
                            objectFit: 'contain'
                        }}
                    />
                );
            })}
        </div>
    );
};

export default AuctionLogo;
