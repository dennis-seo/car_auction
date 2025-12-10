import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '../utils/apiConfig';
import type {
    VehicleHistoryAggregatedResponse,
    AggregatedSummary,
    AggregatedDateData,
} from '../types';

/**
 * 집계 히스토리 조회 파라미터
 */
export interface FetchAggregatedHistoryParams {
    /** 제조사 ID (필수) */
    manufacturerId: string;
    /** 모델 ID (필수) */
    modelId: string;
    /** 트림 ID (선택) */
    trimId?: string | null;
    /** 최소 확보할 날짜 수 (기본 5) */
    minDates?: number;
    /** 날짜별 최대 거래 건수 (기본 10) */
    maxPerDate?: number;
    /** 전체 최대 거래 건수 (기본 100) */
    maxTotal?: number;
    /** 조회 기간 개월 수 (기본 12) */
    months?: number;
    /** 제외할 날짜 (현재 경매일) */
    excludeDate?: string | null;
}

/**
 * useVehicleHistoryAggregated 훅 반환 타입
 */
export interface UseVehicleHistoryAggregatedReturn {
    /** 요약 통계 */
    summary: AggregatedSummary | null;
    /** 날짜별 데이터 */
    data: AggregatedDateData[];
    /** 로딩 상태 */
    loading: boolean;
    /** 에러 메시지 */
    error: string | null;
    /** 데이터 조회 함수 */
    fetchAggregatedHistory: (params: FetchAggregatedHistoryParams) => Promise<void>;
    /** 데이터 초기화 */
    resetAggregatedHistory: () => void;
}

/**
 * 차량 시세 히스토리 집계 조회 훅
 * 날짜별로 분산된 거래 데이터를 조회하여 시세 그래프용으로 사용
 */
export const useVehicleHistoryAggregated = (): UseVehicleHistoryAggregatedReturn => {
    const [summary, setSummary] = useState<AggregatedSummary | null>(null);
    const [data, setData] = useState<AggregatedDateData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * 집계 히스토리 조회
     */
    const fetchAggregatedHistory = useCallback(async ({
        manufacturerId,
        modelId,
        trimId,
        minDates = 5,
        maxPerDate = 10,
        maxTotal = 100,
        months = 12,
        excludeDate,
    }: FetchAggregatedHistoryParams): Promise<void> => {
        // 필수 파라미터 검증
        if (!manufacturerId || !modelId) {
            setSummary(null);
            setData([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                manufacturer_id: manufacturerId,
                model_id: modelId,
                min_dates: String(minDates),
                max_per_date: String(maxPerDate),
                max_total: String(maxTotal),
                months: String(months),
            });

            if (trimId) {
                params.append('trim_id', trimId);
            }
            if (excludeDate) {
                params.append('exclude_date', excludeDate);
            }

            const apiUrl = `${API_ENDPOINTS.vehicleHistoryAggregated}?${params}`;

            // 디버그 모드에서만 API 호출 정보 출력
            if (process.env.NODE_ENV === 'development') {
                console.group('[VehicleHistoryAggregated] API 호출');
                console.log('URL:', apiUrl);
                console.log('검색 조건:', {
                    manufacturerId,
                    modelId,
                    trimId: trimId || '없음',
                    minDates,
                    maxPerDate,
                    maxTotal,
                    months,
                    excludeDate: excludeDate || '없음',
                });
                console.groupEnd();
            }

            const response = await fetch(apiUrl);

            if (!response.ok) {
                if (response.status === 404) {
                    // API가 아직 없는 경우 빈 데이터 반환
                    setSummary(null);
                    setData([]);
                    return;
                }
                throw new Error('시세 데이터 조회 실패');
            }

            const result: VehicleHistoryAggregatedResponse = await response.json();

            // 디버그 모드에서만 응답 결과 출력
            if (process.env.NODE_ENV === 'development') {
                console.group('[VehicleHistoryAggregated] API 응답');
                console.log('요약:', result.summary);
                console.log('날짜 수:', result.data.length);
                console.log('데이터:', result.data);
                console.groupEnd();
            }

            setSummary(result.summary);
            setData(result.data);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
            setError(errorMessage);
            setSummary(null);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * 데이터 초기화
     */
    const resetAggregatedHistory = useCallback((): void => {
        setSummary(null);
        setData([]);
        setLoading(false);
        setError(null);
    }, []);

    return {
        summary,
        data,
        loading,
        error,
        fetchAggregatedHistory,
        resetAggregatedHistory,
    };
};

export default useVehicleHistoryAggregated;
