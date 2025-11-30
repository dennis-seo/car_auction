import React, { useState } from 'react';

/**
 * ErrorBoundary 테스트 컴포넌트
 * 개발 모드에서만 표시되며, 의도적으로 에러를 발생시켜 ErrorBoundary를 테스트할 수 있음
 */
const ErrorBoundaryTest: React.FC = () => {
    const [shouldThrow, setShouldThrow] = useState<boolean>(false);

    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    if (shouldThrow) {
        throw new Error('테스트 에러: ErrorBoundary가 정상적으로 작동하는지 확인하기 위한 의도적인 에러입니다.');
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '10px',
            backgroundColor: '#dc3545',
            color: 'white',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
            <button
                onClick={() => setShouldThrow(true)}
                style={{
                    padding: '8px 16px',
                    backgroundColor: 'white',
                    color: '#dc3545',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.875rem'
                }}
            >
                에러 발생시키기 (테스트)
            </button>
        </div>
    );
};

export default ErrorBoundaryTest;
