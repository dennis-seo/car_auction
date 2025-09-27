import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import DateSelector from './components/DateSelector.jsx';
import MainSearch from './components/MainSearch.jsx';
import ActiveFilters from './components/ActiveFilters.jsx';
import CarGallery from './components/CarGallery.jsx';
import CarTable from './components/CarTable.jsx';
import ImageModal from './components/ImageModal.jsx';
import DetailsModal from './components/DetailsModal.jsx';
import AuctionLogo from './components/AuctionLogo.jsx';
import DateLoadError from './components/DateLoadError.jsx';
import { initializeFiltersAndOptions, fetchAvailableDates } from './utils/dataUtils';
import { appState } from './utils/appState';
import { API_ENDPOINTS } from './utils/apiConfig';
import auctionManager from './utils/auctionManager';

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
    const [dateLoadError, setDateLoadError] = useState(false);
    
    // 모달 상태
    const [imageModal, setImageModal] = useState({ show: false, imageUrl: '' });
    const [detailsModal, setDetailsModal] = useState({ show: false, data: null });

    // 초기화: 사용 가능한 날짜 목록 불러오기
    const initializeDates = useCallback(async () => {
        try {
            await fetchAvailableDates();
            setAvailableDates([...appState.availableDates]);
            setDateLoadError(false);
            setMessage('날짜를 선택하면 해당일의 경매 목록을 불러옵니다.');
        } catch (error) {
            console.error(error);
            setDateLoadError(true);
            setMessage('');
        }
    }, []);

    useEffect(() => {
        initializeDates();
    }, [initializeDates]);

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
            // JSON API에서 데이터 가져오기
            const apiUrl = API_ENDPOINTS.auctionsByDate(date);
            const response = await fetch(apiUrl, { cache: 'no-cache' });
            
            if (!response.ok) {
                throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
            }
            
            const jsonData = await response.json();
            
            // JSON 응답에서 items 배열 추출
            if (jsonData && jsonData.items && Array.isArray(jsonData.items) && jsonData.items.length > 0) {
                const newData = jsonData.items;
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

                // AuctionManager 상태 로그 출력
                console.log(`[App] 데이터 로드 완료 - 총 ${newData.length}개 차량 (${jsonData.date || date})`);
                console.log(`[App] 소스 파일: ${jsonData.source_filename || '알 수 없음'}`);
                console.log(`[App] 총 행 수: ${jsonData.row_count || newData.length}`);
                console.log('[App] 경매장별 정보:', auctionManager.getVehicleCountsByAuction());
                console.log('[App] 필터 모드:', auctionManager.getFilterMode());
            } else {
                setMessage(`데이터가 없거나 파일을 찾을 수 없습니다. (날짜: ${date})`);
                console.warn('JSON 응답에 데이터가 없습니다:', jsonData);
            }
        } catch (error) {
            console.error('데이터 로드 오류:', error);
            setMessage(`오류: '${date}' 날짜의 데이터를 읽을 수 없습니다. 잠시 후 다시 시도해주세요.`);
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
            
            // 연식 필터가 설정되면 최근 정렬 우선순위를 'year'로 갱신
            if (filterType === 'year') {
                const arr = newFilters.year;
                if (Array.isArray(arr) && arr.length === 2) {
                    appState.lastSortedFilter = 'year';
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
                loading={!availableDates.length && !dateLoadError}
                disabled={dateLoadError}
            />
            
            {dateLoadError ? (
                <DateLoadError onRetry={initializeDates} />
            ) : (
                message && (
                    <p 
                        id="message" 
                        style={{ 
                            textAlign: 'center', 
                            color: '#6c757d', 
                            padding: '2rem',
                            display: message ? 'block' : 'none'
                        }}
                    >
                        {message}
                    </p>
                )
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
                    onBudgetRangeChange={(range) => {
                        setBudgetRange(range);
                        if (range) {
                            appState.lastSortedFilter = 'budget';
                        }
                    }}
                    onYearRangeChange={(range) => {
                        setYearRange(range);
                        if (Array.isArray(range) && range.length === 2) {
                            appState.lastSortedFilter = 'year';
                        }
                    }}
                />
            )}

            <ActiveFilters 
                activeFilters={activeFilters}
                budgetRange={budgetRange}
                searchQuery={searchQuery}
                data={data}
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