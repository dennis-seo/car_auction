import React from 'react';
import PropTypes from 'prop-types';
import { useFilteredData } from '../hooks/useFilteredData';
import { useIsMobile } from '../hooks/useIsMobile';
import CarCardMobile from './CarCardMobile.jsx';
import CarCardDesktop from './CarCardDesktop.jsx';

/**
 * 차량 갤러리 컴포넌트
 * 모바일/데스크톱에 따라 다른 카드 컴포넌트를 렌더링
 */
const CarGallery = ({
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
        searchQuery,
        budgetRange,
        yearRange,
        lastSortedFilter,
        filterIds
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

CarGallery.propTypes = {
    data: PropTypes.array.isRequired,
    activeFilters: PropTypes.object.isRequired,
    filterIds: PropTypes.object,
    searchQuery: PropTypes.string,
    budgetRange: PropTypes.object,
    yearRange: PropTypes.array,
    lastSortedFilter: PropTypes.string,
    onImageClick: PropTypes.func.isRequired,
    onDetailsClick: PropTypes.func.isRequired
};

export default CarGallery;