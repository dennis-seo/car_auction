import React, { useMemo } from 'react';
import { filterData, sortFilteredData } from '../utils/dataUtils';
import { appState } from '../utils/appState';
import useIsMobile from '../utils/useIsMobile';
import CarCardMobile from './CarCardMobile';
import CarCardDesktop from './CarCardDesktop';

/**
 * 차량 갤러리 컴포넌트
 */
const CarGallery = ({ data, activeFilters, searchQuery, budgetRange, onImageClick, onDetailsClick }) => {
    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        const filtered = filterData(data, activeFilters, searchQuery, budgetRange);
        return sortFilteredData(filtered, activeFilters, appState.lastSortedFilter);
    }, [data, activeFilters, searchQuery, budgetRange]);

    // 이미지 클릭 핸들러
    const handleImageClick = (imageUrl) => {
        if (imageUrl && onImageClick) {
            onImageClick(imageUrl);
        }
    };

    const isMobile = useIsMobile(640);

    const renderCarCard = (row, index) => {
        const key = `${row.sell_number}-${index}`;
        return isMobile ? (
            <CarCardMobile
                key={key}
                row={row}
                onImageClick={handleImageClick}
                onDetailsClick={onDetailsClick}
            />
        ) : (
            <CarCardDesktop
                key={key}
                row={row}
                onImageClick={handleImageClick}
                onDetailsClick={onDetailsClick}
            />
        );
    };

    if (!filteredData || filteredData.length === 0) {
        return <div id="car-list-gallery" className="car-list-gallery"></div>;
    }

    return (
        <div id="car-list-gallery" className="car-list-gallery">
            {filteredData.map((row, index) => renderCarCard(row, index))}
        </div>
    );
};

export default CarGallery;