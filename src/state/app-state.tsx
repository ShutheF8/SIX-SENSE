// 앱 전체 상태 (집 기기 상태, 설정, 대화 기록, 지금 처리 중인 음성 해석)
// 라이브러리 안 쓰고 Context + useReducer 로만 구성함
// 설정이랑 기록은 AsyncStorage 에 저장해서 앱 껐다 켜도 남아 있게 함 (기기 밖으로는 안 나감)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';

import { summaryText } from '@/engine/describe';
import type { DeviceAction, Interpretation } from '@/engine/types';
import type { HistoryItem, HomeState, Settings } from '@/state/types';

const STORAGE_KEY = 'six-sense/v1';
const SETTINGS_REV = 2;

// 화면 모드별 실행 방식 기본값: 한눈에 = 바로 실행, 자세히 = 확인하고 실행
export const DEFAULT_EXEC: Record<Settings['viewMode'], Settings['execMode']> = { simple: 'direct', detail: 'confirm' };

const initialHome: HomeState = {
  indoorTemp: 28,
  recommendedTemp: 26,
  light: { on: true, brightness: 70 },
  ac: { on: false, target: 24, fan: 'mid' },
  blind: { open: 100 },
  favorites: ['light'],
};

const initialSettings: Settings = {
  userName: '말순',
  fontSize: 'large',
  viewMode: 'simple',
  dialect: '경상도',
  voice: 'calm',
  execMode: 'direct', // 한눈에 모드 기본값은 바로 실행
  engine: 'rule',
  serverUrl: 'http://192.168.0.10:8000',
  rev: SETTINGS_REV,
};

type State = {
  loaded: boolean;
  home: HomeState;
  settings: Settings;
  history: HistoryItem[];
  pending: Interpretation | null; // 해석 확인 / 되묻기 / 결과 화면이 같이 보는 값
  undoSnapshot: HomeState | null; // 실행 결과 화면 "되돌리기"용
  lastHistoryId: string | null;
};

type Action =
  | { type: 'LOAD'; data: Partial<Pick<State, 'home' | 'settings' | 'history'>> }
  | { type: 'SET_HOME'; patch: Partial<HomeState> }
  | { type: 'SET_SETTINGS'; patch: Partial<Settings> }
  | { type: 'SET_PENDING'; it: Interpretation | null }
  | { type: 'EXECUTE'; actions: DeviceAction[]; item: HistoryItem }
  | { type: 'LOG'; item: HistoryItem }
  | { type: 'UNDO' }
  | { type: 'CORRECT'; id: string; correction: string }
  | { type: 'TOGGLE_FAVORITE'; id: HomeState['favorites'][number] };

// 명령 여러 개를 집 상태에 순서대로 적용
export function applyActions(home: HomeState, actions: DeviceAction[]): HomeState {
  const next = { ...home, light: { ...home.light }, ac: { ...home.ac }, blind: { ...home.blind } };
  for (const a of actions) {
    if (a.device === 'light') {
      if (a.on !== undefined) next.light.on = a.on;
      if (a.brightness !== undefined) next.light.brightness = a.brightness;
    } else if (a.device === 'ac') {
      if (a.on !== undefined) next.ac.on = a.on;
      if (a.target !== undefined) next.ac.target = a.target;
      if (a.fan !== undefined) next.ac.fan = a.fan;
    } else {
      if (a.open !== undefined) next.blind.open = a.open;
      else if (a.down !== undefined) next.blind.open = a.down ? 0 : 100;
    }
  }
  return next;
}

export const MAX_FAVORITES = 2;

// 예전 버전(블라인드가 down: true/false)으로 저장된 값 바꿔주기
function migrateHome(home: any): HomeState | undefined {
  if (!home) return undefined;
  const blind = home.blind ?? {};
  const open = typeof blind.open === 'number' ? blind.open : blind.down ? 0 : 100;
  return { ...home, blind: { open }, favorites: (home.favorites ?? []).slice(-MAX_FAVORITES) };
}

