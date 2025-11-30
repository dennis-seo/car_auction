import React, { useMemo } from 'react';
import { useFilteredData } from '../hooks/useFilteredData';
import { columnMapping, mileageRanges, priceRanges } from '../utils/appState';
import TableHeaderFilter from './TableHeaderFilter';
import type { AuctionItem, ActiveFilters, FilterIds, BudgetRange, SortFilterType, FilterAction } from '../types';

/** 연식 범위 타입 */
type YearRange = [number, number] | null;

/** 테이블 필터 옵션 타입 */
interface TableFilters {
    fuel?: string[];
    vehicleType?: string[];
    title?: string[];
    auction_name?: string[];
    region?: string[];
    km?: string[];
    price?: string[];
}

/** CarTable Props */
interface CarTableProps {
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
    /** 필터 업데이트 콜백 */
    onUpdateFilter: (filterType: string, value: string | string[], action?: FilterAction) => void;
    /** 테이블 표시 여부 */
    showTable: boolean;
}

/**
 * 차량 테이블 컴포넌트
 */
const CarTable: React.FC<CarTableProps> = ({
    data,
    activeFilters,
    filterIds,
    searchQuery,
    budgetRange,
    yearRange,
    lastSortedFilter,
    onImageClick,
    onDetailsClick,
    onUpdateFilter,
    showTable
}) => {
    // useFilteredData 훅 사용
    const filteredData = useFilteredData(
        data,
        activeFilters,
        searchQuery ?? '',
        budgetRange ?? null,
        yearRange ?? null,
        lastSortedFilter ?? null,
        filterIds ?? null
    );

    // 테이블 필터 옵션을 useMemo로 최적화
    const tableFilters = useMemo((): TableFilters => {
        if (!data || data.length === 0) return {};

        return {
            fuel: [...new Set(data.map(row => row.fuel).filter(Boolean))].sort(),
            vehicleType: [...new Set(data.map(row =>
                row.vehicleType || row.usage || row.type || row.purpose || row.fuel
            ).filter((v): v is string => Boolean(v)))].sort(),
            title: [...new Set(data.map(row => {
                const match = row.title ? row.title.match(/\[(.*?)\]/) : null;
                return match ? match[1] : null;
            }).filter((v): v is string => Boolean(v)))].sort(),
            auction_name: [...new Set(data.map(row => row.auction_name).filter(Boolean))].sort(),
            region: [...new Set(data.map(row => row.region).filter(Boolean))].sort(),
            km: Object.keys(mileageRanges),
            price: Object.keys(priceRanges)
        };
    }, [data]);

    const handleCellClick = (e: React.MouseEvent<HTMLTableCellElement>, row: AuctionItem, columnKey: string): void => {
        if (columnKey === 'title' && row.image) {
            onImageClick(row.image);
        } else if (columnKey === 'sell_number') {
            onDetailsClick(row);
        }
    };

    const renderTableHeader = (): React.ReactNode => {
        return (
            <tr>
                {Object.keys(columnMapping).map(key => (
                    <TableHeaderFilter
                        key={key}
                        columnKey={key}
                        columnName={columnMapping[key]}
                        options={tableFilters[key as keyof TableFilters]}
                        activeFilters={activeFilters}
                        onUpdateFilter={onUpdateFilter}
                        isFilterable={["fuel", "vehicleType", "title", "km", "price", "year", "auction_name", "region"].includes(key)}
                    />
                ))}
            </tr>
        );
    };

    const renderTableRow = (row: AuctionItem, index: number): React.ReactNode => {
        return (
            <tr key={`${row.sell_number}-${index}`}>
                {Object.keys(columnMapping).map(key => {
                    const rowValue = row[key as keyof AuctionItem];
                    let content: React.ReactNode = rowValue !== undefined && rowValue !== null ? String(rowValue) : '-';
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
                    } else if (key === 'km' && row.km && !isNaN(parseInt(String(row.km), 10))) {
                        content = `${parseInt(String(row.km), 10).toLocaleString('ko-KR')} km`;
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
