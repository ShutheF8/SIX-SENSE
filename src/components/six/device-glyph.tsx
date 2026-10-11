// 기기 아이콘 + 켜짐/꺼짐 애니메이션
// 켜지거나 올라가면 빛이 들어오고, 꺼지거나 내려가면 빛이 꺼짐
//   조명: 노란 빛이 번지면서 전구가 켜짐
//   에어컨: 시원한 파란 빛 + 눈꽃이 천천히 돌아감
//   블라인드: 날개가 위로 걷히면서 뒤에서 햇빛이 들어옴 (열린 정도만큼)

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import type { DeviceId } from '@/state/types';
import { C } from '@/theme/colors';

const NATIVE = Platform.OS !== 'web';

type Props = {
  id: DeviceId;
  active: boolean; // 켜짐 / 올라감
  level?: number; // 블라인드 열린 정도 0~100
  size?: number;
};

export function DeviceGlyph({ id, active, level, size = 60 }: Props) {
  if (id === 'blind') return <BlindGlyph open={level ?? (active ? 100 : 0)} size={size} />;
  return <GlowGlyph id={id} active={active} size={size} />;
}

const GLOW = {
  light: { halo: 'rgba(255,196,61,0.55)', tile: '#FFF3CF', icon: '#E59A00', onIcon: 'lightbulb-on', offIcon: 'lightbulb-outline' },
  ac: { halo: 'rgba(110,190,255,0.5)', tile: '#E3F2FF', icon: '#2B86D1', onIcon: 'snowflake', offIcon: 'snowflake' },
} as const;

function GlowGlyph({ id, active, size }: { id: 'light' | 'ac'; active: boolean; size: number }) {
  const g = GLOW[id];
  const on = useRef(new Animated.Value(active ? 1 : 0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(on, {
      toValue: active ? 1 : 0,
      duration: active ? 450 : 350,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE,
    }).start();
  }, [active, on]);

  // 에어컨은 켜져 있는 동안 눈꽃이 천천히 돔
  useEffect(() => {
    if (id !== 'ac' || !active) {
      spin.stopAnimation();
      return;
    }
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: NATIVE }),
    );
    spin.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [id, active, spin]);

  const halo = size * 1.45;
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* 번지는 빛 */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: halo,
          height: halo,
          borderRadius: halo / 2,
          backgroundColor: g.halo,
          opacity: on,
          transform: [{ scale: on.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
        }}
      />
      {/* 꺼진 타일 위에 켜진 타일을 겹쳐서 색이 서서히 바뀌게 */}
      <View style={[styles.tile, { width: size, height: size, borderRadius: size / 2, backgroundColor: C.offTile }]} />
      <Animated.View
        style={[
          styles.tile,
          { position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: g.tile, opacity: on },
        ]}
      />
      <MaterialCommunityIcons name={g.offIcon} size={size * 0.5} color={C.offIcon} style={{ position: 'absolute' }} />
      <Animated.View style={{ position: 'absolute', opacity: on, transform: [{ rotate }] }}>
        <MaterialCommunityIcons name={g.onIcon} size={size * 0.5} color={g.icon} />
      </Animated.View>
    </View>
  );
}

function BlindGlyph({ open, size }: { open: number; size: number }) {
  const v = useRef(new Animated.Value(open)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: open, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
  }, [open, v]);

  const inner = size * 0.62;
  // 날개 높이 = 닫힌 만큼
  const slatH = v.interpolate({ inputRange: [0, 100], outputRange: [inner, inner * 0.12] });
  const sun = v.interpolate({ inputRange: [0, 100], outputRange: [0, 1] });
  const halo = size * 1.45;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: halo,
          height: halo,
          borderRadius: halo / 2,
          backgroundColor: 'rgba(255,196,61,0.45)',
          opacity: sun,
        }}
      />
      <View style={[styles.tile, { width: size, height: size, borderRadius: size / 2, backgroundColor: C.primarySoft }]}>
        {/* 창문: 뒤에 햇빛, 위에서 내려오는 날개 */}
        <View style={[styles.window, { width: inner, height: inner }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFE7A3', opacity: sun }]} />
          <Animated.View style={[styles.slats, { height: slatH }]}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.slatLine} />
            ))}
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
  window: {
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.primary,
    backgroundColor: '#E6EEF6',
    overflow: 'hidden',
  },
  slats: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F8DCE4',
    justifyContent: 'space-evenly',
    overflow: 'hidden',
  },
  slatLine: { height: 2, backgroundColor: C.primary, opacity: 0.8 },
});
