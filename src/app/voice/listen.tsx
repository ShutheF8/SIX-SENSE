// 02 듣는 중
// 음성 인식(STT)은 보드 기본 모듈을 쓸 예정이라 아직 연결 전. 그래서 지금은 "말을 들었다고 치고" 시연함
//   마이크 누르면 이 화면이 뜨고, 3초 동안 듣다가(빈칸) 3초 뒤 들은 말이 들어오고, 그걸 3초 보여준 다음 자동 진행
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

// 김말순 하루 생활 패턴 대표 발화 (기상 직후, 오후 더위, 저녁 식후, 취침 전)
// 뒤의 두 개는 되묻기, 해당 없음 화면 시연용
const EXAMPLES = [
  '아이고 인자 일났다, 블라인드 좀 걷어라',
  '아 덥다 아이가, 이거 좀 우예 해봐라',
  '불 좀 낮차라, 눈 아프다',
  '인자 잘란다, 싹 다 꺼라',
  '그거 좀 꺼도',
  '옆집은 에어컨 샀다더라',
  '아이고 눈부시다, 퍼뜩 좀 가려봐라',
];
const LISTEN = 3; // 듣는 시간 (이 동안 들은 말 칸은 비어 있음)
const SHOW = 3; // 들은 말을 보여주는 시간 (앞 1.5초는 타자 치듯 글자가 들어오고, 나머지는 다 들어온 채로)
const TYPE = 1.5;
const WAIT = LISTEN + SHOW;
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

  // 3초 듣기 -> 들은 말 표시 -> 3초 뒤 자동 진행. 문장 바꾸면 처음부터 다시 셈
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

  const elapsed = WAIT - left;
  const listening = !busy && elapsed < LISTEN; // 아직 듣는 중이면 꿈틀거리는 점만
  const typed = busy ? said.length : Math.min(said.length, Math.ceil(said.length * ((elapsed - LISTEN) / TYPE)));

  return (
    <Screen scroll={false}>
      <BackHeader
        label="홈"
        onBack={() => router.back()}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="equalizer" size={26} />
            <T v="bodyBold" color={C.primary}>
              {busy ? '알아듣는 중' : listening ? '듣고 있어요' : '들었어요'}
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
          {busy ? '알아듣는 중이에요' : listening ? '편하게 말씀하세요' : '이렇게 들었어요'}
        </T>
        <T v="body" color={C.sub} center>
          {busy ? '잠깐만 기다려 주세요' : listening ? '말씀을 듣고 있어요' : `${Math.ceil(left)}초 뒤 자동으로 넘어가요`}
        </T>
      </View>

      <Glass highlight>
        <T v="label" color={C.sub}>
          들은 말
        </T>
        {listening ? (
          <WigglingDots />
        ) : (
          <T v="title" style={{ marginTop: 6, minHeight: 34 }}>
            “{said.slice(0, Math.max(0, typed))}
            {typed < said.length ? <T v="title" color={C.primary}>|</T> : '”'}
          </T>
        )}
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

// 듣는 동안 점 세 개가 차례로 위아래로 움직임 (지렁이처럼 꿈틀)
function WigglingDots() {
  const vals = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const native = Platform.OS !== 'web';
    const one = (v: Animated.Value) =>
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: native }),
        Animated.timing(v, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: native }),
      ]);
    const loop = Animated.loop(Animated.stagger(140, vals.map(one)));
    loop.start();
    return () => loop.stop();
  }, [vals]);
  return (
    <View style={styles.dots}>
      {vals.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              transform: [
                { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
                { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) },
              ],
              opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 34, marginTop: 6, paddingLeft: 4 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: C.primary },
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
