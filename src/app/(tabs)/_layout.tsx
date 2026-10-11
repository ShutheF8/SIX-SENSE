// 하단 탭 (홈, 기기, 기록, 설정)
// 기본 탭바 대신 시안처럼 선택된 탭에 동그란 배경 깔리는 탭바를 직접 그림

import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, T, type IconName } from '@/components/six/ui';
import { C } from '@/theme/colors';

const TAB_INFO: Record<string, { label: string; icon: IconName }> = {
  index: { label: '홈', icon: 'home-outline' },
  devices: { label: '기기', icon: 'view-grid-outline' },
  history: { label: '기록', icon: 'clock-outline' },
  settings: { label: '설정', icon: 'cog-outline' },
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          {state.routes.map((route, i) => {
            const info = TAB_INFO[route.name];
            if (!info) return null;
            const focused = state.index === i;
            return (
              <Pressable
                key={route.key}
                style={styles.item}
                onPress={() => {
                  if (!focused) navigation.navigate(route.name);
                }}>
                <View style={[styles.pill, focused && { backgroundColor: C.tabActiveBg }]}>
                  <Icon name={info.icon} size={28} color={focused ? C.primary : C.sub} />
                </View>
                <T v="label" color={focused ? C.primary : C.sub} style={focused && { fontWeight: '800' }}>
                  {info.label}
                </T>
              </Pressable>
            );
          })}
        </View>
      )}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="devices" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: C.tabBar,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,86,110,0.12)',
    paddingTop: 10,
  },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  pill: { width: 72, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
