import React from 'react';

/**
 * ImageModal 컴포넌트 Props
 */
interface ImageModalProps {
    /** 모달 표시 여부 */
    show: boolean;
    /** 표시할 이미지 URL */
    imageUrl: string;
    /** 모달 닫기 콜백 */
    onClose: () => void;
}

/**
 * 이미지 모달 컴포넌트
 * 차량 이미지를 크게 보여주는 오버레이 모달
 */
const ImageModal: React.FC<ImageModalProps> = ({ show, imageUrl, onClose }) => {

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
