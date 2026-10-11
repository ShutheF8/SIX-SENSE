// 03 실행 결과, 상황 인지
// 혼잣말/불평에서 유추한 의도 + 지금 -> 목표 + 움직인 기기 목록 + 음성 응답. 5초 뒤 홈

import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BackHeader,
  DEVICE_ICON,
  Glass,
  Icon,
  IconTile,
  OutlineButton,
  PrimaryButton,
  Screen,
  T,
} from '@/components/six/ui';
import { doneText } from '@/engine/describe';
import { goHome } from '@/lib/nav';
import { useCountdown } from '@/lib/use-countdown';
import { speak, stopSpeaking } from '@/lib/voice';
import { useApp } from '@/state/app-state';
import { C } from '@/theme/colors';

export default function ResultScreen() {
  const { pending: it, home, undoSnapshot, settings, undo, markGood } = useApp();
  const [undone, setUndone] = useState(false);
  const left = useRef(false);

  // 실행 전 실내 온도 (목표 온도 비교용). 실행 후 home 이 바뀌어도 처음 값 유지
  const before = useRef(undoSnapshot ?? home).current;

  const remain = useCountdown(5, () => {
    if (!left.current) goHome();
  }, !!it && !undone);

  useEffect(() => {
    if (it?.reply) speak(it.reply, settings.voice);
    return () => stopSpeaking();
  }, [it?.reply]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!it) return <Redirect href="/" />;

  const acAction = it.actions.find((a) => a.device === 'ac' && a.on !== false && a.target !== undefined);
  const target = acAction && acAction.device === 'ac' ? acAction.target : undefined;

  const onUndo = () => {
    undo();
    setUndone(true);
    speak('원래대로 돌려놨어요.', settings.voice);
  };

  const leave = () => {
    left.current = true;
    goHome();
  };

  const sub = it.monologue ? '혼잣말로 들렸어요' : '';

  return (
    <Screen
      footer={
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <OutlineButton
            label={undone ? '되돌렸어요' : '되돌리기'}
            icon="undo-variant"
            onPress={onUndo}
            style={{ flex: 1, opacity: undone ? 0.5 : 1 }}
          />
          <PrimaryButton
            label="좋아요"
            icon="thumb-up-outline"
            onPress={() => {
              if (!undone) markGood(); // 기록에 "해결됐어요"로 남김
              leave();
            }}
            style={{ flex: 1 }}
          />
        </View>
      }>
      <BackHeader
        label="홈"
        onBack={leave}
        right={
          !undone ? (
            <T v="bodyBold" color={C.sub}>
              {Math.ceil(remain)}초 뒤 홈으로
            </T>
          ) : undefined
        }
      />

      <View style={styles.titleRow}>
        <LinearGradient colors={[...C.primaryGrad]} style={styles.check}>
          <Icon name={undone ? 'undo-variant' : 'check'} size={30} color="#fff" />
        </LinearGradient>
        <T v="hero">{undone ? '원래대로 돌렸어요' : '이렇게 했어요'}</T>
      </View>

      <Glass>
        <T v="label" color={C.sub}>
          들은 말
        </T>
        <T v="h2" style={{ marginTop: 4 }}>
          “{it.utterance}”
        </T>
        <T v="body" color={C.sub}>
          {it.meaning}
        </T>
        {settings.viewMode === 'detail' ? (
          <T v="small" color={C.muted} style={{ marginTop: 4 }}>
            {sub ? `${sub}, ` : ''}확신도 {Math.round(it.confidence * 100)}%
          </T>
        ) : null}
      </Glass>

      {target !== undefined ? (
        <Glass style={styles.tempCard}>
          <View style={{ alignItems: 'center' }}>
            <T v="body" color={C.sub}>
              지금 실내
            </T>
            <T v="big">{before.indoorTemp}°C</T>
          </View>
          <Icon name="arrow-right" size={34} />
          <View style={{ alignItems: 'center' }}>
            <T v="body" color={C.sub}>
              목표
            </T>
            <T v="big" color={C.primaryText}>
              {target}°C
            </T>
          </View>
        </Glass>
      ) : null}

      <T v="label" color={C.sub}>
        움직인 기기
      </T>
      <Glass style={{ paddingVertical: 8 }}>
        {it.actions.map((a, i) => {
          const d = doneText(a, home);
          return (
            <View key={i} style={[styles.doneRow, i > 0 && styles.doneBorder]}>
              <IconTile name={DEVICE_ICON[a.device]} size={56} />
              <View style={{ flex: 1 }}>
                <T v="h2" style={undone && { textDecorationLine: 'line-through', color: C.muted }}>
                  {d.title}
                </T>
                {d.sub ? (
                  <T v="small" color={C.sub}>
                    {d.sub}
                  </T>
                ) : null}
              </View>
              {!undone ? <Icon name="check" size={30} /> : null}
            </View>
          );
        })}
      </Glass>

      {it.reply ? (
        <View style={styles.reply}>
          <Icon name="volume-high" size={26} />
          <T v="bodyBold" style={{ flex: 1 }}>
            “{it.reply}”
          </T>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  check: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  tempCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  doneBorder: { borderTopWidth: 1.5, borderTopColor: C.divider },
  reply: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.primarySoft,
    borderRadius: 20,
    padding: 16,
  },
});
