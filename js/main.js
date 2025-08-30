import { 
    appState, 
    columnMapping,
    mileageRanges,
    priceRanges,
    initializeFiltersAndOptions,
    fetchAvailableDates
} from './utils.js';

// 제조사 목록은 외부 JSON에서 지연 로드합니다(캐시 포함)
let cachedBrandList = null;
async function loadBrandList() {
    if (cachedBrandList) return cachedBrandList;
    try {
        const res = await fetch('data/search_tree.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error(`search_tree.json fetch failed: ${res.status}`);
        const json = await res.json();
        
        // search_tree.json 구조에서 브랜드 목록 추출
        const domestic = json.domestic?.map(brand => brand.label) || [];
        const import_brands = json.import?.map(brand => brand.label) || [];
        
        cachedBrandList = { domestic, import: import_brands };
        return cachedBrandList;
    } catch (err) {
        console.error('[브랜드 목록 로드 실패]', err);
        // 최소한의 안전한 기본값
        cachedBrandList = { domestic: [], import: [] };
        return cachedBrandList;
    }
}

// 모델 목록은 search_tree.json에서 지연 로드합니다(캐시 포함)
let cachedSearchTree = null;
async function loadSearchTree() {
    if (cachedSearchTree) return cachedSearchTree;
    try {
        const res = await fetch('data/search_tree.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error(`search_tree.json fetch failed: ${res.status}`);
        const json = await res.json();
        cachedSearchTree = json;
        return cachedSearchTree;
    } catch (err) {
        console.error('[검색 트리 로드 실패]', err);
        cachedSearchTree = { domestic: [], import: [] };
        return cachedSearchTree;
    }
}

// 한글 브랜드명에서 해당 브랜드 정보 찾기
function findBrandByLabel(brandLabel) {
    if (!cachedSearchTree) return null;
    
    // domestic과 import 배열에서 브랜드 찾기
    const allBrands = [...(cachedSearchTree.domestic || []), ...(cachedSearchTree.import || [])];
    return allBrands.find(brand => brand.label === brandLabel);
}

// --- UI 관련 DOM 요소 캐싱 ---
const DOM = {
    dateSelector: document.getElementById('date-selector'),
    carTable: document.getElementById('car-table'),
    tableHead: document.querySelector('#car-table thead tr'),
    tableBody: document.querySelector('#car-table tbody'),
    messageEl: document.getElementById('message'),
    imageModal: document.getElementById('image-modal'),
    modalImage: document.getElementById('modal-image'),
    modalClose: document.querySelector('.modal-close'),
    detailsModal: document.getElementById('details-modal'),
    detailsModalContent: document.getElementById('details-modal-content'),
    detailsModalClose: document.querySelector('.details-close'),
    activeFiltersBar: document.getElementById('active-filters'),
    auctionLogoContainer: document.getElementById('auction-logo-container'),
    mainSearchContainer: document.querySelector('.main-search-container'),
    searchInput: document.querySelector('.input-area input'),
    searchButton: document.querySelector('.btn-search-submit button'),
    // 경매장 이름과 로고 이미지 경로 매핑
    logoMap: {
        "현대 경매장": "images/hyundai_glovis.png",
        "롯데 경매장": "images/lotte_auto_auction.png",
        "오토허브 경매장": "images/auto_hub_auction.png",
        "SK렌터카 경매장": "images/sk_rent.png"
    }
};

/**
 * yymmdd 형식으로 날짜 문자열을 정규화합니다.
 * - 입력 예: '250809', '2025.08.09', '2025-08-09', '20250809'
 */
function normalizeDateToYYMMDD(input) {
    if (!input) return '';
    const str = String(input).trim();
    // 이미 yymmdd 형식
    if (/^\d{6}$/.test(str)) return str;
    // yyyymmdd -> yymmdd
    if (/^\d{8}$/.test(str)) return str.slice(2);
    // yyyy.mm.dd 또는 yyyy-mm-dd
    const m = str.match(/^(\d{4})[.-](\d{2})[.-](\d{2})$/);
    if (m) {
        const yy = m[1].slice(2);
        const mm = m[2];
        const dd = m[3];
        return `${yy}${mm}${dd}`;
    }
    // 기타 형식은 숫자만 추출해 6자리/8자리 처리
    const digits = str.replace(/\D/g, '');
    if (digits.length === 8) return digits.slice(2);
    if (digits.length === 6) return digits;
    return str; // 실패 시 원본문자열 반환
}

/**
 * yymmdd 또는 yyyymmdd를 표시용 'yy년 mm월 dd일'로 변환합니다.
 */
function formatYYMMDDToLabel(input) {
    if (!input) return '';
    const str = String(input).trim();
    const digits = str.replace(/\D/g, '');
    let yy, mm, dd;
    if (digits.length === 6) {
        yy = digits.slice(0, 2);
        mm = digits.slice(2, 4);
        dd = digits.slice(4, 6);
    } else if (digits.length === 8) {
        yy = digits.slice(2, 4);
        mm = digits.slice(4, 6);
        dd = digits.slice(6, 8);
    } else {
        return str;
    }
    return `${yy}년 ${mm}월 ${dd}일`;
}

/**
 * 앱 초기화: 날짜 목록을 불러와 드롭다운을 설정하고 이벤트 리스너를 연결합니다.
 */
async function initialize() {
    try {
        // 검색 트리 데이터 미리 로드
        await loadSearchTree();
        await fetchAvailableDates();
        populateDateSelector();
    } catch (error) {
        DOM.messageEl.textContent = '경매 날짜 목록을 불러오는 데 실패했습니다.';
        console.error(error);
    }
    
    DOM.dateSelector.addEventListener('change', (e) => loadDataForDate(e.target.value));
    
    DOM.tableBody.addEventListener('click', (e) => {
        const clickableTitle = e.target.closest('.title-clickable');
        if (clickableTitle) {
            const imageUrl = clickableTitle.dataset.imageUrl;
            if (imageUrl) showImageModal(imageUrl);
            else alert('표시할 이미지가 없습니다.');
        }
    });

    DOM.modalClose.onclick = hideImageModal;
    DOM.imageModal.onclick = (e) => {
        if (e.target === DOM.imageModal) hideImageModal();
    };

    DOM.tableBody.addEventListener('click', (e) => {
        const clickableTitle = e.target.closest('.title-clickable');
        const clickableSellNumber = e.target.closest('.sell-number-clickable');

        if (clickableTitle) {
            const imageUrl = clickableTitle.dataset.imageUrl;
            if (imageUrl) showImageModal(imageUrl);
            else alert('표시할 이미지가 없습니다.');
        }
        else if (clickableSellNumber) {
            const sellNumber = clickableSellNumber.dataset.sellNumber;
            const rowData = appState.allData.find(row => row.sell_number === sellNumber);
            if (rowData) showDetailsModal(rowData);
            else alert('해당 출품번호의 정보를 찾을 수 없습니다.');
        }
    });

    DOM.detailsModalClose.onclick = hideDetailsModal;
    DOM.detailsModal.onclick = (e) => {
        if (e.target === DOM.detailsModal) hideDetailsModal();
    };
    
    window.addEventListener('click', (e) => {
        const isPopup = e.target.closest('.filter-popup');
        const isHeader = e.target.closest('.filterable-header');
        const isSelectDropdown = e.target.closest('.select-dropdown');
        const isBrandSelect = e.target.closest('#brand-select');
        const isModelSelect = e.target.closest('#model-select');
        const isSubmodelSelect = e.target.closest('#submodel-select');
        
        // 필터 관련 요소나 드롭다운 내부를 클릭한 경우가 아니면 모든 드롭다운 닫기
        if (!isPopup && !isHeader && !isSelectDropdown && !isBrandSelect && !isModelSelect && !isSubmodelSelect) {
            // 테이블 헤더의 필터 팝업 닫기
            document.querySelectorAll('.filter-popup').forEach(popup => {
                popup.classList.remove('active');
                popup.addEventListener('transitionend', function onEnd() {
                    popup.removeEventListener('transitionend', onEnd);
                    if (popup.parentNode) popup.parentNode.removeChild(popup);
                });
            });
            
            // 메인 필터 드롭다운들 닫기
            closeBrandDropdown();
            closeModelDropdown();
            closeSubmodelDropdown();
        }
    });
    
    // ESC 키를 눌렀을 때 모든 드롭다운과 팝업 닫기
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // 모든 필터 팝업 닫기
            document.querySelectorAll('.filter-popup').forEach(popup => {
                popup.classList.remove('active');
                popup.addEventListener('transitionend', function onEnd() {
                    popup.removeEventListener('transitionend', onEnd);
                    if (popup.parentNode) popup.parentNode.removeChild(popup);
                });
            });
            
            // 메인 필터 드롭다운들 닫기
            closeBrandDropdown();
            closeModelDropdown();
            closeSubmodelDropdown();
        }
    });
    
    setupBrandDropdown();
    setupModelSelect();
    setupSubmodelSelect();
    setupBudgetSlider();

    // 검색 이벤트: 버튼 클릭 및 Enter 입력
    if (DOM.searchButton) {
        DOM.searchButton.addEventListener('click', () => applySearchQuery());
    }
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applySearchQuery();
            }
        });
        // 입력이 비워지면 즉시 해제
        DOM.searchInput.addEventListener('input', () => {
            const val = (DOM.searchInput.value || '').trim();
            if (val === '' && appState.searchQuery !== '') {
                appState.searchQuery = '';
                render();
            }
        });
    }
    
    // 필터 검색 버튼 이벤트 추가
    const filterSearchBtn = document.querySelector('.filter-search-btn');
    if (filterSearchBtn) {
        filterSearchBtn.addEventListener('click', () => {
            // 현재 선택된 필터들로 검색 실행
            render();
        });
    }
}

