// 음성 출력(TTS)
// 지금은 폰 기본 TTS(expo-speech)로 읽어줌. 보드 오면 VITS(sherpa-onnx) 쪽에서 스피커로 내보내는 걸로 바뀜

import * as Speech from 'expo-speech';

import type { Settings } from '@/state/types';

export function speak(text: string, voice: Settings['voice']) {
  if (!text) return;
  Speech.stop();
  Speech.speak(text, {
    language: 'ko-KR',
    rate: voice === 'calm' ? 0.9 : 1.05, // 어르신 대상이라 기본은 살짝 느리게
    pitch: voice === 'calm' ? 0.95 : 1.1,
  });
}

export function stopSpeaking() {
  Speech.stop();
}