// 예전에 저장된 설정 맞춰주기
//   rev 1: 실행 방식 기본값이 "확인하고 실행"이었음 -> 화면 모드 기본값으로
//   사투리 지역은 경상도만
function migrateSettings(s: Settings): Settings {
  const next = { ...s, dialect: '경상도' as const };
  if ((s.rev ?? 1) < SETTINGS_REV) {
    next.execMode = DEFAULT_EXEC[s.viewMode];
    next.rev = SETTINGS_REV;
  }
  return next;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD':
      return {
        ...state,
        loaded: true,
        home: migrateHome(action.data.home) ?? state.home,
        settings: migrateSettings({ ...state.settings, ...action.data.settings }),
        history: action.data.history ?? state.history,
      };
    case 'SET_HOME':
      return { ...state, home: { ...state.home, ...action.patch } };
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'SET_PENDING':
      return { ...state, pending: action.it };
    case 'EXECUTE':
      return {
        ...state,
        undoSnapshot: state.home,
        home: applyActions(state.home, action.actions),
        history: [action.item, ...state.history],
        lastHistoryId: action.item.id,
      };
    case 'LOG':
      return { ...state, history: [action.item, ...state.history], lastHistoryId: action.item.id };
    case 'UNDO': {
      if (!state.undoSnapshot) return state;
      // 되돌리면 기록에도 남겨둠 (어떤 해석을 싫어했는지 나중에 볼 수 있게)
      const history = state.history.map((h) =>
        h.id === state.lastHistoryId ? { ...h, correction: h.correction ?? '되돌림' } : h,
      );
      return { ...state, home: state.undoSnapshot, undoSnapshot: null, history };
    }
    case 'CORRECT':
      return {
        ...state,
        history: state.history.map((h) => (h.id === action.id ? { ...h, correction: action.correction } : h)),
      };
    case 'TOGGLE_FAVORITE': {
      const fav = state.home.favorites;
      // 홈에는 2칸뿐이라 최대 2개. 세 번째를 고르면 제일 먼저 고른 걸 뺌
      const favorites = fav.includes(action.id)
        ? fav.filter((f) => f !== action.id)
        : [...fav, action.id].slice(-MAX_FAVORITES);
      return { ...state, home: { ...state.home, favorites } };
    }
  }
}

function makeItem(it: Interpretation, route: HistoryItem['route'], actions: DeviceAction[]): HistoryItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: Date.now(),
    utterance: it.utterance,
    summary: summaryText(actions),
    confidence: it.confidence,
    route,
  };
}

type Ctx = State & {
  setHome: (patch: Partial<HomeState>) => void;
  setSettings: (patch: Partial<Settings>) => void;
  setPending: (it: Interpretation | null) => void;
  execute: (it: Interpretation, route: HistoryItem['route'], actions?: DeviceAction[]) => void;
  logNothing: (it: Interpretation, route: HistoryItem['route']) => void;
  undo: () => void;
  correct: (id: string, correction: string) => void;
  toggleFavorite: (id: HomeState['favorites'][number]) => void;
};

const AppContext = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    loaded: false,
    home: initialHome,
    settings: initialSettings,
    history: [],
    pending: null,
    undoSnapshot: null,
    lastHistoryId: null,
  });

  // 처음 켤 때 저장된 값 불러오기
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => dispatch({ type: 'LOAD', data: raw ? JSON.parse(raw) : {} }))
      .catch(() => dispatch({ type: 'LOAD', data: {} }));
  }, []);

  // 바뀔 때마다 저장. 너무 자주 쓰지 않게 0.5초 모았다가 저장
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!state.loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const { home, settings, history } = state;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ home, settings, history: history.slice(0, 200) })).catch(
        () => {},
      );
    }, 500);
  }, [state.loaded, state.home, state.settings, state.history]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      setHome: (patch) => dispatch({ type: 'SET_HOME', patch }),
      setSettings: (patch) => dispatch({ type: 'SET_SETTINGS', patch }),
      setPending: (it) => dispatch({ type: 'SET_PENDING', it }),
      execute: (it, route, actions = it.actions) =>
        dispatch({ type: 'EXECUTE', actions, item: makeItem(it, route, actions) }),
      logNothing: (it, route) => dispatch({ type: 'LOG', item: makeItem(it, route, []) }),
      undo: () => dispatch({ type: 'UNDO' }),
      correct: (id, correction) => dispatch({ type: 'CORRECT', id, correction }),
      toggleFavorite: (id) => dispatch({ type: 'TOGGLE_FAVORITE', id }),
    }),
    [state],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('AppStateProvider 밖에서 useApp 호출함');
  return ctx;
}
