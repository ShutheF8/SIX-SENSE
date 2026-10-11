// 블라인드 열린 정도 세로 슬라이더 (위 = 다 올림 100, 아래 = 다 내림 0)

import { useRef, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { C } from '@/theme/colors';

type Props = { value: number; step?: number; onChange: (v: number) => void };

export function VSlider({ value, step = 10, onChange }: Props) {
  const [height, setHeight] = useState(1);
  // 손가락을 누른 지점(pageY)과 그때 값을 기억해 두고, 움직인 거리만큼만 바꿈
  // locationY는 손가락이 칸 밖으로 나가거나 손잡이 위로 지나가면 기준이 바뀌어서
  // 0 -> 100, 100 -> 0 으로 확 튀는 문제가 있었음
  const start = useRef({ pageY: 0, value: 0 });
  const last = useRef(value);
  last.current = value;

  const toStep = (raw: number) => Math.min(100, Math.max(0, Math.round(raw / step) * step));
  const emit = (next: number) => {
    if (next !== last.current) {
      last.current = next;
      onChange(next);
    }
  };

  const grant = (e: GestureResponderEvent) => {
    // 처음 누른 곳은 칸 안이라 locationY가 정확함. 거기로 바로 이동
    const y = Math.min(height, Math.max(0, e.nativeEvent.locationY));
    const v = toStep((1 - y / height) * 100);
    start.current = { pageY: e.nativeEvent.pageY, value: v };
    emit(v);
  };

  const move = (e: GestureResponderEvent) => {
    const dy = e.nativeEvent.pageY - start.current.pageY;
    // 끝까지 가면 0, 100에서 멈춤 (넘어가도 반대쪽으로 안 넘어감)
    emit(toStep(start.current.value - (dy / height) * 100));
  };

  return (
    <View
      style={styles.hit}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={grant}
      onResponderMove={move}
      onResponderTerminationRequest={() => false}>
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
