/**
 * 니치 진단.
 *
 * 이 앱은 지금까지 "민담을 만든다"를 전제로 했다. 그 전제를 의심해야 한다.
 *
 * 강의 진행자 본인이 "제가 이거 만든 거 만 명 넘게 배웠을 거다"라고 말한다.
 * 같은 프롬프트로 같은 구조의 민담을 만 명이 만들고 있다면,
 * 그것 자체가 YouTube 정책의 "generic or repetitive content"에 가까워지는 조건이다.
 *
 * 방법론(한국어 롱폼 오디오 + AI 보조 제작)은 다른 니치에도 쓸 수 있다.
 * 다만 니치마다 정책 위험과 광고 단가가 다르다. 그 차이를 정리했다.
 */

/** 정책 적합성 판정 */
export type PolicyFit = 'safe' | 'caution' | 'blocked';

/**
 * 판정의 근거 수준.
 * 이 데이터의 상당 부분은 공식 통계가 없어 추론이 섞여 있다.
 * 사용자가 무엇을 믿을지 판단할 수 있게 수준을 밝힌다.
 */
export type EvidenceLevel = 'official' | 'reported' | 'inferred';

export const EVIDENCE_LABEL: Record<EvidenceLevel, string> = {
  official: '공식 문서',
  reported: '보도·발언',
  inferred: '추론',
};

export interface NicheOption {
  id: string;
  name: string;
  /** 어떤 콘텐츠인가 */
  description: string;
  /** 이 방법론(대본→TTS→정지 이미지)이 그대로 통하는가 */
  methodReuse: '그대로' | '부분 수정' | '대폭 수정';
  /** 정책 적합성 */
  policyFit: PolicyFit;
  /** 정책 판단 근거 */
  policyReason: string;
  /** 정책 판정의 근거 수준 */
  policyEvidence: EvidenceLevel;
  /** 포화도 — 이 방식으로 만든 채널이 얼마나 많은가 */
  saturation: '매우 높음' | '높음' | '보통' | '낮음';
  saturationReason: string;
  /** 포화도 판정의 근거 수준 */
  saturationEvidence: EvidenceLevel;
  /** 광고 단가 성향 */
  rpmTier: '낮음' | '보통' | '높음';
  rpmReason: string;
  rpmEvidence: EvidenceLevel;
  /** 주 시청층 */
  audience: string;
  /** 이 니치를 고를 때 유의할 점 */
  caveats: string[];
}

