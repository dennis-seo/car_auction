import React from 'react';

/**
 * 활성화된 필터 표시 컴포넌트
 */
const ActiveFilters = ({ activeFilters, budgetRange, searchQuery, onRemoveFilter, onRemoveBudgetRange, onRemoveSearchQuery }) => {
    const FILTER_LABELS = {
        title: '차종',
        model: '모델',
        submodel: '세부모델',
        fuel: '연료',
        km: '주행거리',
        price: '가격',
        auction_name: '경매장',
        region: '지역'
    };

    const handleRemoveFilterValue = (filterType, value) => {
        onRemoveFilter(filterType, value, 'toggle'); // toggle로 해당 값 제거
    };

    const handleRemoveYear = () => {
        onRemoveFilter('year', [], 'clear');
    };

    const renderFilterPills = () => {
        const pills = [];

        // 검색어 필터 (맨 앞에 표시)
        if (searchQuery && searchQuery.trim() !== '') {
            pills.push(
                <span key="search" className="filter-pill">
                    <span className="filter-pill-label">🔍 검색어</span>
                    <span className="filter-pill-value">{searchQuery}</span>
                    <button
                        className="filter-pill-remove"
                        type="button"
                        aria-label="검색어 제거"
                        onClick={onRemoveSearchQuery}
                    >
                        ×
                    </button>
                </span>
            );
        }

        // 연식 필터
        if (Array.isArray(activeFilters.year) && activeFilters.year.length === 2) {
            const [minYear, maxYear] = activeFilters.year;
            pills.push(
                <span key="year" className="filter-pill">
                    <span className="filter-pill-label">연식</span>
                    <span className="filter-pill-value">{minYear} ~ {maxYear}</span>
                    <button
                        className="filter-pill-remove"
                        type="button"
                        aria-label="필터 제거"
                        onClick={handleRemoveYear}
                    >
                        ×
                    </button>
                </span>
            );
        }

        // 나머지 필터들
        Object.keys(activeFilters).forEach(key => {
            if (key === 'year') return; // 연식은 위에서 처리

            const values = activeFilters[key] || [];
            values.forEach(val => {
                pills.push(
                    <span key={`${key}-${val}`} className="filter-pill">
                        <span className="filter-pill-label">{FILTER_LABELS[key]}</span>
                        <span className="filter-pill-value">{val}</span>
                        <button
                            className="filter-pill-remove"
                            type="button"
                            aria-label="필터 제거"
                            onClick={() => handleRemoveFilterValue(key, val)}
                        >
                            ×
                        </button>
                    </span>
                );
            });
        });

        // 예산 범위 필터
        if (budgetRange) {
            const { min, max } = budgetRange;
            const minLabel = min === 0 ? '0원' : `${min.toLocaleString()}만원`;
            const maxLabel = max === Infinity ? '3,000만원이상' : `${max.toLocaleString()}만원`;

            pills.push(
                <span key="budget" className="filter-pill">
                    <span className="filter-pill-label">예산</span>
                    <span className="filter-pill-value">{minLabel} ~ {maxLabel}</span>
                    <button
                        className="filter-pill-remove"
                        type="button"
                        aria-label="필터 제거"
                        onClick={onRemoveBudgetRange}
                    >
                        ×
                    </button>
                </span>
            );
        }

        return pills;
    };

    const pills = renderFilterPills();

    if (pills.length === 0) {
        return <div id="active-filters" className="active-filters-bar"></div>;
    }

    return (
        <div id="active-filters" className="active-filters-bar">
            {pills}
        </div>
    );
};

export default ActiveFilters;