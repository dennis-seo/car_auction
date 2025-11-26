import React from 'react';

/**
 * 에러 바운더리 컴포넌트
 * 하위 컴포넌트에서 발생한 에러를 잡아서 처리
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    maxWidth: '800px',
                    margin: '2rem auto',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '8px'
                }}>
                    <h1 style={{ color: '#856404', marginBottom: '1rem' }}>
                        앗! 문제가 발생했습니다
                    </h1>
                    <p style={{ marginBottom: '1.5rem', color: '#856404' }}>
                        예상치 못한 오류가 발생했습니다. 아래 버튼을 눌러 다시 시도해주세요.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <button
                            onClick={this.handleReset}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            다시 시도
                        </button>
                        <button
                            onClick={this.handleReload}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            페이지 새로고침
                        </button>
                    </div>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details style={{
                            marginTop: '1.5rem',
                            padding: '1rem',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px'
                        }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                개발자 정보 (개발 모드에서만 표시)
                            </summary>
                            <pre style={{
                                fontSize: '0.875rem',
                                overflow: 'auto',
                                whiteSpace: 'pre-wrap',
                                wordWrap: 'break-word'
                            }}>
                                {this.state.error.toString()}
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
