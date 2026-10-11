import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppStateProvider, useApp } from '@/state/app-state';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { loaded } = useApp();

  // 저장된 설정(글자 크기 등) 불러온 다음에 스플래시 내림. 안 그러면 글자 크기가 한 번 튐
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="voice/listen" />
        {/* 음성 흐름 화면은 자동으로 넘어가니까 뒤로 스와이프 막아둠 */}
        <Stack.Screen name="voice/confirm" options={{ gestureEnabled: false }} />
        <Stack.Screen name="voice/ask" options={{ gestureEnabled: false }} />
        <Stack.Screen name="voice/none" options={{ gestureEnabled: false }} />
        <Stack.Screen name="voice/result" options={{ gestureEnabled: false }} />
        <Stack.Screen name="devices/light" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="devices/ac" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="devices/blind" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppStateProvider>
      <RootStack />
    </AppStateProvider>
  );
}
