import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
    ComposedChart,
    Line,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { useVehicleHistoryAggregated } from '../hooks/useVehicleHistoryAggregated';
import type { AuctionItem, AggregatedDateData } from '../types';

/** 차량 정보 타입 */
interface VehicleInfo {
    manufacturerId: string | undefined;
    manufacturerName: string | undefined;
    modelId: string | undefined;
    modelName: string | undefined;
    trimId: string | undefined;
    trimName: string | undefined;
    currentPrice: number | undefined;
}

/** 차트 데이터 타입 */
interface ChartDataItem {
    date: string;
    displayDate: string;
    avgPrice: number;
    count: number;          // 원본 거래 건수 (신뢰도 표시용)
    minPrice: number;
    maxPrice: number;
    // 개별 거래 가격 (동적 키)
    [key: string]: string | number | undefined;
}

/** 통계 타입 */
interface Stats {
    min: number;
    max: number;
    avg: number;
    current: number | null;
    count: number;
    dateCount: number;
}

/** 툴팁 Props */
interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ payload: ChartDataItem }>;
    label?: string;
    formatPrice: (value: number) => string;
}

/** PriceChart Props */
interface PriceChartProps {
    vehicleData: AuctionItem | null;
    currentAuctionDate: string | null;
}

// 날짜 포맷팅 (MM/DD)
function formatShortDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[1]}/${parts[2]}`;
    }
    return dateStr;
}

// 신뢰도 계산 (0~1, count 기반)
function getReliability(count: number, maxCount: number): number {
    if (maxCount <= 1) return 1;
    // 최소 0.3, 최대 1.0
    return Math.max(0.3, Math.min(1, count / maxCount));
}

/**
 * 커스텀 툴팁 컴포넌트
 */
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, formatPrice }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="price-chart-tooltip">
                <p className="tooltip-date">{data.date}</p>
                <p className="tooltip-count">거래 {data.count}건</p>
                <div className="tooltip-stats">
                    <p className="tooltip-avg">평균: {formatPrice(data.avgPrice)}원</p>
                    {data.count > 1 && (
                        <>
                            <p className="tooltip-min">최저: {formatPrice(data.minPrice)}원</p>
                            <p className="tooltip-max">최고: {formatPrice(data.maxPrice)}원</p>
                        </>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

/**
 * 시세 변동 그래프 컴포넌트
 * 집계 API를 사용하여 날짜별 분산된 시세 데이터 표시
 */
const PriceChart: React.FC<PriceChartProps> = ({ vehicleData, currentAuctionDate }) => {
    const [includeTrim, setIncludeTrim] = useState<boolean>(false);

    const {
        summary,
        data: aggregatedData,
        loading,
        error,
        fetchAggregatedHistory,
        resetAggregatedHistory,
    } = useVehicleHistoryAggregated();

    // 차량 정보 추출
    const vehicleInfo = useMemo((): VehicleInfo | null => {
        if (!vehicleData) return null;

        const data = vehicleData as AuctionItem & {
            manufacturer?: string;
            model?: string;
            trim?: string;
        };

        return {
            manufacturerId: data.manufacturer_id,
            manufacturerName: data.manufacturer,
            modelId: data.model_id,
            modelName: data.model,
            trimId: data.trim_id,
            trimName: data.trim,
            currentPrice: data.price,
        };
    }, [vehicleData]);

    // 데이터 로드
    useEffect(() => {
        if (vehicleInfo?.manufacturerId && vehicleInfo?.modelId) {
            fetchAggregatedHistory({
                manufacturerId: vehicleInfo.manufacturerId,
                modelId: vehicleInfo.modelId,
                trimId: includeTrim ? vehicleInfo.trimId : undefined,
                minDates: 5,
                maxPerDate: 10,
                maxTotal: 100,
                months: 12,
                excludeDate: currentAuctionDate || undefined,
            });
        }

        return () => resetAggregatedHistory();
    }, [vehicleInfo, includeTrim, currentAuctionDate, fetchAggregatedHistory, resetAggregatedHistory]);

    // API 데이터를 차트 데이터로 변환
    const chartData = useMemo((): ChartDataItem[] => {
        if (!aggregatedData || aggregatedData.length === 0) return [];

        return aggregatedData.map((item: AggregatedDateData) => {
            const chartItem: ChartDataItem = {
                date: item.date,
                displayDate: formatShortDate(item.date),
                avgPrice: Math.round(item.avg_price),
                count: item.count,
                minPrice: item.min_price,
                maxPrice: item.max_price,
            };

            // 개별 거래 가격을 동적 키로 추가
            item.trades.forEach((trade, idx) => {
                if (trade.price !== null) {
                    chartItem[`price${idx}`] = trade.price;
                }
            });

            return chartItem;
        });
    }, [aggregatedData]);

    // 날짜별 최대 거래 수 (Scatter 동적 생성용)
    const maxTradesPerDate = useMemo(() => {
        if (aggregatedData.length === 0) return 0;
        return Math.max(...aggregatedData.map(d => d.trades.length));
    }, [aggregatedData]);

    // 최대 원본 거래 수 (신뢰도 계산용)
    const maxOriginalCount = useMemo(() => {
        if (chartData.length === 0) return 1;
        return Math.max(...chartData.map(d => d.count));
    }, [chartData]);

    // 통계 계산
    const stats = useMemo((): Stats | null => {
        if (!summary) return null;

        const current = vehicleInfo?.currentPrice
            ? parseInt(String(vehicleInfo.currentPrice), 10)
            : null;

        return {
            min: summary.min_price,
            max: summary.max_price,
            avg: Math.round(summary.avg_price),
            current,
            count: summary.total_count,
            dateCount: summary.date_count,
        };
    }, [summary, vehicleInfo?.currentPrice]);

    // 가격 포맷팅
    const formatPrice = useCallback((value: number): string => {
        return `${value.toLocaleString('ko-KR')}만`;
    }, []);

    if (loading) {
        return (
            <div className="price-chart-loading">
                <div className="loading-spinner"></div>
                <span>시세 데이터 조회 중...</span>
            </div>
        );
    }

    if (!vehicleInfo?.modelId) {
        return (
            <div className="price-chart-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 3v18h18" />
                    <path d="M18 9l-5 5-4-4-3 3" />
                </svg>
                <span>차량 모델 정보를 확인할 수 없습니다</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="price-chart-error">
                <span>시세 데이터를 불러올 수 없습니다</span>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="price-chart-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 3v18h18" />
                    <path d="M18 9l-5 5-4-4-3 3" />
                </svg>
                <span>시세 데이터가 없습니다</span>
            </div>
        );
    }

    // 날짜가 3개 미만이면 추세 파악 불가 경고
    const insufficientDates = (stats?.dateCount || 0) < 3;

    return (
        <div className="price-chart">
            {/* 헤더 */}
            <div className="price-chart-header">
                <div className="price-chart-header-left">
                    <span className="chart-model-info">
                        {vehicleInfo.manufacturerName} {vehicleInfo.modelName}
                        {includeTrim && vehicleInfo.trimName && (
                            <span className="chart-trim-info"> {vehicleInfo.trimName}</span>
                        )}
                    </span>
                    <span className="chart-count">
                        {stats?.count}건 / {stats?.dateCount}일
                    </span>
                </div>
                {vehicleInfo.trimId && (
                    <button
                        type="button"
                        className={`trim-toggle-btn ${includeTrim ? 'active' : ''}`}
                        onClick={() => setIncludeTrim(!includeTrim)}
                        title={includeTrim ? '모델 전체 시세 보기' : '동일 트림만 보기'}
                    >
                        트림 검색
                    </button>
                )}
            </div>

            {/* 날짜 부족 경고 */}
            {insufficientDates && (
                <div className="price-chart-warning">
                    데이터가 {stats?.dateCount}일치만 있어 추세 파악이 어려울 수 있습니다
                </div>
            )}

            {/* 통계 요약 */}
            {stats && (
                <div className="price-chart-stats">
                    <div className="stat-item">
                        <span className="stat-label">최저</span>
                        <span className="stat-value low">{formatPrice(stats.min)}원</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">평균</span>
                        <span className="stat-value avg">{formatPrice(stats.avg)}원</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">최고</span>
                        <span className="stat-value high">{formatPrice(stats.max)}원</span>
                    </div>
                    {stats.current && (
                        <div className="stat-item current">
                            <span className="stat-label">현재</span>
                            <span className="stat-value current">{formatPrice(stats.current)}원</span>
                        </div>
                    )}
                </div>
            )}

            {/* 차트 */}
            <div className="price-chart-container">
                <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 10, right: 35, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            dataKey="displayDate"
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={{ stroke: '#e2e8f0' }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                            domain={['dataMin - 50', 'dataMax + 50']}
                            width={45}
                        />
                        <Tooltip content={<CustomTooltip formatPrice={formatPrice} />} />
                        {stats?.current && (
                            <ReferenceLine
                                y={stats.current}
                                stroke="#2563eb"
                                strokeDasharray="3 3"
                                label={{ value: '현재', position: 'right', fontSize: 10, fill: '#2563eb' }}
                            />
                        )}
                        {/* 개별 거래 점 (Scatter) - 신뢰도에 따른 투명도 적용 */}
                        {Array.from({ length: maxTradesPerDate }, (_, i) => (
                            <Scatter
                                key={`scatter-${i}`}
                                dataKey={`price${i}`}
                                fill="#93c5fd"
                                shape={(props: unknown) => {
                                    const { cx, cy, payload } = props as { cx?: number; cy?: number; payload?: ChartDataItem };
                                    if (cx === undefined || cy === undefined || !payload) return <circle />;
                                    const reliability = getReliability(payload.count, maxOriginalCount);
                                    return (
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            r={4}
                                            fill="#93c5fd"
                                            fillOpacity={reliability}
                                            stroke="#3b82f6"
                                            strokeWidth={0.5}
                                            strokeOpacity={reliability}
                                        />
                                    );
                                }}
                                legendType="none"
                            />
                        ))}
                        {/* 평균가 선 (Line) */}
                        <Line
                            type="monotone"
                            dataKey="avgPrice"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 5, fill: '#2563eb' }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* 안내 문구 */}
            <p className="price-chart-note">
                * 동일 {includeTrim ? '트림' : '모델'} 기준 최근 12개월 시세
                {maxOriginalCount > 3 && ' (점 투명도: 거래량 반영)'}
            </p>
        </div>
    );
};

export default PriceChart;
