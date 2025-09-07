import React, { useMemo, useState, useEffect } from 'react';
import { filterData, sortFilteredData } from '../utils/dataUtils';
import { columnMapping, mileageRanges, priceRanges, appState } from '../utils/appState';
import TableHeaderFilter from './TableHeaderFilter';

/**
 * 차량 테이블 컴포넌트
 */
const CarTable = ({ 
    data, 
    activeFilters, 
    searchQuery, 
    budgetRange, 
    yearRange,
    onImageClick, 
    onDetailsClick, 
    onUpdateFilter,
    showTable 
}) => {
    const [tableFilters, setTableFilters] = useState({});

    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        const filtered = filterData(data, activeFilters, searchQuery, budgetRange, yearRange);
        return sortFilteredData(filtered, activeFilters, appState.lastSortedFilter);
    }, [data, activeFilters, searchQuery, budgetRange, yearRange]);

    useEffect(() => {
        // 데이터가 변경되면 테이블 필터 옵션 업데이트
        if (data && data.length > 0) {
            setTableFilters({
                fuel: [...new Set(data.map(row => row.fuel).filter(Boolean))].sort(),
                title: [...new Set(data.map(row => {
                    const match = row.title ? row.title.match(/\[(.*?)\]/) : null;
                    return match ? match[1] : null;
                }).filter(Boolean))].sort(),
                auction_name: [...new Set(data.map(row => row.auction_name).filter(Boolean))].sort(),
                region: [...new Set(data.map(row => row.region).filter(Boolean))].sort(),
                km: Object.keys(mileageRanges),
                price: Object.keys(priceRanges)
            });
        }
    }, [data]);

    const handleCellClick = (e, row, columnKey) => {
        if (columnKey === 'title' && row.image) {
            onImageClick(row.image);
        } else if (columnKey === 'sell_number') {
            onDetailsClick(row);
        }
    };

    const renderTableHeader = () => {
        return (
            <tr>
                {Object.keys(columnMapping).map(key => (
                    <TableHeaderFilter
                        key={key}
                        columnKey={key}
                        columnName={columnMapping[key]}
                        options={tableFilters[key]}
                        activeFilters={activeFilters}
                        onUpdateFilter={onUpdateFilter}
                        isFilterable={["fuel", "title", "km", "price", "year", "auction_name", "region"].includes(key)}
                    />
                ))}
            </tr>
        );
    };

    const renderTableRow = (row, index) => {
        return (
            <tr key={`${row.sell_number}-${index}`}>
                {Object.keys(columnMapping).map(key => {
                    let content = row[key] || '-';
                    let className = '';
                    let isClickable = false;

                    if (key === 'sell_number') {
                        className = 'sell-number-clickable';
                        isClickable = true;
                    } else if (key === 'details') {
                        return (
                            <td key={key} className="details-cell">
                                <div className="details-grid">
                                    <div className="detail-item-label">차량<br/>번호</div>
                                    <div className="detail-item-value">{row.car_number || '-'}</div>
                                    <div className="detail-item-label">점수</div>
                                    <div className="detail-item-value">{row.score || '-'}</div>
                                </div>
                            </td>
                        );
                    } else if (key === 'km' && !isNaN(parseInt(row.km, 10))) {
                        content = `${parseInt(row.km, 10).toLocaleString('ko-KR')} km`;
                    } else if (key === 'title' && row.image) {
                        className = 'title-clickable';
                        isClickable = true;
                    }

                    if (['fuel', 'price', 'km', 'title'].includes(key)) {
                        className += ` ${key}-column`;
                    }

                    return (
                        <td
                            key={key}
                            className={className}
                            onClick={isClickable ? (e) => handleCellClick(e, row, key) : undefined}
                            style={isClickable ? { cursor: 'pointer' } : undefined}
                        >
                            {content}
                        </td>
                    );
                })}
            </tr>
        );
    };

    if (!showTable || !filteredData || filteredData.length === 0) {
        return (
            <div className="table-wrapper">
                <table id="car-table" style={{ display: 'none' }}>
                    <thead></thead>
                    <tbody></tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="table-wrapper">
            <table id="car-table" style={{ display: 'table' }}>
                <thead>
                    {renderTableHeader()}
                </thead>
                <tbody>
                    {filteredData.length === 0 ? (
                        <tr>
                            <td 
                                colSpan={Object.keys(columnMapping).length}
                                style={{ 
                                    padding: '2rem', 
                                    textAlign: 'center' 
                                }}
                            >
                                검색 결과가 없습니다. 다른 필터 조건을 선택해주세요.
                            </td>
                        </tr>
                    ) : (
                        filteredData.map((row, index) => renderTableRow(row, index))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default CarTable;