import React from 'react';
import { formatYYMMDDToLabel } from '../utils/dataUtils';

/**
 * 경매 날짜 선택 컴포넌트
 */
const DateSelector = ({ availableDates, selectedDate, onDateChange }) => {
    const handleChange = (e) => {
        onDateChange(e.target.value);
    };

    return (
        <div id="date-selector-container">
            <label htmlFor="date-selector">경매 날짜 선택:</label>
            <select 
                id="date-selector" 
                value={selectedDate} 
                onChange={handleChange}
            >
                <option value="">날짜를 선택하세요</option>
                {availableDates.map(date => (
                    <option key={date} value={date}>
                        {formatYYMMDDToLabel(date)}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default DateSelector;