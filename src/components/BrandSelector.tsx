import React, { useState, useEffect, useRef } from 'react';
import { loadSearchTree } from '../utils/dataUtils';
import type { ActiveFilters, FilterIds, SearchTree, BrandInfo, FilterAction } from '../types';

/** 필터 라벨 정보 */
interface FilterLabels {
    manufacturer: string | null;
    model: string | null;
    trim: string | null;
}

/** BrandSelector Props */
interface BrandSelectorProps {
    /** 활성화된 필터 */
    activeFilters: ActiveFilters;
    /** 필터 업데이트 콜백 */
    onUpdateFilter: (filterType: string, value: string[], action?: FilterAction) => void;
    /** ID 기반 필터 변경 콜백 */
    onFilterIdChange?: (filterIds: FilterIds, labels: FilterLabels) => void;
}

/**
 * 브랜드 선택 컴포넌트
 * ID 기반 필터링을 위해 onFilterIdChange 콜백 지원
 */
const BrandSelector: React.FC<BrandSelectorProps> = ({ activeFilters, onUpdateFilter, onFilterIdChange }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [searchTree, setSearchTree] = useState<SearchTree | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);

    const currentBrand = (activeFilters.title || [])[0] || null;

    useEffect(() => {
        // 검색 트리 데이터 로드
        const loadData = async (): Promise<void> => {
            const tree = await loadSearchTree();
            setSearchTree(tree);
        };
        loadData();
    }, []);

    useEffect(() => {
        // 외부 클릭 시 드롭다운 닫기
        const handleClickOutside = (event: MouseEvent): void => {
            if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleToggle = (e: React.MouseEvent<HTMLDivElement>): void => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
        }
    };

    const handleBrandSelect = (brand: BrandInfo | null): void => {
        const brandLabel = brand?.label || null;
        const brandId = brand?.id || null;

        // 브랜드 변경 시 모델과 세부트림도 초기화
        onUpdateFilter('title', brandLabel ? [brandLabel] : [], 'set');
        onUpdateFilter('model', [], 'clear');
        onUpdateFilter('submodel', [], 'clear');

        // ID 기반 필터링을 위한 콜백 (라벨 정보도 함께 전달)
        if (onFilterIdChange) {
            onFilterIdChange(
                {
                    manufacturerId: brandId,
                    modelId: null,
                    trimId: null,
                },
                {
                    manufacturer: brandLabel,
                    model: null,
                    trim: null,
                }
            );
        }

        setIsOpen(false);
    };

    const renderBrandOptions = (): React.ReactNode => {
        if (!searchTree || (!searchTree.domestic && !searchTree.import)) {
            return (
                <div style={{ padding: '14px 16px', color: '#8a94a6' }}>
                    목록을 불러오지 못했습니다.
                </div>
            );
        }

        return (
            <>
                <div className="select-group-title">국산</div>
                {(searchTree.domestic || []).map(brand => (
                    <div
                        key={brand.label}
                        className={`select-option${currentBrand === brand.label ? ' selected' : ''}`}
                        role="option"
                        aria-selected={currentBrand === brand.label}
                        onClick={() => handleBrandSelect(brand)}
                    >
                        {brand.label}
                    </div>
                ))}
                <div className="select-group-title">수입</div>
                {(searchTree.import || []).map(brand => (
                    <div
                        key={brand.label}
                        className={`select-option${currentBrand === brand.label ? ' selected' : ''}`}
                        role="option"
                        aria-selected={currentBrand === brand.label}
                        onClick={() => handleBrandSelect(brand)}
                    >
                        {brand.label}
                    </div>
                ))}
            </>
        );
    };

    return (
        <div
            ref={boxRef}
            className="car-select-box"
            id="brand-select"
            role="button"
            tabIndex={0}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
        >
            <div className="car-select-label">
                {currentBrand || '제조사'}
            </div>
            {isOpen && (
                <div className="select-dropdown" ref={dropdownRef}>
                    <div className="select-dropdown-inner">
                        <div className="select-list" role="listbox" aria-label="제조사 선택">
                            {renderBrandOptions()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrandSelector;
