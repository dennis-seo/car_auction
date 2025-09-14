// 연료 그룹 정의: UI 그룹 라벨 -> 실제 데이터상의 변형 값 목록
// 이 파일만 수정하면 그룹 라벨과 매핑을 전체에서 공유할 수 있습니다.
export const FUEL_GROUPS = {
  '가솔린': ['가솔린', '휘발유'],
  '디젤': ['디젤', '경유'],
  '하이브리드': ['하이브리드', '가솔린하이브리드'],
  'LPG': ['LPG'],
  '전기': ['전기']
};

export const ALL_FUEL_VARIANTS = Object.values(FUEL_GROUPS).flat();
