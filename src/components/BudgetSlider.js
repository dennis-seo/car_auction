import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Range } from 'react-range';

// 연속형 슬라이더 설정 (단위: 만원)
const MAX_BUDGET = 3000; // 3,000만원을 최댓값으로 취급 (최댓값은 '이상' 처리)
const SLIDER_STEP = 10; // 10만원 단위로 부드럽게 이동

// 숫자 값을 한국어 금액 라벨로 포맷
const formatBudgetLabel = (value) => {
    if (value === 0) return '0원';
    const formatted = new Intl.NumberFormat('ko-KR').format(value);
    return value === MAX_BUDGET ? `${formatted}만원이상` : `${formatted}만원`;
};

/**
 * 예산 범위 슬라이더 컴포넌트 - React 네이티브 버전
 */
const BudgetSlider = ({ budgetRange, onBudgetRangeChange }) => {
    // 슬라이더 값 상태 (실제 금액 값, 단위: 만원)
    const [values, setValues] = useState([0, MAX_BUDGET]);

    const updateBudgetText = useCallback((fromValue, toValue) => {
        const fromLabel = formatBudgetLabel(fromValue);
        const toLabel = formatBudgetLabel(toValue);

        if (fromValue === 0 && toValue === MAX_BUDGET) {
            return '최소~최대 예산 구간 모든 차량';
        } else if (fromValue === 0 && toValue < MAX_BUDGET) {
            return `${toLabel} 까지의 예산 차량`;
        } else if (fromValue > 0 && toValue === MAX_BUDGET) {
            return `${fromLabel} 이상의 예산 차량`;
        } else if (fromValue === toValue) {
            return `${fromLabel} 차량만 보고 싶어요`;
        } else {
            return `${fromLabel} ~ ${toLabel} 구간 차량`;
        }
    }, []);

    const updateBudgetFilter = useCallback((fromValue, toValue) => {
        // 전체 범위인 경우 필터 해제
        if (fromValue === 0 && toValue === MAX_BUDGET) {
            onBudgetRangeChange(null);
        } else {
            onBudgetRangeChange({
                min: fromValue,
                max: toValue === MAX_BUDGET ? Infinity : toValue
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
            setValues([0, MAX_BUDGET]);
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
                <div className="budget-slider-wrapper" style={{ padding: '26px 0 14px' }}>
                    <Range
                        step={SLIDER_STEP}
                        min={0}
                        max={MAX_BUDGET}
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
                                        left: `${(values[0] / MAX_BUDGET) * 100}%`,
                                        width: `${((values[1] - values[0]) / MAX_BUDGET) * 100}%`
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
                                    height: '24px',
                                    width: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: '#fff',
                                    border: '2px solid #1976d2',
                                    boxShadow: '0 1px 6px rgba(25, 118, 210, 0.18)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'grab'
                                }}
                            >
                                <div
                                    className="budget-thumb-tooltip"
                                    style={{
                                        position: 'absolute',
                                        top: '-40px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        backgroundColor: '#1976d2',
                                        color: '#fff',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        padding: '8px 14px',
                                        borderRadius: '12px',
                                        minWidth: '60px',
                                        textAlign: 'center',
                                        boxShadow: '0 3px 14px rgba(25, 118, 210, 0.18)',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {formatBudgetLabel(values[index])}
                                    <div
                                        className="budget-thumb-tooltip-arrow"
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