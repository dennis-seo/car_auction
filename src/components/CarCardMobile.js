import React, { useMemo } from 'react';
import { getAuctionLogo } from '../utils/getAuctionLogo';

/**
 * 모바일용 차량 카드 컴포넌트
 */
const CarCardMobile = ({ row, onImageClick, onDetailsClick }) => {
  // 데이터 가공을 useMemo로 메모화하여 리렌더 시 불필요한 계산 방지
  const cardData = useMemo(() => {
    const imgUrl = row.image || '';
    const price = row.price ? parseInt(row.price, 10).toLocaleString('ko-KR') : '-';
    const title = row.title || '-';
    const auctionName = row.auction_name || '';
    const subtitle = row.subtitle || '';
    const sellNumber = row.sell_number || '';
    const carNumber = row.car_number || '';
    const score = row.score || '';

    // 경매장 로고를 폴백 이미지로 설정
    const fallbackImage = getAuctionLogo(auctionName);

    const infoArr = [];
    if (row.year) infoArr.push(row.year);
    if (row.km) infoArr.push(`${parseInt(row.km, 10).toLocaleString()}km`);
    if (row.fuel) infoArr.push(row.fuel);
    if (row.region) infoArr.push(row.region);
    const meta = infoArr.join('  |  ');

    const carMeta = [carNumber || null, score ? `점수 ${score}` : null].filter(Boolean).join('  |  ');

    return {
      imgUrl,
      price,
      title,
      auctionName,
      subtitle,
      sellNumber,
      meta,
      carMeta,
      hasCarMeta: !!(carNumber || score),
      hasBadges: !!(sellNumber || auctionName),
      fallbackImage
    };
  }, [row]);

  const { imgUrl, price, title, auctionName, subtitle, sellNumber, meta, carMeta, hasCarMeta, hasBadges, fallbackImage } = cardData;

  return (
    <div className="car-list-item-card">
      <img
        className="car-list-card-image"
        src={imgUrl}
        onError={(e) => { 
          e.target.src = fallbackImage; 
          e.target.classList.add('fallback-image');
          // 폴백 이미지로 변경되면 클릭 기능 제거
          e.target.onclick = null;
          e.target.style.cursor = 'default';
        }}
        onLoad={(e) => {
          // 원본 이미지가 정상 로딩되면 fallback 클래스 제거하고 클릭 기능 복원
          if (e.target.src === imgUrl) {
            e.target.classList.remove('fallback-image');
            e.target.onclick = () => onImageClick && onImageClick(imgUrl);
            e.target.style.cursor = imgUrl ? 'pointer' : 'default';
          }
        }}
        onClick={() => imgUrl && onImageClick && onImageClick(imgUrl)}
        style={{ cursor: imgUrl ? 'pointer' : 'default' }}
        alt="차량 이미지"
      />
      <div className="car-list-card-details">
        {hasBadges && (
          <div className="car-list-card-badges">
            {sellNumber && (
              <div className="badge badge-sell" onClick={() => onDetailsClick && onDetailsClick(row)}>
                출품번호 {sellNumber}
              </div>
            )}
            {auctionName && (
              <div className="badge badge-auction">{auctionName}</div>
            )}
          </div>
        )}
        {subtitle && (
          <div className="car-list-card-subtitle">{subtitle}</div>
        )}
        <div className="car-list-card-title">{title}</div>
        <div className="car-list-card-meta">{meta}</div>
        {hasCarMeta && (
          <div className="car-list-card-meta">{carMeta}</div>
        )}
      </div>
      <div className="car-list-card-price">
        {price}
        <span className="car-list-card-price-label">만원</span>
      </div>
    </div>
  );
};

export default React.memo(CarCardMobile);
