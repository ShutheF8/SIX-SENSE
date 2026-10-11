import type { DeviceId, FanSpeed, HomeState } from '@/state/types';

// LLM(또는 규칙)이 뽑아내야 하는 제어 명령 하나
export type DeviceAction =
  | { device: 'light'; on?: boolean; brightness?: number }
  | { device: 'ac'; on?: boolean; target?: number; fan?: FanSpeed }
  | { device: 'blind'; down?: boolean; open?: number }; // open 있으면 그 값, 없으면 down 으로 다 내림 / 다 올림

// 기기를 못 정했을 때(되묻기) 사용자가 하려던 동작
export type Verb = 'on' | 'off' | 'up' | 'down';

// 해석 결과. 화면은 전부 이 모양만 보고 움직임
export type Interpretation = {
  utterance: string; // 들은 말 원문
  normalized?: string; // 사투리 보정 후 문장
  kind: 'control' | 'ambiguous' | 'none';
  meaning: string; // "덥다고 느끼시는 것 같아요", "조명 끄기"
  dialectNote?: string; // "더버 -> 더워, 디지기 -> 죽기"
  monologue?: boolean; // 명령이 아니라 혼잣말/불평에서 유추한 경우
  actions: DeviceAction[];
  verb?: Verb; // ambiguous 일 때 기기 고르면 이 동작으로 실행
  candidates?: DeviceId[]; // ambiguous 일 때 되물어볼 기기 후보
  confidence: number; // 0~1
  reply: string; // TTS로 읽어줄 문장
};

// 엔진 인터페이스
// 규칙 엔진 / Orange Pi 서버 / 폰 내부 LLM 전부 이걸 구현해서 갈아끼움
export interface IntentEngine {
  readonly name: string; // 설정 화면 "AI 모델"
  readonly runsOn: string; // 설정 화면 "처리 장치"
  interpret(utterance: string, home: HomeState): Promise<Interpretation>;
}
