import React from 'react';

/**
 * 모바일용 차량 카드 컴포넌트
 */
const CarCardMobile = ({ row, onImageClick, onDetailsClick }) => {
  const imgUrl = row.image || '';
  const price = row.price ? parseInt(row.price, 10).toLocaleString('ko-KR') : '-';
  const title = row.title || '-';
  const auctionName = row.auction_name || '';
  const subtitle = row.subtitle || '';
  const sellNumber = row.sell_number || '';
  const carNumber = row.car_number || '';
  const score = row.score || '';

  const infoArr = [];
  if (row.year) infoArr.push(row.year);
  if (row.km) infoArr.push(`${parseInt(row.km, 10).toLocaleString()}km`);
  if (row.fuel) infoArr.push(row.fuel);
  if (row.region) infoArr.push(row.region);
  const meta = infoArr.join('  |  ');

  return (
    <div className="car-list-item-card">
      <img
        className="car-list-card-image"
        src={imgUrl}
        onError={(e) => { e.target.src = 'images/no_car_image.png'; }}
        onClick={() => imgUrl && onImageClick && onImageClick(imgUrl)}
        style={{ cursor: imgUrl ? 'pointer' : 'default' }}
        alt="차량 이미지"
      />
      <div className="car-list-card-details">
        {(sellNumber || auctionName) && (
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
        {(carNumber || score) && (
          <div className="car-list-card-meta">
            {[carNumber || null, score ? `점수 ${score}` : null].filter(Boolean).join('  |  ')}
          </div>
        )}
      </div>
      <div className="car-list-card-price">
        {price}
        <span className="car-list-card-price-label">만원</span>
      </div>
    </div>
  );
};

export default CarCardMobile;
