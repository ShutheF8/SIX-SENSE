// SIX-SENSE 공통 UI 조각들
// 시안에서 반복되는 것들 (유리 카드, 큰 버튼, 들은 말 카드, 뒤로가기 헤더 등) 모아둠

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApp } from '@/state/app-state';
import type { DeviceId } from '@/state/types';
import { C, FONT_SCALE } from '@/theme/colors';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const DEVICE_ICON: Record<DeviceId, IconName> = {
  light: 'lightbulb-outline',
  ac: 'snowflake',
  blind: 'blinds',
};

// ───────── 배경 ─────────
// expo-blur 없이 그라데이션 두 장 겹쳐서 핑크/라벤더/피치 번지는 느낌만 냄
export function GlassBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={[...C.bg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255,179,207,0.55)', 'rgba(255,179,207,0)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.3, y: 0.4 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(215,194,255,0)', 'rgba(215,194,255,0.45)', 'rgba(215,194,255,0)']}
        start={{ x: 0.6, y: 0.2 }}
        end={{ x: 0, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,211,194,0)', 'rgba(255,211,194,0.6)']}
        start={{ x: 0.3, y: 0.6 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

// ───────── 화면 틀 ─────────
type ScreenProps = { children: ReactNode; withTabs?: boolean; scroll?: boolean; footer?: ReactNode };

export function Screen({ children, withTabs, scroll = true, footer }: ScreenProps) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, withTabs && { paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    // 스크롤 없이 한 화면에 끝나는 화면 (홈, 기기 상세)
    <View style={[styles.content, { flex: 1 }, withTabs && { paddingBottom: 112 }]}>{children}</View>
  );

  return (
    <View style={{ flex: 1 }}>
      <GlassBackground />
      <SafeAreaView style={{ flex: 1 }} edges={withTabs ? ['top'] : ['top', 'bottom']}>
        {body}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </SafeAreaView>
    </View>
  );
}

// ───────── 글자 ─────────
// 설정 "글자 크기"가 모든 글자에 먹도록 여기서 한 번에 처리
const VARIANT = {
  hero: { fontSize: 32, fontWeight: '800', lineHeight: 42 },
  title: { fontSize: 26, fontWeight: '800', lineHeight: 34 },
  h2: { fontSize: 21, fontWeight: '700', lineHeight: 29 },
  body: { fontSize: 17, fontWeight: '400', lineHeight: 25 },
  bodyBold: { fontSize: 17, fontWeight: '700', lineHeight: 25 },
  small: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  label: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  big: { fontSize: 44, fontWeight: '800', lineHeight: 52 },
} satisfies Record<string, TextStyle>;

type TProps = {
  children: ReactNode;
  v?: keyof typeof VARIANT;
  color?: string;
  center?: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function T({ children, v = 'body', color = C.text, center, style, numberOfLines }: TProps) {
  const { settings } = useApp();
  const scale = FONT_SCALE[settings.fontSize];
  const base = VARIANT[v];
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        base,
        { color, fontSize: base.fontSize * scale, lineHeight: base.lineHeight * scale },
        center && { textAlign: 'center' },
        style,
      ]}>
      {children}
    </Text>
  );
}

export function Icon({ name, size = 24, color = C.primary }: { name: IconName; size?: number; color?: string }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

// ───────── 유리 카드 ─────────
type GlassProps = {
  children: ReactNode;
  highlight?: boolean; // 주 카드 (진한 테두리)
  danger?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export function Glass({ children, highlight, danger, style, onPress }: GlassProps) {
  const cardStyle = [
    styles.glass,
    highlight && { borderColor: C.primary, borderWidth: 2, backgroundColor: C.glassStrong },
    danger && { borderColor: C.danger, borderWidth: 2, backgroundColor: C.glassStrong },
    style,
  ];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [cardStyle, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

// ───────── 버튼 ─────────
// 시안 원칙: 버튼 높이 56 이상
type BtnProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  height?: number;
  dark?: boolean; // 검은 바탕 흰 글씨 (조명 "어둡게")
};

export function PrimaryButton({ label, onPress, icon, style, disabled, height = 64 }: BtnProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.btnShadow, { opacity: disabled ? 0.5 : pressed ? 0.9 : 1 }, style]}>
      <LinearGradient
        colors={[...C.primaryGrad]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.btn, { height }]}>
        {icon ? <Icon name={icon} color="#fff" size={26} /> : null}
        <T v="h2" color="#fff">
          {label}
        </T>
      </LinearGradient>
    </Pressable>
  );
}

export function OutlineButton({ label, onPress, icon, style, height = 64, dark }: BtnProps) {
  const fg = dark ? '#fff' : C.text;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, styles.outline, { height }, pressed && { opacity: 0.8 }, style]}>
      {icon ? <Icon name={icon} color={fg} size={24} /> : null}
      <T v="h2" color={fg}>
        {label}
      </T>
    </Pressable>
  );
}

