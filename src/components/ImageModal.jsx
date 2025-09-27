import React, { useEffect, useCallback } from 'react';

/**
 * 이미지 모달 컴포넌트
 */
const ImageModal = ({ show, imageUrl, onClose }) => {
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

    if (!show) {
        return null;
    }

    return (
        <div 
            className="modal-backdrop" 
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="image-modal-title"
        >
            <div className="modal-content image-modal-content">
                <div className="modal-header">
                    <h2 id="image-modal-title" className="sr-only">차량 이미지</h2>
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
                    <img 
                        src={imageUrl} 
                        alt="차량 확대 이미지" 
                        className="modal-image"
                        onError={(e) => {
                            e.target.alt = '이미지를 불러올 수 없습니다';
                            e.target.className = 'modal-image error';
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ImageModal;