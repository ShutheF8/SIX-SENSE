import { useApp } from '@/state/app-state';
import type { DeviceId } from '@/state/types';

// 손으로 누르는 켜기/끄기 (홈 "자주 쓰는 기기", 기기 제어 화면에서 같이 씀)
export function useDeviceToggle() {
  const { home, setHome } = useApp();

  return (id: DeviceId) => {
    if (id === 'light') setHome({ light: { ...home.light, on: !home.light.on } });
    else if (id === 'ac') setHome({ ac: { ...home.ac, on: !home.ac.on } });
    else setHome({ blind: { open: home.blind.open > 0 ? 0 : 100 } }); // 조금이라도 열려 있으면 다 내림
  };
}
