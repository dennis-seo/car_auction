import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * 뷰포트 폭을 기준으로 모바일 여부를 판단하는 훅 (성능 최적화 버전)
 */
export default function useIsMobile(breakpoint = 640) {
  const getMatches = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
  };

  const [isMobile, setIsMobile] = useState(getMatches);
  const debounceTimerRef = useRef(null);
  const mqlRef = useRef(null);

  // 디바운스된 상태 업데이트 - 리사이즈 이벤트가 빈번할 때 성능 향상
  const debouncedSetIsMobile = useCallback((matches) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setIsMobile(matches);
      debounceTimerRef.current = null;
    }, 50); // 50ms 디바운스 - 반응성과 성능의 균형
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // MediaQueryList 캐시하여 재생성 방지
    if (!mqlRef.current) {
      mqlRef.current = window.matchMedia(`(max-width: ${breakpoint}px)`);
    }
    
    const mql = mqlRef.current;
    const handler = (e) => debouncedSetIsMobile(e.matches);
    
    // 현재 상태 즉시 반영 (초기 렌더링 시)
    setIsMobile(mql.matches);
    
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
    } else {
      // Safari 호환성
      mql.addListener(handler);
    }
    
    return () => {
      // 타이머 정리
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // 이벤트 리스너 정리
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handler);
      } else {
        mql.removeListener(handler);
      }
    };
  }, [breakpoint, debouncedSetIsMobile]);

  return isMobile;
}
