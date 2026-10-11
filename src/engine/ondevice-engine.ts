// 폰 안에서 LLM 직접 돌리는 엔진 자리
//
// llama.rn은 네이티브 모듈이라 Expo Go에서는 import만 해도 앱이 죽음
// 그래서 development build 만들기 전까지는 비워두고, 고를 수만 있게 해둠
//
// dev build 하고 나면 대략 이런 식으로 채우면 됨
//   npx expo install llama.rn expo-file-system
//   import { initLlama } from 'llama.rn';
//   const ctx = await initLlama({ model: 모델경로(gguf), n_ctx: 1024, n_gpu_layers: 99 });
//   const out = await ctx.completion({ messages: [...], n_predict: 200, temperature: 0.1 });
//   -> out.text 에서 JSON 잘라서 ServerEngine이랑 똑같이 Interpretation 으로 변환
// 프롬프트는 server-engine.ts 의 SYSTEM_PROMPT 그대로 같이 쓰면 됨

import type { IntentEngine, Interpretation } from '@/engine/types';
import type { HomeState } from '@/state/types';

export class OnDeviceEngine implements IntentEngine {
  readonly name = 'Qwen 1.5B (GGUF)';
  readonly runsOn = '이 폰';

  async interpret(_utterance: string, _home: HomeState): Promise<Interpretation> {
    throw new Error('폰 내부 LLM은 development build 만든 다음에 쓸 수 있어요. 설정에서 다른 엔진을 골라 주세요.');
  }
}
