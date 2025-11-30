import React from 'react';

/**
 * 이미지 모달 컴포넌트
 */
const ImageModal = ({ show, imageUrl, onClose }) => {

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