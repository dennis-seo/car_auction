import React, { useMemo } from 'react';
import { filterData, sortFilteredData } from '../utils/dataUtils';
import { appState } from '../utils/appState';
import CarCardMobile from './CarCardMobile.jsx';
import CarCardDesktop from './CarCardDesktop.jsx';

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
        console.log('[CarGallery] 데이터 필터링 시작:', {
            originalDataLength: data?.length || 0,
            activeFilters,
            searchQuery,
            budgetRange,
            yearRange
        });
        
        if (!data || data.length === 0) {
            console.log('[CarGallery] 원본 데이터가 없음');
            return [];
        }
        
        const filtered = filterData(data, activeFilters, searchQuery, budgetRange, yearRange);
        const sorted = sortFilteredData(filtered, activeFilters, budgetRange, yearRange, appState.lastSortedFilter);
        
        console.log('[CarGallery] 데이터 필터링 완료:', {
            originalLength: data.length,
            filteredLength: filtered.length,
            finalLength: sorted.length,
            sampleData: data[0]
        });
        
        return sorted;
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