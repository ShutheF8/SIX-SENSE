import { router } from 'expo-router';

// 음성 흐름 화면들(확인, 되묻기, 결과...)을 다 닫고 홈 탭으로
export function goHome() {
  if (router.canDismiss()) router.dismissAll();
  else router.replace('/');
}
