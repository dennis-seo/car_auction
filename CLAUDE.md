# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

차량 경매 정보를 조회하는 React + TypeScript 웹 애플리케이션입니다. Google Cloud Run에서 호스팅되는 백엔드 API로부터 경매 데이터를 가져와 사용자에게 제공합니다.

## 개발 명령어

```bash
npm start          # 개발 서버 실행 (http://localhost:3000)
npm run build      # 프로덕션 빌드 (build/ 디렉토리)
npm test           # Jest 테스트 실행
npm test -- --watchAll=false  # CI용 테스트 (watch 모드 없이)
```

## 기술 스택

- **React 18** + **TypeScript** (컴포넌트는 .tsx, 훅/유틸리티는 .ts)
- **react-range**: 예산/연식 슬라이더
- **recharts**: 시세 그래프
- 일부 레거시 유틸리티는 .js + .d.ts 타입 선언 파일 사용

## 아키텍처

### 데이터 흐름

1. **API 계층** (`src/utils/apiConfig.ts`)
   - Google Cloud Run REST API 사용
   - 날짜 목록: `/api/dates`
   - 경매 데이터: `/api/auction/{date}` (JSON 응답)

2. **상태 관리**
   - `src/contexts/AppContext`: React Context로 전역 상태 관리
   - `src/utils/appState.ts`: 레거시 전역 상태 (하위 호환성용)

3. **데이터 처리** (`src/utils/dataUtils.js`)
   - `filterData()`: 브랜드/모델/연료/가격/주행거리/연식 필터링
   - `sortFilteredData()`: 정렬 로직 (가격/연식/주행거리)

4. **경매장 관리** (`src/utils/auctionManager.js`)
   - 싱글톤 패턴으로 경매장 정보 관리
   - 오토허브 경매장 여부에 따라 필터 모드 자동 전환 (차량용도 vs 연료)

### 타입 시스템

- `src/types/api.ts`: 핵심 타입 정의 (AuctionItem, ActiveFilters, FilterIds, SearchTree 등)
- `src/types/index.ts`: 타입 re-export

### 중요한 로직

**필터 초기화**: 날짜 변경 시 반드시 `auctionManager.reset()` 호출 후 새 데이터로 `initializeFromData()` 실행

**정렬 우선순위**:
- 예산 슬라이더 활성화 → 가격 오름차순
- 연식 슬라이더 활성화 → 연식 내림차순
- 둘 다 활성화 → `lastSortedFilter` 상태로 우선순위 결정

**브랜드/모델 검색 트리**: `public/data/search_tree.json`에서 국산/수입 브랜드 → 모델 → 트림 계층 구조 로드

## 경매장별 평가 등급 기준

- **롯데 경매장 (월요일)**: A/B 무사고, C/D 골격판금, E/F 큰사고 (앞자리만 확인)
- **현대 경매장 (화수목금)**: A만 무사고 (A1-3은 골격 가능), A4-A9 무사고
- **안성 오토허브 (수요일)**: A/B 무사고, C/D 골격판금, E/F 큰사고
- **케이카 옥션 (화/목)**: A만 무사고 (일부 A1-4는 사고 가능)

## Git 커밋 메시지 규칙

- 포맷: `제목` + 목적(원인) + 수정내역 (개조식)
- 한국어로 작성, 모든 변경사항 포함
- **중요**: 커밋 메시지에 Claude 관련 attribution 포함 금지
  - `🤖 Generated with [Claude Code]` 제외
  - `Co-Authored-By: Claude` 제외

## 환경 변수

- `REACT_APP_API_BASE_URL`: API 베이스 URL (기본값: Google Cloud Run 엔드포인트)
- `PUBLIC_URL`: GitHub Pages 배포 시 서브 경로 설정 (`/car_auction`)
