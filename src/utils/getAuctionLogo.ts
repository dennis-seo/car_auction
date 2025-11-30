/**
 * 경매장 로고 관련 유틸리티 모듈
 */

// 경매장명 타입 정의
export type AuctionName = '현대 경매장' | '롯데 경매장' | '오토허브 경매장' | 'SK렌터카 경매장';

// 로고 매핑 타입
type LogoMap = Record<AuctionName, string>;

/**
 * 경매장명에 따른 로고 이미지 경로를 반환하는 유틸리티 함수
 * @param auctionName - 경매장명
 * @returns 로고 이미지 경로
 */
export const getAuctionLogo = (auctionName: string | null | undefined): string => {
    const publicUrl = process.env.PUBLIC_URL || '';

    const logoMap: LogoMap = {
        "현대 경매장": `${publicUrl}/images/hyundai_glovis.png`,
        "롯데 경매장": `${publicUrl}/images/lotte_auto_auction.png`,
        "오토허브 경매장": `${publicUrl}/images/auto_hub_auction.png`,
        "SK렌터카 경매장": `${publicUrl}/images/sk_rent.png`
    };

    if (auctionName && auctionName in logoMap) {
        return logoMap[auctionName as AuctionName];
    }

    return `${publicUrl}/images/no_car_image.png`;
};

/**
 * 경매장명 리스트를 반환하는 함수
 * @returns 경매장명 배열
 */
export const getAuctionNames = (): readonly AuctionName[] => {
    return [
        "현대 경매장",
        "롯데 경매장",
        "오토허브 경매장",
        "SK렌터카 경매장"
    ] as const;
};