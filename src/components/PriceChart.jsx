import React, { useEffect, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { useVehicleHistory } from '../hooks/useVehicleHistory';

/**
 * 시세 변동 그래프 컴포넌트
 * 동일 모델의 과거 경매 가격 추이를 차트로 표시
 */
const PriceChart = ({ vehicleData, currentAuctionDate }) => {
    const {
        history,
        loading,
        error,
        pagination,
        fetchHistory,
        resetHistory,
    } = useVehicleHistory();

    // 차량 정보 추출
    const vehicleInfo = useMemo(() => {
        if (!vehicleData) return null;

        return {
            manufacturerId: vehicleData.manufacturer_id,
            manufacturerName: vehicleData.manufacturer,
            modelId: vehicleData.model_id,
            modelName: vehicleData.model,
            trimId: vehicleData.trim_id,
            trimName: vehicleData.trim,
            currentPrice: vehicleData.price,
        };
    }, [vehicleData]);

    // 데이터 로드 (최대 50개)
    useEffect(() => {
        if (vehicleInfo?.modelId) {
            fetchHistory({
                manufacturerId: vehicleInfo.manufacturerId,
                modelId: vehicleInfo.modelId,
                limit: 50,
                offset: 0,
                excludeDate: currentAuctionDate,
            });
        }
        return () => resetHistory();
    }, [vehicleInfo, currentAuctionDate, fetchHistory, resetHistory]);

    // 차트 데이터 변환 (날짜순 정렬)
    const chartData = useMemo(() => {
        if (!history || history.length === 0) return [];

        return history
            .filter(item => item.price && !isNaN(parseInt(item.price, 10)))
            .map(item => ({
                date: item.auction_date,
                price: parseInt(item.price, 10),
                displayDate: formatShortDate(item.auction_date),
                km: item.km ? parseInt(item.km, 10) : null,
                year: item.year,
                score: item.score,
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [history]);

    // 통계 계산
    const stats = useMemo(() => {
        if (chartData.length === 0) return null;

        const prices = chartData.map(d => d.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
        const current = vehicleInfo?.currentPrice ? parseInt(vehicleInfo.currentPrice, 10) : null;

        return { min, max, avg, current, count: prices.length };
    }, [chartData, vehicleInfo?.currentPrice]);

    // 날짜 포맷팅
    function formatShortDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[1]}/${parts[2]}`;
        }
        return dateStr;
    }

    // 가격 포맷팅
    const formatPrice = (value) => {
        return `${value.toLocaleString('ko-KR')}만`;
    };

    // 커스텀 툴팁
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="price-chart-tooltip">
                    <p className="tooltip-date">{data.date}</p>
                    <p className="tooltip-price">{formatPrice(data.price)}원</p>
                    {data.km && <p className="tooltip-km">{data.km.toLocaleString()}km</p>}
                    {data.year && <p className="tooltip-year">{data.year}년식</p>}
                    {data.score && <p className="tooltip-score">등급: {data.score}</p>}
                </div>
            );
        }
        return null;
    };

    // 로딩 상태
    if (loading) {
        return (
            <div className="price-chart-loading">
                <div className="loading-spinner"></div>
                <span>시세 데이터 조회 중...</span>
            </div>
        );
    }

    // 모델 ID가 없는 경우
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

    // 에러 상태
    if (error) {
        return (
            <div className="price-chart-error">
                <span>시세 데이터를 불러올 수 없습니다</span>
            </div>
        );
    }

    // 데이터 없음
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

    return (
        <div className="price-chart">
            {/* 헤더 */}
            <div className="price-chart-header">
                <span className="chart-model-info">
                    {vehicleInfo.manufacturerName} {vehicleInfo.modelName}
                </span>
                <span className="chart-count">{pagination.total}건 기준</span>
            </div>

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
                    <LineChart
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
                        <Tooltip content={<CustomTooltip />} />
                        {stats?.avg && (
                            <ReferenceLine
                                y={stats.avg}
                                stroke="#94a3b8"
                                strokeDasharray="5 5"
                                label={{ value: '평균', position: 'right', fontSize: 10, fill: '#94a3b8' }}
                            />
                        )}
                        {stats?.current && (
                            <ReferenceLine
                                y={stats.current}
                                stroke="#2563eb"
                                strokeDasharray="3 3"
                                label={{ value: '현재', position: 'right', fontSize: 10, fill: '#2563eb' }}
                            />
                        )}
                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                            activeDot={{ r: 5, fill: '#2563eb' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* 안내 문구 */}
            <p className="price-chart-note">
                * 동일 모델 기준 최근 {stats?.count}건의 경매 데이터
            </p>
        </div>
    );
};

export default PriceChart;