/**
 * 가져온 날짜 목록으로 드롭다운 메뉴를 채웁니다.
 */
function populateDateSelector() {
    appState.availableDates.forEach(date => {
        const option = document.createElement('option');
        option.value = date; // yymmdd 값 유지
        option.textContent = formatYYMMDDToLabel(date); // 표시: 'yy년 mm월 dd일'
        DOM.dateSelector.appendChild(option);
    });
}

/**
 * 선택된 날짜에 해당하는 CSV 데이터를 불러옵니다.
 */
function loadDataForDate(date) {
    if (!date) {
        DOM.carTable.style.display = 'none';
        DOM.messageEl.textContent = '날짜를 선택하면 해당일의 경매 목록을 불러옵니다.';
        DOM.messageEl.style.display = 'block';
        if (DOM.mainSearchContainer) DOM.mainSearchContainer.style.display = 'none';
        return;
    }
    
    // 다양한 입력 포맷을 yymmdd로 정규화
    const yymmdd = normalizeDateToYYMMDD(date);
    
    // 파일명 형식: sources/auction_data_yymmdd.csv
    const filePath = `sources/auction_data_${yymmdd}.csv`;

    DOM.messageEl.textContent = `'${yymmdd}'의 경매 데이터를 불러오는 중입니다...`;
    DOM.messageEl.style.display = 'block';
    DOM.carTable.style.display = 'none';
    DOM.tableBody.innerHTML = ''; // 이전 데이터 삭제

    Papa.parse(filePath, {
        download: true, // URL로 파일 다운로드
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data && results.data.length > 0) {
                appState.allData = results.data;
                initializeFiltersAndOptions();
                buildAndAttachHeader();
                updateAuctionTitle(yymmdd);
                renderAuctionLogos();
                render();
                
                DOM.messageEl.style.display = 'none';
                DOM.carTable.style.display = 'table';
            } else {
                DOM.messageEl.textContent = `데이터가 없거나 파일을 찾을 수 없습니다. (경로: ${filePath})`;
            }
        },
        error: function(error) {
            console.error("파일 파싱 오류:", error);
            DOM.messageEl.textContent = `오류: '${filePath}' 파일을 읽을 수 없습니다. 파일이 정확한 위치에 있는지 확인해주세요.`;
        }
    });
    if (DOM.mainSearchContainer) DOM.mainSearchContainer.style.display = 'block';
}

/**
 * 데이터에 포함된 경매장 로고를 제목 아래에 표시합니다.
 */
function renderAuctionLogos() {
    const container = DOM.auctionLogoContainer;
    if (!container) return;
    
    container.innerHTML = '';
    const uniqueAuctionNames = [...new Set(appState.allData.map(row => row.auction_name).filter(Boolean))];
    
    uniqueAuctionNames.forEach(name => {
        const logoFileName = DOM.logoMap[name];
        if (logoFileName) {
            const img = document.createElement('img');
            img.src = logoFileName;
            img.alt = `${name} 로고`;
            container.appendChild(img);
        }
    });
}

