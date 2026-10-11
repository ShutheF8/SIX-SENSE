// 04-2 에어컨 상세: 큰 켜기/끄기 + 희망 온도 + 바람 세기(세로로 크게) + 말하기 마이크
// 스크롤 없이 한 화면. 꺼져 있으면 아래 조절 칸은 흐리게 막아둠

import { Pressable, StyleSheet, View } from 'react-native';

import { DeviceHeader } from '@/components/six/device-header';
import { ThermoScale } from '@/components/six/thermo';
import { Glass, Icon, Screen, T, VoiceMic } from '@/components/six/ui';
import { useApp } from '@/state/app-state';
import type { FanSpeed } from '@/state/types';
import { C } from '@/theme/colors';

const FANS: { label: string; value: FanSpeed }[] = [
  { label: '약하게', value: 'low' },
  { label: '보통', value: 'mid' },
  { label: '세게', value: 'high' },
];

export default function AcScreen() {
  const { home, setHome } = useApp();
  const { on, target, fan } = home.ac;

  const setTarget = (t: number) => setHome({ ac: { ...home.ac, target: Math.min(30, Math.max(18, t)) } });
  const setFan = (f: FanSpeed) => setHome({ ac: { ...home.ac, fan: f } });

  const diff = target - home.recommendedTemp;
  const diffText =
    diff === 0 ? '권장 온도랑 같아요' : diff < 0 ? `권장 온도보다 ${-diff}°C 낮아요` : `권장 온도보다 ${diff}°C 높아요`;

  return (
    <Screen scroll={false}>
      <DeviceHeader id="ac" onToggle={() => setHome({ ac: { ...home.ac, on: !on } })} />

      <View style={[styles.controls, !on && styles.disabled]} pointerEvents={on ? 'auto' : 'none'}>
        {/* 온도 막대: 왼쪽 18~30°C 막대에 실내 / 권장 / 희망 위치, 오른쪽 올리기 / 내리기 */}
        <Glass style={{ paddingVertical: 14, paddingHorizontal: 14 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ThermoScale
              indoor={home.indoorTemp}
              recommended={home.recommendedTemp}
              target={target}
              height={300}
            />
            {/* 올리기 / 내리기: 온도계 높이를 반반 나눠 크게 */}
            <View style={styles.side}>
              <Pressable onPress={() => setTarget(target + 1)} style={({ pressed }) => [styles.sideBtn, pressed && { opacity: 0.8 }]}>
                <Icon name="plus" size={40} color={C.text} />
                <T v="h2">올리기</T>
              </Pressable>
              <Pressable onPress={() => setTarget(target - 1)} style={({ pressed }) => [styles.sideBtn, pressed && { opacity: 0.8 }]}>
                <Icon name="minus" size={40} color={C.text} />
                <T v="h2">내리기</T>
              </Pressable>
            </View>
          </View>
          <T v="bodyBold" color={C.text} style={{ marginTop: 8 }}>
            {diffText}
          </T>
        </Glass>

        <View style={{ gap: 8 }}>
          <T v="label" color={C.sub}>
            바람 세기
          </T>
          {/* 가로로 3개 (세로 공간은 온도계에 양보) */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {FANS.map((f) => {
              const sel = f.value === fan;
              return (
                <Pressable key={f.value} onPress={() => setFan(f.value)} style={[styles.fan, sel && styles.fanOn]}>
                  <T v="h2" color={sel ? '#fff' : C.text}>
                    {f.label}
                  </T>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.micArea}>
        <VoiceMic size={72} hint={on ? '말로도 돼요: “쫌 시원하게 해도”' : '말로도 돼요: “에어컨 켜도”'} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  side: { width: 92, gap: 10 },
  sideBtn: {
    flex: 1,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: C.glassStrong,
    borderWidth: 1.5,
    borderColor: C.glassBorder,
  },
  controls: { gap: 14 },
  disabled: { opacity: 0.38 },
  fan: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.glassStrong,
    borderWidth: 1.5,
    borderColor: C.glassBorder,
  },
  fanOn: { backgroundColor: C.primary, borderColor: C.primary },
  micArea: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' },
});
