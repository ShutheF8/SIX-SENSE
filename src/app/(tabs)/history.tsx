// 05 대화 기록, 교정
// "잘못됐어요"로 고친 내용은 기기 안에만 저장. 이번 학기는 저장까지만, 모델 재학습에 쓰는 건 다음 단계

import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Glass, Icon, OutlineButton, PrimaryButton, Screen, T } from '@/components/six/ui';
import { useApp } from '@/state/app-state';
import type { HistoryItem } from '@/state/types';
import { C } from '@/theme/colors';

const ROUTE_LABEL: Record<HistoryItem['route'], string> = {
  auto: '바로 실행',
  confirm: '확인 후 실행',
  ask: '되물어서 실행',
  none: '해당 없음',
};

function dayLabel(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return '오늘';
  if (d.toDateString() === y.toDateString()) return '어제';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function timeLabel(ts: number) {
  const d = new Date(ts);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  if (h < 12) return `오전 ${h === 0 ? 12 : h}:${m}`;
  return `${h === 12 ? 12 : h - 12}:${m}`;
}

export default function HistoryScreen() {
  const { history, correct } = useApp();
  const [editing, setEditing] = useState<HistoryItem | null>(null);
  const [text, setText] = useState('');

  // 날짜별로 묶기 (기록은 최신순으로 들어 있음)
  const groups: { label: string; items: HistoryItem[] }[] = [];
  for (const item of history) {
    const label = dayLabel(item.at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }

  const save = () => {
    if (editing && text.trim()) correct(editing.id, text.trim());
    setEditing(null);
    setText('');
  };

  return (
    <Screen withTabs>
      <View style={{ marginTop: 12 }}>
        <T v="hero">대화 기록</T>
        <T v="body" color={C.sub}>
          잘못 알아들은 건 눌러서 고쳐 주세요
        </T>
      </View>

      {history.length === 0 ? (
        <Glass>
          <T v="body" color={C.sub} center>
            아직 기록이 없어요.{'\n'}홈에서 마이크를 눌러 말해 보세요.
          </T>
        </Glass>
      ) : null}

      {groups.map((g) => (
        <View key={g.label} style={{ gap: 12 }}>
          <T v="label" color={C.sub}>
            {g.label}
          </T>
          {g.items.map((item) => (
            <Glass key={item.id}>
              <T v="body" color={C.sub}>
                “{item.utterance}”
              </T>
              <View style={styles.row}>
                <T v="h2" style={{ flex: 1 }}>
                  {item.summary}
                </T>
                <T v="label" color={C.sub}>
                  {timeLabel(item.at)}
                </T>
              </View>
              <T v="small" color={C.muted}>
                {ROUTE_LABEL[item.route]}, 확신도 {Math.round(item.confidence * 100)}%
              </T>

              {/* 상태: 교정됨 > 해결됨(좋아요) > 아직 표시 없음(고치기 버튼만 작게) */}
              {item.correction ? (
                <View style={styles.corrected}>
                  <Icon name="pencil-outline" size={22} />
                  <T v="bodyBold" color={C.primaryText} style={{ flex: 1 }}>
                    교정됨: {item.correction}
                  </T>
                </View>
              ) : item.feedback === 'good' ? (
                <View style={styles.solved}>
                  <Icon name="check-circle" size={22} color="#fff" />
                  <T v="bodyBold" color="#fff">
                    해결됐어요
                  </T>
                </View>
              ) : item.route !== 'none' ? (
                <Pressable onPress={() => setEditing(item)} style={styles.fixBtn}>
                  <Icon name="pencil-outline" size={20} color={C.sub} />
                  <T v="label" color={C.sub}>
                    잘못 알아들었으면 고쳐 주세요
                  </T>
                </Pressable>
              ) : null}
            </Glass>
          ))}
        </View>
      ))}

      <View style={styles.footNote}>
        <Icon name="lock-outline" size={20} color={C.sub} />
        <T v="small" color={C.sub}>
          고친 내용은 이 기기 안에만 저장돼요
        </T>
      </View>

      {/* 교정 입력 */}
      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
          <View style={styles.sheet}>
            <T v="label" color={C.sub}>
              “{editing?.utterance}”
            </T>
            <T v="h2" style={{ marginTop: 4 }}>
              원래 어떻게 했어야 했나요?
            </T>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="예: 에어컨 26°C로"
              placeholderTextColor={C.muted}
              style={styles.input}
              autoFocus
            />
            <PrimaryButton label="고치기" onPress={save} height={58} />
            <OutlineButton label="그만두기" onPress={() => setEditing(null)} height={58} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  corrected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.primarySoft,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  solved: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: C.on,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 12,
  },
  fixBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    marginTop: 6,
  },
  wrongBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: C.text,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  footNote: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(42,32,39,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFF7FA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    gap: 12,
  },
  input: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.primary,
    paddingHorizontal: 16,
    fontSize: 18,
    color: C.text,
    backgroundColor: '#fff',
  },
});
