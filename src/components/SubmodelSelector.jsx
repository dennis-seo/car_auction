import React, { useState, useEffect, useRef } from 'react';
import { loadSearchTree } from '../utils/dataUtils';

/**
 * 세부모델 선택 컴포넌트
 * ID 기반 필터링을 위해 onFilterIdChange 콜백 지원
 */
const SubmodelSelector = ({ activeFilters, onUpdateFilter, filterIds, onFilterIdChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTree, setSearchTree] = useState(null);
    const dropdownRef = useRef(null);
    const boxRef = useRef(null);

    const currentBrand = (activeFilters.title || [])[0] || null;
    const currentModel = (activeFilters.model || [])[0] || null;
    const currentSubmodel = (activeFilters.submodel || [])[0] || null;

    useEffect(() => {
        // 검색 트리 데이터 로드
        const loadData = async () => {
            const tree = await loadSearchTree();
            setSearchTree(tree);
        };
        loadData();
    }, []);

    useEffect(() => {
        // 외부 클릭 시 드롭다운 닫기
        const handleClickOutside = (event) => {
            if (boxRef.current && !boxRef.current.contains(event.target)) {
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

    const handleToggle = (e) => {
        e.stopPropagation();
        if (!currentBrand || !currentModel) return; // 브랜드와 모델이 선택되지 않으면 열 수 없음
        setIsOpen(!isOpen);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (currentBrand && currentModel) {
                setIsOpen(!isOpen);
            }
        }
    };

    const handleSubmodelSelect = (submodel) => {
        const submodelLabel = submodel?.trim || submodel?.label || null;
        const trimId = submodel?.id || null;

        onUpdateFilter('submodel', submodelLabel ? [submodelLabel] : [], 'set');

        // ID 기반 필터링을 위한 콜백 (라벨 정보도 함께 전달)
        if (onFilterIdChange) {
            onFilterIdChange(
                {
                    manufacturerId: filterIds?.manufacturerId || null,
                    modelId: filterIds?.modelId || null,
                    trimId: trimId,
                },
                {
                    manufacturer: currentBrand,
                    model: currentModel,
                    trim: submodelLabel,
                }
            );
        }

        setIsOpen(false);
    };

    const getAvailableSubmodels = () => {
        if (!searchTree || !currentBrand || !currentModel) return [];

        // 국산과 수입 브랜드 모두에서 검색
        const allBrands = [
            ...(searchTree.domestic || []),
            ...(searchTree.import || [])
        ];

        const brand = allBrands.find(b => b.label === currentBrand);
        const model = brand?.models?.find(m => (m.model || m.label) === currentModel);
        // trims 또는 submodels 둘 다 지원
        return model?.trims || model?.submodels || [];
    };

    const renderSubmodelOptions = () => {
        const submodels = getAvailableSubmodels();
        
        if (submodels.length === 0) {
            return (
                <div style={{ padding: '14px 16px', color: '#8a94a6' }}>
                    {currentBrand && currentModel 
                        ? '사용 가능한 세부모델이 없습니다.' 
                        : '브랜드와 모델을 먼저 선택해주세요.'
                    }
                </div>
            );
        }

        return submodels.map(submodel => {
            const submodelLabel = submodel.trim || submodel.label;
            return (
                <div
                    key={submodelLabel}
                    className={`select-option${currentSubmodel === submodelLabel ? ' selected' : ''}`}
                    role="option"
                    aria-selected={currentSubmodel === submodelLabel}
                    onClick={() => handleSubmodelSelect(submodel)}
                >
                    {submodelLabel}
                </div>
            );
        });
    };

    const isDisabled = !currentBrand || !currentModel;

    return (
        <div
            ref={boxRef}
            className={`car-select-box${isDisabled ? ' disabled' : ''}`}
            id="submodel-select"
            role="button"
            tabIndex="0"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-disabled={isDisabled}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
        >
            <div className="car-select-label">
                {currentSubmodel || '세부모델'}
            </div>
            {isOpen && !isDisabled && (
                <div className="select-dropdown" ref={dropdownRef}>
                    <div className="select-dropdown-inner">
                        <div className="select-list" role="listbox" aria-label="세부모델 선택">
                            {renderSubmodelOptions()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubmodelSelector;