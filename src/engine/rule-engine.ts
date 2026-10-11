// 규칙 기반 임시 엔진
// LLM 붙이기 전에 화면 흐름(확신도 분기, 되묻기, 해당 없음)을 전부 돌려보려고 만든 것
// 시안에 나온 예시 문장들은 전부 의도대로 나오게 맞춰 놓음
//   "불 좀 꺼주이소"           -> 조명 끄기 (높음)
//   "더버 디지기 딱 좋은 날씨고만" -> 에어컨 24도 + 블라인드 내림 (중간, 혼잣말)
//   "그거 좀 꺼도"             -> 어떤 기기인지 되묻기 (낮음)
//   "옆집은 에어컨 샀다더라"     -> 해당 없음
//   "방 좀 시원하게 해줘"        -> 에어컨 24도 + 블라인드 내림 (중간)
// 김말순 하루 생활 패턴 (페르소나 대표 발화)
//   기상 직후 "아이고 인자 일났다, 블라인드 좀 걷어라" -> 블라인드 올림 (페르소나 정의서: 아침엔 블라인드를 연다)
//   (예외 예시) "아이고 눈부시다, 퍼뜩 좀 가려봐라" -> 블라인드 반쯤 내림 (부분 차광)
//   오후 더위 "아 덥다 아이가, 이거 좀 우예 해봐라" -> 에어컨 켜기 + 블라인드 내림
//   저녁 식후 "불 좀 낮차라, 눈 아프다"          -> 조명 은은하게 (30%)
//   취침 전   "인자 잘란다, 싹 다 꺼라"           -> 조명 끄기 + 블라인드 닫기
// 데이터 C(톤, 감정 기반, 예: "피곤하다")는 7주차 회의에서 이번 학기 범위 밖으로 정해서 규칙도 뺌

import { describeChanges, normalizeDialect } from '@/engine/dialect';
import { DEVICE_NAME, planText, replyText } from '@/engine/describe';
import type { DeviceAction, IntentEngine, Interpretation, Verb } from '@/engine/types';
import type { DeviceId, HomeState } from '@/state/types';

const has = (text: string, words: string[]) => words.some((w) => text.includes(w));

// 기기 이름 찾기
function findDevices(text: string): DeviceId[] {
  const found: DeviceId[] = [];
  if (has(text, ['불', '조명', '전등'])) found.push('light');
  if (has(text, ['에어컨', '냉방'])) found.push('ac');
  if (has(text, ['블라인드', '커튼'])) found.push('blind');
  return found;
}

// 동작 찾기
function findVerb(text: string): Verb | undefined {
  if (has(text, ['꺼', '끄', '끕'])) return 'off';
  if (has(text, ['켜', '켭'])) return 'on';
  if (has(text, ['올려', '올리', '밝게'])) return 'up';
  if (has(text, ['내려', '내리', '어둡게', '은은하게', '낮춰', '낮추'])) return 'down';
  return undefined;
}

// 남 얘기, 전해 들은 말 ("~더라", "~했대")은 우리 집 제어가 아님
function isHearsay(text: string): boolean {
  return has(text, ['더라', '했대', '샀대', '샀다', '라던데', '이래', '했다던']);
}

function verbToAction(device: DeviceId, verb: Verb, home: HomeState): DeviceAction {
  if (device === 'light') {
    if (verb === 'off') return { device: 'light', on: false };
    if (verb === 'on') return { device: 'light', on: true };
    const step = verb === 'up' ? 20 : -20;
    const b = Math.max(10, Math.min(100, home.light.brightness + step));
    return { device: 'light', on: true, brightness: b };
  }
  if (device === 'ac') {
    if (verb === 'off') return { device: 'ac', on: false };
    if (verb === 'on') return { device: 'ac', on: true };
    const t = home.ac.target + (verb === 'up' ? 1 : -1);
    return { device: 'ac', on: true, target: t };
  }
  // 블라인드는 켜기/올리기 = 올림, 끄기/내리기 = 내림
  return { device: 'blind', down: verb === 'off' || verb === 'down' };
}

export class RuleEngine implements IntentEngine {
  readonly name = '규칙 엔진 (임시)';
  readonly runsOn = '이 폰';

