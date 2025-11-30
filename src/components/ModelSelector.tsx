import React, { useState, useEffect, useRef } from 'react';
import { loadSearchTree } from '../utils/dataUtils';
import type { ActiveFilters, FilterIds, SearchTree, ModelInfo, FilterAction } from '../types';

/** 필터 라벨 정보 */
interface FilterLabels {
    manufacturer: string | null;
    model: string | null;
    trim: string | null;
}

/** ModelSelector Props */
interface ModelSelectorProps {
    /** 활성화된 필터 */
    activeFilters: ActiveFilters;
    /** 필터 업데이트 콜백 */
    onUpdateFilter: (filterType: string, value: string[], action?: FilterAction) => void;
    /** ID 기반 필터 */
    filterIds?: FilterIds | null;
    /** ID 기반 필터 변경 콜백 */
    onFilterIdChange?: (filterIds: FilterIds, labels: FilterLabels) => void;
}

/**
 * 모델 선택 컴포넌트
 * ID 기반 필터링을 위해 onFilterIdChange 콜백 지원
 */
const ModelSelector: React.FC<ModelSelectorProps> = ({ activeFilters, onUpdateFilter, filterIds, onFilterIdChange }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [searchTree, setSearchTree] = useState<SearchTree | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);

    const currentBrand = (activeFilters.title || [])[0] || null;
    const currentModel = (activeFilters.model || [])[0] || null;

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
        if (!currentBrand) return; // 브랜드가 선택되지 않으면 열 수 없음
        setIsOpen(!isOpen);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (currentBrand) {
                setIsOpen(!isOpen);
            }
        }
    };

    const handleModelSelect = (model: ModelInfo | null): void => {
        const modelLabel = model?.label || null;
        const modelId = model?.id || null;

        // 모델 변경 시 세부트림도 초기화
        onUpdateFilter('model', modelLabel ? [modelLabel] : [], 'set');
        onUpdateFilter('submodel', [], 'clear');

        // ID 기반 필터링을 위한 콜백 (라벨 정보도 함께 전달)
        if (onFilterIdChange) {
            onFilterIdChange(
                {
                    manufacturerId: filterIds?.manufacturerId || null,
                    modelId: modelId,
                    trimId: null,
                },
                {
                    manufacturer: currentBrand,
                    model: modelLabel,
                    trim: null,
                }
            );
        }

        setIsOpen(false);
    };

    const getAvailableModels = (): ModelInfo[] => {
        if (!searchTree || !currentBrand) return [];

        // 국산과 수입 브랜드 모두에서 검색
        const allBrands = [
            ...(searchTree.domestic || []),
            ...(searchTree.import || [])
        ];

        const brand = allBrands.find(b => b.label === currentBrand);
        return brand?.models || [];
    };

    const renderModelOptions = (): React.ReactNode => {
        const models = getAvailableModels();

        if (models.length === 0) {
            return (
                <div style={{ padding: '14px 16px', color: '#8a94a6' }}>
                    {currentBrand ? '사용 가능한 모델이 없습니다.' : '브랜드를 먼저 선택해주세요.'}
                </div>
            );
        }

        return models.map(model => {
            const modelLabel = model.label;
            return (
                <div
                    key={modelLabel}
                    className={`select-option${currentModel === modelLabel ? ' selected' : ''}`}
                    role="option"
                    aria-selected={currentModel === modelLabel}
                    onClick={() => handleModelSelect(model)}
                >
                    {modelLabel}
                </div>
            );
        });
    };

    return (
        <div
            ref={boxRef}
            className={`car-select-box${!currentBrand ? ' disabled' : ''}`}
            id="model-select"
            role="button"
            tabIndex={0}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-disabled={!currentBrand}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
        >
            <div className="car-select-label">
                {currentModel || '모델'}
            </div>
            {isOpen && currentBrand && (
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
