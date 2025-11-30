import { useState, useEffect, useCallback } from 'react';

/**
 * useModal 훅 반환 타입
 */
export interface UseModalReturn<T = unknown> {
    /** 모달 열림 상태 */
    isOpen: boolean;
    /** 모달에 전달된 데이터 */
    data: T | null;
    /** 모달 열기 함수 */
    openModal: (modalData?: T | null) => void;
    /** 모달 닫기 함수 */
    closeModal: () => void;
}

/**
 * 모달 관리를 위한 커스텀 훅
 * - ESC 키로 모달 닫기
 * - 모달 열림 시 body 스크롤 제어
 *
 * @template T - 모달에 전달할 데이터 타입
 * @returns 모달 상태 및 제어 함수
 */
export const useModal = <T = unknown>(): UseModalReturn<T> => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [data, setData] = useState<T | null>(null);

    const openModal = useCallback((modalData: T | null = null) => {
        setIsOpen(true);
        setData(modalData);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        setData(null);
    }, []);

    // ESC 키 핸들러 및 body 스크롤 제어
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
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

export default useModal;