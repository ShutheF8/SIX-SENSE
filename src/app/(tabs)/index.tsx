// 01 홈 (대기)
// 스크롤 없이 한 화면: 큰 마이크 + 집 상태 + 자주 쓰는 기기 2칸
// 자주 쓰는 기기: 0개면 "기기 추가하기" 2칸, 1개면 기기 + 추가 1칸, 2개면 추가 칸 없음
// 기기가 조명, 에어컨, 블라인드뿐이라 온도 카드에는 에어컨 버튼만 둠
// 희망 온도는 누를 때마다 바로 반응하지 않고, 손을 뗀 지 3초 지나면 에어컨을 켤지/끌지 묻는 창을 띄움

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { DeviceGlyph } from '@/components/six/device-glyph';
import { Glass, Icon, OutlineButton, Screen, StateButton, T } from '@/components/six/ui';
import { DEVICE_NAME, isOn, statusText } from '@/engine/describe';
import { useDeviceToggle } from '@/lib/use-device-toggle';
import { MAX_FAVORITES, useApp } from '@/state/app-state';
import type { DeviceId } from '@/state/types';
import { C } from '@/theme/colors';

const DETAIL: Record<DeviceId, '/devices/light' | '/devices/ac' | '/devices/blind'> = {
  light: '/devices/light',
  ac: '/devices/ac',
  blind: '/devices/blind',
};

