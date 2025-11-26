import { useState, useEffect, useCallback } from 'react';

/**
 * 모달 관리를 위한 커스텀 훅
 * ESC 키 처리 및 body 스크롤 제어 포함
 * @returns {Object} { isOpen, data, openModal, closeModal }
 */
export const useModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState(null);

    const openModal = useCallback((modalData = null) => {
        setIsOpen(true);
        setData(modalData);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        setData(null);
    }, []);

    // ESC 키 핸들러
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                closeModal();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // body 스크롤 제어
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, closeModal]);

    return {
        isOpen,
        data,
        openModal,
        closeModal
    };
};
