import { 
    appState, 
    columnMapping,
    mileageRanges,
    priceRanges,
    initializeFiltersAndOptions,
    fetchAvailableDates,
    loadCSVForDate
} from './app.js';

// --- UI 관련 DOM 요소 캐싱 ---
const DOM = {
    fileDropContainer: document.getElementById('file-drop-container'),
    fileDropArea: document.querySelector('.file-drop-area'),
    fileInput: document.getElementById('csv-file'),
    carTable: document.getElementById('car-table'),
    tableHead: document.querySelector('#car-table thead tr'),
    tableBody: document.querySelector('#car-table tbody'),
    messageEl: document.getElementById('message'),
    imageModal: document.getElementById('image-modal'),
    modalImage: document.getElementById('modal-image'),
    modalClose: document.querySelector('.modal-close'),
    dateSelect: document.getElementById('date-select')
};

/**
 * 앱 초기화: 모든 이벤트 리스너를 설정합니다.
 */
function initialize() {
    DOM.fileInput.addEventListener('change', () => handleFileSelect(DOM.fileInput.files));
    DOM.fileDropArea.addEventListener('dragover', (e) => { e.preventDefault(); DOM.fileDropArea.classList.add('dragover'); });
    DOM.fileDropArea.addEventListener('dragleave', () => DOM.fileDropArea.classList.remove('dragover'));
    DOM.fileDropArea.addEventListener('drop', (e) => { 
        e.preventDefault(); 
        DOM.fileDropArea.classList.remove('dragover'); 
        handleFileSelect(e.dataTransfer.files); 
    });

    DOM.tableBody.addEventListener('click', (e) => {
        const clickableTitle = e.target.closest('.title-clickable');
        if (clickableTitle) {
            const imageUrl = clickableTitle.dataset.imageUrl;
            if (imageUrl) {
                showImageModal(imageUrl);
            } else {
                alert('표시할 이미지가 없습니다.');
            }
        }
    });

    DOM.modalClose.onclick = hideImageModal;
    DOM.imageModal.onclick = (e) => {
        if (e.target === DOM.imageModal) hideImageModal();
    };
    
    window.addEventListener('click', closeAllPopups);

    // 날짜 선택 이벤트 리스너 추가
    DOM.dateSelect.addEventListener('change', handleDateSelect);
    
    // 날짜 선택 드롭다운 초기화
    initializeDateSelector();
}

/**
 * 사용자가 파일을 선택하거나 드롭했을 때 호출되는 함수
 */
function handleFileSelect(files) {
    if (files.length === 0 || appState.isParsing) return;
    appState.isParsing = true;

    const file = files[0];

    if (file && file.type === 'text/csv') {
        DOM.messageEl.textContent = '파일을 읽는 중입니다...';
        DOM.messageEl.style.display = 'block';
        DOM.carTable.style.display = 'none';

        Papa.parse(file, {
            header: true, skipEmptyLines: true,
            complete: function(results) {
                appState.allData = results.data;
                initializeFiltersAndOptions();
                buildAndAttachHeader();
                updateAuctionTitle();
                render();
                
                DOM.messageEl.style.display = 'none';
                DOM.carTable.style.display = 'table';
                DOM.fileDropContainer.style.display = 'none';
                appState.isParsing = false;
            },
            error: function(error) { 
                DOM.messageEl.textContent = '파일 읽기 오류: ' + error.message; 
                appState.isParsing = false;
            }
        });
    } else {
        alert('CSV 파일만 업로드할 수 있습니다.');
        appState.isParsing = false;
    }
    
    DOM.fileInput.value = null;
}

/**
 * 테이블 헤더를 생성하고 이벤트 리스너를 연결하는 함수
 */
