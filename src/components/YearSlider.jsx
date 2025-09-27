import React, { useState, useEffect, useCallback } from 'react';
import { Range } from 'react-range';

/**
 * 연식 슬라이더 컴포넌트
 */
const YearSlider = ({ yearRange, onYearRangeChange }) => {
    // 연식 범위 상수 정의
    const CURRENT_YEAR = new Date().getFullYear();
    const MIN_YEAR = 2000;
    const MAX_YEAR = CURRENT_YEAR;
    const STEP = 1;

    // 인기 연식 범위 정의
    const POPULAR_YEAR_RANGES = [
        { min: CURRENT_YEAR - 2, max: CURRENT_YEAR, label: '최신 (2년 이내)' },
        { min: CURRENT_YEAR - 5, max: CURRENT_YEAR - 3, label: '3~5년차' },
        { min: CURRENT_YEAR - 10, max: CURRENT_YEAR - 6, label: '6~10년차' },
        { min: MIN_YEAR, max: CURRENT_YEAR - 11, label: '10년 이상' }
    ];

    const [values, setValues] = useState([MIN_YEAR, MAX_YEAR]);
    const [isSliderActive, setIsSliderActive] = useState(false);

    // yearRange prop이 변경될 때 슬라이더 값 동기화
    useEffect(() => {
        if (yearRange && Array.isArray(yearRange) && yearRange.length === 2) {
            setValues([yearRange[0], yearRange[1]]);
            setIsSliderActive(true);
        } else {
            setValues([MIN_YEAR, MAX_YEAR]);
            setIsSliderActive(false);
        }
    }, [yearRange, MIN_YEAR, MAX_YEAR]);

    const handleSliderChange = useCallback((newValues) => {
        setValues(newValues);
        onYearRangeChange(newValues);
        setIsSliderActive(true);
    }, [onYearRangeChange]);

    const handleRangeButtonClick = useCallback((rangeItem) => {
        const newRange = [rangeItem.min, rangeItem.max];
        onYearRangeChange(newRange);
        setValues(newRange);
        setIsSliderActive(true);
    }, [onYearRangeChange]);

    const handleReset = useCallback(() => {
        onYearRangeChange(null);
        setValues([MIN_YEAR, MAX_YEAR]);
        setIsSliderActive(false);
    }, [onYearRangeChange, MIN_YEAR, MAX_YEAR]);

    const getCurrentRangeLabel = () => {
        if (!isSliderActive) return '전체';
        
        const [min, max] = values;
        if (min === MIN_YEAR && max === MAX_YEAR) return '전체';
        if (min === max) return `${min}년`;
        return `${min}년 ~ ${max}년`;
    };

    const isRangeActive = (rangeItem) => {
        if (!yearRange || !Array.isArray(yearRange)) return false;
        return yearRange[0] === rangeItem.min && yearRange[1] === rangeItem.max;
    };

    return (
        <div className="slider-container">
            <div className="slider-header">
                <h4>🗓️ 연식 범위</h4>
                <div className="slider-value">
                    {getCurrentRangeLabel()}
                </div>
            </div>

            <div className="range-buttons">
                {POPULAR_YEAR_RANGES.map((rangeItem, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`range-button ${isRangeActive(rangeItem) ? 'active' : ''}`}
                        onClick={() => handleRangeButtonClick(rangeItem)}
                        title={`${rangeItem.label} 선택`}
                    >
                        {rangeItem.label}
                    </button>
                ))}
            </div>

            <div className="slider-wrapper">
                <Range
                    values={values}
                    step={STEP}
                    min={MIN_YEAR}
                    max={MAX_YEAR}
                    onChange={handleSliderChange}
                    renderTrack={({ props, children }) => (
                        <div
                            onMouseDown={props.onMouseDown}
                            onTouchStart={props.onTouchStart}
                            style={{
                                ...props.style,
                                height: '36px',
                                display: 'flex',
                                width: '100%'
                            }}
                        >
                            <div
                                ref={props.ref}
                                style={{
                                    height: '5px',
                                    width: '100%',
                                    borderRadius: '4px',
                                    background: `linear-gradient(to right, 
                                        #ccc 0%, 
                                        #ccc ${((values[0] - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%, 
                                        #28a745 ${((values[0] - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%, 
                                        #28a745 ${((values[1] - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%, 
                                        #ccc ${((values[1] - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%, 
                                        #ccc 100%)`,
                                    alignSelf: 'center'
                                }}
                            >
                                {children}
                            </div>
                        </div>
                    )}
                    renderThumb={({ props, index }) => (
                        <div
                            {...props}
                            style={{
                                ...props.style,
                                height: '20px',
                                width: '20px',
                                borderRadius: '50%',
                                backgroundColor: '#28a745',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                boxShadow: '0px 2px 6px #AAA',
                                cursor: 'pointer'
                            }}
                            aria-label={`연식 범위 ${index === 0 ? '최소값' : '최대값'} 조절`}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '-28px',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: '12px',
                                    fontFamily: 'Arial,Helvetica Neue,Helvetica,sans-serif',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {values[index]}년
                            </div>
                        </div>
                    )}
                />
            </div>

            <div className="slider-footer">
                <div className="slider-labels">
                    <span>{MIN_YEAR}년</span>
                    <span>{MAX_YEAR}년</span>
                </div>
                
                {isSliderActive && (
                    <button
                        type="button"
                        className="reset-button"
                        onClick={handleReset}
                        title="연식 범위 초기화"
                    >
                        초기화
                    </button>
                )}
            </div>
        </div>
    );
};

export default YearSlider;