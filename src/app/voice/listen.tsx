// 02 듣는 중
// 음성 인식(STT)은 보드 기본 모듈을 쓸 예정이라 아직 연결 전. 그래서 지금은 "말을 들었다고 치고" 시연함
//   마이크 누르면 이 화면이 뜨고, 3초 동안 듣는 척하다가 예시 문장 하나로 자동 진행
//   예시는 누를 때마다 김말순 시나리오 순서대로 돌아감. 아래 칩을 누르면 그 문장으로 바꾸고 3초 다시 셈
// 나중에 STT 붙으면 녹음 -> 텍스트 -> 아래 submit() 로 똑같이 넘기면 됨

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';

import { BackHeader, Glass, Icon, OutlineButton, Screen, T } from '@/components/six/ui';
import { decideRoute, getEngine } from '@/engine';
import { useApp } from '@/state/app-state';
import { C } from '@/theme/colors';

// 김말순 시나리오 4개 + 계획서 기대효과 예시 (데이터 A 사투리, B 모호한 말 기준)
const EXAMPLES = [
  '불 좀 꺼주이소',
  '더버 디지기 딱 좋은 날씨고만',
  '그거 좀 꺼도',
  '옆집은 에어컨 샀다더라',
  '방 좀 시원하게 해줘',
  '블라인드 쫌 올리라',
];
const WAIT = 3;
let nextIndex = 0; // 앱 켜져 있는 동안 다음 예시 순서 기억

const VOICE_PATH = {
  result: '/voice/result',
  confirm: '/voice/confirm',
  ask: '/voice/ask',
  none: '/voice/none',
} as const;

export default function ListenScreen() {
  const { home, settings, setPending, execute, logNothing } = useApp();
  const [said, setSaid] = useState(() => EXAMPLES[nextIndex % EXAMPLES.length]);
  const [left, setLeft] = useState(WAIT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);

  // 다음에 마이크 누르면 그다음 예시
  useEffect(() => {
    nextIndex += 1;
  }, []);

  const submit = async (utterance: string) => {
    if (done.current) return;
    done.current = true;
    setBusy(true);
    setError(null);
    try {
      const it = await getEngine(settings).interpret(utterance, home);
      setPending(it);
      const next = decideRoute(it, settings.execMode);
      if (next === 'result') execute(it, 'auto'); // 확신도 높음 + 바로 실행 -> 먼저 하고 보고
      if (next === 'none') logNothing(it, 'none');
      router.replace(VOICE_PATH[next]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '알아듣다가 문제가 생겼어요');
      setBusy(false);
      done.current = false;
    }
  };

  // 3초 듣는 척 -> 자동 진행. 문장 바꾸면 처음부터 다시 셈
  useEffect(() => {
    if (busy || error) return;
    const started = Date.now();
    setLeft(WAIT);
    const id = setInterval(() => {
      const remain = Math.max(0, WAIT - (Date.now() - started) / 1000);
      setLeft(remain);
      if (remain <= 0) {
        clearInterval(id);
        submit(said);
      }
    }, 100);
    return () => clearInterval(id);
  }, [said, error]); // eslint-disable-line react-hooks/exhaustive-deps

  // 마이크 주변 물결
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const heard = Math.min(said.length, Math.ceil(said.length * ((WAIT - left) / (WAIT - 0.6)))); // 말하는 것처럼 글자가 차례로 나타남

  return (
    <Screen scroll={false}>
      <BackHeader
        label="홈"
        onBack={() => router.back()}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="equalizer" size={26} />
            <T v="bodyBold" color={C.primary}>
              {busy ? '알아듣는 중' : '듣고 있어요'}
            </T>
          </View>
        }
      />

      <View style={styles.center}>
        <View style={styles.micWrap}>
          <Animated.View
            style={[
              styles.wave,
              {
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
              },
            ]}
          />
          <LinearGradient colors={[...C.primaryGrad]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mic}>
            <Icon name="microphone" size={60} color="#fff" />
          </LinearGradient>
        </View>
        <T v="title" center style={{ marginTop: 18 }}>
          {busy ? '알아듣는 중이에요' : '편하게 말씀하세요'}
        </T>
        <T v="body" color={C.sub} center>
          {busy ? '잠깐만 기다려 주세요' : `${Math.ceil(left)}초 뒤 자동으로 넘어가요`}
        </T>
      </View>

      <Glass highlight>
        <T v="label" color={C.sub}>
          들은 말
        </T>
        <T v="title" style={{ marginTop: 6, minHeight: 34 }}>
          “{said.slice(0, Math.max(heard, busy ? said.length : 0))}”
        </T>
      </Glass>

      {error ? (
        <Glass danger>
          <T v="bodyBold" color={C.danger}>
            {error}
          </T>
        </Glass>
      ) : null}

      {/* 시연용: 다른 문장으로 바꾸기 */}
      <View style={{ gap: 8 }}>
        <T v="label" color={C.sub}>
          시연용, 다른 말로 바꾸기
        </T>
        <View style={styles.examples}>
          {EXAMPLES.map((ex) => (
            <Pressable
              key={ex}
              disabled={busy}
              onPress={() => {
                setError(null);
                setSaid(ex);
              }}
              style={({ pressed }) => [styles.example, ex === said && styles.exampleOn, pressed && { opacity: 0.7 }]}>
              <T v="small" color={ex === said ? '#fff' : C.text}>
                “{ex}”
              </T>
            </Pressable>
          ))}
        </View>
      </View>

      <OutlineButton label="그만 듣기" onPress={() => router.back()} height={58} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' },
  micWrap: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  wave: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: C.primary },
  mic: { width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center' },
  examples: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  example: {
    backgroundColor: C.glassStrong,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  exampleOn: { backgroundColor: C.primary, borderColor: C.primary },
});