/**
 * 테이블 헤더를 생성하고 이벤트 리스너를 연결합니다.
 */
function buildAndAttachHeader() {
    DOM.tableHead.innerHTML = '';
    Object.keys(columnMapping).forEach(key => {
        const th = document.createElement('th');
        th.dataset.filterKey = key;
        th.innerHTML = columnMapping[key];
        if (["fuel", "title", "km", "price"].includes(key)) {
            th.classList.add('filterable-header');
            th.innerHTML += ' <span class="arrow">▼</span>';
            th.addEventListener('click', (e) => {
                e.stopPropagation();
                let options, filterType;
                if (key === 'fuel') { options = appState.fuelTypes; filterType = 'fuel'; }
                if (key === 'title') { options = appState.carBrands; filterType = 'title'; }
                if (key === 'km') { options = Object.keys(mileageRanges); filterType = 'km'; }
                if (key === 'price') { options = Object.keys(priceRanges); filterType = 'price'; }
                toggleFilterPopup_multi(th, options, filterType);
            });
        } else if (key === 'year') {
            th.classList.add('filterable-header');
            th.innerHTML += ' <span class="arrow">▼</span>';
            th.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleYearSliderPopup(th);
            });
        }
        DOM.tableHead.appendChild(th);
    });
}

/**
 * 현재 활성화된 필터를 적용하고 결과를 렌더링합니다.
 */
function render() {
    let filteredData = appState.allData.filter(row => {
        // ... 기존 필터링 ...
        // year 필터
        if (Array.isArray(appState.activeFilters.year) && appState.activeFilters.year.length === 2) {
            const year = parseInt(row.year, 10);
            const [minYear, maxYear] = appState.activeFilters.year;
            if(isNaN(year) || year < minYear || year > maxYear) return false;
        }
        // 제조사(차종)
        const titleArr = appState.activeFilters.title || [];
        const brandMatch = titleArr.length === 0
            || (row.title && titleArr.some(val => row.title.includes(`[${val}]`)));
        // 모델
        const modelArr = appState.activeFilters.model || [];
        const modelMatch = modelArr.length === 0
            || (row.title && modelArr.some(val => row.title.includes(val)));
        // 세부 트림
        const submodelArr = appState.activeFilters.submodel || [];
        const submodelMatch = submodelArr.length === 0
            || (row.title && submodelArr.some(val => {
                // 선택된 트림명에서 괄호와 괄호 안의 내용 제거
                const cleanTrimName = val.replace(/\s*\([^)]*\)\s*/g, '').trim();
                console.log(`[세부트림 필터링] 원본: "${val}" → 정리된 이름: "${cleanTrimName}"`);
                // 차량 제목에서 괄호 제거된 트림명이 포함되어 있는지 확인
                const isMatch = row.title.includes(cleanTrimName);
                if (isMatch) {
                    console.log(`[세부트림 매칭 성공] 차량: "${row.title}" ↔ 트림: "${cleanTrimName}"`);
                }
                return isMatch;
            }));
        // 자유 검색어(차종 제목 내 포함 여부, 대소문자 무시)
        const query = (appState.searchQuery || '').toLowerCase();
        const searchMatch = query === ''
            || (row.title && String(row.title).toLowerCase().includes(query));
        // 연료
        const fuelArr = appState.activeFilters.fuel || [];
        const fuelMatch = fuelArr.length === 0 || fuelArr.includes(row.fuel);
        // 주행거리
        let kmArr = appState.activeFilters.km || [];
        let kmMatch = true;
        if (kmArr.length > 0) {
            const kmValue = parseInt(row.km, 10); // 필드 값
            // 배열 내 하나라도 일치하면 true
            kmMatch = kmArr.some(rangeKey => {
                const range = mileageRanges[rangeKey].split('-');
                const min = parseInt(range[0], 10);
                const max = range[1] === 'Infinity' ? Infinity : parseInt(range[1], 10);
                return !isNaN(kmValue) && kmValue >= min && kmValue < max;
            });
        }
        // 가격
        let priceArr = appState.activeFilters.price || [];
        let priceMatch = true;
        if (priceArr.length > 0) {
            const priceValue = parseInt(row.price, 10);
            priceMatch = priceArr.some(rangeKey => {
                const range = priceRanges[rangeKey].split('-');
                const min = parseInt(range[0], 10);
                const max = range[1] === 'Infinity' ? Infinity : parseInt(range[1], 10);
                return !isNaN(priceValue) && (max === Infinity ? priceValue >= min : (priceValue >= min && priceValue < max));
            });
        }
        // 예산 필터링
        if (appState.budgetRange) {
            const budgetMin = appState.budgetRange.min;
            const budgetMax = appState.budgetRange.max;
            const priceValue = parseInt(row.price, 10);
            if (isNaN(priceValue) || priceValue < budgetMin || (budgetMax !== Infinity && priceValue > budgetMax)) {
                return false;
            }
        }
        return brandMatch && modelMatch && submodelMatch && searchMatch && fuelMatch && kmMatch && priceMatch;
    });
    // 정렬 로직 (마지막 필터 기준)
    const priceArr = appState.activeFilters.price || [];
    const kmArr = appState.activeFilters.km || [];
    if (priceArr.length > 0 && kmArr.length > 0 && appState.lastSortedFilter) {
        filteredData = filteredData.slice();
        if (appState.lastSortedFilter === 'price') {
            filteredData.sort((a, b) => (parseInt(a.price, 10) || 0) - (parseInt(b.price, 10) || 0));
        } else if (appState.lastSortedFilter === 'km') {
            filteredData.sort((a, b) => (parseInt(a.km, 10) || 0) - (parseInt(b.km, 10) || 0));
        }
    } else if (priceArr.length > 0) {
        filteredData = filteredData.slice().sort((a, b) => (parseInt(a.price, 10) || 0) - (parseInt(b.price, 10) || 0));
    } else if (kmArr.length > 0) {
        filteredData = filteredData.slice().sort((a, b) => (parseInt(a.km, 10) || 0) - (parseInt(b.km, 10) || 0));
    }
    renderActiveFilterPills_multi();
    if (filteredData.length === 0) {
        DOM.tableBody.innerHTML = `<tr><td colspan="${Object.keys(columnMapping).length}" style="padding: 2rem; text-align: center;">검색 결과가 없습니다. 다른 필터 조건을 선택해주세요.</td></tr>`;
    } else {
        displayTableBody(filteredData);
    }
    renderCarGalleryCardList(filteredData);
    DOM.carTable.style.display = 'table';
    // 메인 필터 라벨 동기화(브랜드)
    updateMainFilterLabels();
}

