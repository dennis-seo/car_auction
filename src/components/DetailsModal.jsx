import React, { useEffect, useCallback } from 'react';

/**
 * 상세 정보 모달 컴포넌트
 */
const DetailsModal = ({ show, data, onClose }) => {
    // ESC 키로 모달 닫기
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    // 모달 외부 클릭 시 닫기
    const handleBackdropClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (show) {
            document.addEventListener('keydown', handleKeyDown);
            // 스크롤 방지
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [show, handleKeyDown]);

    const renderDetailItem = (label, value) => {
        if (!value || value === '-') return null;
        
        return (
            <div className="detail-item" key={label}>
                <span className="detail-label">{label}:</span>
                <span className="detail-value">{value}</span>
            </div>
        );
    };

    const formatKm = (km) => {
        if (!km || isNaN(parseInt(km, 10))) return km;
        return `${parseInt(km, 10).toLocaleString('ko-KR')} km`;
    };

    const formatPrice = (price) => {
        if (!price || isNaN(parseInt(price, 10))) return price;
        return `${parseInt(price, 10).toLocaleString('ko-KR')} 만원`;
    };

    if (!show || !data) {
        return null;
    }

    return (
        <div 
            className="modal-backdrop" 
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="details-modal-title"
        >
            <div className="modal-content details-modal-content">
                <div className="modal-header">
                    <h2 id="details-modal-title">차량 상세 정보</h2>
                    <button 
                        className="modal-close-btn" 
                        onClick={onClose}
                        aria-label="모달 닫기"
                        type="button"
                    >
                        ×
                    </button>
                </div>
                <div className="modal-body">
                    <div className="details-grid">
                        {renderDetailItem('출품번호', data.sell_number)}
                        {renderDetailItem('차량명', data.title)}
                        {renderDetailItem('부제목', data.subtitle)}
                        {renderDetailItem('연식', data.year)}
                        {renderDetailItem('주행거리', formatKm(data.km))}
                        {renderDetailItem('연료', data.fuel)}
                        {renderDetailItem('가격', formatPrice(data.price))}
                        {renderDetailItem('경매장', data.auction_name)}
                        {renderDetailItem('지역', data.region)}
                        {renderDetailItem('차량번호', data.car_number)}
                        {renderDetailItem('점수', data.score)}
                    </div>
                    
                    {data.image && (
                        <div className="details-image-container">
                            <img 
                                src={data.image} 
                                alt={`${data.title || '차량'} 이미지`}
                                className="details-image"
                                onError={(e) => {
                                    e.target.alt = '이미지를 불러올 수 없습니다';
                                    e.target.className = 'details-image error';
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DetailsModal;