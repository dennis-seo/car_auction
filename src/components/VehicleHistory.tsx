import React, { useEffect, useMemo } from 'react';
import { useVehicleHistory } from '../hooks/useVehicleHistory';
import type { AuctionItem } from '../types';

/** 차량 정보 타입 */
interface VehicleInfo {
    manufacturerId: string | undefined;
    manufacturerName: string | undefined;
    modelId: string | undefined;
    modelName: string | undefined;
    trimId: string | undefined;
    trimName: string | undefined;
}

/** VehicleHistory Props */
interface VehicleHistoryProps {
    /** 현재 차량 데이터 */
    vehicleData: AuctionItem | null;
    /** 현재 경매 날짜 (YYYY-MM-DD 형식) */
    currentAuctionDate: string | null;
}

/**
 * 차량 히스토리 컴포넌트
 * 동일 모델의 과거 경매 기록을 표시
 * API 응답의 manufacturer_id, model_id 기준으로 검색
 */
const VehicleHistory: React.FC<VehicleHistoryProps> = ({ vehicleData, currentAuctionDate }) => {
    const {
        history,
        loading,
        error,
        pagination,
        fetchHistory,
        goToPage,
        resetHistory,
    } = useVehicleHistory();

    // 차량 정보 추출 (API 응답에서 직접 사용)
    const vehicleInfo = useMemo((): VehicleInfo | null => {
        if (!vehicleData) return null;

        // vehicleData에서 manufacturer, model 등의 필드는 직접 존재하지 않을 수 있음
        // API에서 오는 데이터 구조에 맞게 타입 assertion 사용
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
        };
    }, [vehicleData]);

    // 현재 페이지 계산
    const currentPage = useMemo((): number => {
        return Math.floor(pagination.offset / pagination.limit) + 1;
    }, [pagination.offset, pagination.limit]);

    // 총 페이지 수
    const totalPages = useMemo((): number => {
        return Math.ceil(pagination.total / pagination.limit);
    }, [pagination.total, pagination.limit]);

    // 데이터 로드
    useEffect(() => {
        if (vehicleInfo?.modelId) {
            // 디버그 모드에서만 차량 정보 출력
            if (process.env.NODE_ENV === 'development') {
                console.group('[VehicleHistory] 차량 정보');
                console.log('원본 제목:', vehicleData?.title);
                console.log('제조사:', vehicleInfo.manufacturerName, `(ID: ${vehicleInfo.manufacturerId})`);
                console.log('모델:', vehicleInfo.modelName, `(ID: ${vehicleInfo.modelId})`);
                console.log('트림:', vehicleInfo.trimName, `(ID: ${vehicleInfo.trimId})`);
                console.groupEnd();
            }

            fetchHistory({
                manufacturerId: vehicleInfo.manufacturerId,
                modelId: vehicleInfo.modelId,
                // trimId는 선택적으로 사용 (너무 좁은 범위가 될 수 있음)
                // trimId: vehicleInfo.trimId,
                limit: 10,
                offset: 0,
                excludeDate: currentAuctionDate || undefined,
            });
        }
        return () => resetHistory();
    }, [vehicleInfo, vehicleData?.title, currentAuctionDate, fetchHistory, resetHistory]);

    // 페이지 변경 핸들러
    const handlePageChange = (page: number): void => {
        if (!vehicleInfo?.modelId) return;

        goToPage(page, {
            manufacturerId: vehicleInfo.manufacturerId,
            modelId: vehicleInfo.modelId,
            excludeDate: currentAuctionDate || undefined,
        });
    };

    // 숫자 포맷팅
    const formatNumber = (num: number | string | undefined): string => {
        if (!num || isNaN(parseInt(String(num), 10))) return '-';
        return parseInt(String(num), 10).toLocaleString('ko-KR');
    };

    // 날짜 포맷팅 (YYYY-MM-DD -> YY.MM.DD)
    const formatDate = (dateStr: string | undefined): string => {
        if (!dateStr) return '-';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[0].slice(2)}.${parts[1]}.${parts[2]}`;
        }
        return dateStr;
    };

    // 로딩 상태
    if (loading) {
        return (
            <div className="vehicle-history-loading">
                <div className="loading-spinner"></div>
                <span>히스토리 조회 중...</span>
            </div>
        );
    }

    // 모델 ID가 없는 경우
    if (!vehicleInfo?.modelId) {
        return (
            <div className="vehicle-history-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>차량 모델 정보를 확인할 수 없습니다</span>
            </div>
        );
    }

    // 에러 상태
    if (error) {
        return (
            <div className="vehicle-history-error">
                <span>히스토리를 불러올 수 없습니다</span>
            </div>
        );
    }

    // 데이터 없음
    if (history.length === 0) {
        return (
            <div className="vehicle-history-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>동일 모델의 과거 경매 기록이 없습니다</span>
            </div>
        );
    }

    return (
        <div className="vehicle-history">
            <div className="vehicle-history-header">
                <span className="history-model-info">
                    {vehicleInfo.manufacturerName} {vehicleInfo.modelName}
                </span>
                <span className="history-count">총 {pagination.total}건</span>
            </div>

            <div className="vehicle-history-list">
                {history.map((item, index) => {
                    // auction_house 필드 타입 처리
                    const itemWithHouse = item as AuctionItem & { auction_house?: string };
                    return (
                        <div key={`${item.auction_date}-${item.sell_number}-${index}`} className="history-item">
                            <div className="history-item-date">
                                <span className="date-value">{formatDate(item.auction_date)}</span>
                                {itemWithHouse.auction_house && (
                                    <span className="auction-house">{itemWithHouse.auction_house}</span>
                                )}
                            </div>
                            <div className="history-item-details">
                                <div className="history-detail-row">
                                    <span className="detail-label">가격</span>
                                    <span className="detail-value price">{formatNumber(item.price)}만원</span>
                                </div>
                                <div className="history-detail-row">
                                    <span className="detail-label">주행</span>
                                    <span className="detail-value">{formatNumber(item.km)}km</span>
                                </div>
                                {item.year && (
                                    <div className="history-detail-row">
                                        <span className="detail-label">연식</span>
                                        <span className="detail-value">{item.year}년</span>
                                    </div>
                                )}
                                {item.score && (
                                    <div className="history-detail-row">
                                        <span className="detail-label">등급</span>
                                        <span className="detail-value score">{item.score}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="vehicle-history-pagination">
                    <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <span className="pagination-info">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default VehicleHistory;