  // 엔진 공통 인터페이스라 async. 실제 LLM이랑 똑같이 약간 기다리게 해둠
  async interpret(utterance: string, home: HomeState): Promise<Interpretation> {
    await new Promise((r) => setTimeout(r, 350));

    const { text, changes } = normalizeDialect(utterance);
    const dialectNote = describeChanges(changes);
    const devices = findDevices(text);
    const verb = findVerb(text);
    const base = { utterance, normalized: text, dialectNote };

    // 1) 남 얘기
    if (isHearsay(text)) {
      return {
        ...base,
        kind: 'none',
        meaning: '제가 도와드릴 수 있는 일이 아니에요',
        actions: [],
        confidence: 0.3,
        reply: '우리 집 기기를 움직이라는 말은 아니라서 그대로 둘게요.',
      };
    }

    // 1-1) 취침 전: "이제 잘 거야, 전부 꺼라" -> 조명 끄고 블라인드 닫기
    if (has(text, ['잘 거', '잘거', '자야겠', '잘게', '잘께']) || (has(text, ['전부', '다 꺼']) && verb === 'off')) {
      const actions: DeviceAction[] = [{ device: 'light', on: false }];
      if (home.blind.open > 0) actions.push({ device: 'blind', down: true });
      return {
        ...base,
        kind: 'control',
        monologue: false,
        meaning: '주무시려는 것 같아요',
        actions,
        confidence: 0.88,
        reply: actions.length > 1 ? '네, 불 끄고 블라인드 닫았어요. 편히 주무세요.' : '네, 불 껐어요. 편히 주무세요.',
      };
    }

    // 1-2) 기상 직후: "인자 일났다, 블라인드 좀 걷어라" -> 블라인드 올림
    if (has(text, ['일어났', '잘 잤', '잘잤'])) {
      return {
        ...base,
        kind: 'control',
        monologue: false,
        meaning: '일어나셨으니 블라인드를 올려 달라고 하셨어요',
        actions: [{ device: 'blind', open: 100 }],
        confidence: 0.91,
        reply: '네, 블라인드 올렸어요. 좋은 아침이에요.',
      };
    }

    // 1-2b) 눈부심: "눈부시다, 빨리 좀 가려 봐" -> 블라인드 반쯤 내림 (눈부심은 블라인드로만 처리, 조명이랑 안 겹치게)
    if (has(text, ['눈부', '부셔', '가려'])) {
      return {
        ...base,
        kind: 'control',
        monologue: !has(text, ['가려']),
        meaning: '햇빛이 눈부시다고 하셨어요',
        actions: [{ device: 'blind', open: 50 }],
        confidence: 0.84,
        reply: '네, 블라인드 반쯤 내렸어요.',
      };
    }

    // 1-3) 저녁 식후: "불 좀 낮춰라, 눈 아프다" -> 조명 은은하게
    if (devices.includes('light') && has(text, ['낮춰', '낮추', '눈 아프', '은은'])) {
      return {
        ...base,
        kind: 'control',
        meaning: '불을 은은하게 낮춰 달라고 하셨어요',
        actions: [{ device: 'light', on: true, brightness: 30 }],
        confidence: 0.93,
        reply: '네, 불 은은하게 낮췄어요.',
      };
    }

    // 2) 기기 + 동작이 다 있는 명령
    if (devices.length > 0 && verb) {
      const actions = devices.map((d) => verbToAction(d, verb, home));
      const title = actions.map(planText).join(', ');
      return {
        ...base,
        kind: 'control',
        meaning: title,
        actions,
        confidence: changes.length > 0 ? 0.92 : 0.96,
        reply: replyText(actions),
      };
    }

    // 3) 동작은 있는데 기기를 모르겠음 -> 되묻기
    if (!devices.length && verb) {
      return {
        ...base,
        kind: 'ambiguous',
        meaning: '어떤 기기를 말씀하시는 건가요?',
        actions: [],
        verb,
        candidates: ['light', 'ac', 'blind'],
        confidence: 0.54,
        reply: '어떤 기기를 말씀하시는 건가요?',
      };
    }

    // 4) 혼잣말, 불평에서 유추 (상황 인지형 센스 제어)
    if (has(text, ['더워', '덥', '찜통', '죽겠', '시원하게'])) {
      // 실내가 권장 온도보다 높으면 4도 정도 내림. 22도 밑으로는 안 내려감
      const target = Math.max(22, Math.min(home.indoorTemp - 4, home.recommendedTemp - 2));
      const actions: DeviceAction[] = [{ device: 'ac', on: true, target, fan: 'mid' }];
      if (home.blind.open > 0) actions.push({ device: 'blind', down: true });
      // "방 좀 시원하게 해줘"처럼 부탁한 말이면 혼잣말이 아님 (계획서 기대효과 1-1)
      const asked = has(text, ['해 줘', '해줘', '해 주세요', '해주세요', '해라']);
      return {
        ...base,
        kind: 'control',
        monologue: !asked,
        meaning: asked ? '시원하게 해 달라고 하셨어요' : '덥다고 느끼시는 것 같아요',
        actions,
        confidence: 0.84,
        reply:
          actions.length > 1 ? `네, ${target}도로 켜고 블라인드 내렸어요. 금방 시원해질 거예요.` : `네, 에어컨 ${target}도로 켰어요.`,
      };
    }
    if (has(text, ['추워', '춥', '쌀쌀'])) {
      return {
        ...base,
        kind: 'control',
        monologue: true,
        meaning: '춥다고 느끼시는 것 같아요',
        actions: [{ device: 'ac', on: false }],
        confidence: 0.8,
        reply: '에어컨 껐어요.',
      };
    }
    if (has(text, ['답답', '어두워', '깜깜'])) {
      const actions: DeviceAction[] = [{ device: 'blind', down: false }];
      if (has(text, ['어두워', '깜깜'])) actions.push({ device: 'light', on: true, brightness: 100 });
      return {
        ...base,
        kind: 'control',
        monologue: true,
        meaning: has(text, ['답답']) ? '답답하게 느끼시는 것 같아요' : '어둡다고 느끼시는 것 같아요',
        actions,
        confidence: 0.76,
        reply: actions.length > 1 ? '블라인드 올리고 불 밝게 켰어요.' : '블라인드 올렸어요.',
      };
    }

    // 5) 기기 이름만 있고 뭘 하라는 건지 모름 -> 되묻기 대신 해당 없음 처리
    if (devices.length > 0) {
      return {
        ...base,
        kind: 'none',
        meaning: '제가 도와드릴 수 있는 일이 아니에요',
        actions: [],
        confidence: 0.4,
        reply: `${DEVICE_NAME[devices[0]]} 이야기는 들렸는데 뭘 하라는 건지 모르겠어요.`,
      };
    }

    return {
      ...base,
      kind: 'none',
      meaning: '제가 도와드릴 수 있는 일이 아니에요',
      actions: [],
      confidence: 0.2,
      reply: '우리 집 기기랑 관련 없는 말 같아서 그대로 둘게요.',
    };
  }
}

// 되묻기 화면에서 기기를 고르면 원래 동작이랑 합쳐서 명령 만들어 줌
export function resolveWithDevice(verb: Verb, device: DeviceId, home: HomeState): DeviceAction {
  return verbToAction(device, verb, home);
}
