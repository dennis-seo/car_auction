import React from 'react';

/**
 * 날짜 로딩 오류 표시 컴포넌트
 * - 창의적이고 이쁜 카드 스타일로 에러를 안내하고 재시도 버튼 제공
 */
const DateLoadError = ({ onRetry }) => {
  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        margin: '24px auto',
        maxWidth: 720,
        padding: '20px 24px',
        borderRadius: 16,
        background: 'linear-gradient(135deg, #fff0f5 0%, #f0f9ff 100%)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 36 }}>📅</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>
            날짜 목록을 불러오지 못했어요
          </div>
          <div style={{ marginTop: 6, color: '#4b5563', lineHeight: 1.5 }}>
            네트워크 상태를 확인하시거나 잠시 후 다시 시도해 주세요. 문제가 계속되면 새로고침을 해보세요.
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          style={{
            appearance: 'none',
            border: 'none',
            padding: '10px 14px',
            borderRadius: 999,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 6px 14px rgba(99,102,241,0.35)',
            transition: 'transform 0.08s ease',
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'translateY(1px)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          다시 시도
        </button>
      </div>
    </div>
  );
};

export default DateLoadError;
