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
    modalClose: document.querySelector('.modal-close'),
    detailsModal: document.getElementById('details-modal'),
    detailsModalContent: document.getElementById('details-modal-content'),
    detailsModalClose: document.querySelector('.details-close'),
    activeFiltersBar: document.getElementById('active-filters')
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
        if (isPopup || isHeader) return;
        document.querySelectorAll('.filter-popup.active').forEach(popup => {
            popup.classList.remove('active');
            popup.addEventListener('transitionend', function onEnd() {
                popup.removeEventListener('transitionend', onEnd);
                if (popup.parentNode) popup.parentNode.removeChild(popup);
            });
        });
    });
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
        // ... 나머지 조건 ...
        // 차종
        const titleArr = appState.activeFilters.title || [];
        const brandMatch = titleArr.length === 0
            || (row.title && titleArr.some(val => row.title.includes(`[${val}]`)));
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
        return brandMatch && fuelMatch && kmMatch && priceMatch;
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
        // 같은 th에 pop이 열려 있다면 트랜지션 닫기
        existingPopup.classList.remove('active');
        existingPopup.addEventListener('transitionend', function onEnd() {
            existingPopup.removeEventListener('transitionend', onEnd);
            if (existingPopup.parentNode) existingPopup.parentNode.removeChild(existingPopup);
        });
        return;
    }
    // 다른 팝업은 즉시 제거한다.
    closeAllPopups();

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
            const other = filterType === 'price' ? 'km' : 'price';
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
            const other = filterType === 'price' ? 'km' : 'price';
            if ((appState.activeFilters[other]||[]).length > 0) appState.lastSortedFilter = other;
            else appState.lastSortedFilter = null;
        }
    }
    render();
    closeAllPopups();
}

const FILTER_LABELS = {
    title: '차종',
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
                render();
            };
            pill.appendChild(closeBtn);
            bar.appendChild(pill);
        });
    });
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
        h1Element.textContent = `차량 경매 정보 (${uniqueAuctionNames[0]})`;
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

// --- 앱 실행 ---
initialize();