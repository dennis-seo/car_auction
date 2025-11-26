import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import './App.css';
import DateSelector from './components/DateSelector.jsx';
import AuctionLogo from './components/AuctionLogo.jsx';
import DateLoadError from './components/DateLoadError.jsx';
import { initializeFiltersAndOptions, fetchAvailableDates } from './utils/dataUtils';
import { appState } from './utils/appState';
import { API_ENDPOINTS } from './utils/apiConfig';
import auctionManager from './utils/auctionManager';
import { useAppContext } from './contexts/AppContext';

// Lazy Loading으로 코드 스플리팅
const MainSearch = lazy(() => import('./components/MainSearch.jsx'));
const ActiveFilters = lazy(() => import('./components/ActiveFilters.jsx'));
const CarGallery = lazy(() => import('./components/CarGallery.jsx'));
const CarTable = lazy(() => import('./components/CarTable.jsx'));
const ImageModal = lazy(() => import('./components/ImageModal.jsx'));
const DetailsModal = lazy(() => import('./components/DetailsModal.jsx'));
const ErrorBoundaryTest = lazy(() => import('./components/ErrorBoundaryTest.jsx'));

function App() {
    // Context에서 전역 상태 가져오기
    const { allData, setAllData, lastSortedFilter, setLastSortedFilter } = useAppContext();

    // 앱 상태 관리
    const [selectedDate, setSelectedDate] = useState('');
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
            const dates = await fetchAvailableDates();
            setAvailableDates(dates);
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
        console.log(`[App] 날짜 변경 요청: ${selectedDate} → ${date}`);
        setSelectedDate(date);
        
        if (!date) {
            console.log('[App] 빈 날짜 선택, 데이터 초기화');
            setAllData([]);
            appState.allData = []; // 하위 호환성 유지
            auctionManager.reset(); // AuctionManager 초기화
            setMessage('날짜를 선택하면 해당일의 경매 목록을 불러옵니다.');
            setShowMainSearch(false);
            return;
        }

        setMessage(`'${date}'의 경매 데이터를 불러오는 중입니다...`);
        console.log(`[App] API 호출 시작: ${date}`);
        
        // 새 데이터 로드 전 AuctionManager 초기화
        console.log('[App] 새 날짜 데이터 로드 전 AuctionManager 초기화');
        auctionManager.reset();
        
        try {
            // JSON API에서 데이터 가져오기 - 강화된 캐시 방지
            const apiUrl = `${API_ENDPOINTS.auctionsByDate(date)}?_t=${Date.now()}`;
            console.log(`[App] API URL: ${apiUrl}`);
            
            const response = await fetch(apiUrl, { 
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            
            console.log(`[App] API 응답 상태: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
            }
            
            const jsonData = await response.json();
            console.log(`[App] API 응답 데이터:`, {
                date: jsonData.date,
                sourceFile: jsonData.source_filename,
                rowCount: jsonData.row_count,
                itemsLength: jsonData.items?.length,
                sampleItem: jsonData.items?.[0]
            });
            
            // JSON 응답에서 items 배열 추출
            if (jsonData && jsonData.items && Array.isArray(jsonData.items) && jsonData.items.length > 0) {
                const newData = jsonData.items;
                console.log(`[App] 새 데이터 설정: ${newData.length}개 차량`);

                // 상태 업데이트
                setAllData(newData);
                appState.allData = newData; // 하위 호환성 유지

                console.log('[App] 필터 및 옵션 초기화 시작');
                initializeFiltersAndOptions(newData);
                
                // 모든 필터 초기화
                setActiveFilters({
                    title: [], model: [], submodel: [], price: [], km: [], fuel: [], auction_name: [], region: [], year: []
                });
                setSearchQuery('');
                setBudgetRange(null);
                setYearRange(null);
                setMessage('');
                setShowMainSearch(true);

                // 상세 로그 출력
                console.log(`[App] 데이터 로드 완료:`);
                console.log(`  - 날짜: ${jsonData.date || date}`);
                console.log(`  - 소스 파일: ${jsonData.source_filename || '알 수 없음'}`);
                console.log(`  - 총 행 수: ${jsonData.row_count || newData.length}`);
                console.log(`  - 실제 아이템 수: ${newData.length}`);
                console.log(`  - 첫 번째 차량:`, newData[0]);
                console.log('  - 경매장별 정보:', auctionManager.getVehicleCountsByAuction());
                console.log('  - 필터 모드:', auctionManager.getFilterMode());
                console.log('[App] 컴포넌트 상태 업데이트 완료');
            } else {
                console.warn('[App] 데이터 없음 또는 빈 응답:', jsonData);
                setAllData([]);
                appState.allData = []; // 하위 호환성 유지
                auctionManager.reset(); // 빈 데이터 시 AuctionManager 초기화
                setMessage(`데이터가 없거나 파일을 찾을 수 없습니다. (날짜: ${date})`);
                setShowMainSearch(false);
            }
        } catch (error) {
            console.error('[App] 데이터 로드 오류:', error);
            setAllData([]);
            appState.allData = []; // 하위 호환성 유지
            auctionManager.reset(); // 오류 시 AuctionManager 초기화
            setMessage(`오류: '${date}' 날짜의 데이터를 읽을 수 없습니다. 잠시 후 다시 시도해주세요.`);
            setShowMainSearch(false);
        }
    }, [selectedDate, setAllData]);

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
                    setLastSortedFilter('year');
                }
            }

            return newFilters;
        });
    }, [setLastSortedFilter]);

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
            <AuctionLogo data={allData} />

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

            <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</div>}>
                {showMainSearch && (
                    <MainSearch
                    data={allData}
                    activeFilters={activeFilters}
                    searchQuery={searchQuery}
                    budgetRange={budgetRange}
                    yearRange={yearRange}
                    onUpdateFilter={updateFilter}
                    onSearchQueryChange={setSearchQuery}
                    onBudgetRangeChange={(range) => {
                        setBudgetRange(range);
                        if (range) {
                            setLastSortedFilter('budget');
                        }
                    }}
                    onYearRangeChange={(range) => {
                        setYearRange(range);
                        if (Array.isArray(range) && range.length === 2) {
                            setLastSortedFilter('year');
                        }
                    }}
                />
            )}

            <ActiveFilters
                activeFilters={activeFilters}
                budgetRange={budgetRange}
                searchQuery={searchQuery}
                data={allData}
                onRemoveFilter={updateFilter}
                onRemoveBudgetRange={() => setBudgetRange(null)}
                onRemoveSearchQuery={handleRemoveSearchQuery}
            />

            <CarGallery
                data={allData}
                activeFilters={activeFilters}
                searchQuery={searchQuery}
                budgetRange={budgetRange}
                yearRange={yearRange}
                lastSortedFilter={lastSortedFilter}
                onImageClick={showImageModalHandler}
                onDetailsClick={showDetailsModalHandler}
            />

            <CarTable
                data={allData}
                activeFilters={activeFilters}
                searchQuery={searchQuery}
                budgetRange={budgetRange}
                yearRange={yearRange}
                lastSortedFilter={lastSortedFilter}
                onImageClick={showImageModalHandler}
                onDetailsClick={showDetailsModalHandler}
                onUpdateFilter={updateFilter}
                showTable={!!selectedDate && allData.length > 0}
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

                <ErrorBoundaryTest />
            </Suspense>
        </div>
    );
}

export default App;