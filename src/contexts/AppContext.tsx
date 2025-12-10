import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { AuctionItem } from '../types';

/** 정렬 필터 타입 */
type SortFilterType = 'budget' | 'year' | null;

/** 앱 컨텍스트 값 인터페이스 */
interface AppContextValue {
    allData: AuctionItem[];
    setAllData: React.Dispatch<React.SetStateAction<AuctionItem[]>>;
    lastSortedFilter: SortFilterType;
    setLastSortedFilter: React.Dispatch<React.SetStateAction<SortFilterType>>;
}

/** AppProvider Props */
interface AppProviderProps {
    children: ReactNode;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [allData, setAllData] = useState<AuctionItem[]>([]);
    const [lastSortedFilter, setLastSortedFilter] = useState<SortFilterType>(null);

    const value: AppContextValue = {
        allData,
        setAllData,
        lastSortedFilter,
        setLastSortedFilter
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextValue => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
};
