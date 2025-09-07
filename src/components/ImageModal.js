import React, { useEffect } from 'react';

/**
 * 이미지 모달 컴포넌트
 */
const ImageModal = ({ show, imageUrl, onClose }) => {
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

    if (!show) {
        return null;
    }

    return (
        <div 
            id="image-modal" 
            className="modal-overlay"
            style={{ display: 'flex' }}
            onClick={handleOverlayClick}
        >
            <span 
                className="modal-close"
                onClick={onClose}
            >
                &times;
            </span>
            <img 
                className="modal-content" 
                id="modal-image" 
                src={imageUrl} 
                alt="차량 이미지 크게 보기"
            />
        </div>
    );
};

export default ImageModal;