export const NICHES: NicheOption[] = [
  {
    id: 'mindam',
    name: '민담 · 야담',
    description: '조선시대 배경 창작 설화. 권선징악, 귀신, 며느리·시집 이야기.',
    methodReuse: '그대로',
    policyFit: 'caution',
    policyReason:
      '픽션이라 허위정보 정책에는 걸리지 않는다. 그러나 같은 골격을 반복하면 "매우 비슷한 줄거리 템플릿"에 해당한다. 골격 변주가 필수다.',
    saturation: '매우 높음',
    saturationReason:
      '강의 진행자가 "만 명 넘게 배웠다"고 밝혔다. 같은 프롬프트로 같은 구조를 만드는 채널이 대량으로 존재할 가능성이 높다.',
    rpmTier: '낮음',
    rpmReason:
      '엔터테인먼트 분류. 50~70대 한국 시청자 위주여서 광고주 경쟁이 약하다. 한국 CPM은 미국의 약 4분의 1이다.',
    audience: '50~70대, 배경 청취',
    policyEvidence: 'official',
    saturationEvidence: 'reported',
    rpmEvidence: 'reported',
    caveats: [
      '지금 진입하면 이미 같은 형식의 채널이 많다. 차별점을 만들지 않으면 묻힌다.',
      '골격·결말·조력자를 매 영상 바꾸지 않으면 수익화가 막힐 수 있다.',
      '광고 단가가 낮아 조회수를 크게 확보해야 의미 있는 수익이 된다.',
    ],
  },
  {
    id: 'local-legend',
    name: '지역 전설 · 향토 설화',
    description: '특정 지역의 실제 전승. 마을 이름의 유래, 고개 이야기, 사찰 연기설화.',
    methodReuse: '부분 수정',
    policyFit: 'safe',
    policyReason:
      '실제 전승을 다루므로 조사와 출처가 들어간다. 이것이 정책이 요구하는 "제작자의 관점"과 "교육적 가치"에 해당한다.',
    saturation: '낮음',
    saturationReason:
      '지역별로 소재가 갈리고 조사가 필요해 대량 생산이 어렵다. 그래서 경쟁이 적다.',
    rpmTier: '보통',
    rpmReason: '교육·역사 성향이 섞이면 광고 단가가 순수 엔터테인먼트보다 높은 경향이 있다.',
    audience: '40~70대, 해당 지역 연고자',
    policyEvidence: 'inferred',
    saturationEvidence: 'inferred',
    rpmEvidence: 'inferred',
    caveats: [
      '조사가 필요하다. 대본을 AI에 전부 맡길 수 없다.',
      '실제 지명·인물이 나오므로 사실 확인이 필요하다. 틀리면 정정 요구가 온다.',
      '대량 생산이 안 되므로 편수로 수익을 늘리는 전략과 맞지 않는다.',
    ],
  },
  {
    id: 'history-anecdote',
    name: '역사 야사 · 인물 일화',
    description: '기록에 남은 실제 사건과 인물의 일화. 조선왕조실록, 야사집 기반.',
    methodReuse: '부분 수정',
    policyFit: 'caution',
    policyReason:
      '교육적 가치가 인정되기 쉽다. 다만 실존 인물을 다루므로 사실과 창작을 섞으면 오해를 부를 수 있다. 창작 부분을 명시해야 한다.',
    saturation: '높음',
    saturationReason: '이미 규모 있는 채널이 많다. 다만 소재가 방대해 틈이 있다.',
    rpmTier: '높음',
    rpmReason: '교육 분류에 가까울수록 광고 단가가 높다. 조사 자료에서 교육 니치가 가장 높았다.',
    audience: '30~60대, 남성 비중 높음',
    policyEvidence: 'inferred',
    saturationEvidence: 'inferred',
    rpmEvidence: 'reported',
    caveats: [
      '사실 확인이 필수다. 틀린 역사를 퍼뜨리면 신뢰를 잃고 정정 요구가 온다.',
      '실존 인물 명예에 관한 서술은 조심해야 한다.',
      '창작을 섞을 때는 어디까지가 기록인지 밝히는 편이 안전하다.',
    ],
  },
  {
    id: 'life-story',
    name: '사연 · 실화 재구성',
    description: '제보나 공개 사연을 각색한 이야기. 가족 갈등, 이웃 분쟁, 인생 역전.',
    methodReuse: '그대로',
    policyFit: 'caution',
    policyReason:
      '감정을 끌어내는 구조가 강해 "감정을 조작하는 공식에 크게 의존"에 걸릴 소지가 있다. 서사의 일관성이 관건이다.',
    saturation: '매우 높음',
    saturationReason: '진입 장벽이 낮아 채널이 매우 많다. 형식도 서로 비슷하다.',
    rpmTier: '보통',
    rpmReason: '시청층이 넓어 민담보다는 낫지만 자극적 소재는 광고 적합성에서 불이익을 받는다.',
    audience: '30~60대, 여성 비중 높음',
    policyEvidence: 'official',
    saturationEvidence: 'inferred',
    rpmEvidence: 'inferred',
    caveats: [
      '실제 인물을 특정할 수 있는 정보를 넣으면 안 된다.',
      '자극만으로 조회수를 끌면 광고 적합성 제한을 받는다.',
      '"실화"라고 표기하면서 창작하면 허위 콘텐츠 문제가 생긴다.',
    ],
  },
  {
    id: 'classic-lit',
    name: '고전 문학 낭독 · 각색',
    description: '저작권이 소멸한 고전을 낭독하거나 현대어로 각색.',
    methodReuse: '대폭 수정',
    policyFit: 'blocked',
    policyReason:
      '"오직 본인이 만들지 않은 자료의 낭독으로만 이루어진 콘텐츠"는 재사용 콘텐츠 정책으로 수익화가 불가하다. 원문 낭독만으로는 안 된다.',
    saturation: '보통',
    saturationReason: '낭독 채널은 많지만 대부분 수익화에 애를 먹는다.',
    rpmTier: '낮음',
    rpmReason: '수익화 자체가 어려우므로 단가를 논하기 이전 문제다.',
    audience: '전 연령',
    policyEvidence: 'official',
    saturationEvidence: 'inferred',
    rpmEvidence: 'inferred',
    caveats: [
      '원문 낭독만으로는 수익화가 안 된다. 해설·비평·각색이 실질적으로 들어가야 한다.',
      '저작권이 살아 있는 번역본을 쓰면 저작권 문제가 별도로 생긴다.',
    ],
  },
  {
    id: 'health-advice',
    name: '건강 · 의학 정보',
    description: '증상, 약, 식습관 정보를 AI 음성으로 전달.',
    methodReuse: '그대로',
    policyFit: 'blocked',
    policyReason:
      'AI 페르소나가 건강·법률·금융·정치에 관해 사람 전문가처럼 조언하는 콘텐츠는 수익화가 명시적으로 불가하다. 이 방식(AI 음성 나레이션)이 정확히 해당한다.',
    saturation: '매우 높음',
    saturationReason: '단가가 높아 채널이 몰렸고, 그래서 YouTube가 정책으로 막았다.',
    rpmTier: '높음',
    rpmReason: '단가는 높지만 수익화가 막히므로 의미가 없다.',
    audience: '50대 이상',
    policyEvidence: 'official',
    saturationEvidence: 'inferred',
    rpmEvidence: 'reported',
    caveats: [
      'AI 음성으로 건강 조언을 하는 것은 정책상 수익화 불가다. 시도하지 않는 편이 낫다.',
      '의료 오정보는 정책 위반을 넘어 실제 피해를 낼 수 있다.',
    ],
  },
  {
    id: 'traditional-wisdom',
    name: '옛 생활 지혜 · 세시풍속',
    description: '절기, 제사 절차, 옛 살림살이, 속담의 유래.',
    methodReuse: '부분 수정',
    policyFit: 'safe',
    policyReason:
      '교육적 가치가 분명하고 사실 기반이다. 영상마다 내용이 실질적으로 달라 템플릿 반복 문제에서 자유롭다.',
    saturation: '낮음',
    saturationReason: '소재가 실용적이고 조사가 필요해 대량 생산 채널이 적다.',
    rpmTier: '보통',
    rpmReason: '교육·라이프스타일 성향. 엔터테인먼트보다 높은 편이다.',
    audience: '40~70대',
    policyEvidence: 'inferred',
    saturationEvidence: 'inferred',
    rpmEvidence: 'inferred',
    caveats: [
      '조사가 필요하다. AI에 전부 맡기면 틀린 정보가 섞인다.',
      '이야기보다 정보 전달이므로 시청 지속시간을 확보하기가 더 어렵다.',
      '롱폼으로 두 시간을 채우기 어려울 수 있다. 짧은 영상 여러 편이 맞을 수 있다.',
    ],
  },
];

