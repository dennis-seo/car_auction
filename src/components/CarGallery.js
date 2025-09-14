import React, { useMemo, useCallback } from 'react';
import { filterData, sortFilteredData } from '../utils/dataUtils';
import { appState } from '../utils/appState';
import useIsMobile from '../utils/useIsMobile';
import CarCardMobile from './CarCardMobile';
import CarCardDesktop from './CarCardDesktop';

/**
 * 차량 갤러리 컴포넌트 (성능 최적화)
 */
const CarGallery = ({ data, activeFilters, searchQuery, budgetRange, yearRange, onImageClick, onDetailsClick }) => {
    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return [];
        const filtered = filterData(data, activeFilters, searchQuery, budgetRange, yearRange);
        return sortFilteredData(filtered, activeFilters, budgetRange, yearRange, appState.lastSortedFilter);
    }, [data, activeFilters, searchQuery, budgetRange, yearRange]);

    // 이미지 클릭 핸들러
    const handleImageClick = useCallback((imageUrl) => {
        if (imageUrl && onImageClick) {
            onImageClick(imageUrl);
        }
    }, [onImageClick]);

    const isMobile = useIsMobile(640);

    // 카드 렌더러를 useCallback으로 메모화 - 큰 목록에서 성능 향상
    const renderCarCard = useCallback((row, index) => {
        const key = `${row.sell_number}-${index}`;
        const CardComponent = isMobile ? CarCardMobile : CarCardDesktop;
        
        return (
            <CardComponent
                key={key}
                row={row}
                onImageClick={handleImageClick}
                onDetailsClick={onDetailsClick}
            />
        );
    }, [isMobile, handleImageClick, onDetailsClick]);

    // 빈 상태 컴포넌트를 메모화
    const emptyState = useMemo(() => (
        <div id="car-list-gallery" className="car-list-gallery"></div>
    ), []);

    if (!filteredData || filteredData.length === 0) {
        return emptyState;
    }

    return (
        <div id="car-list-gallery" className="car-list-gallery">
            {filteredData.map((row, index) => renderCarCard(row, index))}
        </div>
    );
};

export default React.memo(CarGallery);