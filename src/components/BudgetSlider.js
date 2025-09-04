import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Range } from 'react-range';

// 예산 범위 옵션을 컴포넌트 외부로 이동
const BUDGET_RANGES = [
    { value: 0, label: '0원' },
    { value: 200, label: '200만원' },
    { value: 400, label: '400만원' },
    { value: 600, label: '600만원' },
    { value: 800, label: '800만원' },
    { value: 1000, label: '1,000만원' },
    { value: 1500, label: '1,500만원' },
    { value: 2000, label: '2,000만원' },
    { value: 2500, label: '2,500만원' },
    { value: 3000, label: '3,000만원이상' }
];

/**
 * 예산 범위 슬라이더 컴포넌트 - React 네이티브 버전
 */
const BudgetSlider = ({ budgetRange, onBudgetRangeChange }) => {
    // 슬라이더 값 상태 (인덱스 기반)
    const [values, setValues] = useState([0, BUDGET_RANGES.length - 1]);

    const updateBudgetText = useCallback((fromIndex, toIndex) => {
        const fromLabel = BUDGET_RANGES[fromIndex].label;
        const toLabel = BUDGET_RANGES[toIndex].label;

        if (fromIndex === 0 && toIndex === BUDGET_RANGES.length - 1) {
            return '최소~최대 예산 구간 모든 차량';
        } else if (fromIndex === 0 && toIndex < BUDGET_RANGES.length - 1) {
            return `${toLabel} 까지의 예산 차량`;
        } else if (fromIndex > 0 && toIndex === BUDGET_RANGES.length - 1) {
            return `${fromLabel} 이상의 예산 차량`;
        } else if (fromIndex === toIndex) {
            return `${fromLabel} 차량만 보고 싶어요`;
        } else {
            return `${fromLabel} ~ ${toLabel} 구간 차량`;
        }
    }, []);

    const updateBudgetFilter = useCallback((fromIndex, toIndex) => {
        const fromValue = BUDGET_RANGES[fromIndex].value;
        const toValue = BUDGET_RANGES[toIndex].value;
        
        // 전체 범위인 경우 필터 해제
        if (fromIndex === 0 && toIndex === BUDGET_RANGES.length - 1) {
            onBudgetRangeChange(null);
        } else {
            onBudgetRangeChange({ 
                min: fromValue, 
                max: toValue === 3000 ? Infinity : toValue 
            });
        }
    }, [onBudgetRangeChange]);

    const handleChange = useCallback((newValues) => {
        setValues(newValues);
        updateBudgetFilter(newValues[0], newValues[1]);
    }, [updateBudgetFilter]);

    // budgetRange가 null로 리셋될 때 슬라이더도 리셋
    useEffect(() => {
        if (!budgetRange) {
            setValues([0, BUDGET_RANGES.length - 1]);
        }
    }, [budgetRange]);

    const currentText = useMemo(() => 
        updateBudgetText(values[0], values[1]), 
        [values, updateBudgetText]
    );

    return (
        <div className="budget-range-section">
            <div className="budget-title">
                <span className="budget-icon">💰</span>
                <h4>예산이 어떻게 되시나요?</h4>
            </div>
            <div className="budget-slider-container">
                <div className="budget-slider-wrapper" style={{ padding: '20px 0' }}>
                    <Range
                        step={1}
                        min={0}
                        max={BUDGET_RANGES.length - 1}
                        values={values}
                        onChange={handleChange}
                        renderTrack={({ props, children }) => (
                            <div
                                {...props}
                                style={{
                                    ...props.style,
                                    height: '12px',
                                    width: '100%',
                                    backgroundColor: '#e1e5ea',
                                    borderRadius: '6px',
                                    position: 'relative'
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        height: '12px',
                                        background: 'linear-gradient(90deg, #4a90e2 0%, #1976d2 100%)',
                                        borderRadius: '6px',
                                        left: `${(values[0] / (BUDGET_RANGES.length - 1)) * 100}%`,
                                        width: `${((values[1] - values[0]) / (BUDGET_RANGES.length - 1)) * 100}%`
                                    }}
                                />
                                {children}
                            </div>
                        )}
                        renderThumb={({ props, index }) => (
                            <div
                                {...props}
                                style={{
                                    ...props.style,
                                    height: '38px',
                                    width: '38px',
                                    borderRadius: '50%',
                                    backgroundColor: '#fff',
                                    border: '4px solid #1976d2',
                                    boxShadow: '0 2px 10px rgba(25, 118, 210, 0.13)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'grab',
                                    position: 'relative'
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '-50px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        backgroundColor: '#1976d2',
                                        color: '#fff',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        padding: '8px 16px',
                                        borderRadius: '12px',
                                        minWidth: '60px',
                                        textAlign: 'center',
                                        boxShadow: '0 3px 14px rgba(25, 118, 210, 0.18)',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {BUDGET_RANGES[values[index]].label}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            left: '50%',
                                            bottom: '-8px',
                                            transform: 'translateX(-50%)',
                                            width: 0,
                                            height: 0,
                                            borderLeft: '8px solid transparent',
                                            borderRight: '8px solid transparent',
                                            borderTop: '8px solid #1976d2'
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    />
                </div>
                <div className="budget-display">
                    <span id="budget-range-text">
                        {currentText}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default BudgetSlider;