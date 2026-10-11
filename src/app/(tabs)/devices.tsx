// 04 기기 제어
// 말로 하기 어려울 때 쓰는 수동 제어. 카드 누르면 상세, 오른쪽 버튼은 바로 켜기/끄기
// 켜지거나 올라가면 아이콘에 빛이 들어오고, 꺼지거나 내려가면 빛이 꺼짐

import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { DeviceGlyph } from '@/components/six/device-glyph';
import { Glass, Icon, Screen, StateButton, T, VoiceMicBox } from '@/components/six/ui';
import { DEVICE_NAME, isOn, statusText } from '@/engine/describe';
import { useDeviceToggle } from '@/lib/use-device-toggle';
import { useApp } from '@/state/app-state';
import type { DeviceId } from '@/state/types';
import { C } from '@/theme/colors';

const ORDER: DeviceId[] = ['light', 'ac', 'blind'];

const DETAIL: Record<DeviceId, '/devices/light' | '/devices/ac' | '/devices/blind'> = {
  light: '/devices/light',
  ac: '/devices/ac',
  blind: '/devices/blind',
};

// 버튼 글자 = 지금 상태
function buttonLabel(id: DeviceId, on: boolean) {
  if (id === 'blind') return on ? '올림' : '내림';
  return on ? '켜짐' : '꺼짐';
}

export default function DevicesScreen() {
  const { home, toggleFavorite } = useApp();
  const toggle = useDeviceToggle();

  return (
    <Screen withTabs scroll={false}>
      <View style={{ marginTop: 12 }}>
        <T v="hero">기기 제어</T>
        <T v="body" color={C.sub}>
          말이 어려울 땐 여기서 직접 누르세요
        </T>
      </View>

      {ORDER.map((id) => {
        const on = isOn(id, home);
        const fav = home.favorites.includes(id);
        return (
          <Glass key={id} style={styles.card} onPress={() => router.push(DETAIL[id])}>
            <DeviceGlyph id={id} active={on} level={home.blind.open} size={60} />
            <View style={{ flex: 1 }}>
              <T v="h2">{DEVICE_NAME[id]}</T>
              <T v="small" color={C.sub}>
                {statusText(id, home)}
              </T>
            </View>
            <Pressable onPress={() => toggleFavorite(id)} hitSlop={10}>
              <Icon name={fav ? 'star' : 'star-outline'} size={30} color={fav ? C.primary : C.sub} />
            </Pressable>
            <StateButton label={buttonLabel(id, on)} on={on} onPress={() => toggle(id)} style={styles.toggle} />
          </Glass>
        );
      })}

      {/* 범례: 색만으로 구분 안 되게 상자 안에 글자도 같이 */}
      <View style={styles.legend}>
        <View style={[styles.legendBox, { backgroundColor: C.on }]}>
          <T v="label" color="#fff">
            켜짐
          </T>
        </View>
        <View style={[styles.legendBox, { backgroundColor: C.off }]}>
          <T v="label" color="#fff">
            꺼짐
          </T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 4 }}>
          <Icon name="star" size={22} color={C.primary} />
          <T v="small">홈에 표시 (최대 2개)</T>
        </View>
      </View>

      {/* 방금 한 음성 명령은 기록 탭에서 볼 수 있어서, 남는 자리는 말하기 버튼으로 */}
      <View style={{ flex: 1 }} />
      <VoiceMicBox hint="누르고 말하면 켜고 끌 수 있어요" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 18 },
  toggle: { minWidth: 92 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4, flexWrap: 'wrap' },
  legendBox: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 },
});
