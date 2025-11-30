import React, { memo, useState, useRef, useEffect } from 'react';
import { formatYYMMDDToLabel } from '../utils/dataUtils';

/** DateSelector Props */
interface DateSelectorProps {
    /** 선택 가능한 날짜 목록 (yymmdd 형식) */
    availableDates?: string[];
    /** 현재 선택된 날짜 */
    selectedDate?: string;
    /** 날짜 변경 핸들러 */
    onDateChange: (date: string) => void;
    /** 컴포넌트 비활성화 여부 */
    disabled?: boolean;
    /** 로딩 상태 여부 */
    loading?: boolean;
}

/**
 * 경매 날짜 선택 컴포넌트
 * 사용 가능한 날짜 목록에서 날짜를 선택할 수 있는 커스텀 드롭다운을 제공합니다.
 */
const DateSelector: React.FC<DateSelectorProps> = memo(({
    availableDates = [],
    selectedDate = '',
    onDateChange,
    disabled = false,
    loading = false
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleSelect = (value: string): void => {
        onDateChange(value);
        setIsOpen(false);
    };

    const toggleDropdown = (): void => {
        if (!disabled && !loading) {
            setIsOpen(!isOpen);
        }
    };

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ESC 키로 닫기
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            return () => document.removeEventListener('keydown', handleEsc);
        }
    }, [isOpen]);

    const displayLabel = selectedDate
        ? formatYYMMDDToLabel(selectedDate)
        : (loading ? '날짜를 불러오는 중...' : '날짜를 선택하세요');

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
        <div id="date-selector-container" className="date-selector" ref={dropdownRef}>
            <label htmlFor="date-selector" className="date-selector-label">
                경매 날짜 선택:
            </label>
            <div className="date-selector-dropdown">
                <button
                    id="date-selector"
                    type="button"
                    className={`date-selector-input ${isOpen ? 'open' : ''} ${disabled || loading ? 'disabled' : ''}`}
                    onClick={toggleDropdown}
                    disabled={disabled || loading}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-describedby="date-selector-help"
                >
                    <span className="date-selector-value">{displayLabel}</span>
                    <svg className="date-selector-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                {isOpen && (
                    <ul className="date-selector-options" role="listbox">
                        <li
                            className={`date-selector-option ${!selectedDate ? 'selected' : ''}`}
                            onClick={() => handleSelect('')}
                            role="option"
                            aria-selected={!selectedDate}
                        >
                            날짜를 선택하세요
                        </li>
                        {availableDates.map(date => (
                            <li
                                key={date}
                                className={`date-selector-option ${selectedDate === date ? 'selected' : ''}`}
                                onClick={() => handleSelect(date)}
                                role="option"
                                aria-selected={selectedDate === date}
                            >
                                {formatYYMMDDToLabel(date)}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div id="date-selector-help" className="sr-only">
                경매 날짜를 선택하면 해당 날짜의 차량 경매 정보를 확인할 수 있습니다.
            </div>
        </div>
    );
});

// 컴포넌트 이름 설정 (개발 도구에서 표시)
DateSelector.displayName = 'DateSelector';

export default DateSelector;
