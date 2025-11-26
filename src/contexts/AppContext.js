import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [allData, setAllData] = useState([]);
    const [lastSortedFilter, setLastSortedFilter] = useState(null);

    const value = {
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

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
};