/**
 * 니치 비교 점수.
 *
 * ⚠ 이 점수는 객관적 지표가 아니다. 저자가 정한 가중치로 계산한 편의적 종합값이다.
 * 가중치의 근거는 없다. 아래 비중이 타당하다고 볼 이유도, 아니라고 볼 이유도 있다.
 *
 * 그래서 두 가지를 함께 제공한다.
 *   1. 가중치를 숨기지 않고 밝힌다 (SCORE_WEIGHTS를 UI에 노출)
 *   2. 세 축의 원래 판정을 그대로 보여줘 사용자가 직접 판단할 수 있게 한다
 *
 * 점수만 보고 결정하지 말고 세 축과 근거 수준을 함께 보라는 뜻이다.
 */
export interface NicheScore {
  niche: NicheOption;
  /** 0~100. 편의적 종합값이며 객관적 지표가 아니다 */
  score: number;
  /** 축별 획득 점수. 어디서 점수가 깎였는지 보이게 한다 */
  breakdown: { policy: number; saturation: number; rpm: number };
  /** 진입을 권하는지 */
  recommendation: '권장' | '조건부' | '비권장';
  /** 왜 그런지 한 줄 */
  summary: string;
  /** 이 판정에서 가장 약한 근거 수준 */
  weakestEvidence: EvidenceLevel;
}

/** 가중치. UI에 그대로 표시해 임의성을 숨기지 않는다 */
export const SCORE_WEIGHTS = {
  policy: { max: 40, label: '정책 안전성' },
  saturation: { max: 35, label: '경쟁 강도(낮을수록 높은 점수)' },
  rpm: { max: 25, label: '광고 단가' },
} as const;

export const SCORE_DISCLAIMER =
  '이 점수는 정책 안전성 40점, 경쟁 강도 35점, 광고 단가 25점으로 가중한 편의적 종합값입니다. ' +
  '가중치는 저자가 정한 것이며 객관적 근거가 없습니다. 점수만 보지 말고 세 축과 근거 수준을 함께 보세요.';

const POLICY_WEIGHT: Record<PolicyFit, number> = { safe: 40, caution: 20, blocked: 0 };
const SATURATION_WEIGHT: Record<NicheOption['saturation'], number> = {
  낮음: 35,
  보통: 25,
  높음: 12,
  '매우 높음': 4,
};
const RPM_WEIGHT: Record<NicheOption['rpmTier'], number> = { 높음: 25, 보통: 16, 낮음: 7 };

/** 근거 수준을 약한 순으로 */
const EVIDENCE_RANK: Record<EvidenceLevel, number> = { inferred: 0, reported: 1, official: 2 };

export function scoreNiche(n: NicheOption): NicheScore {
  const breakdown = {
    policy: POLICY_WEIGHT[n.policyFit],
    saturation: SATURATION_WEIGHT[n.saturation],
    rpm: RPM_WEIGHT[n.rpmTier],
  };
  const score = breakdown.policy + breakdown.saturation + breakdown.rpm;

  const weakestEvidence = (
    [n.policyEvidence, n.saturationEvidence, n.rpmEvidence] as EvidenceLevel[]
  ).reduce((weakest, e) => (EVIDENCE_RANK[e] < EVIDENCE_RANK[weakest] ? e : weakest), 'official');

  let recommendation: NicheScore['recommendation'];
  let summary: string;

  if (n.policyFit === 'blocked') {
    recommendation = '비권장';
    summary = '정책상 수익화가 막히는 니치입니다. 시도하지 마세요.';
  } else if (score >= 70) {
    recommendation = '권장';
    summary = '정책이 안전하고 경쟁이 적습니다. 조사 부담을 감당할 수 있다면 유리합니다.';
  } else if (score >= 45) {
    recommendation = '조건부';
    summary = '가능하지만 차별점이 필요합니다. 대응책을 지켜야 합니다.';
  } else {
    recommendation = '비권장';
    summary = '포화됐거나 단가가 낮습니다. 같은 노력으로 다른 니치가 낫습니다.';
  }

  // 근거가 추론뿐이면 판정을 그대로 믿지 말라고 덧붙인다
  if (weakestEvidence === 'inferred' && n.policyFit !== 'blocked') {
    summary += ' 다만 이 판정의 근거 일부는 추론입니다.';
  }

  return { niche: n, score, breakdown, recommendation, summary, weakestEvidence };
}

/** 점수 높은 순으로 정렬해 반환 */
export function rankNiches(): NicheScore[] {
  return NICHES.map(scoreNiche).sort((a, b) => b.score - a.score);
}
