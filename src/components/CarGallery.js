import React, { useMemo } from 'react';
import { filterData, sortFilteredData } from '../utils/dataUtils';
import { appState } from '../utils/appState';

/**
 * 차량 갤러리 컴포넌트
 */
const CarGallery = ({ data, activeFilters, searchQuery, budgetRange, onImageClick }) => {
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

    const renderCarCard = (row, index) => {
        const imgUrl = row.image || '';
        const price = row.price ? parseInt(row.price, 10).toLocaleString('ko-KR') : '-';
        const title = row.title || '-';
        const auctionName = row.auction_name || '';
        const subtitle = row.subtitle || '';
        
        const infoArr = [];
        if (row.year) infoArr.push(row.year);
        if (row.km) infoArr.push(`${parseInt(row.km, 10).toLocaleString()}km`);
        if (row.fuel) infoArr.push(row.fuel);
        if (row.region) infoArr.push(row.region);
        const meta = infoArr.join('  |  ');

        return (
            <div key={`${row.sell_number}-${index}`} className="car-list-item-card">
                <img 
                    className="car-list-card-image" 
                    src={imgUrl} 
                    onError={(e) => { e.target.src = 'images/no_car_image.png'; }}
                    onClick={() => handleImageClick(imgUrl)}
                    style={{ cursor: imgUrl ? 'pointer' : 'default' }}
                    alt="차량 이미지" 
                />
                <div className="car-list-card-details">
                    {auctionName && (
                        <div className="car-list-card-auction">{auctionName}</div>
                    )}
                    {subtitle && (
                        <div className="car-list-card-subtitle">{subtitle}</div>
                    )}
                    <div className="car-list-card-title">{title}</div>
                    <div className="car-list-card-meta">{meta}</div>
                </div>
                <div className="car-list-card-price">
                    {price}<span className="car-list-card-price-label">만원</span>
                </div>
            </div>
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