export default function HomeScreen() {
  const { home, settings, setHome } = useApp();
  const toggle = useDeviceToggle();

  // 희망 온도를 마지막으로 바꾼 시각. 3초 동안 더 안 건드리면 에어컨 켜기/끄기를 권하는 창을 띄움
  const [changedAt, setChangedAt] = useState<number | null>(null);
  const [suggest, setSuggest] = useState<'on' | 'off' | null>(null);

  useEffect(() => {
    if (changedAt === null) return;
    const t = setTimeout(() => {
      const { on, target } = home.ac;
      // 꺼져 있는데 지금보다 시원하게 하고 싶으면 켜기 권유
      // 켜져 있는데 지금 온도나 권장 온도보다 높게 맞췄으면 끄기 권유
      if (!on && target < home.indoorTemp) setSuggest('on');
      else if (on && (target >= home.indoorTemp || target > home.recommendedTemp)) setSuggest('off');
      setChangedAt(null);
    }, 3000);
    return () => clearTimeout(t);
  }, [changedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeTarget = (diff: number) => {
    const target = Math.min(30, Math.max(18, home.ac.target + diff));
    setHome({ ac: { ...home.ac, target } });
    setChangedAt(Date.now()); // 누를 때마다 3초 다시 셈
  };

  const answer = (yes: boolean) => {
    if (yes && suggest) setHome({ ac: { ...home.ac, on: suggest === 'on' } });
    setSuggest(null);
  };

  const belowRec = home.recommendedTemp - home.ac.target; // 권장보다 몇 도 낮은지

  const favs = home.favorites.slice(0, MAX_FAVORITES);
  const emptySlots = MAX_FAVORITES - favs.length;

  return (
    <Screen withTabs scroll={false}>
      <View style={{ gap: 10, marginTop: 4 }}>
        <T v="title">
          {settings.userName} 님,{'\n'}편하게 말씀하세요
        </T>
        {/* 프라이버시 배지: 홈에 항상 보이게 (설계 원칙) */}
        <View style={styles.badge}>
          <Icon name="lock-outline" size={18} color={C.primary} />
          <T v="label" color={C.primary}>
            집 안에서만 처리, 외부 전송 없음
          </T>
        </View>
      </View>

      {/* 마이크: 남는 자리를 다 쓰고, 화면이 작으면 같이 줄어듦 */}
      <View style={styles.micArea}>
        <View style={styles.micRing}>
          <Pressable
            onPress={() => router.push('/voice/listen')}
            style={({ pressed }) => [styles.micShadow, pressed && { transform: [{ scale: 0.96 }] }]}>
            <LinearGradient colors={[...C.primaryGrad]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mic}>
              <Icon name="microphone" size={54} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
        <T v="h2" center style={{ marginTop: 10 }}>
          누르고 말씀하세요
        </T>
        <T v="small" color={C.sub} center>
          사투리도, 혼잣말도 괜찮아요
        </T>
      </View>

      {/* 지금 집 상태: 왼쪽 1/3 지금 실내 / 오른쪽 2/3 희망 온도, 권장 온도, 에어컨 버튼 */}
      <View style={{ gap: 8 }}>
        <T v="label" color={C.sub}>
          지금 집 상태
        </T>
        <Glass style={styles.tempCard}>
          <View style={[styles.half, { flex: 1 }]}>
            <T v="bodyBold">지금 실내</T>
            <T v="title" style={styles.tempBig}>
              {home.indoorTemp}°C
            </T>
          </View>
          <View style={styles.vline} />
          <View style={[styles.half, { flex: 2 }]}>
            <T v="bodyBold">희망 온도</T>
            <View style={styles.stepper}>
              <Pressable onPress={() => changeTarget(-1)} hitSlop={8} style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.8 }]}>
                <Icon name="minus" size={28} color="#fff" />
              </Pressable>
              <T v="title" color={C.primaryText} style={styles.tempTarget}>
                {home.ac.target}°C
              </T>
              <Pressable onPress={() => changeTarget(1)} hitSlop={8} style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.8 }]}>
                <Icon name="plus" size={28} color="#fff" />
              </Pressable>
            </View>
            <T v="bodyBold">
              {new Date().getMonth() + 1}월 권장 {home.recommendedTemp}°C
            </T>
            <StateButton
              label={home.ac.on ? '에어컨 ON' : '에어컨 OFF'}
              on={home.ac.on}
              onPress={() => toggle('ac')}
              height={48}
              style={styles.acBtn}
            />
          </View>
        </Glass>
      </View>

      {/* 자주 쓰는 기기 (항상 2칸) */}
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="star" size={20} color={C.primary} />
          <T v="label" color={C.sub}>
            자주 쓰는 기기
          </T>
        </View>
        <View style={styles.grid}>
          {favs.map((id) => {
            const on = isOn(id, home);
            return (
              <Glass key={id} style={styles.favCard} onPress={() => router.push(DETAIL[id])}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <DeviceGlyph id={id} active={on} level={home.blind.open} size={40} />
                  <View style={{ flex: 1 }}>
                    <T v="h2">{DEVICE_NAME[id]}</T>
                    <T v="small" color={C.sub} numberOfLines={1}>
                      {statusText(id, home)}
                    </T>
                  </View>
                </View>
                <StateButton
                  label={id === 'blind' ? (on ? '올림' : '내림') : on ? '켜짐' : '꺼짐'}
                  on={on}
                  onPress={() => toggle(id)}
                  height={50}
                  style={{ marginTop: 10 }}
                />
              </Glass>
            );
          })}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <Pressable key={`add-${i}`} onPress={() => router.navigate('/devices')} style={[styles.favCard, styles.addCard]}>
              <Icon name="plus" size={30} color={C.sub} />
              <T v="bodyBold" color={C.sub}>
                기기 추가하기
              </T>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 희망 온도 바꾸고 3초 뒤 뜨는 권유 창 */}
      <Modal visible={suggest !== null} transparent animationType="fade" onRequestClose={() => answer(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <T v="title" center>
              {suggest === 'on' ? '에어컨을 켤까요?' : '에어컨을 끌까요?'}
            </T>
            <T v="body" color={C.sub} center>
              지금 실내 {home.indoorTemp}°C, 희망 온도 {home.ac.target}°C
            </T>
            {suggest === 'on' && belowRec > 0 ? (
              <T v="bodyBold" color={C.danger} center>
                권장 온도({home.recommendedTemp}°C)보다 {belowRec}°C 낮아요
              </T>
            ) : null}
            {suggest === 'off' ? (
              <T v="bodyBold" center>
                {home.ac.target > home.recommendedTemp
                  ? `권장 온도(${home.recommendedTemp}°C)보다 높게 맞추셔서 에어컨을 꺼도 괜찮아요`
                  : '지금 온도보다 높게 맞추셔서 에어컨이 필요 없어 보여요'}
              </T>
            ) : null}
            <StateButton
              label={suggest === 'on' ? '에어컨 켜기' : '에어컨 끄기'}
              on={suggest === 'on'}
              onPress={() => answer(true)}
              height={60}
              style={{ marginTop: 8 }}
            />
            <OutlineButton label="그대로 두기" onPress={() => answer(false)} height={56} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: C.glassStrong,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  micArea: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' },
  micRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
  micShadow: {
    borderRadius: 65,
    shadowColor: C.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  mic: { width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center' },
  tempCard: { flexDirection: 'row', alignItems: 'stretch', paddingVertical: 14, paddingHorizontal: 10 },
  half: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  vline: { width: 1.5, backgroundColor: C.divider, marginHorizontal: 6 },
  tempBig: { fontSize: 34, lineHeight: 42 },
  tempTarget: { fontSize: 30, lineHeight: 38 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  acBtn: { alignSelf: 'stretch', marginTop: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(42,32,39,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 420, backgroundColor: '#FFF7FA', borderRadius: 28, padding: 24, gap: 10 },
  grid: { flexDirection: 'row', gap: 12 },
  favCard: { flex: 1, minHeight: 140, padding: 14 },
  addCard: {
    borderRadius: 26,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(107,94,102,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
