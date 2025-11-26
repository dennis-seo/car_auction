# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

차량 경매 정보를 조회하는 React 웹 애플리케이션입니다. Google Cloud Run에서 호스팅되는 백엔드 API로부터 경매 데이터를 가져와 사용자에게 제공합니다.

## 개발 명령어

### 개발 서버 실행
```bash
npm start
```
개발 서버가 http://localhost:3000 에서 실행됩니다.

### 빌드
```bash
npm run build
```
프로덕션 빌드를 `build/` 디렉토리에 생성합니다.

### 테스트
```bash
npm test
```
React Scripts의 Jest 기반 테스트 실행.

## 아키텍처

### 데이터 흐름

1. **API 계층** (`src/utils/apiConfig.js`)
   - Google Cloud Run에서 호스팅되는 REST API 사용
   - 경매 날짜 목록: `${API_BASE_URL}/api/dates`
   - 특정 날짜 경매 데이터: `${API_BASE_URL}/api/auction_date/${date}`
   - JSON 형식으로 데이터 전달 (과거 CSV → JSON 변환 완료)

2. **상태 관리** (`src/utils/appState.js`)
   - 전역 상태를 단일 `appState` 객체로 관리
   - React 컴포넌트 간 공유되는 데이터 저장
   - 필터, 검색, 데이터 캐시 등 포함

3. **데이터 처리** (`src/utils/dataUtils.js`)
   - API 호출 및 데이터 정규화
   - 필터링 로직: 브랜드/모델/서브모델, 연료, 가격, 주행거리, 연식, 경매장/지역
   - 정렬 로직: 가격/연식/주행거리 기준

4. **경매장 관리** (`src/utils/auctionManager.js`)
   - 싱글톤 패턴으로 경매장 정보 관리
   - 데이터 로드 시 `initializeFromData()`로 경매장별 통계 수집
   - 오토허브 경매장 여부에 따라 필터 모드 자동 전환 (차량용도 vs 연료)

### 컴포넌트 구조

- **App.jsx**: 최상위 컴포넌트, 날짜 선택 및 데이터 로드 관리
- **DateSelector**: 날짜 드롭다운 선택
- **MainSearch**: 브랜드/모델 계층 선택, 검색어, 예산/연식 슬라이더
- **ActiveFilters**: 활성화된 필터 표시 및 제거
- **CarGallery/CarTable**: 모바일/데스크톱 분기하여 차량 목록 표시
- **ImageModal/DetailsModal**: 이미지 확대 및 상세정보 팝업

### 중요한 로직

#### 필터 초기화 및 AuctionManager
- 날짜 변경 시 반드시 `auctionManager.reset()` 호출 후 새 데이터로 `initializeFromData()` 실행
- AuctionManager가 오토허브 경매장 포함 여부를 감지하여 `FuelFilter` vs `VehicleTypeFilter` 표시 결정

#### 정렬 우선순위
- 예산 슬라이더 활성화 → 가격 오름차순
- 연식 슬라이더 활성화 → 연식 내림차순
- 둘 다 활성화 → `lastSortedFilter` 상태로 우선순위 결정
- 테이블 헤더 필터(가격/주행거리) → 각각 오름차순

#### 브랜드/모델 검색 트리
- `public/data/search_tree.json`: 국산/수입 브랜드 → 모델 → 서브모델(트림) 계층 구조
- `loadSearchTree()`로 로드 후 `BrandSelector` → `ModelSelector` → `SubmodelSelector` 연쇄 필터링

## 경매장별 평가 등급 정보

README.md에 명시된 경매장별 평가 등급 기준:

- **롯데 경매장 (월요일)**: A/B 무사고, C/D 골격판금, E/F 큰사고 (앞자리만 확인)
- **현대 경매장 (화수목금)**: A만 무사고 (A1-3은 골격 가능), A4-A9 무사고
- **안성 오토허브 (수요일)**: A/B 무사고, C/D 골격판금, E/F 큰사고
- **케이카 옥션 (화/목)**: A만 무사고 (일부 A1-4는 사고 가능)

## Git 커밋 메시지 규칙

`.firebender/commands/git-push-message-rule.md` 참고:
- 포맷: `제목` + 목적(원인) + 수정내역 (개조식)
- 한국어로 작성, 모든 변경사항 포함
- **중요**: 커밋 메시지에 Claude 관련 attribution 제외 (아래 내용 포함 금지)
  - `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
  - `Co-Authored-By: Claude <noreply@anthropic.com>`

## 환경 변수

- `REACT_APP_API_BASE_URL`: API 베이스 URL (기본값: Google Cloud Run 엔드포인트)
- `PUBLIC_URL`: GitHub Pages 배포 시 서브 경로 설정