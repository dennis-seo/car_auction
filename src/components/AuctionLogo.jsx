import React, { useMemo } from 'react';
import { getAuctionLogo } from '../utils/getAuctionLogo';

/**
 * 경매장 로고 표시 컴포넌트
 */
const AuctionLogo = ({ data }) => {
    // 경매장별 차량 개수 계산
    const auctionStats = useMemo(() => {
        if (!data || data.length === 0) return {};
        
        const stats = {};
        data.forEach(item => {
            const auctionName = item.auction_name || '기타';
            stats[auctionName] = (stats[auctionName] || 0) + 1;
        });
        
        // 개수 내림차순 정렬
        return Object.entries(stats)
            .sort(([, a], [, b]) => b - a)
            .reduce((acc, [name, count]) => {
                acc[name] = count;
                return acc;
            }, {});
    }, [data]);

    // 데이터가 없으면 렌더링하지 않음
    if (!data || data.length === 0) {
        return null;
    }

    const auctionNames = Object.keys(auctionStats);
    
    // 경매장이 없으면 렌더링하지 않음
    if (auctionNames.length === 0) {
        return null;
    }

    return (
        <div className="auction-logo-container">
            <div className="auction-logos">
                {auctionNames.map(auctionName => {
                    const logoUrl = getAuctionLogo(auctionName);
                    const count = auctionStats[auctionName];
                    
                    return (
                        <div key={auctionName} className="auction-logo-item">
                            <div className="auction-logo-wrapper">
                                <img
                                    src={logoUrl}
                                    alt={`${auctionName} 로고`}
                                    className="auction-logo"
                                    onError={(e) => {
                                        e.target.alt = `${auctionName} (로고 없음)`;
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block';
                                    }}
                                />
                                <div className="auction-logo-fallback" style={{ display: 'none' }}>
                                    {auctionName}
                                </div>
                            </div>
                            <div className="auction-info">
                                <span className="auction-name">{auctionName}</span>
                                <span className="auction-count">
                                    {count.toLocaleString('ko-KR')}대
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="auction-summary">
                <span className="total-count">
                    총 {data.length.toLocaleString('ko-KR')}대
                </span>
                <span className="auction-count-text">
                    {auctionNames.length}개 경매장
                </span>
            </div>
        </div>
    );
};

export default AuctionLogo;