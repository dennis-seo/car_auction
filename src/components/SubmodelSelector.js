import React, { useState, useEffect, useRef } from 'react';
import { loadSearchTree, findBrandByLabel } from '../utils/dataUtils';

/**
 * 세부 트림(서브모델) 선택 컴포넌트
 */
const SubmodelSelector = ({ activeFilters, onUpdateFilter }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTree, setSearchTree] = useState(null);
    const dropdownRef = useRef(null);
    const boxRef = useRef(null);

    const currentBrand = (activeFilters.title || [])[0] || null;
    const currentModel = (activeFilters.model || [])[0] || null;
    const currentSubmodel = (activeFilters.submodel || [])[0] || null;
    const isDisabled = !currentModel;

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
        if (!isDisabled) {
            setIsOpen(!isOpen);
        }
    };

    const handleKeyDown = (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
            e.preventDefault();
            setIsOpen(!isOpen);
        }
    };

    const handleSubmodelSelect = (submodelLabel) => {
        onUpdateFilter('submodel', submodelLabel ? [submodelLabel] : [], 'set');
        setIsOpen(false);
    };

    const getTrimsForModel = () => {
        if (!searchTree || !currentBrand || !currentModel) return [];
        
        const brandInfo = findBrandByLabel(currentBrand);
        const modelInfo = brandInfo?.models?.find(m => (m.label || m.model) === currentModel);
        return modelInfo?.trims || [];
    };

    const renderSubmodelOptions = () => {
        if (!currentModel) {
            return (
                <div style={{ padding: '14px 16px', color: '#8a94a6' }}>
                    먼저 모델을 선택하세요.
                </div>
            );
        }

        const trims = getTrimsForModel();
        if (!trims || trims.length === 0) {
            return (
                <div style={{ padding: '14px 16px', color: '#8a94a6' }}>
                    세부트림 정보가 없습니다.
                </div>
            );
        }

        return trims.map(trim => {
            const trimName = typeof trim === 'object' ? (trim.trim || trim.label || '') : trim;
            return (
                <div
                    key={trimName}
                    className={`select-option${currentSubmodel === trimName ? ' selected' : ''}`}
                    role="option"
                    aria-selected={currentSubmodel === trimName}
                    onClick={() => handleSubmodelSelect(trimName)}
                >
                    {trimName}
                </div>
            );
        });
    };

    return (
        <div
            ref={boxRef}
            className={`car-select-box${isDisabled ? ' disabled' : ''}`}
            id="submodel-select"
            role="button"
            tabIndex="0"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
        >
            <div className={`car-select-label${isDisabled ? ' disabled' : ''}`}>
                {currentSubmodel || '세부 트림'}
            </div>
            {isOpen && !isDisabled && (
                <div className="select-dropdown" ref={dropdownRef}>
                    <div className="select-dropdown-inner">
                        <div className="select-list" role="listbox" aria-label="세부트림 선택">
                            {renderSubmodelOptions()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubmodelSelector;