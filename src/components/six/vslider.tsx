// 블라인드 열린 정도 세로 슬라이더 (위 = 다 올림 100, 아래 = 다 내림 0)

import { useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { C } from '@/theme/colors';

type Props = { value: number; step?: number; onChange: (v: number) => void };

export function VSlider({ value, step = 10, onChange }: Props) {
  const [height, setHeight] = useState(1);

  const handle = (e: GestureResponderEvent) => {
    const y = Math.min(height, Math.max(0, e.nativeEvent.locationY));
    const raw = (1 - y / height) * 100;
    const next = Math.min(100, Math.max(0, Math.round(raw / step) * step));
    if (next !== value) onChange(next);
  };

  return (
    <View
      style={styles.hit}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handle}
      onResponderMove={handle}>
      <View style={styles.track} pointerEvents="none">
        <View style={[styles.fill, { height: `${value}%` }]} />
      </View>
      <View style={[styles.thumb, { top: (1 - value / 100) * height - 20 }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { flex: 1, width: 64, alignItems: 'center', alignSelf: 'center' },
  track: { flex: 1, width: 16, borderRadius: 8, backgroundColor: 'rgba(200,86,110,0.18)', justifyContent: 'flex-end', overflow: 'hidden' },
  fill: { width: '100%', backgroundColor: C.primary, borderRadius: 8 },
  thumb: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary,
    borderWidth: 4,
    borderColor: '#fff',
  },
});
