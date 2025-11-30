import React from 'react';
import CarCard, { type CarCardProps } from './CarCard';

/**
 * 데스크톱용 차량 카드 컴포넌트 (성능 최적화)
 * 공통 CarCard 컴포넌트를 사용합니다.
 */
const CarCardDesktop: React.FC<CarCardProps> = (props) => {
    return <CarCard {...props} />;
};

export default React.memo(CarCardDesktop);
