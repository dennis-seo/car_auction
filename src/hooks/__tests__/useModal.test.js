import { renderHook, act, waitFor } from '@testing-library/react';
import { useModal } from '../useModal';

describe('useModal', () => {
    test('초기 상태는 닫혀있다', () => {
        const { result } = renderHook(() => useModal());

        expect(result.current.isOpen).toBe(false);
        expect(result.current.data).toBeNull();
    });

    test('openModal을 호출하면 모달이 열린다', () => {
        const { result } = renderHook(() => useModal());

        act(() => {
            result.current.openModal();
        });

        expect(result.current.isOpen).toBe(true);
    });

    test('openModal에 데이터를 전달하면 저장된다', () => {
        const { result } = renderHook(() => useModal());
        const testData = { id: 1, name: 'Test' };

        act(() => {
            result.current.openModal(testData);
        });

        expect(result.current.isOpen).toBe(true);
        expect(result.current.data).toEqual(testData);
    });

    test('closeModal을 호출하면 모달이 닫힌다', () => {
        const { result } = renderHook(() => useModal());

        act(() => {
            result.current.openModal('test');
        });

        act(() => {
            result.current.closeModal();
        });

        expect(result.current.isOpen).toBe(false);
    });
});
