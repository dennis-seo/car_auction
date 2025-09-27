import React, { useMemo } from 'react';
import { filterData, sortFilteredData } from '../utils/dataUtils';
import { appState } from '../utils/appState';
import CarCardMobile from './CarCardMobile';
import CarCardDesktop from './CarCardDesktop';

/**
 * 차량 갤러리 컴포넌트
 * 모바일/데스크톱에 따라 다른 카드 컴포넌트를 렌더링
 */
const CarGallery = ({ 
    data, 
    activeFilters, 
    searchQuery, 
    budgetRange, 
    yearRange, 
    onImageClick, 
    onDetailsClick 
}) => {
    // 필터링된 데이터 계산
    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        const filtered = filterData(data, activeFilters, searchQuery, budgetRange, yearRange);
        return sortFilteredData(filtered, activeFilters, budgetRange, yearRange, appState.lastSortedFilter);
    }, [data, activeFilters, searchQuery, budgetRange, yearRange]);

    // 렌더링할 카드 컴포넌트 결정
    const CardComponent = window.innerWidth <= 768 ? CarCardMobile : CarCardDesktop;

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
            <div className="car-gallery-header">
                <h3>검색 결과 ({filteredData.length.toLocaleString()}대)</h3>
            </div>
            
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