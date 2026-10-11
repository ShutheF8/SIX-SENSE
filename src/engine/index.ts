import { OnDeviceEngine } from '@/engine/ondevice-engine';
import { RuleEngine } from '@/engine/rule-engine';
import { ServerEngine } from '@/engine/server-engine';
import type { IntentEngine, Interpretation } from '@/engine/types';
import type { ExecMode, Settings } from '@/state/types';

const rule = new RuleEngine();
const onDevice = new OnDeviceEngine();

// 설정에서 고른 엔진 돌려줌
export function getEngine(settings: Settings): IntentEngine {
  if (settings.engine === 'server') return new ServerEngine(settings.serverUrl);
  if (settings.engine === 'ondevice') return onDevice;
  return rule;
}

// 확신도 분기 기준
// 수행계획서대로 임시값 90% / 70%. 파인튜닝 후 평가셋 보고 모델 담당이랑 다시 정하기로 함
export const CONFIDENCE_HIGH = 0.9;
export const CONFIDENCE_MID = 0.7;

export type VoiceRoute = 'result' | 'confirm' | 'ask' | 'none';

// 해석 결과를 보고 다음 화면을 정함
//   높음 -> 바로 실행 후 결과 화면 (단, 설정이 "확인하고 실행"이면 확인 화면)
//   중간 -> 3초 확인 화면
//   낮음 -> 되묻기
export function decideRoute(it: Interpretation, execMode: ExecMode): VoiceRoute {
  if (it.kind === 'none') return 'none';
  if (it.kind === 'ambiguous' || it.confidence < CONFIDENCE_MID || it.actions.length === 0) return 'ask';
  if (it.confidence >= CONFIDENCE_HIGH && execMode === 'direct') return 'result';
  return 'confirm';
}