function renderCarGalleryCardList(filteredData) {
    const gallery = document.getElementById('car-list-gallery');
    if (!gallery) return;

    if (!filteredData || filteredData.length === 0) {
        gallery.innerHTML = '';
        return;
    }

    gallery.innerHTML = filteredData.map(row => {
        const imgUrl = row.image || '';
        const price = row.price ? parseInt(row.price, 10).toLocaleString('ko-KR') : '-';
        const title = row.title || '-';
        const auctionName = row.auction_name || '';
        const subtitle = row.subtitle || '';
        const infoArr = [];
        if (row.year)        infoArr.push(row.year);
        if (row.km)          infoArr.push(`${parseInt(row.km,10).toLocaleString()}km`);
        if (row.fuel)        infoArr.push(row.fuel);
        if (row.region)      infoArr.push(row.region);
        const meta = infoArr.join('  |  ');

        // Extra actions (관심차량 / 비교 등은 아이콘 또는 텍스트 대체)
        return `<div class="car-list-item-card">
            <img class="car-list-card-image" src="${imgUrl}" onerror="this.src='images/no_car_image.png'" alt="차량 이미지">
            <div class="car-list-card-details">
                ${auctionName ? `<div class="car-list-card-auction">${auctionName}</div>` : ''}
                ${subtitle ? `<div class="car-list-card-subtitle">${subtitle}</div>` : ''}
                <div class="car-list-card-title">${title}</div>
                <div class="car-list-card-meta">${meta}</div>
                <div class="car-list-card-actions">
                    <button class="car-list-card-action" tabindex="-1" aria-label="관심차량"><span class="icon">&#9825;</span>관심차량</button>
                    <button class="car-list-card-action" tabindex="-1" aria-label="차량비교"><span class="icon">VS</span>차량비교</button>
                </div>
            </div>
            <div class="car-list-card-price">
                ${price}<span class="car-list-card-price-label">만원</span>
            </div>
        </div>`;
    }).join('');
}

/**
 * 테이블 본문 내용을 생성하고 표시합니다.
 */
