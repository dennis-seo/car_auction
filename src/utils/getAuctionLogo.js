/**
 * 경매장명에 따른 로고 이미지 경로를 반환하는 유틸리티 함수
 */
export const getAuctionLogo = (auctionName) => {
  const publicUrl = process.env.PUBLIC_URL || '';
  
  const logoMap = {
    "현대 경매장": `${publicUrl}/images/hyundai_glovis.png`,
    "롯데 경매장": `${publicUrl}/images/lotte_auto_auction.png`, 
    "오토허브 경매장": `${publicUrl}/images/auto_hub_auction.png`,
    "SK렌터카 경매장": `${publicUrl}/images/sk_rent.png`
  };
  
  return logoMap[auctionName] || `${publicUrl}/images/no_car_image.png`;
};

/**
 * 경매장명 리스트를 반환하는 함수
 */
export const getAuctionNames = () => {
  return [
    "현대 경매장",
    "롯데 경매장", 
    "오토허브 경매장",
    "SK렌터카 경매장"
  ];
};