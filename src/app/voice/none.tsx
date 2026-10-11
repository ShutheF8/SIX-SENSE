// 02-B 해당 없음
// 기기 이름이 들려도 우리 집 제어 요청이 아니면 아무것도 안 하고, 그대로라는 걸 보여줌. 5초 뒤 홈

import { Redirect, router } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BackHeader,
  DEVICE_ICON,
  Glass,
  HeardCard,
  Icon,
  IconTile,
  OutlineButton,
  PrimaryButton,
  Screen,
  T,
} from '@/components/six/ui';
import { DEVICE_NAME, shortStatus } from '@/engine/describe';
import { goHome } from '@/lib/nav';
import { useCountdown } from '@/lib/use-countdown';
import { useApp } from '@/state/app-state';
import type { DeviceId } from '@/state/types';
import { C } from '@/theme/colors';

const DEVICES: DeviceId[] = ['light', 'ac', 'blind'];

export default function NoneScreen() {
  const { pending: it, home } = useApp();
  const left = useRef(false);
  const remain = useCountdown(5, () => {
    if (!left.current) goHome();
  }, !!it);

  if (!it) return <Redirect href="/" />;

  const mentioned = ['불', '조명', '에어컨', '블라인드'].some((w) => it.utterance.includes(w));

  const leave = (fn: () => void) => {
    left.current = true;
    fn();
  };

  return (
    <Screen
      footer={
        <>
          <PrimaryButton label="다시 말하기" icon="microphone" onPress={() => leave(() => router.replace('/voice/listen'))} />
          <OutlineButton label="홈으로" onPress={() => leave(goHome)} />
        </>
      }>
      <BackHeader
        label="홈"
        onBack={() => leave(goHome)}
        right={
          <T v="bodyBold" color={C.sub}>
            {Math.ceil(remain)}초 뒤 홈으로
          </T>
        }
      />

      <HeardCard text={it.utterance} />

      <Glass danger>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <IconTile name="information-outline" size={64} danger />
          <T v="title" style={{ flex: 1 }}>
            제가 도와드릴 수 있는 일이 아니에요
          </T>
        </View>
        <T v="body" color={C.sub} style={{ marginTop: 12 }}>
          {mentioned
            ? '기기 이름이 들렸지만, 우리 집 기기를 움직이라는 말은 아니라서 아무것도 하지 않았어요.'
            : '우리 집 기기랑 관련 없는 말 같아서 아무것도 하지 않았어요.'}
        </T>
      </Glass>

      <Glass>
        <T v="label" color={C.sub}>
          우리 집 기기는 그대로예요
        </T>
        {DEVICES.map((d) => (
          <View key={d} style={styles.row}>
            <Icon name={DEVICE_ICON[d]} size={28} color={C.text} />
            <T v="h2" style={{ flex: 1 }}>
              {DEVICE_NAME[d]}
            </T>
            <T v="h2">{shortStatus(d, home)}</T>
          </View>
        ))}
      </Glass>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
});
