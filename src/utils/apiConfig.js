// 중앙 API 설정 파일
// 메인 도메인을 여기에서만 관리합니다.

export const API_BASE_URL = 'https://car-auction-849074372493.asia-northeast3.run.app';

export const API_ENDPOINTS = {
  dates: `${API_BASE_URL}/api/dates`,
  // 서버 DB에서 경매 데이터를 가져오는 엔드포인트
  // 현재는 기존 CSV 경로와 호환되도록 유지합니다. 서버 수정 시 이 경로만 변경하면 됩니다.
  auctionsByDate: (date) => `${API_BASE_URL}/api/csv/${date}`,
};
