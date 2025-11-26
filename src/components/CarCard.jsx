import React, { useMemo, useCallback } from 'react';
import { getAuctionLogo } from '../utils/getAuctionLogo';

// 상수 분리
const CONSTANTS = {
  PRICE_UNIT: '만원',
  SCORE_PREFIX: '점수',
  SELL_NUMBER_PREFIX: '출품번호',
  META_SEPARATOR: '  |  ',
  ALT_TEXT: '차량 이미지'
};

/**
 * 공통 차량 카드 컴포넌트 (데스크톱/모바일 공용)
 */
const CarCard = ({ row, onImageClick, onDetailsClick }) => {
  // 이미지 에러 핸들러
  const handleImageError = useCallback((e, fallbackImage) => {
    e.target.src = fallbackImage;
    e.target.classList.add('fallback-image');
    e.target.onclick = null;
    e.target.style.cursor = 'default';
  }, []);

  // 이미지 로드 핸들러
  const handleImageLoad = useCallback((e, imgUrl) => {
    if (e.target.src === imgUrl) {
      e.target.classList.remove('fallback-image');
      e.target.onclick = () => onImageClick && onImageClick(imgUrl);
      e.target.style.cursor = imgUrl ? 'pointer' : 'default';
    }
  }, [onImageClick]);

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
    const meta = infoArr.join(CONSTANTS.META_SEPARATOR);

    const carMeta = [
      carNumber || null, 
      score ? `${CONSTANTS.SCORE_PREFIX} ${score}` : null
    ].filter(Boolean).join(CONSTANTS.META_SEPARATOR);

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

  const { 
    imgUrl, 
    price, 
    title, 
    auctionName, 
    subtitle, 
    sellNumber, 
    meta, 
    carMeta, 
    hasCarMeta, 
    hasBadges, 
    fallbackImage 
  } = cardData;

  // 카드 클릭 핸들러 (이미지 영역 제외)
  const handleCardClick = useCallback((e) => {
    // 이미지 클릭은 별도 처리 (이미지 확대)
    if (e.target.tagName === 'IMG') return;
    onDetailsClick && onDetailsClick(row);
  }, [onDetailsClick, row]);

  return (
    <div
      className="car-list-item-card"
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <img
        className="car-list-card-image"
        src={imgUrl}
        loading="lazy"
        onError={(e) => handleImageError(e, fallbackImage)}
        onLoad={(e) => handleImageLoad(e, imgUrl)}
        onClick={(e) => {
          e.stopPropagation();
          imgUrl && onImageClick && onImageClick(imgUrl);
        }}
        style={{ cursor: imgUrl ? 'pointer' : 'default' }}
        alt={CONSTANTS.ALT_TEXT}
      />
      <div className="car-list-card-details">
        {hasBadges && (
          <div className="car-list-card-badges">
            {sellNumber && (
              <div className="badge badge-sell">
                {CONSTANTS.SELL_NUMBER_PREFIX} {sellNumber}
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
        <span className="car-list-card-price-label">{CONSTANTS.PRICE_UNIT}</span>
      </div>
    </div>
  );
};

export default React.memo(CarCard);