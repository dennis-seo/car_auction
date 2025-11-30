import React from 'react';

/**
 * DateLoadError 컴포넌트 Props
 */
interface DateLoadErrorProps {
    /** 재시도 콜백 함수 */
    onRetry?: () => void;
}

/**
 * 날짜 로드 에러 컴포넌트
 * 날짜 목록을 불러오는 데 실패했을 때 표시되는 에러 화면
 */
const DateLoadError: React.FC<DateLoadErrorProps> = ({ onRetry }) => {
    const handleRetryClick = (): void => {
        if (onRetry) {
            onRetry();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>): void => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRetryClick();
        }
    };

    return (
        <div className="date-load-error-container">
            <div className="error-icon" role="img" aria-label="오류 아이콘">
                ⚠️
            </div>

            <div className="error-content">
                <h3 className="error-title">
                    날짜 정보를 불러올 수 없습니다
                </h3>

                <p className="error-message">
                    서버 연결에 문제가 있거나 일시적인 오류가 발생했습니다.<br />
                    잠시 후 다시 시도해주세요.
                </p>

                <div className="error-actions">
                    <button
                        type="button"
                        className="retry-button"
                        onClick={handleRetryClick}
                        onKeyDown={handleKeyDown}
                        aria-label="다시 시도"
                    >
                        🔄 다시 시도
                    </button>
                </div>

                <div className="error-help">
                    <p className="help-text">
                        문제가 계속되면 브라우저를 새로고침하거나<br />
                        잠시 후 다시 접속해주세요.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DateLoadError;
