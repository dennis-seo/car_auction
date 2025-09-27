import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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

    // 타이핑/드래그 중 과도한 업데이트를 막고 0.5초 후에 적용
    const debounceTimerRef = useRef(null);

    const scheduleBudgetUpdate = useCallback((fromValue, toValue) => {
        // 이전 타이머가 있다면 취소
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        // 500ms 후 업데이트 적용
        debounceTimerRef.current = setTimeout(() => {
            updateBudgetFilter(fromValue, toValue);
            debounceTimerRef.current = null;
        }, 500);
    }, [updateBudgetFilter]);

    const handleChange = useCallback((newValues) => {
        setValues(newValues);
        scheduleBudgetUpdate(newValues[0], newValues[1]);
    }, [scheduleBudgetUpdate]);

    // budgetRange가 null로 리셋될 때 슬라이더도 리셋
    useEffect(() => {
        if (!budgetRange) {
            // 외부에서 예산 필터를 제거한 경우, 대기 중인 업데이트도 취소
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            setValues([0, MAX_BUDGET]);
        }
    }, [budgetRange]);

    // 언마운트 또는 의존성 변경 시 지연된 작업 정리
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

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
                        renderTrack={({ props, children }) => {
                            // key prop을 분리하되 직접 할당하여 리스트 렌더링 경고 방지
                            const { key, ...trackProps } = props;
                            return (
                                <div
                                    key={key}
                                    {...trackProps}
                                    style={{
                                        ...trackProps.style,
                                        height: '8px',
                                        width: '100%',
                                        backgroundColor: '#e1e5ea',
                                        borderRadius: '4px',
                                        position: 'relative'
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'absolute',
                                            height: '8px',
                                            background: 'linear-gradient(90deg, #4a90e2 0%, #1976d2 100%)',
                                            borderRadius: '4px',
                                            left: `${(values[0] / MAX_BUDGET) * 100}%`,
                                            width: `${((values[1] - values[0]) / MAX_BUDGET) * 100}%`
                                        }}
                                    />
                                    {children}
                                </div>
                            );
                        }}
                        renderThumb={({ props, index }) => {
                            // key prop을 분리하되 직접 할당하여 리스트 렌더링 경고 방지
                            const { key, ...thumbProps } = props;
                            return (
                                <div
                                    key={key}
                                    {...thumbProps}
                                    style={{
                                        ...thumbProps.style,
                                        height: '20px',
                                        width: '20px',
                                        borderRadius: '50%',
                                        backgroundColor: '#fff',
                                        border: '2px solid #1976d2',
                                        boxShadow: '0 2px 10px rgba(41,105,190,0.24)',
                                        cursor: 'grab',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center'
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
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            padding: '8px 12px',
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
                            );
                        }}
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