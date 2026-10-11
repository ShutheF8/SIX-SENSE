import type { FontSize } from '@/theme/colors';

export type DeviceId = 'light' | 'ac' | 'blind';
export type FanSpeed = 'low' | 'mid' | 'high';

// 집 안 가전 상태
// 지금은 앱 안에서만 들고 있는 가짜 상태고, 나중에 마음AI 버추얼 홈 / 웹 시뮬레이터랑 연동하면 여기를 서버 값으로 채우면 됨
export type HomeState = {
  indoorTemp: number; // 지금 실내 온도
  recommendedTemp: number; // 이번 달 권장 온도
  light: { on: boolean; brightness: number }; // brightness 0~100
  ac: { on: boolean; target: number; fan: FanSpeed };
  blind: { open: number }; // 열린 정도 0~100. 0 = 다 내림(닫힘), 100 = 다 올림
  favorites: DeviceId[]; // 홈 "자주 쓰는 기기"에 띄울 것 (최대 2개)
};

// 계획서 범위대로 경상도 한 곳만
export type Dialect = '경상도';

export type ExecMode = 'confirm' | 'direct'; // 확인하고 실행 / 바로 실행
export type ViewMode = 'simple' | 'detail'; // 한눈에 / 자세히
export type EngineKind = 'rule' | 'server' | 'ondevice';

export type Settings = {
  userName: string;
  fontSize: FontSize;
  viewMode: ViewMode;
  dialect: Dialect;
  voice: 'calm' | 'bright';
  execMode: ExecMode;
  engine: EngineKind;
  serverUrl: string; // Orange Pi FastAPI 주소 (OpenAI 호환)
  rev?: number; // 저장된 설정 버전 (기본값 바뀔 때 한 번 맞춰주려고)
};

// 대화 기록 한 줄
export type HistoryItem = {
  id: string;
  at: number; // timestamp
  utterance: string; // 들은 말
  summary: string; // "조명 끔", "아무것도 안 함" 같은 결과 한 줄
  confidence: number;
  route: 'auto' | 'confirm' | 'ask' | 'none';
  feedback?: 'good'; // 실행 결과 화면에서 "좋아요"를 누름 = 해결됨
  correction?: string; // "잘못됐어요"로 사용자가 고친 내용 (기기 안에만 저장, 재학습은 다음 단계)
};
