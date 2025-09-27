import React, { useState, useEffect, useCallback } from 'react';
import BrandSelector from './BrandSelector';
import ModelSelector from './ModelSelector';
import SubmodelSelector from './SubmodelSelector';
import BudgetSlider from './BudgetSlider';
import YearSlider from './YearSlider';
import DynamicFilter from './FuelFilter';

/**
 * 메인 검색 영역 컴포넌트
 */
const MainSearch = ({ 
    data, 
    activeFilters, 
    searchQuery, 
    budgetRange,
    yearRange,
    onUpdateFilter, 
    onSearchQueryChange, 
    onBudgetRangeChange,
    onYearRangeChange
}) => {
    const [inputValue, setInputValue] = useState(searchQuery);

    // searchQuery가 외부에서 변경되면 inputValue도 동기화
    useEffect(() => {
        setInputValue(searchQuery);
    }, [searchQuery]);

    const handleSearchClick = useCallback(() => {
        onSearchQueryChange(inputValue.trim());
    }, [inputValue, onSearchQueryChange]);

    const handleSearchKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearchClick();
        }
    }, [handleSearchClick]);

    const handleInputChange = useCallback((e) => {
        const value = e.target.value;
        setInputValue(value);
        
        // 입력이 비워지면 즉시 검색 쿼리 해제
        if (value.trim() === '' && searchQuery !== '') {
            onSearchQueryChange('');
        }
    }, [searchQuery, onSearchQueryChange]);

    const handleFilterSearch = useCallback(() => {
        // 현재 선택된 필터들로 검색 실행 (이미 activeFilters가 업데이트되어 있으므로 별도 처리 불필요)
        console.log('필터 검색 실행');
    }, []);

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
                    />
                    <ModelSelector 
                        activeFilters={activeFilters}
                        onUpdateFilter={onUpdateFilter}
                    />
                    <SubmodelSelector 
                        activeFilters={activeFilters}
                        onUpdateFilter={onUpdateFilter}
                    />
                    <span className="btn-base tx-white bg-blue70 big radius fr">
                        <button 
                            type="button" 
                            className="filter-search-btn"
                            onClick={handleFilterSearch}
                        >
                            검색
                        </button>
                    </span>
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