// 제어 명령 / 기기 상태를 화면에 보여줄 한국어 문장으로 바꾸는 함수들
// 화면마다 문구를 따로 만들면 나중에 꼭 어긋나서 한 군데로 모음

import type { DeviceAction } from '@/engine/types';
import type { DeviceId, FanSpeed, HomeState } from '@/state/types';

export const DEVICE_NAME: Record<DeviceId, string> = {
  light: '조명',
  ac: '에어컨',
  blind: '블라인드',
};

export const FAN_NAME: Record<FanSpeed, string> = {
  low: '약하게',
  mid: '보통',
  high: '세게',
};

// 해석 확인 화면 "이렇게 할게요" 줄
export function planText(a: DeviceAction): string {
  switch (a.device) {
    case 'light':
      if (a.on === false) return '조명 끄기';
      if (a.brightness !== undefined) return `조명 밝기 ${a.brightness}%`;
      return '조명 켜기';
    case 'ac':
      if (a.on === false) return '에어컨 끄기';
      if (a.target !== undefined) return `에어컨 켜고 ${a.target}°C`;
      return '에어컨 켜기';
    case 'blind':
      if (a.open !== undefined) return `블라인드 ${a.open}% 열기`;
      return a.down ? '블라인드 내리기' : '블라인드 올리기';
  }
}

// 실행 결과 화면 "움직인 기기" 줄 (제목 + 작은 설명)
export function doneText(a: DeviceAction, home: HomeState): { title: string; sub: string } {
  switch (a.device) {
    case 'light':
      if (a.on === false) return { title: '조명 끔', sub: '' };
      return { title: `조명 켬, 밝기 ${a.brightness ?? home.light.brightness}%`, sub: '' };
    case 'ac':
      if (a.on === false) return { title: '에어컨 끔', sub: '' };
      return {
        title: `에어컨 켬, ${a.target ?? home.ac.target}°C`,
        sub: `냉방, 바람 ${FAN_NAME[a.fan ?? home.ac.fan]}`,
      };
    case 'blind':
      if (a.open !== undefined && a.open > 0 && a.open < 100) return { title: `블라인드 ${a.open}% 열림`, sub: '햇빛 조금 들어옴' };
      return blindDown(a) ? { title: '블라인드 내림', sub: '햇빛 가림' } : { title: '블라인드 올림', sub: '햇빛 들어옴' };
  }
}

// 대화 기록에 남길 한 줄 요약 ("에어컨 24°C, 블라인드 내림")
export function summaryText(actions: DeviceAction[]): string {
  if (actions.length === 0) return '아무것도 안 함';
  const parts = actions.map((a) => {
    if (a.device === 'light') {
      if (a.on === false) return '조명 끔';
      return a.brightness !== undefined ? `조명 ${a.brightness}%` : '조명 켬';
    }
    if (a.device === 'ac') {
      if (a.on === false) return '에어컨 끔';
      return a.target !== undefined ? `에어컨 ${a.target}°C` : '에어컨 켬';
    }
    return blindDown(a) ? '블라인드 내림' : '블라인드 올림';
  });
  return parts.join(', ');
}

// TTS로 읽어줄 짧은 대답 ("네, 조명 껐어요.")
export function replyText(actions: DeviceAction[]): string {
  const parts = actions.map((a) => {
    if (a.device === 'light') {
      if (a.on === false) return '조명 껐어요';
      return a.brightness !== undefined ? `조명 밝기 ${a.brightness}%로 맞췄어요` : '조명 켰어요';
    }
    if (a.device === 'ac') {
      if (a.on === false) return '에어컨 껐어요';
      return a.target !== undefined ? `에어컨 ${a.target}도로 맞췄어요` : '에어컨 켰어요';
    }
    return blindDown(a) ? '블라인드 내렸어요' : '블라인드 올렸어요';
  });
  return `네, ${parts.join(', ')}.`;
}

// 기기 카드 아래 작은 글씨 상태
export function statusText(id: DeviceId, home: HomeState): string {
  if (id === 'light') return home.light.on ? `켜짐, 밝기 ${home.light.brightness}%` : '꺼짐';
  if (id === 'ac') return home.ac.on ? `켜짐, 희망 ${home.ac.target}°C` : `꺼짐, 희망 ${home.ac.target}°C`;
  return home.blind.open === 0 ? '닫혀 있음' : `${home.blind.open}% 열림`;
}

// "해당 없음" 화면처럼 짧게 상태만 보여줄 때
export function shortStatus(id: DeviceId, home: HomeState): string {
  if (id === 'light') return home.light.on ? '켜짐' : '꺼짐';
  if (id === 'ac') return home.ac.on ? '켜짐' : '꺼짐';
  return home.blind.open === 0 ? '내림' : '올림';
}

export function isOn(id: DeviceId, home: HomeState): boolean {
  if (id === 'light') return home.light.on;
  if (id === 'ac') return home.ac.on;
  return home.blind.open > 0; // 블라인드는 올라가 있으면(빛이 들어오면) 켜진 걸로 침
}

function blindDown(a: Extract<DeviceAction, { device: 'blind' }>): boolean {
  if (a.open !== undefined) return a.open === 0;
  return !!a.down;
}
