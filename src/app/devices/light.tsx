// 04-1 조명 상세: 큰 켜기/끄기 + 밝기 + 빠르게 고르기 + 말하기 마이크
// 스크롤 없이 한 화면. 꺼져 있으면 아래 조절 칸은 흐리게 막아둠

import { Pressable, StyleSheet, View } from 'react-native';

import { DeviceHeader } from '@/components/six/device-header';
import { Slider } from '@/components/six/slider';
import { Glass, OutlineButton, Screen, T, VoiceMic } from '@/components/six/ui';
import { useApp } from '@/state/app-state';
import { C } from '@/theme/colors';

type Preset = 'dim' | 'normal' | 'bright';
const PRESET_VALUE: Record<Preset, number> = { dim: 30, normal: 70, bright: 100 };
const PRESETS: { label: string; value: Preset }[] = [
  { label: '은은하게', value: 'dim' },
  { label: '보통', value: 'normal' },
  { label: '밝게', value: 'bright' },
];

export default function LightScreen() {
  const { home, setHome } = useApp();
  const { on, brightness } = home.light;

  const setBrightness = (b: number) => setHome({ light: { ...home.light, brightness: Math.min(100, Math.max(10, b)) } });
  const preset: Preset = brightness <= 40 ? 'dim' : brightness >= 90 ? 'bright' : 'normal';

  return (
    <Screen scroll={false}>
      <DeviceHeader id="light" onToggle={() => setHome({ light: { ...home.light, on: !on } })} />

      <View style={[styles.controls, !on && styles.disabled]} pointerEvents={on ? 'auto' : 'none'}>
        <Glass>
          <View style={styles.between}>
            <T v="bodyBold" color={C.sub}>
              밝기
            </T>
            <T v="title" color={C.primaryText}>
              {brightness}%
            </T>
          </View>
          <Slider value={brightness} min={10} onChange={setBrightness} />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <OutlineButton
              label="어둡게"
              icon="minus"
              onPress={() => setBrightness(brightness - 10)}
              style={[styles.darkBtn, { flex: 1 }]}
              dark
            />
            <OutlineButton label="밝게" icon="plus" onPress={() => setBrightness(brightness + 10)} style={{ flex: 1 }} />
          </View>
        </Glass>

        <View style={{ gap: 8 }}>
          <T v="label" color={C.sub}>
            빠르게 고르기
          </T>
          {/* 세로로 크게 하나씩 */}
          {PRESETS.map((p) => {
            const sel = p.value === preset;
            return (
              <Pressable key={p.value} onPress={() => setBrightness(PRESET_VALUE[p.value])} style={[styles.preset, sel && styles.presetOn]}>
                <T v="h2" color={sel ? '#fff' : C.text}>
                  {p.label}
                </T>
              </Pressable>
            );
          })}
        </View>
      </View>

      {!on ? (
        <T v="body" color={C.sub} center>
          꺼져 있어요. 켜면 밝기를 바꿀 수 있어요
        </T>
      ) : null}

      <View style={styles.micArea}>
        <VoiceMic hint="말로도 돼요: “불 꺼도”, “불 쫌 어둡게 해도”" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  controls: { gap: 16 },
  disabled: { opacity: 0.38 },
  darkBtn: { backgroundColor: C.dark, borderColor: C.dark },
  preset: {
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.glassStrong,
    borderWidth: 1.5,
    borderColor: C.glassBorder,
  },
  presetOn: { backgroundColor: C.primary, borderColor: C.primary },
  micArea: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' },
});
