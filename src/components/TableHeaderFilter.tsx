import React, { useState, useEffect, useRef } from 'react';
import { mileageRanges, priceRanges } from '../utils/appState';
import type { ActiveFilters, FilterAction } from '../types';

/** TableHeaderFilter Props */
interface TableHeaderFilterProps {
    /** 컬럼 키 */
    columnKey: string;
    /** 컬럼 이름 (표시용) */
    columnName: string;
    /** 필터 옵션 목록 */
    options?: string[];
    /** 활성화된 필터 */
    activeFilters: ActiveFilters;
    /** 필터 업데이트 콜백 */
    onUpdateFilter: (filterType: string, value: string | string[], action?: FilterAction) => void;
    /** 필터링 가능 여부 */
    isFilterable: boolean;
}

/**
 * 테이블 헤더 필터 컴포넌트
 */
const TableHeaderFilter: React.FC<TableHeaderFilterProps> = ({
    columnKey,
    columnName,
    options,
    activeFilters,
    onUpdateFilter,
    isFilterable
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLTableCellElement>(null);

    useEffect(() => {
        // 외부 클릭 시 드롭다운 닫기
        const handleClickOutside = (event: MouseEvent): void => {
            if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleToggle = (e: React.MouseEvent<HTMLTableCellElement>): void => {
        e.stopPropagation();
        if (isFilterable) {
            setIsOpen(!isOpen);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTableCellElement>): void => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (isFilterable) {
                setIsOpen(!isOpen);
            }
        }
    };

    const handleFilterSelect = (value: string): void => {
        onUpdateFilter(columnKey, value, 'toggle');
        // 드롭다운을 열어둠 (다중 선택 가능)
    };

    const getActiveFilterValues = (): string[] => {
        const filterKey = columnKey as keyof ActiveFilters;
        const values = activeFilters[filterKey];
        return Array.isArray(values) ? (values as string[]) : [];
    };

    const renderFilterOptions = (): React.ReactNode => {
        if (!options || options.length === 0) {
            return (
                <div className="filter-option-item disabled">
                    필터 옵션이 없습니다.
                </div>
            );
        }

        const activeValues = getActiveFilterValues();

        // km, price 범위 처리
        if (columnKey === 'km' || columnKey === 'price') {
            const ranges = columnKey === 'km' ? mileageRanges : priceRanges;

            return Object.keys(ranges).map(rangeKey => {
                const isActive = activeValues.includes(rangeKey);
                return (
                    <div
                        key={rangeKey}
                        className={`filter-option-item ${isActive ? 'active' : ''}`}
                        onClick={() => handleFilterSelect(rangeKey)}
                        role="option"
                        aria-selected={isActive}
                    >
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => { }} // onClick에서 처리
                            aria-label={`${rangeKey} 필터 ${isActive ? '해제' : '적용'}`}
                        />
                        <span>{rangeKey}</span>
                    </div>
                );
            });
        }

        // 일반 옵션 처리
        return options.map(option => {
            const isActive = activeValues.includes(option);
            return (
                <div
                    key={option}
                    className={`filter-option-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleFilterSelect(option)}
                    role="option"
                    aria-selected={isActive}
                >
                    <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => { }} // onClick에서 처리
                        aria-label={`${option} 필터 ${isActive ? '해제' : '적용'}`}
                    />
                    <span>{option}</span>
                </div>
            );
        });
    };

    const activeCount = getActiveFilterValues().length;
    const hasActiveFilters = activeCount > 0;

    return (
        <th
            ref={headerRef}
            className={`table-header-filter ${isFilterable ? 'filterable' : ''} ${hasActiveFilters ? 'has-active-filters' : ''}`}
            role={isFilterable ? 'button' : undefined}
            tabIndex={isFilterable ? 0 : undefined}
            aria-haspopup={isFilterable ? 'listbox' : undefined}
            aria-expanded={isOpen}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
        >
            <div className="header-content">
                <span className="header-text">{columnName}</span>
                {isFilterable && (
                    <span className="filter-icon" aria-hidden="true">
                        {hasActiveFilters ? `▼(${activeCount})` : '▼'}
                    </span>
                )}
            </div>

            {isOpen && isFilterable && (
                <div className="filter-dropdown" ref={dropdownRef}>
                    <div className="filter-dropdown-header">
                        <span>{columnName} 필터</span>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                className="clear-filters-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateFilter(columnKey, [], 'clear');
                                }}
                                title="모든 필터 해제"
                            >
                                전체 해제
                            </button>
                        )}
                    </div>
                    <div
                        className="filter-dropdown-content"
                        role="listbox"
                        aria-label={`${columnName} 필터 옵션`}
                    >
                        {renderFilterOptions()}
                    </div>
                </div>
            )}
        </th>
    );
};

export default TableHeaderFilter;
