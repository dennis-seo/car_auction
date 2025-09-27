import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { formatYYMMDDToLabel } from '../utils/dataUtils';

/**
 * 경매 날짜 선택 컴포넌트
 * 사용 가능한 날짜 목록에서 날짜를 선택할 수 있는 드롭다운을 제공합니다.
 */
const DateSelector = memo(({ availableDates, selectedDate, onDateChange, disabled = false, loading = false }) => {
    const handleChange = (e) => {
        const value = e.target.value;
        onDateChange(value);
    };

    // 에러 상태 처리
    if (!Array.isArray(availableDates)) {
        return (
            <div id="date-selector-container" className="date-selector-error">
                <label htmlFor="date-selector">경매 날짜 선택:</label>
                <select 
                    id="date-selector" 
                    disabled
                    aria-describedby="date-selector-error"
                >
                    <option value="">날짜 정보를 불러올 수 없습니다</option>
                </select>
                <div id="date-selector-error" className="sr-only">
                    날짜 데이터 로드에 실패했습니다.
                </div>
            </div>
        );
    }

    // 빈 배열 처리
    if (availableDates.length === 0) {
        return (
            <div id="date-selector-container" className="date-selector-empty">
                <label htmlFor="date-selector">경매 날짜 선택:</label>
                <select 
                    id="date-selector" 
                    disabled
                    aria-describedby="date-selector-empty"
                >
                    <option value="">
                        {loading ? '날짜를 불러오는 중...' : '사용 가능한 날짜가 없습니다'}
                    </option>
                </select>
                <div id="date-selector-empty" className="sr-only">
                    {loading ? '날짜 목록을 로딩 중입니다.' : '선택 가능한 경매 날짜가 없습니다.'}
                </div>
            </div>
        );
    }

    return (
        <div id="date-selector-container" className="date-selector">
            <label htmlFor="date-selector" className="date-selector-label">
                경매 날짜 선택:
            </label>
            <select 
                id="date-selector"
                className="date-selector-input"
                value={selectedDate} 
                onChange={handleChange}
                disabled={disabled || loading}
                aria-describedby="date-selector-help"
            >
                <option value="">
                    {loading ? '날짜를 불러오는 중...' : '날짜를 선택하세요'}
                </option>
                {availableDates.map(date => (
                    <option key={date} value={date}>
                        {formatYYMMDDToLabel(date)}
                    </option>
                ))}
            </select>
            <div id="date-selector-help" className="sr-only">
                경매 날짜를 선택하면 해당 날짜의 차량 경매 정보를 확인할 수 있습니다.
            </div>
        </div>
    );
});

// 컴포넌트 이름 설정 (개발 도구에서 표시)
DateSelector.displayName = 'DateSelector';

// PropTypes 정의
DateSelector.propTypes = {
    /** 선택 가능한 날짜 목록 (yymmdd 형식) */
    availableDates: PropTypes.arrayOf(PropTypes.string),
    /** 현재 선택된 날짜 */
    selectedDate: PropTypes.string,
    /** 날짜 변경 핸들러 */
    onDateChange: PropTypes.func.isRequired,
    /** 컴포넌트 비활성화 여부 */
    disabled: PropTypes.bool,
    /** 로딩 상태 여부 */
    loading: PropTypes.bool
};

// 기본값 설정
DateSelector.defaultProps = {
    availableDates: [],
    selectedDate: '',
    disabled: false,
    loading: false
};

export default DateSelector;