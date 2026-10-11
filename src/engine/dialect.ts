// 사투리 풀이 사전 (경상도)
// 해석 확인 화면의 "사투리 풀이" 줄을 보여주려고 씀. STT 쪽 작업은 이번 학기 범위 밖이라 여기선 글자만 바꿈
// 팀장님 데이터셋(SIX-SENSE_ABC_데이터셋_경상도.xlsx) 정리되면 여기 계속 추가하면 됨
//
// 순서 중요함. 긴 표현을 먼저 바꿔야 "꺼주이소"가 "꺼도" 규칙에 먼저 걸리는 일이 없음

type Rule = { from: string; to: string };

const RULES: Rule[] = [
  { from: '꺼주이소', to: '꺼 주세요' },
  { from: '켜주이소', to: '켜 주세요' },
  { from: '해주이소', to: '해 주세요' },
  { from: '올려주이소', to: '올려 주세요' },
  { from: '내려주이소', to: '내려 주세요' },
  { from: '더버', to: '더워' },
  { from: '디지기', to: '죽기' },
  { from: '덥다카이', to: '덥다니까' },
  { from: '춥다카이', to: '춥다니까' },
  { from: '고만', to: '구먼' },
  { from: '억수로', to: '엄청' },
  { from: '쫌', to: '좀' },
  { from: '우째', to: '어떻게' },
  { from: '올리라', to: '올려라' },
  { from: '내리라', to: '내려라' },
  { from: '꺼도', to: '꺼 줘' },
  { from: '켜도', to: '켜 줘' },
  { from: '해도', to: '해 줘' },
];

export type NormalizeResult = {
  text: string;
  changes: Rule[]; // 화면에 "사투리 풀이"로 보여줄 것
};

export function normalizeDialect(input: string): NormalizeResult {
  let text = input.trim();
  const changes: Rule[] = [];

  for (const rule of RULES) {
    if (text.includes(rule.from)) {
      text = text.split(rule.from).join(rule.to);
      changes.push(rule);
    }
  }
  return { text, changes };
}

// "더버 -> 더워, 디지기 -> 죽기" 형태로
export function describeChanges(changes: Rule[]): string | undefined {
  if (changes.length === 0) return undefined;
  return changes.map((c) => `${c.from} → ${c.to}`).join(', ');
}
