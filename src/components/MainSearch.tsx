import React, { useState, useEffect, useCallback } from 'react';
import BrandSelector from './BrandSelector';
import ModelSelector from './ModelSelector';
import SubmodelSelector from './SubmodelSelector';
import BudgetSlider from './BudgetSlider';
import YearSlider from './YearSlider';
import DynamicFilter from './FuelFilter';
import type { AuctionItem, ActiveFilters, FilterIds, BudgetRange, FilterAction } from '../types';

/** 필터 라벨 정보 */
interface FilterLabels {
    manufacturer: string | null;
    model: string | null;
    trim: string | null;
}

/** 연식 범위 타입 */
type YearRange = [number, number] | null;

/** MainSearch Props */
interface MainSearchProps {
    /** 차량 데이터 */
    data: AuctionItem[];
    /** 활성화된 필터 */
    activeFilters: ActiveFilters;
    /** ID 기반 필터 */
    filterIds: FilterIds | null;
    /** 검색 쿼리 */
    searchQuery: string;
    /** 예산 범위 */
    budgetRange: BudgetRange | null;
    /** 연식 범위 */
    yearRange: YearRange;
    /** 필터 업데이트 콜백 */
    onUpdateFilter: (filterType: string, value: string | string[], action?: FilterAction) => void;
    /** ID 기반 필터 변경 콜백 */
    onFilterIdChange: (filterIds: FilterIds, labels: FilterLabels) => void;
    /** 검색 쿼리 변경 콜백 */
    onSearchQueryChange: (query: string) => void;
    /** 예산 범위 변경 콜백 */
    onBudgetRangeChange: (range: BudgetRange | null) => void;
    /** 연식 범위 변경 콜백 */
    onYearRangeChange: (range: YearRange) => void;
}

/**
 * 메인 검색 영역 컴포넌트
 */
const MainSearch: React.FC<MainSearchProps> = ({
    data,
    activeFilters,
    filterIds,
    searchQuery,
    budgetRange,
    yearRange,
    onUpdateFilter,
    onFilterIdChange,
    onSearchQueryChange,
    onBudgetRangeChange,
    onYearRangeChange
}) => {
    const [inputValue, setInputValue] = useState<string>(searchQuery);

    // searchQuery가 외부에서 변경되면 inputValue도 동기화
    useEffect(() => {
        setInputValue(searchQuery);
    }, [searchQuery]);

    const handleSearchClick = useCallback((): void => {
        onSearchQueryChange(inputValue.trim());
    }, [inputValue, onSearchQueryChange]);

    const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearchClick();
        }
    }, [handleSearchClick]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
        const value = e.target.value;
        setInputValue(value);

        // 입력이 비워지면 즉시 검색 쿼리 해제
        if (value.trim() === '' && searchQuery !== '') {
            onSearchQueryChange('');
        }
    }, [searchQuery, onSearchQueryChange]);

    return (
        <div className="main-search-container">
            <div className="main-auto-search">
                <h3>원하는 차를 찾아보세요!</h3>
                <div className="input-area">
                    <input
                        type="text"
                        placeholder="찾으시는 차량명을 입력하세요"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleSearchKeyDown}
                        aria-label="차량명 검색"
                    />
                    <span className="btn-base big btn-search-submit">
                        <button
                            type="button"
                            onClick={handleSearchClick}
                            aria-label="검색"
                        />
                    </span>
                </div>
            </div>

            <div className="main-car-filter">
                <div className="car-select-wrap">
                    <BrandSelector
                        activeFilters={activeFilters}
                        onUpdateFilter={onUpdateFilter}
                        onFilterIdChange={onFilterIdChange}
                    />
                    <ModelSelector
                        activeFilters={activeFilters}
                        onUpdateFilter={onUpdateFilter}
                        filterIds={filterIds}
                        onFilterIdChange={onFilterIdChange}
                    />
                    <SubmodelSelector
                        activeFilters={activeFilters}
                        onUpdateFilter={onUpdateFilter}
                        filterIds={filterIds}
                        onFilterIdChange={onFilterIdChange}
                    />
                </div>
            </div>
            <DynamicFilter
                data={data}
                activeFilters={activeFilters}
                onUpdateFilter={onUpdateFilter}
            />
            <div className="slider-container-wrapper">
                <BudgetSlider
                    budgetRange={budgetRange}
                    onBudgetRangeChange={onBudgetRangeChange}
                />
                <YearSlider
                    yearRange={yearRange}
                    onYearRangeChange={onYearRangeChange}
                />
            </div>
        </div>
    );
};

export default MainSearch;
