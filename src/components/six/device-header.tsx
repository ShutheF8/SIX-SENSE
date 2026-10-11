// 기기 상세 화면 공통 윗부분 (뒤로가기, 빛 애니메이션 아이콘, 이름, 상태, 큰 켜기/끄기 버튼)

import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { DeviceGlyph } from '@/components/six/device-glyph';
import { BackHeader, Icon, StateButton, T } from '@/components/six/ui';
import { DEVICE_NAME, isOn, statusText } from '@/engine/describe';
import { useApp } from '@/state/app-state';
import type { DeviceId } from '@/state/types';
import { C } from '@/theme/colors';

// onToggle 없으면(블라인드) 큰 버튼 없이 윗부분만
export function DeviceHeader({ id, onToggle }: { id: DeviceId; onToggle?: () => void }) {
  const { home, toggleFavorite } = useApp();
  const fav = home.favorites.includes(id);
  const on = isOn(id, home);

  return (
    <>
      <BackHeader
        label="기기"
        onBack={() => router.back()}
        right={
          <Pressable onPress={() => toggleFavorite(id)} hitSlop={10}>
            <Icon name={fav ? 'star' : 'star-outline'} size={30} color={fav ? C.primary : C.sub} />
          </Pressable>
        }
      />
      <View style={styles.title}>
        <DeviceGlyph id={id} active={on} level={home.blind.open} size={72} />
        <View>
          <T v="hero">{DEVICE_NAME[id]}</T>
          <T v="body" color={C.sub}>
            {statusText(id, home)}
          </T>
        </View>
      </View>
      {/* 버튼 글자는 누르면 할 일. 켜기 = 청록, 끄기 = 주홍 */}
      {onToggle ? <StateButton label={on ? '끄기' : '켜기'} on={!on} onPress={onToggle} height={68} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  title: { flexDirection: 'row', alignItems: 'center', gap: 18 },
});
