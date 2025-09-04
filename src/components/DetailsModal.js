import React, { useEffect } from 'react';

/**
 * 상세 정보 모달 컴포넌트
 */
const DetailsModal = ({ show, data, onClose }) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (show) {
            document.addEventListener('keydown', handleEscape);
            // 스크롤 방지
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [show, onClose]);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!show || !data) {
        return null;
    }

    const { 
        sell_number, 
        title, 
        year, 
        km, 
        color, 
        fuel, 
        car_number, 
        price, 
        auction_name, 
        score 
    } = data;

    const infoString = [
        year,
        km ? `${parseInt(km, 10).toLocaleString('ko-KR')}km` : null,
        color,
        fuel,
        car_number
    ].filter(Boolean).join(' | ');

    return (
        <div 
            id="details-modal" 
            className="modal-overlay"
            style={{ display: 'flex' }}
            onClick={handleOverlayClick}
        >
            <div className="details-modal-container">
                <span 
                    className="modal-close details-close"
                    onClick={onClose}
                >
                    &times;
                </span>
                <div id="details-modal-content" className="details-modal-content">
                    <div className="details-modal-header">
                        <span className="details-modal-sell-number">
                            출품번호 {sell_number}
                        </span>
                        <h2 className="details-modal-title">
                            {title || '-'}
                        </h2>
                        <p className="details-modal-info">
                            {infoString}
                        </p>
                    </div>
                    <div className="details-modal-body">
                        <p className="details-modal-price">
                            시작가 {price ? parseInt(price, 10).toLocaleString('ko-KR') : '-'} 만원
                        </p>
                        <p>경매장: {auction_name || '-'}</p>
                        <p>평가점수: {score || '-'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailsModal;