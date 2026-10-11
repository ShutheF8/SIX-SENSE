// 02-A 되묻기 (확신도 낮음)
// 화면으로도, 소리로도 똑같이 물어봄. 기기 버튼 3개 중에 고르거나 말로 다시 대답

import { Redirect, router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BackHeader,
  DEVICE_ICON,
  Glass,
  HeardCard,
  Icon,
  IconTile,
  OutlineButton,
  Screen,
  T,
  TextLink,
} from '@/components/six/ui';
import { DEVICE_NAME, replyText } from '@/engine/describe';
import { resolveWithDevice } from '@/engine/rule-engine';
import { goHome } from '@/lib/nav';
import { speak, stopSpeaking } from '@/lib/voice';
import { useApp } from '@/state/app-state';
import type { DeviceId } from '@/state/types';
import { C } from '@/theme/colors';

const QUESTION = '어떤 기기를 말씀하시는 건가요?';

export default function AskScreen() {
  const { pending: it, home, settings, execute, setPending, logNothing } = useApp();

  // 들어오자마자 소리로 물어봄
  useEffect(() => {
    if (it) speak(QUESTION, settings.voice);
    return () => stopSpeaking();
  }, [it?.utterance]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!it) return <Redirect href="/" />;

  const candidates: DeviceId[] = it.candidates ?? ['light', 'ac', 'blind'];

  const pick = (device: DeviceId) => {
    // 동작(끄기/켜기 등)을 알아들었으면 고른 기기에 바로 적용
    if (it.verb) {
      const action = resolveWithDevice(it.verb, device, home);
      const resolved = { ...it, kind: 'control' as const, actions: [action], reply: replyText([action]) };
      setPending(resolved);
      execute(resolved, 'ask');
      router.replace('/voice/result');
      return;
    }
    // 동작도 모르면 그 기기 화면으로 보내서 직접 누르게 함
    logNothing(it, 'ask');
    goHome();
    if (device === 'light') router.push('/devices/light');
    else if (device === 'ac') router.push('/devices/ac');
    else router.navigate('/devices');
  };

  const cancel = () => {
    logNothing(it, 'ask');
    goHome();
  };

  return (
    <Screen>
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

      <Glass highlight>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <IconTile name="help-circle-outline" size={64} />
          <T v="title" style={{ flex: 1 }}>
            {QUESTION}
          </T>
        </View>
        <View style={styles.speakLine}>
          <Icon name="volume-high" size={22} />
          <T v="body" color={C.sub}>
            소리로도 똑같이 물어봐요
          </T>
        </View>
      </Glass>

      {candidates.map((d) => (
        <Glass key={d} onPress={() => pick(d)} style={styles.option}>
          <IconTile name={DEVICE_ICON[d]} size={60} />
          <T v="title" style={{ flex: 1 }}>
            {DEVICE_NAME[d]}
          </T>
          <Icon name="chevron-right" size={30} color={C.sub} />
        </Glass>
      ))}

      <TextLink label="“불 꺼도”처럼 말로 대답하셔도 돼요" onPress={() => router.replace('/voice/listen')} />
      <OutlineButton label="취소, 아무것도 안 하기" onPress={cancel} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  speakLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16 },
});
