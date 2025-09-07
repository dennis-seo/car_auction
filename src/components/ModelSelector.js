import React, { useState, useEffect, useRef } from 'react';
import { loadSearchTree, findBrandByLabel } from '../utils/dataUtils';

/**
 * 모델 선택 컴포넌트
 */
const ModelSelector = ({ activeFilters, onUpdateFilter }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTree, setSearchTree] = useState(null);
    const dropdownRef = useRef(null);
    const boxRef = useRef(null);

    const currentBrand = (activeFilters.title || [])[0] || null;
    const currentModel = (activeFilters.model || [])[0] || null;
    const isDisabled = !currentBrand;

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

    const handleModelSelect = (modelLabel) => {
        // 모델 변경 시 세부트림도 초기화
        onUpdateFilter('model', modelLabel ? [modelLabel] : [], 'set');
        onUpdateFilter('submodel', [], 'clear');
        setIsOpen(false);
    };

    const getModelsForBrand = () => {
        if (!searchTree || !currentBrand) return [];
        
        const brandInfo = findBrandByLabel(currentBrand);
        return brandInfo?.models || [];
    };

    const renderModelOptions = () => {
        if (!currentBrand) {
            return (
                <div style={{ padding: '14px 16px', color: '#8a94a6' }}>
                    먼저 제조사를 선택하세요.
                </div>
            );
        }

        const models = getModelsForBrand();
        if (!models || models.length === 0) {
            return (
                <div style={{ padding: '14px 16px', color: '#8a94a6' }}>
                    모델 정보가 없습니다.
                </div>
            );
        }

        return models.map(model => {
            const modelName = model.label || model.model;
            return (
                <div
                    key={modelName}
                    className={`select-option${currentModel === modelName ? ' selected' : ''}`}
                    role="option"
                    aria-selected={currentModel === modelName}
                    onClick={() => handleModelSelect(modelName)}
                >
                    {modelName}
                </div>
            );
        });
    };

    return (
        <div
            ref={boxRef}
            className={`car-select-box${isDisabled ? ' disabled' : ''}`}
            id="model-select"
            role="button"
            tabIndex="0"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
        >
            <div className={`car-select-label${isDisabled ? ' disabled' : ''}`}>
                {currentModel || '모델'}
            </div>
            {isOpen && !isDisabled && (
                <div className="select-dropdown" ref={dropdownRef}>
                    <div className="select-dropdown-inner">
                        <div className="select-list" role="listbox" aria-label="모델 선택">
                            {renderModelOptions()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModelSelector;