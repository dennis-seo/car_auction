import React from 'react';

/**
 * 경매장 로고 표시 컴포넌트
 */
const AuctionLogo = ({ data }) => {
    const logoMap = {
        "현대 경매장": "images/hyundai_glovis.png",
        "롯데 경매장": "images/lotte_auto_auction.png",
        "오토허브 경매장": "images/auto_hub_auction.png",
        "SK렌터카 경매장": "images/sk_rent.png"
    };

    if (!data || data.length === 0) {
        return <div id="auction-logo-container" aria-hidden="true"></div>;
    }

    const uniqueAuctionNames = [...new Set(data.map(row => row.auction_name).filter(Boolean))];

    return (
        <div id="auction-logo-container" aria-hidden="true">
            {uniqueAuctionNames.map(name => {
                const logoFileName = logoMap[name];
                if (logoFileName) {
                    return (
                        <img
                            key={name}
                            src={logoFileName}
                            alt={`${name} 로고`}
                        />
                    );
                }
                return null;
            })}
        </div>
    );
};

export default AuctionLogo;