import React from 'react';
import { useFilteredData } from '../hooks/useFilteredData';
import { useIsMobile } from '../hooks/useIsMobile';
import CarCardMobile from './CarCardMobile';
import CarCardDesktop from './CarCardDesktop';
import type { AuctionItem, ActiveFilters, FilterIds, BudgetRange, SortFilterType } from '../types';

/** 연식 범위 타입 */
type YearRange = [number, number] | null;

/** CarGallery Props */
interface CarGalleryProps {
    /** 차량 데이터 */
    data: AuctionItem[];
    /** 활성화된 필터 */
    activeFilters: ActiveFilters;
    /** ID 기반 필터 */
    filterIds?: FilterIds | null;
    /** 검색 쿼리 */
    searchQuery?: string;
    /** 예산 범위 */
    budgetRange?: BudgetRange | null;
    /** 연식 범위 */
    yearRange?: YearRange;
    /** 마지막 정렬 필터 */
    lastSortedFilter?: SortFilterType;
    /** 이미지 클릭 콜백 */
    onImageClick: (imageUrl: string) => void;
    /** 상세보기 클릭 콜백 */
    onDetailsClick: (row: AuctionItem) => void;
}

/**
 * 차량 갤러리 컴포넌트
 * 모바일/데스크톱에 따라 다른 카드 컴포넌트를 렌더링
 */
const CarGallery: React.FC<CarGalleryProps> = ({
    data,
    activeFilters,
    filterIds,
    searchQuery,
    budgetRange,
    yearRange,
    lastSortedFilter,
    onImageClick,
    onDetailsClick
}) => {
    // 커스텀 훅 사용
    const isMobile = useIsMobile(768);
    const filteredData = useFilteredData(
        data,
        activeFilters,
        searchQuery ?? '',
        budgetRange ?? null,
        yearRange ?? null,
        lastSortedFilter ?? null,
        filterIds ?? null
    );

    // 렌더링할 카드 컴포넌트 결정
    const CardComponent = isMobile ? CarCardMobile : CarCardDesktop;

    if (!data || data.length === 0) {
        return (
            <div id="car-gallery" className="car-gallery-container">
                <div className="no-data-message">
                    <p>데이터가 없습니다. 날짜를 선택해주세요.</p>
                </div>
            </div>
        );
    }

    if (filteredData.length === 0) {
        return (
            <div id="car-gallery" className="car-gallery-container">
                <div className="no-results-message">
                    <p>검색 결과가 없습니다. 다른 조건으로 검색해보세요.</p>
                </div>
            </div>
        );
    }

    return (
        <div id="car-gallery" className="car-gallery-container">
            <div className="car-gallery-grid">
                {filteredData.map((row, index) => (
                    <CardComponent
                        key={`${row.sell_number || 'no-sell-number'}-${index}`}
                        row={row}
                        onImageClick={onImageClick}
                        onDetailsClick={onDetailsClick}
                    />
                ))}
            </div>
        </div>
    );
};

export default CarGallery;