function displayTableBody(data) {
    DOM.tableBody.innerHTML = data.map(row => {
        const cells = Object.keys(columnMapping).map(key => {
            let content = row[key] || '-';
            const className = ['fuel-column', 'price-column', 'km-column', 'title-column'].find(c => c.startsWith(key)) || '';

            if (key === 'sell_number') {
                return `<td class="${className} sell-number-clickable" data-sell-number="${content}">${content}</td>`;
            }
            if (key === 'details') {
                return `<td class="details-cell"><div class="details-grid">
                    <div class="detail-item-label">차량<br>번호</div><div class="detail-item-value">${row.car_number || '-'}</div>
                    <div class="detail-item-label">점수</div><div class="detail-item-value">${row.score || '-'}</div>
                </div></td>`;
            }
            if (key === 'km' && !isNaN(parseInt(row.km, 10))) {
                content = `${parseInt(row.km, 10).toLocaleString('ko-KR')} km`;
            }
            if (key === 'title' && row.image) {
                return `<td class="${className} title-clickable" data-image-url="${row.image}">${content}</td>`;
            }
            return `<td class="${className}">${content}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
    }).join('');
}

/**
 * 다중 선택 팝업 토글
 */
function toggleFilterPopup_multi(thElement, options, filterType) {
    const existingPopup = thElement.querySelector('.filter-popup');
    if (existingPopup) {
        // 같은 th에 popup이 열려 있다면 트랜지션 닫기
        existingPopup.classList.remove('active');
        existingPopup.addEventListener('transitionend', function onEnd() {
            existingPopup.removeEventListener('transitionend', onEnd);
            if (existingPopup.parentNode) existingPopup.parentNode.removeChild(existingPopup);
        });
        return;
    }
    // 다른 팝업과 드롭다운들 즉시 제거한다.
    closeAllPopups();
    closeBrandDropdown();
    closeModelDropdown();
    closeSubmodelDropdown();

    const popup = document.createElement('div');
    popup.className = 'filter-popup';
    // 전체 옵션
    const allOption = document.createElement('a');
    allOption.className = 'filter-option';
    allOption.textContent = '전체';
    allOption.onclick = () => {
        updateAndApplyFilters_multi(filterType, 'all');
    };
    popup.appendChild(allOption);
    // 이하 직접 값들(체크/선택 표시)
    options.forEach(optionValue => {
        const option = document.createElement('a');
        option.className = 'filter-option';
        option.textContent = optionValue;
        // 선택표시:
        if ((appState.activeFilters[filterType] || []).includes(optionValue)) {
            option.style.fontWeight = 'bold';
            option.style.background = '#e7f5ff';
        }
        option.onclick = () => {
            updateAndApplyFilters_multi(filterType, optionValue);
        };
        popup.appendChild(option);
    });
    thElement.appendChild(popup);
    // filter-popup이 보여질 때 .active를 추가하여 트랜지션 적용
    setTimeout(() => popup.classList.add('active'), 10);
}

/**
 * 다중 선택 필터 업데이트 함수
 */
function updateAndApplyFilters_multi(filterType, value) {
    let selectedArr = appState.activeFilters[filterType];
    if (value === 'all') {
        appState.activeFilters[filterType] = [];
        if (["price", "km"].includes(filterType)) {
            // 전체 해제 시 정렬도 없앰
            const other = filterType === 'price' ? 'km':'price';
            if ((appState.activeFilters[other]||[]).length > 0) appState.lastSortedFilter = other;
            else appState.lastSortedFilter = null;
        }
    } else {
        if (!selectedArr) selectedArr = [];
        // toggle: 있으면 제거, 없으면 추가
        if (selectedArr.includes(value)) {
            selectedArr = selectedArr.filter(v => v !== value);
        } else {
            selectedArr = [...selectedArr, value];
        }
        appState.activeFilters[filterType] = selectedArr;
        if (["price", "km"].includes(filterType)) {
            if (selectedArr.length > 0) appState.lastSortedFilter = filterType;
        }
        // 전체 상태면 null로
        if (["price","km"].includes(filterType) && selectedArr.length === 0) {
            const other = filterType === 'price' ? 'km':'price';
            if ((appState.activeFilters[other]||[]).length > 0) appState.lastSortedFilter = other;
            else appState.lastSortedFilter = null;
        }
    }
    render();
    closeAllPopups();
}

const FILTER_LABELS = {
    title: '차종',
    model: '모델',
    submodel: '세부모델',
    fuel: '연료',
    km: '주행거리',
    price: '가격'
};

// --- 필터 정렬 기록 변수 추가 ---
if (!('lastSortedFilter' in appState)) appState.lastSortedFilter = null;

/**
 * 각 값별 al-pill 표시 및 X로 삭제 기능 추가
 */
function renderActiveFilterPills_multi() {
    const bar = DOM.activeFiltersBar;
    bar.innerHTML = '';
    Object.keys(appState.activeFilters).forEach(key => {
        if(key === 'year') {
            const v = appState.activeFilters.year;
            if(Array.isArray(v) && v.length === 2) {
                const pill = document.createElement('span');
                pill.className = 'filter-pill';
                pill.innerHTML = `<span class="filter-pill-label">연식</span><span class="filter-pill-value">${v[0]} ~ ${v[1]}</span>`;
                const closeBtn = document.createElement('button');
                closeBtn.className = 'filter-pill-remove';
                closeBtn.type = 'button';
                closeBtn.setAttribute('aria-label', '필터 제거');
                closeBtn.innerHTML = '×';
                closeBtn.onclick = () => {
                    appState.activeFilters.year = [];
                    render();
                }
                pill.appendChild(closeBtn);
                bar.appendChild(pill);
            }
            return;
        }
        // ... 나머지는 기존대로 ...
        const values = appState.activeFilters[key] || [];
        values.forEach(val => {
            const pill = document.createElement('span');
            pill.className = 'filter-pill';
            pill.innerHTML = `<span class="filter-pill-label">${FILTER_LABELS[key]}</span><span class="filter-pill-value">${val}</span>`;
            const closeBtn = document.createElement('button');
            closeBtn.className = 'filter-pill-remove';
            closeBtn.type = 'button';
            closeBtn.setAttribute('aria-label', '필터 제거');
            closeBtn.innerHTML = '×';
            closeBtn.onclick = () => {
                // 한 값만 제거, 배열에서 삭제
                appState.activeFilters[key] = (appState.activeFilters[key]||[]).filter(v => v !== val);
                // 정렬 기준 업데이트
                if (["price","km"].includes(key)) {
                    if ((appState.activeFilters[key]||[]).length === 0) {
                        // 해당 정렬기준 없앰
                        const other = key === 'price' ? 'km':'price';
                        if ((appState.activeFilters[other]||[]).length > 0) appState.lastSortedFilter = other;
                        else appState.lastSortedFilter = null;
                    } // else, 마지막 삭제가 이 필드였음을 유지
                }
                // 모델 제거 시 라벨 업데이트
                if (key === 'model' && (appState.activeFilters.model||[]).length === 0) {
                    const modelBox = document.getElementById('model-select');
                    const label = modelBox?.querySelector('.car-select-label');
                    if (label) label.textContent = '모델';
                }
                render();
            };
            pill.appendChild(closeBtn);
            bar.appendChild(pill);
        });
    });
    
    // 예산 범위 필터 pill 추가
    if (appState.budgetRange) {
        const { min, max } = appState.budgetRange;
        const minLabel = min === 0 ? '0원' : `${min.toLocaleString()}만원`;
        const maxLabel = max === Infinity ? '3,000만원이상' : `${max.toLocaleString()}만원`;
        
        const pill = document.createElement('span');
        pill.className = 'filter-pill';
        pill.innerHTML = `<span class="filter-pill-label">예산</span><span class="filter-pill-value">${minLabel} ~ ${maxLabel}</span>`;
        const closeBtn = document.createElement('button');
        closeBtn.className = 'filter-pill-remove';
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', '필터 제거');
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => {
            appState.budgetRange = null;
            // 슬라이더도 초기 상태로 리셋
            const slider = $('#budget-range-slider').data('ionRangeSlider');
            if (slider) {
                slider.reset();
            }
            const budgetText = document.getElementById('budget-range-text');
            if (budgetText) {
                budgetText.textContent = '최소~최대 예산 구간 모든 차량';
            }
            render();
        };
        pill.appendChild(closeBtn);
        bar.appendChild(pill);
    }
}

function toggleYearSliderPopup(thElement) {
    const existingPopup = thElement.querySelector('.filter-popup');
    if (existingPopup) {
        existingPopup.classList.remove('active');
        existingPopup.addEventListener('transitionend', function onEnd() {
            existingPopup.removeEventListener('transitionend', onEnd);
            if (existingPopup.parentNode) existingPopup.parentNode.removeChild(existingPopup);
        });
        return;
    }
    closeAllPopups();
    closeBrandDropdown();
    closeModelDropdown();
    closeSubmodelDropdown();
    
    const popup = document.createElement('div');
    popup.className = 'filter-popup';
    const min = appState.yearMin;
    const max = appState.yearMax;
    let curMin = min, curMax = max;
    if (Array.isArray(appState.activeFilters.year) && appState.activeFilters.year.length === 2) {
        curMin = appState.activeFilters.year[0];
        curMax = appState.activeFilters.year[1];
    }
    console.log('[연식 슬라이더 생성]', 'min:', min, 'max:', max, 'curMin:', curMin, 'curMax:', curMax);
    if (isNaN(min) || isNaN(max) || isNaN(curMin) || isNaN(curMax)) {
        console.warn('[경고] 연식 슬라이더 값이 비정상(min, max, from, to). 데이터를 확인하세요');
    }
    popup.innerHTML = `
        <div style='padding: 14px 18px 15px 18px; min-width:230px;'>
            <div style='margin-bottom:12px;font-weight:500;'>연식 범위: <span id='year-range-display'>${curMin} ~ ${curMax}</span></div>
            <input id='year-ion-slider' type='text' />
            <button id='year-reset' style='margin-top:16px; width:100%; border-radius:10px; border:1px solid #ccc; background:#f4f6fa; font-weight:500; cursor:pointer;'>전체</button>
        </div>
    `;
    thElement.appendChild(popup);
    // filter-popup이 보여질 때 .active를 추가하여 트랜지션 적용
    setTimeout(() => popup.classList.add('active'), 10);
    // ionRangeSlider 초기화(jQuery 기반)
    $(function() {
        $('#year-ion-slider').ionRangeSlider({
            type: 'double',
            min: min,
            max: max,
            from: curMin,
            to: curMax,
            grid: true,
            prettify: function(num) { return num + '년'; },
            onStart: function(data) {
                popup.querySelector('#year-range-display').textContent = `${data.from} ~ ${data.to}`;
            },
            onChange: function(data) {
                popup.querySelector('#year-range-display').textContent = `${data.from} ~ ${data.to}`;
                // 전체 구간이면 전체(빈 배열), 아니면 min~max
                if (data.from == min && data.to == max) {
                    appState.activeFilters.year = [];
                } else {
                    appState.activeFilters.year = [data.from, data.to];
                }
                render();
            }
        });
    });
    // 전체(리셋) 버튼
    popup.querySelector('#year-reset').onclick = () => {
        const slider = $('#year-ion-slider').data('ionRangeSlider');
        slider.update({ from: min, to: max });
        popup.querySelector('#year-range-display').textContent = `${min} ~ ${max}`;
        appState.activeFilters.year = [];
        render();
    };
}

function updateHeaderAppearance() {} // 더 이상 사용하지 않음

function closeAllPopups() {
    document.querySelectorAll('.filter-popup').forEach(p => p.remove());
}

function showImageModal(imageUrl) {
    DOM.modalImage.src = imageUrl;
    DOM.imageModal.style.display = 'flex';
}

function hideImageModal() {
    DOM.imageModal.style.display = 'none';
}

/**
 * 페이지 제목을 선택된 경매 날짜로 업데이트합니다.
 */
function updateAuctionTitle(date) {
    const h1Element = document.querySelector('h1');
    const uniqueAuctionNames = [...new Set(appState.allData.map(row => row.auction_name).filter(Boolean))];
    
    if (uniqueAuctionNames.length > 0) {
        h1Element.textContent = `차량 경매 정보 (${uniqueAuctionNames.join(', ')})`;
    }
}

/** 상세 정보 모달을 보여주는 함수 */
function showDetailsModal(data) {
    const { sell_number, title, year, km, color, fuel, car_number, price, auction_name, score } = data;
    const infoString = [year, km ? `${parseInt(km, 10).toLocaleString('ko-KR')}km` : null, color, fuel, car_number].filter(Boolean).join(' | ');
    
    DOM.detailsModalContent.innerHTML = `
        <div class="details-modal-header">
            <span class="details-modal-sell-number">출품번호 ${sell_number}</span>
            <h2 class="details-modal-title">${title || '-'}</h2>
            <p class="details-modal-info">${infoString}</p>
        </div>
        <div class="details-modal-body">
            <p class="details-modal-price">시작가 ${price ? parseInt(price, 10).toLocaleString('ko-KR') : '-'} 만원</p>
            <p>경매장: ${auction_name || '-'}</p>
            <p>평가점수: ${score || '-'}</p>
        </div>
    `;
    
    DOM.detailsModal.style.display = 'flex';
}

/** 상세 정보 모달을 숨기는 함수 */
function hideDetailsModal() {
    DOM.detailsModal.style.display = 'none';
}

// --- 메인 검색영역 - 제조사 드롭다운 구성 ---
function setupBrandDropdown() {
    const box = document.getElementById('brand-select');
    if (!box) return;
    box.setAttribute('role', 'button');
    box.setAttribute('tabindex', '0');
    box.setAttribute('aria-haspopup', 'listbox');
    box.setAttribute('aria-expanded', 'false');
    box.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBrandDropdown();
    });
    box.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleBrandDropdown();
        }
    });
}

async function toggleBrandDropdown() {
    const box = document.getElementById('brand-select');
    let dropdown = box.querySelector('.select-dropdown');
    if (dropdown) {
        closeBrandDropdown();
        return;
    }
    // 다른 드롭다운들 먼저 닫기
    closeModelDropdown();
    closeSubmodelDropdown();
    closeAllPopups();
    
    await buildBrandDropdown();
}

function closeBrandDropdown() {
    const box = document.getElementById('brand-select');
    if (!box) return;
    const dd = box.querySelector('.select-dropdown');
    if (dd) dd.remove();
    box?.setAttribute('aria-expanded', 'false');
}

async function buildBrandDropdown() {
    const box = document.getElementById('brand-select');
    if (!box) return;
    const current = (appState.activeFilters.title || [])[0] || null;
    const searchTree = await loadSearchTree();
    const dropdown = document.createElement('div');
    dropdown.className = 'select-dropdown';
    if (!searchTree || (!searchTree.domestic && !searchTree.import)) {
        dropdown.innerHTML = `<div class="select-dropdown-inner"><div style="padding:14px 16px;color:#8a94a6;">목록을 불러오지 못했습니다.</div></div>`;
    } else {
        dropdown.innerHTML = `
            <div class="select-dropdown-inner">
                <div class="select-list" role="listbox" aria-label="제조사 선택">
                    <div class="select-group-title">국산</div>
                    ${(searchTree.domestic||[]).map(brand => optionTemplate(brand.label, current)).join('')}
                    <div class="select-group-title">수입</div>
                    ${(searchTree.import||[]).map(brand => optionTemplate(brand.label, current)).join('')}
                </div>
            </div>
        `;
    }
    dropdown.addEventListener('click', (e) => e.stopPropagation());
    dropdown.querySelectorAll('.select-option').forEach(el => {
        el.addEventListener('click', () => {
            const value = el.dataset.value;
            // 단일 선택으로 동기화 및 모델 초기화
            onBrandSelected(value || null);
            closeBrandDropdown();
        });
    });
    box.appendChild(dropdown);
    box.setAttribute('aria-expanded', 'true');
}

function optionTemplate(name, current) {
    const selected = current === name;
    return `<div class="select-option${selected ? ' selected' : ''}" role="option" aria-selected="${selected}" data-value="${name}">${name}</div>`;
}

/** 렌더 이후 메인 필터 라벨 텍스트를 활성 필터와 동기화 */
function updateMainFilterLabels() {
    // 브랜드 라벨
    const brandBox = document.getElementById('brand-select');
    if (brandBox) {
        const brandLabel = brandBox.querySelector('.car-select-label');
        const currentBrand = (appState.activeFilters.title || [])[0] || null;
        if (brandLabel) brandLabel.textContent = currentBrand || '제조사';
    }
    // 모델 라벨 및 활성/비활성 상태
    const modelBox = document.getElementById('model-select');
    if (modelBox) {
        const currentBrand = (appState.activeFilters.title || [])[0] || null;
        if (!currentBrand) {
            // 브랜드가 없으면 모델 비활성화
            modelBox.classList.add('disabled');
            const lbl = modelBox.querySelector('.car-select-label');
            if (lbl) {
                lbl.classList.add('disabled');
                lbl.textContent = '모델';
            }
        } else {
            // 브랜드가 있으면 모델 활성화
            modelBox.classList.remove('disabled');
            const lbl = modelBox.querySelector('.car-select-label');
            if (lbl) lbl.classList.remove('disabled');
            const currentModel = (appState.activeFilters.model || [])[0] || null;
            if (lbl) lbl.textContent = currentModel || '모델';
        }
    }
    // 세부 트림 라벨 + 활성처리
    const submodelBox = document.getElementById('submodel-select');
    if (submodelBox) {
        const currentModel = (appState.activeFilters.model || [])[0] || null;
        if (!currentModel) {
            submodelBox.classList.add('disabled');
            const lbl = submodelBox.querySelector('.car-select-label');
            if (lbl) {
                lbl.classList.add('disabled');
                lbl.textContent = '세부모델';
            }
        } else {
            submodelBox.classList.remove('disabled');
            const lbl = submodelBox.querySelector('.car-select-label');
            if (lbl) lbl.classList.remove('disabled');
            const currentTrim = (appState.activeFilters.submodel || [])[0] || null;
            if (lbl) lbl.textContent = currentTrim || '세부모델';
        }
    }
}

// --- 모델 선택 UI ---
function setupModelSelect() {
    const box = document.getElementById('model-select');
    if (!box) return;
    box.setAttribute('role', 'button');
    box.setAttribute('tabindex', '0');
    box.setAttribute('aria-haspopup', 'listbox');
    box.setAttribute('aria-expanded', 'false');
    box.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleModelDropdown();
    });
    box.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleModelDropdown();
        }
    });
}

async function toggleModelDropdown() {
    const box = document.getElementById('model-select');
    if (!box || box.classList.contains('disabled')) return;
    let dropdown = box.querySelector('.select-dropdown');
    if (dropdown) {
        closeModelDropdown();
        return;
    }
    // 다른 드롭다운들 먼저 닫기
    closeBrandDropdown();
    closeSubmodelDropdown();
    closeAllPopups();
    
    await buildModelDropdown();
}

function closeModelDropdown() {
    const box = document.getElementById('model-select');
    if (!box) return;
    const dd = box.querySelector('.select-dropdown');
    if (dd) dd.remove();
    box?.setAttribute('aria-expanded', 'false');
}

async function buildModelDropdown() {
    const box = document.getElementById('model-select');
    if (!box) return;
    const currentBrand = (appState.activeFilters.title || [])[0] || null;
    const currentModel = (appState.activeFilters.model || [])[0] || null;
    
    // search_tree 데이터 로드
    await loadSearchTree();
    const brandInfo = findBrandByLabel(currentBrand);
    const models = brandInfo?.models || [];

    const dropdown = document.createElement('div');
    dropdown.className = 'select-dropdown';
    if (!currentBrand) {
        dropdown.innerHTML = `<div class="select-dropdown-inner"><div style="padding:14px 16px;color:#8a94a6;">먼저 제조사를 선택하세요.</div></div>`;
    } else if (!models || models.length === 0) {
        dropdown.innerHTML = `<div class="select-dropdown-inner"><div style="padding:14px 16px;color:#8a94a6;">모델 정보가 없습니다.</div></div>`;
    } else {
        dropdown.innerHTML = `
            <div class="select-dropdown-inner">
                <div class="select-list" role="listbox" aria-label="모델 선택">
                    ${models.map(model => {
                        const modelName = model.label || model.model;
                        return optionTemplate(modelName, currentModel);
                    }).join('')}
                </div>
            </div>
        `;
    }
    dropdown.addEventListener('click', (e) => e.stopPropagation());
    dropdown.querySelectorAll('.select-option').forEach(el => {
        el.addEventListener('click', () => {
            const value = el.dataset.value;
            // 단일 선택으로 동기화하고 세부트림 초기화
            appState.activeFilters.model = value ? [value] : [];
            appState.activeFilters.submodel = [];
            const submodelBox = document.getElementById('submodel-select');
            const submodelLabel = submodelBox?.querySelector('.car-select-label');
            if (submodelLabel) submodelLabel.textContent = '세부모델';
            render();
            closeModelDropdown();
        });
    });
    box.appendChild(dropdown);
    box.setAttribute('aria-expanded', 'true');
}

function onBrandSelected(brandOrNull) {
    // 브랜드 변경 적용
    appState.activeFilters.title = brandOrNull ? [brandOrNull] : [];
    // 브랜드 바뀌면 모델과 세부트림 초기화 및 라벨 초기화
    appState.activeFilters.model = [];
    appState.activeFilters.submodel = [];
    const modelBox = document.getElementById('model-select');
    const modelLabel = modelBox?.querySelector('.car-select-label');
    if (modelLabel) modelLabel.textContent = '모델';
    const submodelBox = document.getElementById('submodel-select');
    const submodelLabel = submodelBox?.querySelector('.car-select-label');
    if (submodelLabel) submodelLabel.textContent = '세부모델';
    render();
}

// --- 세부 트림(서브모델) 선택 UI 및 로직 ---
function setupSubmodelSelect() {
    const box = document.getElementById('submodel-select');
    if (!box) return;
    box.setAttribute('role', 'button');
    box.setAttribute('tabindex', '0');
    box.setAttribute('aria-haspopup', 'listbox');
    box.setAttribute('aria-expanded', 'false');
    box.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSubmodelDropdown();
    });
    box.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleSubmodelDropdown();
        }
    });
}

async function toggleSubmodelDropdown() {
    const box = document.getElementById('submodel-select');
    if (!box || box.classList.contains('disabled')) return;
    let dropdown = box.querySelector('.select-dropdown');
    if (dropdown) { closeSubmodelDropdown(); return; }
    // 다른 드롭다운들 먼저 닫기
    closeBrandDropdown();
    closeModelDropdown();
    closeAllPopups();
    
    await buildSubmodelDropdown();
}

function closeSubmodelDropdown() {
    const box = document.getElementById('submodel-select');
    if (!box) return;
    const dd = box.querySelector('.select-dropdown');
    if (dd) dd.remove();
    box?.setAttribute('aria-expanded', 'false');
}

async function buildSubmodelDropdown() {
    const box = document.getElementById('submodel-select');
    if (!box) return;
    const currentBrand = (appState.activeFilters.title || [])[0] || null;
    const currentModel = (appState.activeFilters.model || [])[0] || null;
    const currentSubmodel = (appState.activeFilters.submodel || [])[0] || null;
    
    console.log('[세부트림] 현재 브랜드:', currentBrand, '모델:', currentModel);
    
    const searchTree = await loadSearchTree();
    // 브랜드-모델 매칭
    const brandInfo = [...(searchTree.domestic || []), ...(searchTree.import || [])].find(b => b.label === currentBrand);
    console.log('[세부트림] 브랜드 정보:', brandInfo);
    
    const modelInfo = brandInfo?.models?.find(m => (m.label || m.model) === currentModel);
    console.log('[세부트림] 모델 정보:', modelInfo);
    
    const trims = modelInfo?.trims || [];
    console.log('[세부트림] 트림 목록:', trims);
    
    const dropdown = document.createElement('div');
    dropdown.className = 'select-dropdown';
    if (!currentModel) {
        dropdown.innerHTML = `<div class="select-dropdown-inner"><div style="padding:14px 16px;color:#8a94a6;">먼저 모델을 선택하세요.</div></div>`;
    } else if (!trims || trims.length === 0) {
        dropdown.innerHTML = `<div class="select-dropdown-inner"><div style="padding:14px 16px;color:#8a94a6;">세부트림 정보가 없습니다.</div></div>`;
    } else {
        dropdown.innerHTML = `
            <div class="select-dropdown-inner">
                <div class="select-list" role="listbox" aria-label="세부트림 선택">
                    ${trims.map(trim => {
                        // trim 객체에서 trim.trim 또는 trim 자체를 사용
                        const trimName = typeof trim === 'object' ? (trim.trim || trim.label || '') : trim;
                        const isSelected = currentSubmodel === trimName;
                        return `<div class="select-option${isSelected ? ' selected' : ''}" role="option" aria-selected="${isSelected}" data-value="${trimName}">${trimName}</div>`;
                    }).join('')}
                </div>
            </div>
        `;
    }
    dropdown.addEventListener('click', (e) => e.stopPropagation());
    dropdown.querySelectorAll('.select-option').forEach(el => {
        el.addEventListener('click', () => {
            const value = el.dataset.value;
            console.log('[세부트림] 선택된 값:', value);
            appState.activeFilters.submodel = value ? [value] : [];
            render();
            closeSubmodelDropdown();
        });
    });
    box.appendChild(dropdown);
    box.setAttribute('aria-expanded', 'true');
    console.log('[세부트림] 드롭다운 생성 완료');
}

// --- 예산 범위 슬라이더 설정 ---
function setupBudgetSlider() {
    const slider = document.getElementById('budget-range-slider');
    const budgetText = document.getElementById('budget-range-text');
    
    if (!slider || !budgetText) return;
    
    // 예산 범위 옵션 (1000만원 이하는 200만원 단위)
    const budgetRanges = [
        { value: 0, label: '0원' },
        { value: 200, label: '200만원' },
        { value: 400, label: '400만원' },
        { value: 600, label: '600만원' },
        { value: 800, label: '800만원' },
        { value: 1000, label: '1,000만원' },
        { value: 1500, label: '1,500만원' },
        { value: 2000, label: '2,000만원' },
        { value: 2500, label: '2,500만원' },
        { value: 3000, label: '3,000만원이상' }
    ];
    
    // 슬라이더 초기화
    $(slider).ionRangeSlider({
        type: 'double',
        min: 0,
        max: budgetRanges.length - 1,
        from: 0,
        to: budgetRanges.length - 1,
        grid: false,
        hide_min_max: true,
        hide_from_to: false, // 핸들 위 값 표시를 위해 false로 변경
        prettify: function(num) {
            return budgetRanges[num].label;
        },
        onChange: function(data) {
            updateBudgetText(data, budgetRanges, budgetText);
            updateBudgetFilter(data, budgetRanges);
        },
        onFinish: function(data) {
            updateBudgetText(data, budgetRanges, budgetText);
            updateBudgetFilter(data, budgetRanges);
        }
    });
    
    // 초기 텍스트 설정
    const initialData = { from: 0, to: budgetRanges.length - 1 };
    updateBudgetText(initialData, budgetRanges, budgetText);
}

function updateBudgetText(data, budgetRanges, textElement) {
    const fromLabel = budgetRanges[data.from].label;
    const toLabel = budgetRanges[data.to].label;

    // 새로운 예산 범위 텍스트 규칙
    if (data.from === 0 && data.to === budgetRanges.length - 1) {
        textElement.textContent = '최소~최대 예산 구간 모든 차량';
    } else if (data.from === 0 && data.to < budgetRanges.length - 1) {
        textElement.textContent = `${toLabel} 까지의 예산 차량`;
    } else if (data.from > 0 && data.to === budgetRanges.length - 1) {
        textElement.textContent = `${fromLabel} 이상의 예산 차량`;
    } else if (data.from === data.to) {
        textElement.textContent = `${fromLabel} 차량만 보고 싶어요`;
    } else {
        textElement.textContent = `${fromLabel} ~ ${toLabel} 구간 차량`;
    }
}

function updateBudgetFilter(data, budgetRanges) {
    const fromValue = budgetRanges[data.from].value;
    const toValue = budgetRanges[data.to].value;
    
    // 전체 범위인 경우 필터 해제
    if (data.from === 0 && data.to === budgetRanges.length - 1) {
        appState.budgetRange = null;
    } else {
        appState.budgetRange = { min: fromValue, max: toValue === 3000 ? Infinity : toValue };
    }
    
    // 렌더링 업데이트 (데이터가 로드된 경우에만)
    if (appState.allData && appState.allData.length > 0) {
        render();
    }
}

// --- 앱 실행 ---
initialize();

// 검색어 적용 함수
function applySearchQuery() {
    if (!DOM.searchInput) return;
    const value = (DOM.searchInput.value || '').trim();
    appState.searchQuery = value;
    render();
}