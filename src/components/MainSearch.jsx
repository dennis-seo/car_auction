import React, { useState, useEffect, useCallback } from 'react';
import BrandSelector from './BrandSelector.jsx';
import ModelSelector from './ModelSelector.jsx';
import SubmodelSelector from './SubmodelSelector.jsx';
import BudgetSlider from './BudgetSlider.jsx';
import YearSlider from './YearSlider.jsx';
import DynamicFilter from './FuelFilter.jsx';

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