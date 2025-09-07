import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import './App.css';
import DateSelector from './components/DateSelector';
import MainSearch from './components/MainSearch';
import ActiveFilters from './components/ActiveFilters';
import CarGallery from './components/CarGallery';
import CarTable from './components/CarTable';
import ImageModal from './components/ImageModal';
import DetailsModal from './components/DetailsModal';
import AuctionLogo from './components/AuctionLogo';
import { initializeFiltersAndOptions, fetchAvailableDates } from './utils/dataUtils';
import { appState } from './utils/appState';

function App() {
    // 앱 상태 관리
    const [selectedDate, setSelectedDate] = useState('');
    const [data, setData] = useState([]);
    const [availableDates, setAvailableDates] = useState([]);
    const [activeFilters, setActiveFilters] = useState({
        title: [], model: [], submodel: [], price: [], km: [], fuel: [], auction_name: [], region: [], year: []
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [budgetRange, setBudgetRange] = useState(null);
    const [yearRange, setYearRange] = useState(null);
    const [message, setMessage] = useState('날짜를 선택하면 해당일의 경매 목록을 불러옵니다.');
    const [showMainSearch, setShowMainSearch] = useState(false);
    
    // 모달 상태
    const [imageModal, setImageModal] = useState({ show: false, imageUrl: '' });
    const [detailsModal, setDetailsModal] = useState({ show: false, data: null });

    // 초기화: 사용 가능한 날짜 목록 불러오기
    useEffect(() => {
        const initialize = async () => {
            try {
                await fetchAvailableDates();
                setAvailableDates([...appState.availableDates]);
            } catch (error) {
                setMessage('경매 날짜 목록을 불러오는 데 실패했습니다.');
                console.error(error);
            }
        };
        initialize();
    }, []);

    // 날짜 선택 시 데이터 로드
    const handleDateChange = useCallback(async (date) => {
        setSelectedDate(date);
        
        if (!date) {
            setData([]);
            setMessage('날짜를 선택하면 해당일의 경매 목록을 불러옵니다.');
            setShowMainSearch(false);
            return;
        }

        setMessage(`'${date}'의 경매 데이터를 불러오는 중입니다...`);
        
        try {
            // API에서 CSV를 직접 파싱
            const apiUrl = `https://car-auction-849074372493.asia-northeast3.run.app/api/csv/${date}`;
            
            Papa.parse(apiUrl, {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    console.log('CSV 파싱 완료:', results);
                    if (results.data && results.data.length > 0) {
                        const newData = results.data;
                        setData(newData);
                        appState.allData = newData;
                        initializeFiltersAndOptions();
                        setActiveFilters({
                            title: [], model: [], submodel: [], price: [], km: [], fuel: [], auction_name: [], region: [], year: []
                        });
                        setSearchQuery('');
                        setBudgetRange(null);
                        setYearRange(null);
                        setMessage('');
                        setShowMainSearch(true);
                        console.log('데이터 로드 완료, showMainSearch:', true);
                    } else {
                        setMessage(`데이터가 없거나 파일을 찾을 수 없습니다. (날짜: ${date})`);
                        console.warn('CSV 데이터가 비어있습니다:', results);
                    }
                },
                error: function(error) {
                    console.error("파일 파싱 오류:", error);
                    setMessage(`오류: '${date}' 날짜의 CSV를 읽을 수 없습니다. 잠시 후 다시 시도해주세요.`);
                }
            });
        } catch (error) {
            console.error('데이터 로드 오류:', error);
            setMessage('데이터를 불러오는 중 오류가 발생했습니다.');
        }
    }, []);

    // 필터 업데이트
    const updateFilter = useCallback((filterType, value, action = 'toggle') => {
        setActiveFilters(prev => {
            const newFilters = { ...prev };
            
            if (action === 'clear') {
                newFilters[filterType] = [];
            } else if (action === 'set') {
                newFilters[filterType] = Array.isArray(value) ? [...value] : [value];
            } else if (action === 'toggle') {
                const currentValues = newFilters[filterType] || [];
                if (currentValues.includes(value)) {
                    newFilters[filterType] = currentValues.filter(v => v !== value);
                } else {
                    newFilters[filterType] = [...currentValues, value];
                }
            }
            
            return newFilters;
        });
    }, []);

    // 모달 핸들러
    const showImageModalHandler = useCallback((imageUrl) => {
        setImageModal({ show: true, imageUrl });
    }, []);

    const hideImageModalHandler = useCallback(() => {
        setImageModal({ show: false, imageUrl: '' });
    }, []);

    const showDetailsModalHandler = useCallback((rowData) => {
        setDetailsModal({ show: true, data: rowData });
    }, []);

    const hideDetailsModalHandler = useCallback(() => {
        setDetailsModal({ show: false, data: null });
    }, []);

    // 검색어 제거 핸들러
    const handleRemoveSearchQuery = useCallback(() => {
        setSearchQuery('');
    }, []);

    return (
        <div className="container">
            <h1>차량 경매 정보</h1>
            <AuctionLogo data={data} />
            
            <DateSelector 
                availableDates={availableDates}
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
            />
            
            {message && (
                <p id="message" style={{ 
                    textAlign: 'center', 
                    color: '#6c757d', 
                    padding: '2rem',
                    display: message ? 'block' : 'none'
                }}>
                    {message}
                </p>
            )}

            {showMainSearch && (
                <MainSearch 
                    data={data}
                    activeFilters={activeFilters}
                    searchQuery={searchQuery}
                    budgetRange={budgetRange}
                    yearRange={yearRange}
                    onUpdateFilter={updateFilter}
                    onSearchQueryChange={setSearchQuery}
                    onBudgetRangeChange={setBudgetRange}
                    onYearRangeChange={setYearRange}
                />
            )}

            <ActiveFilters 
                activeFilters={activeFilters}
                budgetRange={budgetRange}
                searchQuery={searchQuery}
                onRemoveFilter={updateFilter}
                onRemoveBudgetRange={() => setBudgetRange(null)}
                onRemoveSearchQuery={handleRemoveSearchQuery}
            />

            <CarGallery 
                data={data}
                activeFilters={activeFilters}
                searchQuery={searchQuery}
                budgetRange={budgetRange}
                yearRange={yearRange}
                onImageClick={showImageModalHandler}
                onDetailsClick={showDetailsModalHandler}
            />

            <CarTable 
                data={data}
                activeFilters={activeFilters}
                searchQuery={searchQuery}
                budgetRange={budgetRange}
                yearRange={yearRange}
                onImageClick={showImageModalHandler}
                onDetailsClick={showDetailsModalHandler}
                onUpdateFilter={updateFilter}
                showTable={!!selectedDate && data.length > 0}
            />

            <ImageModal 
                show={imageModal.show}
                imageUrl={imageModal.imageUrl}
                onClose={hideImageModalHandler}
            />

            <DetailsModal 
                show={detailsModal.show}
                data={detailsModal.data}
                onClose={hideDetailsModalHandler}
            />
        </div>
    );
}

export default App;