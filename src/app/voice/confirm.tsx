// 02 해석 확인 (확신도 중간)
// <들은 말 -> 이해한 뜻 -> 할 일> 순서로 보여주고 3초 뒤 자동 실행. 그 사이 취소 가능

import { Redirect, router } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BackHeader,
  Chip,
  DEVICE_ICON,
  Glass,
  Icon,
  IconTile,
  OutlineButton,
  PrimaryButton,
  HeardCard,
  Screen,
  T,
  TextLink,
} from '@/components/six/ui';
import { planText } from '@/engine/describe';
import { goHome } from '@/lib/nav';
import { useCountdown } from '@/lib/use-countdown';
import { useApp } from '@/state/app-state';
import { C } from '@/theme/colors';

const WAIT = 3;

export default function ConfirmScreen() {
  const { pending: it, settings, execute, logNothing } = useApp();
  const done = useRef(false); // 버튼이랑 카운트다운이 동시에 실행시키는 거 막기

  const run = () => {
    if (!it || done.current) return;
    done.current = true;
    execute(it, 'confirm');
    router.replace('/voice/result');
  };

  const left = useCountdown(WAIT, run, !!it);

  if (!it) return <Redirect href="/" />;

  const cancel = () => {
    if (done.current) return;
    done.current = true;
    logNothing(it, 'confirm');
    goHome();
  };

  const detail = settings.viewMode === 'detail';

  return (
    <Screen
      footer={
        <>
          <View style={styles.between}>
            <T v="body" color={C.sub}>
              {WAIT}초 뒤 자동으로 실행해요
            </T>
            <T v="bodyBold">{Math.ceil(left)}초</T>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${((WAIT - left) / WAIT) * 100}%` }]} />
          </View>
          <PrimaryButton label="네, 지금 실행" icon="check" onPress={run} />
          <OutlineButton label="아니요, 취소" onPress={cancel} />
          <TextLink label="잘못 알아들었어요, 다시 말하기" onPress={() => router.replace('/voice/listen')} />
        </>
      }>
      <BackHeader
        label="홈"
        onBack={cancel}
        right={
          <T v="bodyBold" color={C.sub}>
            확신도 {Math.round(it.confidence * 100)}%
          </T>
        }
      />

      <HeardCard text={it.utterance} />

      <View style={styles.arrow}>
        <Icon name="arrow-down" size={22} color={C.sub} />
        <T v="bodyBold" color={C.sub}>
          이렇게 이해했어요
        </T>
      </View>

      <Glass highlight>
        <T v="title">{it.meaning}</T>
        {it.dialectNote ? (
          <T v="body" color={C.sub} style={{ marginTop: 4 }}>
            사투리 풀이: {it.dialectNote}
          </T>
        ) : null}

        {/* 혼잣말 표시는 항상, 보정된 문장은 "자세히" 모드에서만. 말투 태그는 C 범위 제외로 뺌 */}
        <View style={styles.chips}>
          {it.monologue ? <Chip label="혼잣말로 들렸어요" /> : null}
          {detail && it.normalized && it.normalized !== it.utterance ? <Chip label={`“${it.normalized}”`} /> : null}
        </View>

        <View style={styles.divider} />
        <T v="label" color={C.sub}>
          이렇게 할게요
        </T>
        {it.actions.map((a, i) => (
          <View key={i} style={styles.action}>
            <IconTile name={DEVICE_ICON[a.device]} size={56} />
            <T v="h2">{planText(a)}</T>
          </View>
        ))}
      </Glass>
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  track: { height: 12, borderRadius: 6, backgroundColor: C.track, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: C.primary, borderRadius: 6 },
  arrow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  divider: { height: 1.5, backgroundColor: C.divider, marginVertical: 14 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 },
});
