// 에어컨 온도계 (18~30°C)
//   왼쪽: 실내, 권장 온도 (이름 + 숫자). 실내 = 검정, 권장 = 회색
//   오른쪽: 설정 온도 (분홍, 제일 크게). 사용자가 직접 맞추는 값
//   설정이 실내나 권장이랑 같으면 그 왼쪽 글자도 분홍으로 바뀜
//   왼쪽 두 값이 가까우면 글자끼리 안 겹치게 위아래로 밀고, 선은 실제 위치를 가리킴

import { StyleSheet, View } from 'react-native';

import { T } from '@/components/six/ui';
import { C } from '@/theme/colors';

export const T_MIN = 18;
export const T_MAX = 30;

type Props = { indoor: number; recommended: number; target: number; height?: number };

const LEFT_W = 98; // 왼쪽 이름 + 숫자 칸
const TUBE_X = LEFT_W + 22; // 온도계 관 왼쪽
const TUBE_W = 20;
const BULB = 44; // 아래 동그란 부분 지름
const RIGHT_X = TUBE_X + TUBE_W + 22; // 오른쪽 설정 글자 시작
const MERCURY = '#E0607A';
const ROW_H = 26;

export function ThermoScale({ indoor, recommended, target, height = 300 }: Props) {
  const top = 16; // 30°C 위치
  const bottom = height - BULB - 8; // 18°C 위치 (그 아래는 동그란 부분)
  const yOf = (v: number) => top + (1 - (clamp(v) - T_MIN) / (T_MAX - T_MIN)) * (bottom - top);

  // 왼쪽 두 값 위치 정하기
  const left = [
    { key: 'indoor', label: '실내', value: indoor, color: C.text },
    { key: 'rec', label: '권장', value: recommended, color: C.recommend },
  ]
    .map((m) => ({ ...m, color: m.value === target ? C.primaryText : m.color, y: yOf(m.value), ly: yOf(m.value) }))
    .sort((a, b) => a.y - b.y);
  if (left[1].ly - left[0].ly < ROW_H + 4) {
    const mid = (left[0].y + left[1].y) / 2;
    left[0].ly = mid - (ROW_H + 4) / 2;
    left[1].ly = mid + (ROW_H + 4) / 2;
  }

  const ty = yOf(target);
  const SET_H = 70; // "설정" + 큰 숫자 두 줄
  const setTop = Math.min(height - SET_H, Math.max(0, ty - SET_H / 2));
  const ticks = Array.from({ length: T_MAX - T_MIN + 1 }, (_, i) => T_MIN + i);

  return (
    <View style={{ height, flex: 1 }}>
      {/* 끝 숫자 30 / 18 (오른쪽 관 옆에 작게) */}
      <T v="small" color={C.muted} style={[styles.end, { top: top - 11, left: TUBE_X + TUBE_W + 14 }]}>
        {ty - top > 40 ? `${T_MAX}°C` : ''}
      </T>
      <T v="small" color={C.muted} style={[styles.end, { top: bottom - 11, left: TUBE_X + TUBE_W + 14 }]}>
        {bottom - ty > 40 ? `${T_MIN}°C` : ''}
      </T>

      {/* 눈금: 관 오른쪽, 1도마다 짧게, 2도마다 길게 */}
      {ticks.map((t) => (
        <View key={t} style={[styles.tick, { top: yOf(t) - 1, left: TUBE_X + TUBE_W + 2, width: t % 2 === 0 ? 9 : 5 }]} />
      ))}

      {/* 온도계: 유리관 + 아래 동그라미 + 설정 온도까지 차오른 빨간 기둥 */}
      <View style={[styles.tube, { left: TUBE_X, width: TUBE_W, top: top - 12, height: bottom - top + 30 }]} />
      <View style={[styles.mercury, { left: TUBE_X + 5, width: TUBE_W - 10, top: ty, height: height - BULB / 2 - ty }]} />
      <View style={[styles.bulb, { left: TUBE_X + TUBE_W / 2 - BULB / 2, top: height - BULB - 2, width: BULB, height: BULB }]}>
        <View style={styles.bulbIn} />
      </View>

      {/* 왼쪽: 실내, 권장 (선은 관 왼쪽으로) */}
      {left.map((p) => {
        const x2 = TUBE_X;
        const mid = x2 - 10;
        const x1 = LEFT_W + 4;
        const dy = p.ly - p.y;
        return (
          <View key={p.key} pointerEvents="none">
            <View style={[styles.line, { left: x1, top: p.ly - 1, width: mid - x1, backgroundColor: p.color }]} />
            {dy !== 0 ? (
              <View style={[styles.vline, { left: mid - 1, top: Math.min(p.y, p.ly) - 1, height: Math.abs(dy) + 2, backgroundColor: p.color }]} />
            ) : null}
            <View style={[styles.line, { left: mid, top: p.y - 1, width: x2 - mid, backgroundColor: p.color }]} />
            <View style={[styles.dot, { left: TUBE_X + TUBE_W / 2 - 7, top: p.y - 7, backgroundColor: p.color }]} />
            <View style={[styles.leftRow, { top: p.ly - ROW_H / 2, height: ROW_H }]}>
              <T v="bodyBold" color={p.color}>
                {p.label} {p.value}°C
              </T>
            </View>
          </View>
        );
      })}

      {/* 오른쪽: 설정 (선은 관 오른쪽으로) */}
      <View pointerEvents="none">
        <View style={[styles.line, { left: TUBE_X + TUBE_W, top: ty - 1, width: RIGHT_X - TUBE_X - TUBE_W - 4, backgroundColor: C.primaryText }]} />
        <View style={[styles.dot, styles.dotBig, { left: TUBE_X + TUBE_W / 2 - 9, top: ty - 9 }]} />
      </View>
      <View style={[styles.setBox, { left: RIGHT_X, top: setTop, height: SET_H }]}>
        <T v="h2" color={C.primaryText}>
          설정
        </T>
        <T v="title" color={C.primaryText} style={{ fontSize: 32, lineHeight: 38 }}>
          {target}°C
        </T>
      </View>
    </View>
  );
}

function clamp(v: number) {
  return Math.min(T_MAX, Math.max(T_MIN, v));
}

const styles = StyleSheet.create({
  end: { position: 'absolute' },
  tick: { position: 'absolute', height: 2, backgroundColor: 'rgba(107,94,102,0.45)' },
  tube: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#B9A9B1',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  mercury: { position: 'absolute', borderRadius: 6, backgroundColor: MERCURY },
  bulb: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: '#B9A9B1',
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulbIn: { width: '74%', height: '74%', borderRadius: 999, backgroundColor: MERCURY },
  dot: { position: 'absolute', width: 14, height: 14, borderRadius: 7, borderWidth: 2.5, borderColor: '#fff' },
  dotBig: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.primaryText },
  leftRow: { position: 'absolute', left: 0, width: LEFT_W, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  setBox: { position: 'absolute', right: 0, justifyContent: 'center' },
  line: { position: 'absolute', height: 2 },
  vline: { position: 'absolute', width: 2 },
});