export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={12} style={{ alignSelf: 'center', paddingVertical: 8 }}>
      <T v="label" color={C.sub} style={{ textDecorationLine: 'underline' }}>
        {label}
      </T>
    </Pressable>
  );
}

// 기기 켜짐 / 꺼짐 버튼. 색(청록, 주홍)이랑 글자를 같이 써서 색만으로 구분 안 하게 함
export function StateButton({
  label,
  on,
  onPress,
  style,
  height = 56,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  height?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.stateBtn,
        { height, backgroundColor: on ? C.on : C.off },
        pressed && { opacity: 0.85 },
        style,
      ]}>
      <T v={height >= 64 ? 'h2' : 'bodyBold'} color="#fff">
        {label}
      </T>
    </Pressable>
  );
}

// 3개짜리 선택 버튼 (글자 크기, 바람 세기, 빠르게 고르기 등)
export function Segmented<V extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: V }[];
  value: V;
  onChange: (v: V) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.seg, on ? { backgroundColor: C.primary, borderColor: C.primary } : null]}>
            <T v="bodyBold" color={on ? '#fff' : C.text}>
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

// ───────── 아이콘 칸 ─────────
export function IconTile({ name, size = 56, danger }: { name: IconName; size?: number; danger?: boolean }) {
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size / 2 },
        danger && { backgroundColor: C.dangerSoft },
      ]}>
      <Icon name={name} size={size * 0.5} color={danger ? C.danger : C.primary} />
    </View>
  );
}

// ───────── 헤더 ─────────
export function BackHeader({ label, onBack, right }: { label: string; onBack: () => void; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Icon name="chevron-left" size={30} color={C.text} />
        <T v="h2">{label}</T>
      </Pressable>
      {right}
    </View>
  );
}

// ───────── 말하기 마이크 ─────────
// 홈 말고 기기 상세 화면에서도 언제든 말로 켜고 끌 수 있게 남는 자리에 둠
export function VoiceMic({ size = 96, hint }: { size?: number; hint?: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Pressable
        onPress={() => router.push('/voice/listen')}
        style={({ pressed }) => [styles.micShadow, { borderRadius: size / 2 }, pressed && { transform: [{ scale: 0.95 }] }]}>
        <LinearGradient
          colors={[...C.primaryGrad]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="microphone" size={size * 0.42} color="#fff" />
        </LinearGradient>
      </Pressable>
      {hint ? (
        <T v="body" color={C.sub} center>
          {hint}
        </T>
      ) : null}
    </View>
  );
}

// 기기 카드랑 같은 크기의 마이크 상자 (기기 화면 맨 아래). 너무 튀지 않게 유리 카드 모양
export function VoiceMicBox({ hint, style }: { hint?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Glass onPress={() => router.push('/voice/listen')} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 18 }, style]}>
      <IconTile name="microphone" size={60} />
      <View style={{ flex: 1 }}>
        <T v="h2">말로 하기</T>
        {hint ? (
          <T v="small" color={C.sub}>
            {hint}
          </T>
        ) : null}
      </View>
      <Icon name="chevron-right" size={30} color={C.sub} />
    </Glass>
  );
}

// ───────── 라디오 목록 (설정) ─────────
export function RadioList<V extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; desc?: string; value: V }[];
  value: V;
  onChange: (v: V) => void;
}) {
  return (
    <Glass style={{ paddingVertical: 4 }}>
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.radioRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.divider }]}>
            <View style={[styles.radio, on && { borderColor: C.primary }]}>{on ? <View style={styles.radioDot} /> : null}</View>
            <View style={{ flex: 1 }}>
              <T v="h2">{o.label}</T>
              {o.desc ? (
                <T v="small" color={C.sub} style={{ marginTop: 2 }}>
                  {o.desc}
                </T>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </Glass>
  );
}

// ───────── 들은 말 카드 ─────────
export function HeardCard({ text, sub }: { text: string; sub?: string }) {
  return (
    <Glass>
      <T v="label" color={C.sub}>
        들은 말
      </T>
      <T v="title" style={{ marginTop: 6 }}>
        “{text}”
      </T>
      {sub ? (
        <T v="body" color={C.sub} style={{ marginTop: 4 }}>
          {sub}
        </T>
      ) : null}
    </Glass>
  );
}

// 작은 동그란 칩 ("혼잣말로 들렸어요")
export function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <T v="label" color={C.text}>
        {label}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 16 },
  footer: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  glass: {
    backgroundColor: C.glass,
    borderColor: C.glassBorder,
    borderWidth: 1.5,
    borderRadius: 26,
    padding: 20,
  },
  btn: {
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  btnShadow: {
    borderRadius: 22,
    shadowColor: C.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  outline: { backgroundColor: C.glassStrong, borderWidth: 1.5, borderColor: C.glassBorder },
  seg: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.glassStrong,
    borderWidth: 1.5,
    borderColor: C.glassBorder,
    paddingHorizontal: 6,
  },
  tile: { backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stateBtn: { borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  micShadow: {
    shadowColor: C.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: C.sub,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.primary },
  chip: {
    backgroundColor: C.glassStrong,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
