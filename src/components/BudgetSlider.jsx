import React, { useState, useEffect, useCallback } from 'react';
import { Range } from 'react-range';

/**
 * 예산 슬라이더 컴포넌트
 */
const BudgetSlider = ({ budgetRange, onBudgetRangeChange }) => {
    // 예산 범위 상수 정의
    const BUDGET_RANGES = [
        { min: 0, max: 500, label: '500만원 이하' },
        { min: 500, max: 1000, label: '500~1000만원' },
        { min: 1000, max: 1500, label: '1000~1500만원' },
        { min: 1500, max: 2000, label: '1500~2000만원' },
        { min: 2000, max: 2500, label: '2000~2500만원' },
        { min: 2500, max: 3000, label: '2500~3000만원' },
        { min: 3000, max: Infinity, label: '3000만원 이상' }
    ];

    const MIN_BUDGET = 0;
    const MAX_BUDGET = 3000;
    const STEP = 100;

    const [values, setValues] = useState([MIN_BUDGET, MAX_BUDGET]);
    const [isSliderActive, setIsSliderActive] = useState(false);

    // budgetRange prop이 변경될 때 슬라이더 값 동기화
    useEffect(() => {
        if (budgetRange) {
            const min = budgetRange.min === 0 ? MIN_BUDGET : budgetRange.min;
            const max = budgetRange.max === Infinity ? MAX_BUDGET : budgetRange.max;
            setValues([min, max]);
            setIsSliderActive(true);
        } else {
            setValues([MIN_BUDGET, MAX_BUDGET]);
            setIsSliderActive(false);
        }
    }, [budgetRange]);

    const handleSliderChange = useCallback((newValues) => {
        setValues(newValues);
        
        const [min, max] = newValues;
        const range = {
            min: min === MIN_BUDGET ? 0 : min,
            max: max === MAX_BUDGET ? Infinity : max
        };
        
        onBudgetRangeChange(range);
        setIsSliderActive(true);
    }, [onBudgetRangeChange]);

    const handleRangeButtonClick = useCallback((rangeItem) => {
        const newRange = {
            min: rangeItem.min,
            max: rangeItem.max
        };
        
        onBudgetRangeChange(newRange);
        
        const min = rangeItem.min === 0 ? MIN_BUDGET : rangeItem.min;
        const max = rangeItem.max === Infinity ? MAX_BUDGET : rangeItem.max;
        setValues([min, max]);
        setIsSliderActive(true);
    }, [onBudgetRangeChange]);

    const handleReset = useCallback(() => {
        onBudgetRangeChange(null);
        setValues([MIN_BUDGET, MAX_BUDGET]);
        setIsSliderActive(false);
    }, [onBudgetRangeChange]);

    const formatBudgetLabel = (value) => {
        if (value === MIN_BUDGET && values[1] === MAX_BUDGET) return '전체';
        if (value === MIN_BUDGET) return '0만원';
        if (value === MAX_BUDGET) return '3000만원 이상';
        return `${value.toLocaleString()}만원`;
    };

    const getCurrentRangeLabel = () => {
        if (!isSliderActive) return '전체';
        
        const [min, max] = values;
        const minLabel = min === MIN_BUDGET ? '0만원' : `${min.toLocaleString()}만원`;
        const maxLabel = max === MAX_BUDGET ? '3000만원 이상' : `${max.toLocaleString()}만원`;
        
        return `${minLabel} ~ ${maxLabel}`;
    };

    const isRangeActive = (rangeItem) => {
        if (!budgetRange) return false;
        return budgetRange.min === rangeItem.min && budgetRange.max === rangeItem.max;
    };

    return (
        <div className="slider-container">
            <div className="slider-header">
                <h4>💰 예산 범위</h4>
                <div className="slider-value">
                    {getCurrentRangeLabel()}
                </div>
            </div>

            <div className="range-buttons">
                {BUDGET_RANGES.map((rangeItem, index) => (
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
                    min={MIN_BUDGET}
                    max={MAX_BUDGET}
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
                                        #ccc ${((values[0] - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100}%, 
                                        #007bff ${((values[0] - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100}%, 
                                        #007bff ${((values[1] - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100}%, 
                                        #ccc ${((values[1] - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100}%, 
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
                                backgroundColor: '#007bff',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                boxShadow: '0px 2px 6px #AAA',
                                cursor: 'pointer'
                            }}
                            aria-label={`예산 범위 ${index === 0 ? '최소값' : '최대값'} 조절`}
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
                                {formatBudgetLabel(values[index])}
                            </div>
                        </div>
                    )}
                />
            </div>

            <div className="slider-footer">
                <div className="slider-labels">
                    <span>{formatBudgetLabel(MIN_BUDGET)}</span>
                    <span>{formatBudgetLabel(MAX_BUDGET)}</span>
                </div>
                
                {isSliderActive && (
                    <button
                        type="button"
                        className="reset-button"
                        onClick={handleReset}
                        title="예산 범위 초기화"
                    >
                        초기화
                    </button>
                )}
            </div>
        </div>
    );
};

export default BudgetSlider;