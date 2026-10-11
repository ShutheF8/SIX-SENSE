import { useEffect, useRef, useState } from 'react';

// n초 카운트다운. 0 되면 onDone 한 번 호출
// 해석 확인(3초 자동 실행), 결과/해당 없음 화면(5초 뒤 홈) 에서 같이 씀
export function useCountdown(seconds: number, onDone: () => void, enabled = true) {
  const [left, setLeft] = useState(seconds);
  const doneRef = useRef(onDone);
  // 최신 콜백 유지 (화면 상태 바뀌어도 타이머 다시 안 걸리게)
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    if (!enabled) return;
    const startedAt = Date.now();
    const id = setInterval(() => {
      const remain = Math.max(0, seconds - (Date.now() - startedAt) / 1000);
      setLeft(remain);
      if (remain <= 0) {
        clearInterval(id);
        doneRef.current();
      }
    }, 100);
    return () => clearInterval(id);
  }, [seconds, enabled]);

  return left; // 소수점 포함 남은 초
}
