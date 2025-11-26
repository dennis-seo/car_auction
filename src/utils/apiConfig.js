// 중앙 API 설정 파일
// 메인 도메인을 환경변수로 관리합니다. (CRA: 변수명은 REACT_APP_ 접두사 필수)

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://car-auction-849074372493.asia-northeast3.run.app';

export const API_ENDPOINTS = {
  dates: `${API_BASE_URL}/api/dates`,
  // 서버 DB에서 경매 데이터를 가져오는 엔드포인트 (JSON 형식)
  auctionsByDate: (date) => `${API_BASE_URL}/api/auction/${date}`,
};
