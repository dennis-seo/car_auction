import React, { useState, useRef, useEffect } from 'react';
import { appState } from '../utils/appState';

/**
 * 테이블 헤더 필터 컴포넌트
 */
const TableHeaderFilter = ({ 
    columnKey, 
    columnName, 
    options = [], 
    activeFilters, 
    onUpdateFilter, 
    isFilterable 
}) => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isYearSliderOpen, setIsYearSliderOpen] = useState(false);
    const headerRef = useRef(null);
    const popupRef = useRef(null);
    const yearSliderRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (headerRef.current && !headerRef.current.contains(event.target)) {
                setIsPopupOpen(false);
                setIsYearSliderOpen(false);
            }
        };

        if (isPopupOpen || isYearSliderOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isPopupOpen, isYearSliderOpen]);

    const handleHeaderClick = (e) => {
        if (!isFilterable) return;
        
        e.stopPropagation();
        
        if (columnKey === 'year') {
            setIsYearSliderOpen(!isYearSliderOpen);
            setIsPopupOpen(false);
        } else {
            setIsPopupOpen(!isPopupOpen);
            setIsYearSliderOpen(false);
        }
    };

    const handleFilterOptionClick = (optionValue) => {
        if (optionValue === 'all') {
            onUpdateFilter(columnKey, [], 'clear');
        } else {
            onUpdateFilter(columnKey, optionValue, 'toggle');
        }
        setIsPopupOpen(false);
    };

    const handleYearRangeChange = (minYear, maxYear) => {
        if (minYear === appState.yearMin && maxYear === appState.yearMax) {
            onUpdateFilter('year', [], 'clear');
        } else {
            onUpdateFilter('year', [minYear, maxYear], 'set');
        }
    };

    const renderFilterPopup = () => {
        if (!isPopupOpen || !options || options.length === 0) return null;

        return (
            <div 
                ref={popupRef}
                className="filter-popup active"
                style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    minWidth: '150px',
                    padding: '0.5rem 0',
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}
            >
                <button
                    className="filter-option"
                    onClick={() => handleFilterOptionClick('all')}
                    style={{
                        display: 'block',
                        width: '100%',
                        padding: '0.75rem 1.25rem',
                        color: '#333',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        textAlign: 'left'
                    }}
                >
                    전체
                </button>
                {options.map(option => {
                    const isSelected = (activeFilters[columnKey] || []).includes(option);
                    return (
                        <button
                            key={option}
                            className="filter-option"
                            onClick={() => handleFilterOptionClick(option)}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '0.75rem 1.25rem',
                                color: '#333',
                                background: isSelected ? '#e7f5ff' : 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontWeight: isSelected ? 'bold' : 'normal',
                                textAlign: 'left'
                            }}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>
        );
    };

    const renderYearSlider = () => {
        if (!isYearSliderOpen) return null;

        const min = appState.yearMin || 2000;
        const max = appState.yearMax || 2026;
        const currentRange = activeFilters.year || [min, max];
        const [curMin, curMax] = Array.isArray(currentRange) && currentRange.length === 2 
            ? currentRange 
            : [min, max];

        return (
            <div 
                ref={yearSliderRef}
                className="filter-popup active"
                style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    padding: '14px 18px 15px 18px',
                    minWidth: '230px'
                }}
            >
                <div style={{ marginBottom: '12px', fontWeight: '500' }}>
                    연식 범위: <span>{curMin} ~ {curMax}</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                    <input
                        type="range"
                        min={min}
                        max={max}
                        value={curMin}
                        onChange={(e) => {
                            const newMin = parseInt(e.target.value);
                            handleYearRangeChange(newMin, Math.max(newMin, curMax));
                        }}
                        style={{ width: '100%', marginBottom: '8px' }}
                        aria-label={`최소 연식: ${curMin}`}
                    />
                    <input
                        type="range"
                        min={min}
                        max={max}
                        value={curMax}
                        onChange={(e) => {
                            const newMax = parseInt(e.target.value);
                            handleYearRangeChange(Math.min(curMin, newMax), newMax);
                        }}
                        style={{ width: '100%' }}
                        aria-label={`최대 연식: ${curMax}`}
                    />
                </div>
                <button 
                    onClick={() => handleYearRangeChange(min, max)}
                    style={{
                        width: '100%',
                        borderRadius: '10px',
                        border: '1px solid #ccc',
                        background: '#f4f6fa',
                        fontWeight: '500',
                        cursor: 'pointer',
                        padding: '8px'
                    }}
                >
                    전체
                </button>
            </div>
        );
    };

    if (!isFilterable) {
        return <th>{columnName}</th>;
    }

    return (
        <th 
            ref={headerRef}
            className="filterable-header"
            onClick={handleHeaderClick}
            style={{ 
                position: 'relative', 
                cursor: 'pointer' 
            }}
        >
            {columnName} <span className="arrow">▼</span>
            {renderFilterPopup()}
            {renderYearSlider()}
        </th>
    );
};

export default TableHeaderFilter;