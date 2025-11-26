import {
    normalizeDateToYYMMDD,
    formatYYMMDDToLabel,
    filterData
} from '../dataUtils';

describe('dataUtils', () => {
    describe('normalizeDateToYYMMDD', () => {
        test('yymmdd 형식은 그대로 반환한다', () => {
            expect(normalizeDateToYYMMDD('251225')).toBe('251225');
        });

        test('yyyymmdd 형식을 yymmdd로 변환한다', () => {
            expect(normalizeDateToYYMMDD('20251225')).toBe('251225');
        });

        test('빈 문자열은 빈 문자열을 반환한다', () => {
            expect(normalizeDateToYYMMDD('')).toBe('');
        });
    });

    describe('formatYYMMDDToLabel', () => {
        test('yymmdd 형식을 "yy년 mm월 dd일"로 변환한다', () => {
            expect(formatYYMMDDToLabel('251225')).toBe('25년 12월 25일');
        });

        test('빈 문자열은 빈 문자열을 반환한다', () => {
            expect(formatYYMMDDToLabel('')).toBe('');
        });
    });

    describe('filterData', () => {
        const mockData = [
            {
                title: '[현대] 아반떼',
                price: 1000,
                year: 2020,
                fuel: '가솔린'
            },
            {
                title: '[기아] K5',
                price: 1500,
                year: 2021,
                fuel: '디젤'
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

        test('필터가 없으면 모든 데이터를 반환한다', () => {
            const result = filterData(mockData, emptyFilters, '', null, null);
            expect(result).toHaveLength(2);
        });

        test('검색어로 필터링한다', () => {
            const result = filterData(mockData, emptyFilters, '아반떼', null, null);
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('[현대] 아반떼');
        });
    });
});
