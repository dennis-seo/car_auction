import React, { useMemo, useCallback } from 'react';
import { getAuctionLogo } from '../utils/getAuctionLogo';
import type { AuctionItem } from '../types';

// 상수 분리
const CONSTANTS = {
    PRICE_UNIT: '만원',
    SCORE_PREFIX: '점수',
    SELL_NUMBER_PREFIX: '출품번호',
    META_SEPARATOR: '  |  ',
    ALT_TEXT: '차량 이미지'
} as const;

/** CarCard 컴포넌트에서 사용하는 가공된 데이터 */
interface CardData {
    imgUrl: string;
    price: string;
    title: string;
    auctionName: string;
    subtitle: string;
    sellNumber: string;
    meta: string;
    carMeta: string;
    hasCarMeta: boolean;
    hasBadges: boolean;
    fallbackImage: string;
}

/** CarCard Props */
export interface CarCardProps {
    /** 차량 데이터 */
    row: AuctionItem;
    /** 이미지 클릭 콜백 */
    onImageClick?: (imageUrl: string) => void;
    /** 상세정보 클릭 콜백 */
    onDetailsClick?: (row: AuctionItem) => void;
}

/**
 * 공통 차량 카드 컴포넌트 (데스크톱/모바일 공용)
 */
const CarCard: React.FC<CarCardProps> = ({ row, onImageClick, onDetailsClick }) => {
    // 이미지 에러 핸들러
    const handleImageError = useCallback((
        e: React.SyntheticEvent<HTMLImageElement>,
        fallbackImage: string
    ): void => {
        const target = e.target as HTMLImageElement;
        target.src = fallbackImage;
        target.classList.add('fallback-image');
        target.onclick = null;
        target.style.cursor = 'default';
    }, []);

    // 이미지 로드 핸들러
    const handleImageLoad = useCallback((
        e: React.SyntheticEvent<HTMLImageElement>,
        imgUrl: string
    ): void => {
        const target = e.target as HTMLImageElement;
        if (target.src === imgUrl) {
            target.classList.remove('fallback-image');
            target.onclick = () => onImageClick && onImageClick(imgUrl);
            target.style.cursor = imgUrl ? 'pointer' : 'default';
        }
    }, [onImageClick]);

    // 데이터 가공을 useMemo로 메모화하여 리렌더 시 불필요한 계산 방지
    const cardData = useMemo((): CardData => {
        const imgUrl = row.image || '';
        const price = row.price ? parseInt(String(row.price), 10).toLocaleString('ko-KR') : '-';
        const title = row.title || '-';
        const auctionName = row.auction_name || '';
        const subtitle = row.subtitle || '';
        const sellNumber = row.sell_number || '';
        const carNumber = row.car_number || '';
        const score = row.score || '';

        // 경매장 로고를 폴백 이미지로 설정
        const fallbackImage = getAuctionLogo(auctionName);

        const infoArr: string[] = [];
        if (row.year) infoArr.push(String(row.year));
        if (row.km) infoArr.push(`${parseInt(String(row.km), 10).toLocaleString()}km`);
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
    const handleCardClick = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
        // 이미지 클릭은 별도 처리 (이미지 확대)
        if ((e.target as HTMLElement).tagName === 'IMG') return;
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
