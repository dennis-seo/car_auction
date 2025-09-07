import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Range } from 'react-range';

// 연식 슬라이더 설정
const MIN_YEAR = 2000; // 2000년부터
const MAX_YEAR = new Date().getFullYear(); // 현재년도까지
const YEAR_STEP = 1; // 1년 단위

// 연식 값을 한국어 라벨로 포맷
const formatYearLabel = (value) => {
    return `${value}년`;
};

/**
 * 연식 범위 슬라이더 컴포넌트
 */
const YearSlider = ({ yearRange, onYearRangeChange }) => {
    // 슬라이더 값 상태 (실제 연식 값)
    const [values, setValues] = useState([MIN_YEAR, MAX_YEAR]);

    const updateYearText = useCallback((fromValue, toValue) => {
        const fromLabel = formatYearLabel(fromValue);
        const toLabel = formatYearLabel(toValue);

        if (fromValue === MIN_YEAR && toValue === MAX_YEAR) {
            return '모든 연식의 차량';
        } else if (fromValue === MIN_YEAR && toValue < MAX_YEAR) {
            return `${toLabel} 이하 차량`;
        } else if (fromValue > MIN_YEAR && toValue === MAX_YEAR) {
            return `${fromLabel} 이상 차량`;
        } else if (fromValue === toValue) {
            return `${fromLabel} 차량만`;
        } else {
            return `${fromLabel} ~ ${toLabel} 차량`;
        }
    }, []);

    const updateYearFilter = useCallback((fromValue, toValue) => {
        // 전체 범위인 경우 필터 해제
        if (fromValue === MIN_YEAR && toValue === MAX_YEAR) {
            onYearRangeChange(null);
        } else {
            onYearRangeChange([fromValue, toValue]);
        }
    }, [onYearRangeChange]);

    // 타이핑/드래그 중 과도한 업데이트를 막고 0.5초 후에 적용
    const debounceTimerRef = useRef(null);

    const scheduleYearUpdate = useCallback((fromValue, toValue) => {
        // 이전 타이머가 있다면 취소
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        // 500ms 후 업데이트 적용
        debounceTimerRef.current = setTimeout(() => {
            updateYearFilter(fromValue, toValue);
            debounceTimerRef.current = null;
        }, 500);
    }, [updateYearFilter]);

    const handleChange = useCallback((newValues) => {
        setValues(newValues);
        scheduleYearUpdate(newValues[0], newValues[1]);
    }, [scheduleYearUpdate]);

    // yearRange가 null로 리셋될 때 슬라이더도 리셋
    useEffect(() => {
        if (!yearRange) {
            // 외부에서 연식 필터를 제거한 경우, 대기 중인 업데이트도 취소
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            setValues([MIN_YEAR, MAX_YEAR]);
        }
    }, [yearRange]);

    // 언마운트 또는 의존성 변경 시 지연된 작업 정리
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const currentText = useMemo(() => 
        updateYearText(values[0], values[1]), 
        [values, updateYearText]
    );

    return (
        <div className="year-range-section">
            <div className="year-title">
                <span className="year-icon">🗓️</span>
                <h4>원하는 연식이 있나요?</h4>
            </div>
            <div className="year-slider-container">
                <div style={{ padding: '26px 0 14px' }}>
                    <Range
                        step={YEAR_STEP}
                        min={MIN_YEAR}
                        max={MAX_YEAR}
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
                                            left: `${((values[0] - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%`,
                                            width: `${((values[1] - values[0]) / (MAX_YEAR - MIN_YEAR)) * 100}%`
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
                                        boxShadow: '0 1px 6px rgba(25, 118, 210, 0.18)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'grab'
                                    }}
                                >
                                    <div
                                        className="year-thumb-tooltip"
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
                                        {formatYearLabel(values[index])}
                                        <div
                                            className="year-thumb-tooltip-arrow"
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
                <div className="year-display">
                    <span id="year-range-text">
                        {currentText}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default YearSlider;