import React from 'react';
import { FUEL_GROUPS, ALL_FUEL_VARIANTS } from '../utils/fuelGroups';

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

            // 연료 특별 처리: 그룹(가솔린/디젤/하이브리드 등)은 그룹 라벨 하나만 알약으로 노출
            if (key === 'fuel') {
                const remaining = new Set(values);

                // 1) 정의된 각 그룹이 모두 활성화된 경우, 그룹 라벨 1개로 묶어서 표시
                Object.keys(FUEL_GROUPS).forEach(groupLabel => {
                    const variants = FUEL_GROUPS[groupLabel];
                    const hasAll = variants.length > 0 && variants.every(v => remaining.has(v));
                    if (hasAll) {
                        pills.push(
                            <span key={`fuel-${groupLabel}`} className="filter-pill">
                                <span className="filter-pill-label">{FILTER_LABELS[key]}</span>
                                <span className="filter-pill-value">{groupLabel}</span>
                                <button
                                    className="filter-pill-remove"
                                    type="button"
                                    aria-label="필터 제거"
                                    onClick={() => {
                                        // 그룹 해제 시 변형들을 모두 제거
                                        variants.forEach(v => onRemoveFilter('fuel', v, 'toggle'));
                                    }}
                                >
                                    ×
                                </button>
                            </span>
                        );
                        variants.forEach(v => remaining.delete(v));
                    }
                });

                // 2) 정의되지 않은 변형들(= 기타)이 활성화된 경우, '기타' 알약 하나만 노출
                const others = [...remaining].filter(v => !ALL_FUEL_VARIANTS.includes(v));
                if (others.length > 0) {
                    pills.push(
                        <span key="fuel-기타" className="filter-pill">
                            <span className="filter-pill-label">{FILTER_LABELS[key]}</span>
                            <span className="filter-pill-value">기타</span>
                            <button
                                className="filter-pill-remove"
                                type="button"
                                aria-label="필터 제거"
                                onClick={() => {
                                    others.forEach(v => onRemoveFilter('fuel', v, 'toggle'));
                                }}
                            >
                                ×
                            </button>
                        </span>
                    );
                    others.forEach(v => remaining.delete(v));
                }

                // 3) 남아있는 개별 값들(부분 선택 등)은 개별 알약으로 표시
                [...remaining].forEach(val => {
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

                return; // fuel 처리 완료
            }

            // 기본: 각 값마다 알약 생성
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