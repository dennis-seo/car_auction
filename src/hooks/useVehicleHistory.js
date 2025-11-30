import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '../utils/apiConfig';

/**
 * 차량 히스토리 조회 훅
 * manufacturer_id, model_id, trim_id 기준으로 과거 경매 기록을 조회
 */
export const useVehicleHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
    });

    /**
     * 히스토리 조회
     * @param {Object} params - 검색 파라미터
     * @param {string} params.manufacturerId - 제조사 ID
     * @param {string} params.modelId - 모델 ID
     * @param {string} params.trimId - 트림 ID (선택)
     * @param {number} params.limit - 조회 개수 (기본 10)
     * @param {number} params.offset - 오프셋 (기본 0)
     * @param {string} params.excludeDate - 제외할 경매일 (현재 보고 있는 차량의 경매일)
     */
    const fetchHistory = useCallback(async ({
        manufacturerId,
        modelId,
        trimId,
        limit = 10,
        offset = 0,
        excludeDate
    }) => {
        // 최소한 modelId는 필요
        if (!modelId) {
            setHistory([]);
            setPagination({ total: 0, limit: 10, offset: 0, hasMore: false });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                limit: String(limit),
                offset: String(offset),
            });

            // ID 기반 파라미터 추가
            if (manufacturerId) {
                params.append('manufacturer_id', manufacturerId);
            }
            if (modelId) {
                params.append('model_id', modelId);
            }
            if (trimId) {
                params.append('trim_id', trimId);
            }

            const apiUrl = `${API_ENDPOINTS.vehicles}?${params}`;

            // 디버그 모드에서만 API 호출 정보 출력
            if (process.env.NODE_ENV === 'development') {
                console.group('[VehicleHistory] API 호출');
                console.log('URL:', apiUrl);
                console.log('검색 조건:', {
                    manufacturerId: manufacturerId || '없음',
                    modelId: modelId || '없음',
                    trimId: trimId || '없음',
                    limit,
                    offset,
                    excludeDate: excludeDate || '없음',
                });
                console.groupEnd();
            }

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error('히스토리 조회 실패');
            }

            const data = await response.json();

            // 현재 보고 있는 차량의 경매일 제외
            let filteredItems = data.items || [];
            if (excludeDate) {
                filteredItems = filteredItems.filter(item => item.auction_date !== excludeDate);
            }

            // 디버그 모드에서만 응답 결과 출력
            if (process.env.NODE_ENV === 'development') {
                console.group('[VehicleHistory] API 응답');
                console.log('전체 결과 수:', data.total);
                console.log('현재 페이지 결과 수:', filteredItems.length);
                console.log('결과 데이터:', filteredItems);
                console.groupEnd();
            }

            setHistory(filteredItems);
            setPagination({
                total: data.total || 0,
                limit: data.limit || limit,
                offset: data.offset || offset,
                hasMore: (data.offset || offset) + filteredItems.length < (data.total || 0),
            });

        } catch (err) {
            setError(err.message);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * 다음 페이지 로드
     */
    const loadMore = useCallback(async (params) => {
        const newOffset = pagination.offset + pagination.limit;
        await fetchHistory({ ...params, offset: newOffset });
    }, [pagination, fetchHistory]);

    /**
     * 이전 페이지 로드
     */
    const loadPrev = useCallback(async (params) => {
        const newOffset = Math.max(0, pagination.offset - pagination.limit);
        await fetchHistory({ ...params, offset: newOffset });
    }, [pagination, fetchHistory]);

    /**
     * 특정 페이지로 이동
     */
    const goToPage = useCallback(async (page, params) => {
        const newOffset = (page - 1) * pagination.limit;
        await fetchHistory({ ...params, offset: newOffset });
    }, [pagination.limit, fetchHistory]);

    /**
     * 히스토리 초기화
     */
    const resetHistory = useCallback(() => {
        setHistory([]);
        setLoading(false);
        setError(null);
        setPagination({ total: 0, limit: 10, offset: 0, hasMore: false });
    }, []);

    return {
        history,
        loading,
        error,
        pagination,
        fetchHistory,
        loadMore,
        loadPrev,
        goToPage,
        resetHistory,
    };
};
