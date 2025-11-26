import { useState, useEffect } from 'react';

/**
 * 화면 크기가 모바일인지 확인하는 커스텀 훅
 * @param {number} breakpoint - 모바일로 간주할 최대 너비 (기본값: 768)
 * @returns {boolean} 모바일 여부
 */
export const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
    );

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= breakpoint);
        };

        window.addEventListener('resize', handleResize);

        // 초기 값 설정
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [breakpoint]);

    return isMobile;
};
