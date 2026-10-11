// 밝기 조절용 가로 슬라이더
// 슬라이더 라이브러리는 Expo Go 호환 신경 쓰기 싫어서 터치 이벤트로 직접 만듦

import { useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { C } from '@/theme/colors';

type Props = { value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void };

export function Slider({ value, min = 0, max = 100, step = 10, onChange }: Props) {
  const [width, setWidth] = useState(1);
  const ratio = (value - min) / (max - min);

  const handle = (e: GestureResponderEvent) => {
    const x = Math.min(width, Math.max(0, e.nativeEvent.locationX));
    const raw = min + (x / width) * (max - min);
    const snapped = Math.round(raw / step) * step;
    const next = Math.min(max, Math.max(min, snapped));
    if (next !== value) onChange(next);
  };

  return (
    <View
      style={styles.hitArea}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handle}
      onResponderMove={handle}>
      <View style={styles.track} pointerEvents="none">
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
      <View style={[styles.thumb, { left: ratio * width - 18 }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: { height: 48, justifyContent: 'center' },
  track: { height: 14, borderRadius: 7, backgroundColor: C.track, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: C.primary, borderRadius: 7 },
  thumb: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: C.primary,
  },
});
