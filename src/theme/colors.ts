// 화면 구조/흐름은 7주차 시안, 색은 6주차 글래스모피즘(핑크) 시안 기준
// 팀에서 색 바꾸기로 하면 여기만 고치면 됨

export const C = {
  // 배경 그라데이션 (왼쪽 위 -> 오른쪽 아래)
  bg: ['#FDEBF3', '#F1E2FB', '#FBE6EA'] as const,
  // 배경에 깔리는 흐릿한 색 덩어리 (글래스 느낌 내려고)
  blobPink: '#FFB3CF',
  blobLavender: '#D7C2FF',
  blobPeach: '#FFD3C2',

  primary: '#C8566E', // 주 버튼, 켜짐 상태
  primaryGrad: ['#D9768E', '#B9435E'] as const, // 주 버튼 그라데이션
  primarySoft: '#F8DCE4', // 아이콘 동그라미, 칩 배경
  primaryText: '#C24F68', // 강조 숫자 (희망 온도, 확신도)

  text: '#2A2027',
  sub: '#6B5E66',
  muted: '#9A8C94',

  // 유리 카드
  glass: 'rgba(255,255,255,0.62)',
  glassStrong: 'rgba(255,255,255,0.82)',
  glassBorder: 'rgba(255,255,255,0.95)',
  divider: 'rgba(200,86,110,0.12)',
  track: 'rgba(255,255,255,0.7)', // 진행바 빈 부분

  // 기기 켜짐 / 꺼짐 (혁민님 7주차 시안 기준 청록, 주홍. 색약도 구분되는 조합이고 글자도 항상 같이 씀)
  on: '#009E73',
  off: '#D55E00',
  offTile: '#EDE6EA', // 꺼진 기기 아이콘 바탕
  offIcon: '#9A8C94',
  dark: '#2A2027',
  recommend: '#8A7E85', // 권장 온도 (참고값이라 튀지 않는 회색) // "어둡게" 버튼처럼 검은 바탕

  danger: '#B4233C',
  dangerSoft: '#FBDDE2',

  tabBar: 'rgba(255,255,255,0.92)',
  tabActiveBg: '#F9DCE5',
  shadow: '#B9435E',
} as const;

// 설정 "글자 크기"에 곱하는 배율. 시안 기본값이 "크게"라서 크게 = 1
export const FONT_SCALE = {
  normal: 0.9,
  large: 1,
  xlarge: 1.15,
} as const;

export type FontSize = keyof typeof FONT_SCALE;
