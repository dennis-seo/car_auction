import { 
    appState, 
    handleFileSelect, 
    columnMapping,
    mileageRanges,
    priceRanges 
} from './app.js';

// UI 관련 DOM 요소 캐싱
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
    modalClose: document.querySelector('.modal-close')
};

// UI 클래스 정의
export const UI = {
    initialize() {
        this.setupEventListeners();
    },

    setupEventListeners() {
        DOM.fileInput.addEventListener('change', () => handleFileSelect(DOM.fileInput.files));
        DOM.fileDropArea.addEventListener('dragover', this.handleDragOver);
        DOM.fileDropArea.addEventListener('dragleave', this.handleDragLeave);
        DOM.fileDropArea.addEventListener('drop', this.handleDrop);
        
        DOM.tableBody.addEventListener('click', this.handleTableClick);
        DOM.modalClose.onclick = this.hideImageModal;
        DOM.imageModal.onclick = this.handleModalClick;
        
        window.addEventListener('click', this.closeAllPopups);
    },

    // 여기에 기존의 모든 UI 관련 함수들을 넣습니다
    showMessage(message) {
        DOM.messageEl.textContent = message;
        DOM.messageEl.style.display = 'block';
        DOM.carTable.style.display = 'none';
    },

    hideFileDropContainer() {
        DOM.messageEl.style.display = 'none';
        DOM.carTable.style.display = 'table';
        DOM.fileDropContainer.style.display = 'none';
    },

    // ... 나머지 UI 관련 함수들
};

// DOM이 로드된 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    UI.initialize();
});