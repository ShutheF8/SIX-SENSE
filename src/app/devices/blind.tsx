// 04-3 블라인드 상세: 열린 정도 그림 + 세로 슬라이더 + 올리기/내리기 + 말하기 마이크
// 올리기 = 다 올림(100%), 내리기 = 다 내림(0%, 닫힘). 중간 값은 슬라이더로
// 올리면 창문 뒤로 햇빛이 들어오고, 내리면 날개가 내려와서 가림

import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { DeviceHeader } from '@/components/six/device-header';
import { VSlider } from '@/components/six/vslider';
import { Glass, PrimaryButton, Screen, T, VoiceMic } from '@/components/six/ui';
import { useApp } from '@/state/app-state';
import { C } from '@/theme/colors';

const SLATS = 8;

export default function BlindScreen() {
  const { home, setHome } = useApp();
  const open = home.blind.open;
  const setOpen = (v: number) => setHome({ blind: { open: Math.min(100, Math.max(0, v)) } });

  // 날개 내려오는 애니메이션
  const anim = useRef(new Animated.Value(open)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: open, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
  }, [open, anim]);
  const slatHeight = anim.interpolate({ inputRange: [0, 100], outputRange: ['100%', '0%'] });
  const sun = anim.interpolate({ inputRange: [0, 100], outputRange: [0, 0.55] });

  const label = open === 0 ? '닫힘' : `${open}% 열림`;

  return (
    <Screen scroll={false}>
      <DeviceHeader id="blind" />

      <Glass style={styles.card}>
        <View style={styles.between}>
          <T v="h2">열린 정도</T>
          <T v="title" color={C.primaryText}>
            {label}
          </T>
        </View>

        <View style={styles.body}>
          {/* 창문 그림 */}
          <View style={styles.window}>
            <Animated.View style={[StyleSheet.absoluteFill, styles.sky, { opacity: sun }]} />
            <Animated.View style={[styles.slats, { height: slatHeight }]}>
              {Array.from({ length: SLATS }).map((_, i) => (
                <View key={i} style={styles.slat} />
              ))}
            </Animated.View>
          </View>

          {/* 오른쪽 조절 */}
          <View style={styles.side}>
            <PrimaryButton label="올리기" onPress={() => setOpen(100)} height={60} />
            <T v="bodyBold" color={C.sub} center>
              올림
            </T>
            <VSlider value={open} onChange={setOpen} />
            <T v="bodyBold" color={C.sub} center>
              내림
            </T>
            <PrimaryButton label="내리기" onPress={() => setOpen(0)} height={60} />
          </View>
        </View>
      </Glass>

      <View style={styles.micArea}>
        <VoiceMic size={84} hint="말로도 돼요: “블라인드 쫌 올리라”" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexShrink: 1, gap: 14 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  body: { flexDirection: 'row', gap: 14, height: 380, maxHeight: '100%' },
  window: {
    flex: 1.4,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#8C7F87',
    backgroundColor: '#DCEBFB',
    overflow: 'hidden',
  },
  sky: { backgroundColor: '#FFF1C2' },
  slats: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#FBE4EA', justifyContent: 'space-evenly', overflow: 'hidden' },
  slat: { height: 2.5, backgroundColor: C.primary },
  side: { flex: 1, gap: 8, justifyContent: 'space-between' },
  micArea: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' },
});
