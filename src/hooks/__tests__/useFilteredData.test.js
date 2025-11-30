import { renderHook } from '@testing-library/react';
import { useFilteredData } from '../useFilteredData';

describe('useFilteredData', () => {
    const mockData = [
        {
            sell_number: '001',
            title: '[현대] 아반떼',
            price: 1000,
            year: 2020,
            km: 50000,
            fuel: '가솔린',
            auction_name: '현대 경매장',
            region: '서울',
            manufacturer_id: '5',
            model_id: '100',
            trim_id: '1001'
        },
        {
            sell_number: '002',
            title: '[기아] K5',
            price: 1500,
            year: 2021,
            km: 30000,
            fuel: '디젤',
            auction_name: '현대 경매장',
            region: '경기',
            manufacturer_id: '2',
            model_id: '140',
            trim_id: '2001'
        },
        {
            sell_number: '003',
            title: '[현대] 소나타',
            price: 2000,
            year: 2022,
            km: 20000,
            fuel: '가솔린',
            auction_name: '롯데 경매장',
            region: '서울',
            manufacturer_id: '5',
            model_id: '111',
            trim_id: '1002'
        }
    ];

    const emptyFilters = {
        title: [],
        model: [],
        submodel: [],
        price: [],
        km: [],
        fuel: [],
        auction_name: [],
        region: [],
        year: []
    };

    test('빈 데이터 배열을 전달하면 빈 배열을 반환한다', () => {
        const { result } = renderHook(() =>
            useFilteredData([], emptyFilters, '', null, null, null)
        );

        expect(result.current).toEqual([]);
    });

    test('필터가 없으면 모든 데이터를 반환한다', () => {
        const { result } = renderHook(() =>
            useFilteredData(mockData, emptyFilters, '', null, null, null)
        );

        expect(result.current).toHaveLength(3);
    });

    test('검색어로 필터링한다', () => {
        const { result } = renderHook(() =>
            useFilteredData(mockData, emptyFilters, '아반떼', null, null, null)
        );

        expect(result.current).toHaveLength(1);
        expect(result.current[0].title).toBe('[현대] 아반떼');
    });

    test('null 데이터는 빈 배열을 반환한다', () => {
        const { result } = renderHook(() =>
            useFilteredData(null, emptyFilters, '', null, null, null)
        );

        expect(result.current).toEqual([]);
    });

    test('manufacturerId로 필터링한다', () => {
        const filterIds = { manufacturerId: '5', modelId: null, trimId: null };
        const { result } = renderHook(() =>
            useFilteredData(mockData, emptyFilters, '', null, null, null, filterIds)
        );

        expect(result.current).toHaveLength(2);
        expect(result.current.every(item => item.manufacturer_id === '5')).toBe(true);
    });

    test('modelId로 필터링한다', () => {
        const filterIds = { manufacturerId: null, modelId: '111', trimId: null };
        const { result } = renderHook(() =>
            useFilteredData(mockData, emptyFilters, '', null, null, null, filterIds)
        );

        expect(result.current).toHaveLength(1);
        expect(result.current[0].title).toBe('[현대] 소나타');
    });

    test('trimId로 필터링한다', () => {
        const filterIds = { manufacturerId: null, modelId: null, trimId: '2001' };
        const { result } = renderHook(() =>
            useFilteredData(mockData, emptyFilters, '', null, null, null, filterIds)
        );

        expect(result.current).toHaveLength(1);
        expect(result.current[0].title).toBe('[기아] K5');
    });

    test('manufacturerId와 modelId 조합으로 필터링한다', () => {
        const filterIds = { manufacturerId: '5', modelId: '100', trimId: null };
        const { result } = renderHook(() =>
            useFilteredData(mockData, emptyFilters, '', null, null, null, filterIds)
        );

        expect(result.current).toHaveLength(1);
        expect(result.current[0].title).toBe('[현대] 아반떼');
    });

    test('filterIds가 null이면 ID 필터를 적용하지 않는다', () => {
        const { result } = renderHook(() =>
            useFilteredData(mockData, emptyFilters, '', null, null, null, null)
        );

        expect(result.current).toHaveLength(3);
    });
});
