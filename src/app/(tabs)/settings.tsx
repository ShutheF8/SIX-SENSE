// 06 설정 (6주차 시안 모양으로 되돌림)
// 보기(글자 크기) -> 화면 모드 -> 말투 -> 실행 방식 -> 개인정보
// 맨 아래 "AI 엔진"은 시안에 없는 개발용 줄 (규칙 / Orange Pi 서버 / 폰 내부)

import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Glass, Icon, RadioList, Screen, T } from '@/components/six/ui';
import { getEngine } from '@/engine';
import { speak } from '@/lib/voice';
import { DEFAULT_EXEC, useApp } from '@/state/app-state';
import type { EngineKind, Settings } from '@/state/types';
import type { FontSize } from '@/theme/colors';
import { C } from '@/theme/colors';

const VOICE_LABEL: Record<Settings['voice'], string> = { calm: '따뜻한 여성, 보통 속도', bright: '밝은 여성, 조금 빠르게' };
const ENGINE_LABEL: Record<EngineKind, string> = { rule: '규칙 (임시)', server: 'Orange Pi 서버', ondevice: '폰 내부 LLM' };
const ENGINE_ORDER: EngineKind[] = ['rule', 'server', 'ondevice'];

// 글자 크기 버튼은 글자 자체가 점점 커지게 (설정 배율이랑 상관없이 고정 크기)
const FONT_OPTIONS: { label: string; value: FontSize; size: number }[] = [
  { label: '보통', value: 'normal', size: 16 },
  { label: '크게', value: 'large', size: 19 },
  { label: '아주 크게', value: 'xlarge', size: 23 },
];

export default function SettingsScreen() {
  const { settings, setSettings } = useApp();
  const engine = getEngine(settings);

  const nextVoice = () => {
    const voice = settings.voice === 'calm' ? 'bright' : 'calm';
    setSettings({ voice });
    speak('이 목소리로 대답할게요.', voice); // 바꾸자마자 들려줌
  };
  const nextEngine = () => {
    const i = ENGINE_ORDER.indexOf(settings.engine);
    setSettings({ engine: ENGINE_ORDER[(i + 1) % ENGINE_ORDER.length] });
  };

  return (
    <Screen withTabs>
      <T v="hero" style={{ marginTop: 12 }}>
        설정
      </T>

      <Section title="보기" />
      <Glass>
        <T v="h2" style={{ marginBottom: 12 }}>
          글자 크기
        </T>
        <View style={styles.fontSeg}>
          {FONT_OPTIONS.map((o) => {
            const on = o.value === settings.fontSize;
            return (
              <Pressable
                key={o.value}
                onPress={() => setSettings({ fontSize: o.value })}
                style={[styles.fontBtn, on && { backgroundColor: C.primary }]}>
                <T v="bodyBold" color={on ? '#fff' : C.text} style={{ fontSize: o.size, lineHeight: o.size * 1.3 }}>
                  {o.label}
                </T>
              </Pressable>
            );
          })}
        </View>
      </Glass>

      <Section title="화면 모드" />
      <RadioList
        value={settings.viewMode}
        // 화면 모드를 바꾸면 실행 방식도 그 모드 기본값으로 (한눈에 = 바로 실행). 이후 따로 바꿀 수 있음
        onChange={(viewMode) => setSettings({ viewMode, execMode: DEFAULT_EXEC[viewMode] })}
        options={[
          { label: '한눈에 모드', desc: '큰 글씨로 꼭 필요한 것만. 세부 조절은 기기를 눌러서', value: 'simple' },
          { label: '자세히 모드', desc: '한 화면에 상태와 수치를 모두 보여줘요', value: 'detail' },
        ]}
      />

      <Section title="말투" />
      <Glass style={{ paddingVertical: 4 }}>
        <Row label="내 사투리 지역" value={settings.dialect} />
        <Row label="응답 목소리" value={VOICE_LABEL[settings.voice]} onPress={nextVoice} last />
      </Glass>

      <Section title="실행 방식" />
      <RadioList
        value={settings.execMode}
        onChange={(execMode) => setSettings({ execMode })}
        options={[
          { label: '확인하고 실행', desc: '실행 전에 3초 동안 보여줘요, 취소 가능', value: 'confirm' },
          { label: '바로 실행', desc: '확실할 때는 바로 하고 결과만 알려줘요', value: 'direct' },
        ]}
      />

      <Section title="개인정보" />
      <Glass style={{ backgroundColor: C.primarySoft, borderColor: C.primary }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="lock-outline" size={24} color={C.text} />
          <T v="h2">{settings.engine === 'server' ? '모든 처리는 집 안 보드에서 해요' : '모든 처리는 이 폰 안에서 해요'}</T>
        </View>
        <View style={{ marginTop: 10 }}>
          <InfoLine label="AI 모델" value={engine.name} />
          <InfoLine label="처리 장치" value={engine.runsOn} />
          <InfoLine label="외부 전송" value="0건" accent />
        </View>
      </Glass>

      <Section title="개발용" />
      <Glass style={{ paddingVertical: 4 }}>
        <Row label="AI 엔진" value={ENGINE_LABEL[settings.engine]} onPress={nextEngine} last />
      </Glass>
      {settings.engine === 'server' ? (
        <Glass>
          <T v="label" color={C.sub}>
            서버 주소 (집 와이파이 안)
          </T>
          <TextInput
            value={settings.serverUrl}
            onChangeText={(serverUrl) => setSettings({ serverUrl })}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.input}
          />
        </Glass>
      ) : null}
    </Screen>
  );
}

function Section({ title }: { title: string }) {
  return (
    <T v="label" color={C.sub} style={{ marginBottom: -6, marginTop: 4 }}>
      {title}
    </T>
  );
}

function Row({ label, value, onPress, last }: { label: string; value: string; onPress?: () => void; last?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.row, !last && styles.rowBorder]}>
      <T v="bodyBold">{label}</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
        <T v="body" color={C.sub} style={{ textAlign: 'right' }}>
          {value}
        </T>
        {onPress ? <Icon name="chevron-right" size={24} color={C.sub} /> : null}
      </View>
    </Pressable>
  );
}

function InfoLine({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.info}>
      <T v="body" color={C.sub}>
        {label}
      </T>
      <T v="bodyBold" color={accent ? C.primaryText : C.text}>
        {value}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  fontSeg: { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 18, padding: 6 },
  fontBtn: { flex: 1, minHeight: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 60, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.divider },
  info: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  input: {
    marginTop: 8,
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    fontSize: 17,
    color: C.text,
  },
});
