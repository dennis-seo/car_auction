import { 
    appState, 
    columnMapping,
    mileageRanges,
    priceRanges,
    initializeFiltersAndOptions,
    fetchAvailableDates
} from './app.js';

// --- UI 관련 DOM 요소 캐싱 ---
const DOM = {
    dateSelector: document.getElementById('date-selector'),
    carTable: document.getElementById('car-table'),
    tableHead: document.querySelector('#car-table thead tr'),
    tableBody: document.querySelector('#car-table tbody'),
    messageEl: document.getElementById('message'),
    imageModal: document.getElementById('image-modal'),
    modalImage: document.getElementById('modal-image'),
    modalClose: document.querySelector('.modal-close')
};

/**
 * 앱 초기화: 날짜 목록을 불러와 드롭다운을 설정하고 이벤트 리스너를 연결합니다.
 */
async function initialize() {
    try {
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
    
    window.addEventListener('click', closeAllPopups);
}

/**
 * 가져온 날짜 목록으로 드롭다운 메뉴를 채웁니다.
 */
function populateDateSelector() {
    appState.availableDates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = date;
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
        return;
    }
    
    // 각 날짜 폴더 안의 파일명을 'data.csv'로 가정합니다.
    const filePath = `sources/${date}/auction_data.csv`;

    DOM.messageEl.textContent = `'${date}'의 경매 데이터를 불러오는 중입니다...`;
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
                updateAuctionTitle(date);
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

        if (['fuel', 'title', 'km', 'price'].includes(key)) {
            th.classList.add('filterable-header');
            th.innerHTML += ' <span class="arrow">▼</span>';
            th.addEventListener('click', (e) => {
                e.stopPropagation();
                let options, filterType;
                if (key === 'fuel') { options = appState.fuelTypes; filterType = 'fuel'; }
                if (key === 'title') { options = appState.carBrands; filterType = 'title'; }
                if (key === 'km') { options = Object.keys(mileageRanges); filterType = 'km'; }
                if (key === 'price') { options = Object.keys(priceRanges); filterType = 'price'; }
                toggleFilterPopup(th, options, filterType);
            });
        }
        DOM.tableHead.appendChild(th);
    });
}

/**
 * 현재 활성화된 필터를 적용하고 결과를 렌더링합니다.
 */
function render() {
    const filteredData = appState.allData.filter(row => {
        const brandMatch = appState.activeFilters.title === 'all' || (row.title && row.title.includes(`[${appState.activeFilters.title}]`));
        const fuelMatch = appState.activeFilters.fuel === 'all' || row.fuel === appState.activeFilters.fuel;

        let kmMatch = true;
        if (appState.activeFilters.km !== 'all') {
            const range = mileageRanges[appState.activeFilters.km].split('-');
            const min = parseInt(range[0], 10);
            const max = range[1] === 'Infinity' ? Infinity : parseInt(range[1], 10);
            const km = parseInt(row.km, 10);
            kmMatch = isNaN(km) ? false : (km >= min && km < max);
        }

        let priceMatch = true;
        if (appState.activeFilters.price !== 'all') {
            const range = priceRanges[appState.activeFilters.price].split('-');
            const min = parseInt(range[0], 10);
            const max = range[1] === 'Infinity' ? Infinity : parseInt(range[1], 10);
            const price = parseInt(row.price, 10);
            priceMatch = isNaN(price) ? false : (max === Infinity ? price >= min : (price >= min && price < max));
        }

        return brandMatch && fuelMatch && kmMatch && priceMatch;
    });

    updateHeaderAppearance();
    
    if (filteredData.length === 0) {
        DOM.tableBody.innerHTML = `<tr><td colspan="${Object.keys(columnMapping).length}" style="padding: 2rem; text-align: center;">검색 결과가 없습니다. 다른 필터 조건을 선택해주세요.</td></tr>`;
    } else {
        displayTableBody(filteredData);
    }

    DOM.carTable.style.display = 'table';
}

/**
 * 테이블 본문 내용을 생성하고 표시합니다.
 */
function displayTableBody(data) {
    DOM.tableBody.innerHTML = data.map(row => {
        const cells = Object.keys(columnMapping).map(key => {
            let content = row[key] || '-';
            const className = ['fuel-column', 'price-column', 'km-column', 'title-column'].find(c => c.startsWith(key)) || '';

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
 * 필터 팝업을 토글합니다.
 */
function toggleFilterPopup(thElement, options, filterType) {
    closeAllPopups();
    const existingPopup = thElement.querySelector('.filter-popup');
    if (existingPopup) {
        existingPopup.remove();
        return;
    }

    const popup = document.createElement('div');
    popup.className = 'filter-popup';
    
    const allOption = document.createElement('a');
    allOption.className = 'filter-option';
    allOption.textContent = '전체';
    allOption.onclick = () => updateAndApplyFilters(filterType, 'all');
    popup.appendChild(allOption);

    options.forEach(optionValue => {
        const option = document.createElement('a');
        option.className = 'filter-option';
        option.textContent = optionValue;
        option.onclick = () => updateAndApplyFilters(filterType, optionValue);
        popup.appendChild(option);
    });

    thElement.appendChild(popup);
    popup.style.display = 'block';
}

function updateAndApplyFilters(filterType, value) {
    appState.activeFilters[filterType] = value;
    render();
    closeAllPopups();
}

function updateHeaderAppearance() {
    document.querySelectorAll('th.filterable-header').forEach(th => {
        const key = th.dataset.filterKey;
        const originalText = columnMapping[key];
        const selectedValue = appState.activeFilters[key];

        if (selectedValue && selectedValue !== 'all') {
            th.innerHTML = `${originalText} <span class="active-filter-value">(${selectedValue})</span> <span class="arrow">▼</span>`;
        } else {
            th.innerHTML = `${originalText} <span class="arrow">▼</span>`;
        }
    });
}

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
        h1Element.textContent = `차량 경매 정보 (${uniqueAuctionNames[0]})`;
    }
    // if (date) {
    //     h1Element.textContent = `차량 경매 정보 (${date})`;
    // } else {
    //     h1Element.textContent = `차량 경매 정보`;
    // }
}

// --- 앱 실행 ---
initialize();