function buildAndAttachHeader() {
    DOM.tableHead.innerHTML = '';
    Object.keys(columnMapping).forEach(key => {
        const th = document.createElement('th');
        th.dataset.filterKey = key;
        th.innerHTML = columnMapping[key];

        if (['fuel', 'title', 'km', 'price'].includes(key)) {
            th.classList.add('filterable-header');
            let options, filterType;
            if (key === 'fuel') { options = appState.fuelTypes; filterType = 'fuel'; }
            if (key === 'title') { options = appState.carBrands; filterType = 'title'; }
            if (key === 'km') { options = Object.keys(mileageRanges); filterType = 'km'; }
            if (key === 'price') { options = Object.keys(priceRanges); filterType = 'price'; }
            
            th.innerHTML += ' <span class="arrow">▼</span>';
            th.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                toggleFilterPopup(th, options, filterType); 
            });
        }
        DOM.tableHead.appendChild(th);
    });
}

/**
 * 현재 활성화된 필터를 적용하고 결과를 렌더링하는 함수
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
            kmMatch = isNaN(km) ? false : (max === Infinity ? km >= min : (km >= min && km < max));
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
        DOM.tableBody.innerHTML = `
            <tr><td colspan="${Object.keys(columnMapping).length}" style="padding: 2rem; text-align: center;">
                검색 결과가 없습니다. 다른 필터 조건을 선택해주세요.
            </td></tr>`;
    } else {
        displayTableBody(filteredData);
    }

    DOM.carTable.style.display = 'table';
}

/**
 * 테이블 본문 내용을 생성하고 표시하는 함수
 */
function displayTableBody(data) {
    DOM.tableBody.innerHTML = data.map(row => {
        const cells = Object.keys(columnMapping).map(key => {
            let content = '';
            const cellValue = row[key] || '-';

            if (key === 'details') {
                return `<td class="details-cell"><div class="details-grid">
                    <div class="detail-item-label">차량<br>번호</div><div class="detail-item-value">${row.car_number || '-'}</div>
                    <div class="detail-item-label">점수</div><div class="detail-item-value">${row.score || '-'}</div>
                </div></td>`;
            }
            
            content = (key === 'km' && !isNaN(parseInt(row.km, 10))) ? `${parseInt(row.km, 10).toLocaleString('ko-KR')} km` : cellValue;

            const className = ['fuel-column', 'price-column', 'km-column', 'title-column'].find(c => c.startsWith(key)) || '';
            const clickableClass = (key === 'title' && row.image) ? 'title-clickable' : '';
            const imageUrl = (key === 'title' && row.image) ? `data-image-url="${row.image}"` : '';
            
            return `<td class="${className} ${clickableClass}" ${imageUrl}>${content}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
    }).join('');
}

/**
 * 필터 팝업 토글 함수
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

function updateAuctionTitle() {
    const h1Element = document.querySelector('h1');
    const uniqueAuctionNames = [...new Set(appState.allData.map(row => row.auction_name).filter(Boolean))];
    
    if (uniqueAuctionNames.length > 0) {
        h1Element.textContent = `차량 경매 정보 (${uniqueAuctionNames[0]})`;
    }
}

// 날짜 선택 드롭다운 초기화
async function initializeDateSelector() {
    const dates = await fetchAvailableDates();
    
    // 드롭다운 옵션 생성
    dates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        // 날짜 형식 변환 (2025.08.09 -> 2025년 8월 9일)
        const formattedDate = new Date(date.replace(/\./g, '-')).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        option.textContent = formattedDate;
        DOM.dateSelect.appendChild(option);
    });
}

// 날짜 선택 이벤트 핸들러
async function handleDateSelect(event) {
    const selectedDate = event.target.value;
    if (!selectedDate) return;

    DOM.messageEl.textContent = '데이터를 로드하는 중입니다...';
    DOM.messageEl.style.display = 'block';
    DOM.carTable.style.display = 'none';

    const csvText = await loadCSVForDate(selectedDate);
    if (csvText) {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                appState.allData = results.data;
                initializeFiltersAndOptions();
                buildAndAttachHeader();
                updateAuctionTitle();
                render();
                
                DOM.messageEl.style.display = 'none';
                DOM.carTable.style.display = 'table';
                DOM.fileDropContainer.style.display = 'none';
            },
            error: function(error) {
                DOM.messageEl.textContent = '파일 읽기 오류: ' + error.message;
            }
        });
    }
}

// --- 앱 실행 ---
initialize();