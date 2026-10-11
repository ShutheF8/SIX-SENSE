// Orange Pi(또는 보드 오기 전엔 PC)에서 돌아가는 LLM 서버 호출용 엔진
// TODO: 모델 출력이 호출 형식(<six_0>(object=, type=)<six_end>, 16종)으로 바뀌었음.
//       기능 정의서(object, type 번호표) 받으면 parseJson 대신 그 형식 파싱으로 바꾸기
// 형균이 만드는 FastAPI 서버가 OpenAI 호환(/v1/chat/completions)이라 그 형식 그대로 씀
// 집 안 와이파이로만 통신하니까 "외부 전송 0건"은 그대로 유지됨

import { describeChanges, normalizeDialect } from '@/engine/dialect';
import type { DeviceAction, IntentEngine, Interpretation } from '@/engine/types';
import type { HomeState } from '@/state/types';

// 파인튜닝 데이터 형식이랑 맞춰야 함. 바뀌면 모델 담당이랑 같이 고치기
const SYSTEM_PROMPT = `너는 스마트홈 AI 비서 SIX-SENSE야.
사용자 말(경상도 사투리, 혼잣말, 불평 포함)을 보고 집 기기를 어떻게 움직일지 정해.
기기는 light(조명), ac(에어컨), blind(블라인드) 세 개뿐이야.
반드시 아래 JSON 하나만 출력해. 설명 붙이지 마.
{
  "kind": "control" | "ambiguous" | "none",
  "meaning": "사용자 의도를 존댓말 한 문장으로",
  "monologue": true | false,
  "actions": [
    {"device":"light","on":true,"brightness":70},
    {"device":"ac","on":true,"target":24,"fan":"low"|"mid"|"high"},
    {"device":"blind","down":true}
  ],
  "verb": "on" | "off" | "up" | "down" | null,
  "confidence": 0.0 ~ 1.0,
  "reply": "TTS로 읽을 짧은 대답"
}`;

export class ServerEngine implements IntentEngine {
  readonly name = 'Llama 3.2 1B';
  readonly runsOn = 'Orange Pi 5 Plus';

  constructor(private baseUrl: string) {}

  async interpret(utterance: string, home: HomeState): Promise<Interpretation> {
    // 사투리 보정은 앱에서 먼저 하고, 원문이랑 보정문 둘 다 넘김
    const { text, changes } = normalizeDialect(utterance);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000); // 전체 응답 3초 목표인데 여유 있게

    try {
      const res = await fetch(`${this.baseUrl.replace(/\/$/, '')}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'six-sense',
          temperature: 0.1,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: JSON.stringify({
                utterance,
                normalized: text,
                home: {
                  indoorTemp: home.indoorTemp,
                  recommendedTemp: home.recommendedTemp,
                  light: home.light,
                  ac: home.ac,
                  blind: home.blind,
                },
              }),
            },
          ],
        }),
      });

      if (!res.ok) throw new Error(`서버 응답 ${res.status}`);
      const data = await res.json();
      const content: string = data?.choices?.[0]?.message?.content ?? '';
      const parsed = parseJson(content);

      return {
        utterance,
        normalized: text,
        dialectNote: describeChanges(changes),
        kind: parsed.kind ?? 'none',
        meaning: parsed.meaning ?? '',
        monologue: parsed.monologue,
        actions: Array.isArray(parsed.actions) ? (parsed.actions as DeviceAction[]) : [],
        verb: parsed.verb ?? undefined,
        candidates: parsed.kind === 'ambiguous' ? ['light', 'ac', 'blind'] : undefined,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        reply: parsed.reply ?? '',
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

// 작은 모델은 JSON 앞뒤에 말을 붙이는 경우가 있어서 { ... } 부분만 잘라냄
function parseJson(content: string): any {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('모델 응답에서 JSON을 못 찾음');
  return JSON.parse(content.slice(start, end + 1));
}
