import React, { useCallback, useState } from 'react';
import VehicleHistory from './VehicleHistory';
import PriceChart from './PriceChart';
import './DetailsModal.css';

/**
 * 상세 정보 모달 컴포넌트
 * 탭 구조: 상세정보 / 시세 히스토리 / 시세 그래프
 * ESC 키 처리 및 body 스크롤 제어는 useModal 훅에서 처리
 */
const DetailsModal = ({ show, data, onClose, currentDate }) => {
    const [activeTab, setActiveTab] = useState('details');

    // 모달 외부 클릭 시 닫기
    const handleBackdropClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    // 모달이 닫힐 때 탭 초기화
    const handleClose = useCallback(() => {
        setActiveTab('details');
        onClose();
    }, [onClose]);

    const formatKm = (km) => {
        if (!km || isNaN(parseInt(km, 10))) return km;
        return parseInt(km, 10).toLocaleString('ko-KR');
    };

    const formatPrice = (price) => {
        if (!price || isNaN(parseInt(price, 10))) return price;
        return parseInt(price, 10).toLocaleString('ko-KR');
    };

    // currentDate를 API 형식(YYYY-MM-DD)으로 변환
    const formatDateForAPI = (dateStr) => {
        if (!dateStr || dateStr.length !== 6) return null;
        return `20${dateStr.slice(0, 2)}-${dateStr.slice(2, 4)}-${dateStr.slice(4, 6)}`;
    };

    if (!show || !data) {
        return null;
    }

    const auctionDateForAPI = formatDateForAPI(currentDate);

    return (
        <div
            className="details-modal-overlay"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="details-modal-title"
        >
            <div className="details-modal-card">
                {/* 닫기 버튼 */}
                <button
                    className="details-modal-close"
                    onClick={handleClose}
                    aria-label="모달 닫기"
                    type="button"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {/* 이미지 섹션 */}
                {data.image && (
                    <div className="details-modal-image-section">
                        <img
                            src={data.image}
                            alt={`${data.title || '차량'} 이미지`}
                            className="details-modal-image"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                )}

                {/* 탭 네비게이션 */}
                <div className="details-modal-tabs">
                    <button
                        className={`details-tab ${activeTab === 'details' ? 'active' : ''}`}
                        onClick={() => setActiveTab('details')}
                        type="button"
                    >
                        상세정보
                    </button>
                    <button
                        className={`details-tab ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                        type="button"
                    >
                        시세 히스토리
                    </button>
                    <button
                        className={`details-tab ${activeTab === 'chart' ? 'active' : ''}`}
                        onClick={() => setActiveTab('chart')}
                        type="button"
                    >
                        시세 그래프
                    </button>
                </div>

                {/* 콘텐츠 섹션 */}
                <div className="details-modal-content">
                    {activeTab === 'details' ? (
                        <>
                            {/* 상단 배지 영역 */}
                            <div className="details-modal-badges">
                                {data.sell_number && (
                                    <span className="details-badge details-badge-sell">
                                        #{data.sell_number}
                                    </span>
                                )}
                                {data.auction_name && (
                                    <span className="details-badge details-badge-auction">
                                        {data.auction_name}
                                    </span>
                                )}
                                {data.score && (
                                    <span className="details-badge details-badge-score">
                                        {data.score}
                                    </span>
                                )}
                            </div>

                            {/* 차량명 */}
                            <h2 id="details-modal-title" className="details-modal-title">
                                {data.title}
                            </h2>

                            {data.subtitle && (
                                <p className="details-modal-subtitle">{data.subtitle}</p>
                            )}

                            {/* 가격 */}
                            <div className="details-modal-price-section">
                                <span className="details-modal-price">
                                    {formatPrice(data.price)}
                                </span>
                                <span className="details-modal-price-unit">만원</span>
                            </div>

                            {/* 핵심 스펙 카드 */}
                            <div className="details-modal-specs">
                                <div className="details-spec-item">
                                    <div className="details-spec-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                    </div>
                                    <div className="details-spec-info">
                                        <span className="details-spec-label">연식</span>
                                        <span className="details-spec-value">{data.year || '-'}년</span>
                                    </div>
                                </div>

                                <div className="details-spec-item">
                                    <div className="details-spec-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                    </div>
                                    <div className="details-spec-info">
                                        <span className="details-spec-label">주행거리</span>
                                        <span className="details-spec-value">{formatKm(data.km) || '-'} km</span>
                                    </div>
                                </div>

                                <div className="details-spec-item">
                                    <div className="details-spec-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                        </svg>
                                    </div>
                                    <div className="details-spec-info">
                                        <span className="details-spec-label">연료</span>
                                        <span className="details-spec-value">{data.fuel || '-'}</span>
                                    </div>
                                </div>

                                {data.car_number && (
                                    <div className="details-spec-item">
                                        <div className="details-spec-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect>
                                                <path d="M16 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"></path>
                                                <circle cx="5.5" cy="18" r="2.5"></circle>
                                                <circle cx="18.5" cy="18" r="2.5"></circle>
                                            </svg>
                                        </div>
                                        <div className="details-spec-info">
                                            <span className="details-spec-label">차량번호</span>
                                            <span className="details-spec-value">{data.car_number}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 추가 정보 */}
                            {data.region && (
                                <div className="details-modal-extra">
                                    <span className="details-extra-label">지역</span>
                                    <span className="details-extra-value">{data.region}</span>
                                </div>
                            )}
                        </>
                    ) : activeTab === 'history' ? (
                        <VehicleHistory
                            vehicleData={data}
                            currentAuctionDate={auctionDateForAPI}
                        />
                    ) : (
                        <PriceChart
                            vehicleData={data}
                            currentAuctionDate={auctionDateForAPI}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DetailsModal;
