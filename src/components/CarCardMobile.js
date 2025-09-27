import React from 'react';
import CarCard from './CarCard';

/**
 * 모바일용 차량 카드 컴포넌트
 * 공통 CarCard 컴포넌트를 사용합니다.
 */
const CarCardMobile = (props) => {
  return <CarCard {...props} />;
};

export default React.memo(CarCardMobile);
