import React from 'react';
import { getAuctionLogo, getAuctionNames } from '../utils/getAuctionLogo.js';

/**
 * 경매장 로고 표시 컴포넌트
 */
const AuctionLogo = ({ data }) => {
    if (!data || data.length === 0) {
        return <div id="auction-logo-container" aria-hidden="true"></div>;
    }

    const uniqueAuctionNames = [...new Set(data.map(row => row.auction_name).filter(Boolean))];
    const validAuctionNames = getAuctionNames(); // 실제 로고 파일이 있는 경매장만
    
    // 데이터에 있는 경매장 중에서 실제 로고 파일이 있는 것만 필터링
    const displayAuctionNames = uniqueAuctionNames.filter(name => validAuctionNames.includes(name));
    
    // 디버깅을 위해 경매장 이름들을 콘솔에 출력
    console.log('All auction names in data:', uniqueAuctionNames);
    console.log('Valid auction names with logos:', validAuctionNames);
    console.log('Display auction names:', displayAuctionNames);

    if (displayAuctionNames.length === 0) {
        return <div id="auction-logo-container" aria-hidden="true"></div>;
    }

    return (
        <div id="auction-logo-container" aria-hidden="true">
            {displayAuctionNames.map(name => {
                const logoPath = getAuctionLogo(name);
                console.log(`Auction: ${name}, Logo path: ${logoPath}`);
                
                return (
                    <img
                        key={name}
                        src={logoPath}
                        alt={`${name} 로고`}
                        onError={(e) => {
                            console.error(`Failed to load logo for ${name}: ${logoPath}`);
                            e.target.style.display = 'none';
                        }}
                        onLoad={() => {
                            console.log(`Successfully loaded logo for ${name}: ${logoPath}`);
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