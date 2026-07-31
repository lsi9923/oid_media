/**
 * 템플릿 반복 방지 이력 관리.
 *
 * YouTube 수익화 정책의 최대 리스크는 "여러 영상에 매우 비슷한 줄거리 템플릿"이다.
 * 계획만 세워두면 지켜지지 않으므로, 무엇을 이미 썼는지 기록하고
 * 다음 영상이 앞 영상과 겹치는지 기계적으로 판정한다.
 */

/** 한 편의 영상에서 사용한 구조 */
export interface EpisodeRecord {
  id: string;
  /** 몇 번째 영상인지 표시용 제목 */
  title: string;
  /** 채널 이름. 채널별로 겹침을 따진다 */
  channel: string;
  /** 갈래 (권선징악-귀신 등) */
  category: string;
  /** 사용한 모티프 코드 (C-01 등) */
  motifs: string[];
  /** 시작점 변주 */
  opening: OpeningVariant;
  /** 결말 유형 */
  ending: EndingType;
  /** 조력자 유형 */
  helper: HelperType;
  /** 주인공 신분 */
  protagonist: string;
  /** 반전 개수 */
  twistCount: number;
  /** 기록 시각 (ISO) */
  createdAt: string;
}

export type OpeningVariant = '순차' | '위기시작' | '결말선행' | '폭로선행';
export type EndingType = '응보' | '용서' | '대가' | '폭로' | '화해' | '순환';
export type HelperType = '초자연' | '동물' | '사람' | '없음' | '뜻밖';

export const OPENING_VARIANTS: OpeningVariant[] = ['순차', '위기시작', '결말선행', '폭로선행'];
export const ENDING_TYPES: EndingType[] = ['응보', '용서', '대가', '폭로', '화해', '순환'];
export const HELPER_TYPES: HelperType[] = ['초자연', '동물', '사람', '없음', '뜻밖'];

/** 흔히 쓰는 주인공 신분. 자유 입력도 허용한다 */
export const PROTAGONIST_PRESETS = [
  '며느리',
  '나무꾼',
  '과객',
  '노비',
  '젖어미',
  '장돌뱅이',
  '훈장',
  '의원',
  '무당',
  '상주',
  '농부',
  '사또',
];

/** 겹침 경고 한 건 */
export interface Overlap {
  field: string;
  /** 무엇이 겹치는가 */
  value: string;
  /** 최근 몇 편 안에서 겹치는가 */
  withinRecent: number;
  severity: 'error' | 'warn';
  message: string;
}

/** 판정 기준. 최근 N편 안에서 같은 값을 쓰면 경고한다 */
const RULES = {
  /** 시작점: 최근 2편 안에서 겹치면 경고 */
  opening: { window: 2, severity: 'warn' as const },
  /** 결말: 최근 3편 안에서 겹치면 경고. 응보가 가장 흔해 쏠리기 쉽다 */
  ending: { window: 3, severity: 'error' as const },
  /** 조력자: 최근 3편 */
  helper: { window: 3, severity: 'warn' as const },
  /** 주인공 신분: 최근 3편 */
  protagonist: { window: 3, severity: 'error' as const },
  /** 갈래: 최근 2편 */
  category: { window: 2, severity: 'warn' as const },
  /** 모티프: 채널 전체에서 재사용 금지 */
  motif: { window: Number.POSITIVE_INFINITY, severity: 'error' as const },
} as const;

/** 같은 채널의 기록을 최신순으로 정렬해 반환한다 */
export function episodesOfChannel(all: EpisodeRecord[], channel: string): EpisodeRecord[] {
  return all
    .filter((e) => e.channel === channel)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * 다음 영상 계획이 앞 영상들과 겹치는지 판정한다.
 * draft는 아직 저장하지 않은 계획이다.
 */
export function findOverlaps(
  all: EpisodeRecord[],
  draft: Pick<
    EpisodeRecord,
    'channel' | 'category' | 'motifs' | 'opening' | 'ending' | 'helper' | 'protagonist'
  >,
): Overlap[] {
  const history = episodesOfChannel(all, draft.channel);
  const out: Overlap[] = [];

  function check(
    field: keyof typeof RULES,
    label: string,
    value: string,
    getter: (e: EpisodeRecord) => string,
  ): void {
    const rule = RULES[field];
    const window = Number.isFinite(rule.window) ? history.slice(0, rule.window) : history;
    const hit = window.findIndex((e) => getter(e) === value);
    if (hit >= 0) {
      out.push({
        field: label,
        value,
        withinRecent: hit + 1,
        severity: rule.severity,
        message:
          hit === 0
            ? `바로 앞 영상과 ${label}이 같습니다: ${value}`
            : `${hit + 1}편 전 영상과 ${label}이 같습니다: ${value}`,
      });
    }
  }

  check('opening', '시작점', draft.opening, (e) => e.opening);
  check('ending', '결말 유형', draft.ending, (e) => e.ending);
  check('helper', '조력자 유형', draft.helper, (e) => e.helper);
  check('protagonist', '주인공 신분', draft.protagonist, (e) => e.protagonist);
  check('category', '갈래', draft.category, (e) => e.category);

  // 모티프는 채널 전체에서 재사용을 금지한다
  for (const m of draft.motifs) {
    if (!m.trim()) continue;
    const idx = history.findIndex((e) => e.motifs.includes(m));
    if (idx >= 0) {
      out.push({
        field: '모티프',
        value: m,
        withinRecent: idx + 1,
        severity: 'error',
        message: `이 채널에서 이미 쓴 모티프입니다: ${m} (${idx + 1}편 전)`,
      });
    }
  }

  return out;
}

/** 채널의 다양성 점수. 낮으면 템플릿 반복 위험이 크다 */
export interface DiversityReport {
  episodeCount: number;
  /** 각 축의 서로 다른 값 개수 */
  uniqueOpenings: number;
  uniqueEndings: number;
  uniqueHelpers: number;
  uniqueProtagonists: number;
  uniqueCategories: number;
  /** 모티프 재사용 횟수 */
  motifReuse: number;
  /** 0~100. 편수가 적으면 판정을 보류한다 */
  score: number | null;
  /** 가장 쏠린 축 */
  weakest: string | null;
}

export function diversityReport(all: EpisodeRecord[], channel: string): DiversityReport {
  const eps = episodesOfChannel(all, channel);
  const n = eps.length;

  const uniq = <T>(xs: T[]) => new Set(xs).size;
  const uniqueOpenings = uniq(eps.map((e) => e.opening));
  const uniqueEndings = uniq(eps.map((e) => e.ending));
  const uniqueHelpers = uniq(eps.map((e) => e.helper));
  const uniqueProtagonists = uniq(eps.map((e) => e.protagonist));
  const uniqueCategories = uniq(eps.map((e) => e.category));

  const seen = new Set<string>();
  let motifReuse = 0;
  for (const e of eps) {
    for (const m of e.motifs) {
      if (seen.has(m)) motifReuse += 1;
      else seen.add(m);
    }
  }

  // 세 편 미만이면 다양성을 논하기 어렵다
  if (n < 3) {
    return {
      episodeCount: n,
      uniqueOpenings,
      uniqueEndings,
      uniqueHelpers,
      uniqueProtagonists,
      uniqueCategories,
      motifReuse,
      score: null,
      weakest: null,
    };
  }

  // 각 축의 다양성을 "서로 다른 값 / 가능한 최대" 로 본다.
  // 가능한 최대는 편수와 선택지 수 중 작은 쪽이다.
  const axes: { name: string; unique: number; options: number }[] = [
    { name: '시작점', unique: uniqueOpenings, options: OPENING_VARIANTS.length },
    { name: '결말 유형', unique: uniqueEndings, options: ENDING_TYPES.length },
    { name: '조력자', unique: uniqueHelpers, options: HELPER_TYPES.length },
    { name: '주인공 신분', unique: uniqueProtagonists, options: PROTAGONIST_PRESETS.length },
    { name: '갈래', unique: uniqueCategories, options: 4 },
  ];

  const ratios = axes.map((a) => ({
    name: a.name,
    ratio: a.unique / Math.min(n, a.options),
  }));

  const avg = ratios.reduce((s, r) => s + r.ratio, 0) / ratios.length;
  // 모티프 재사용은 감점 요인이다
  const penalty = Math.min(0.4, (motifReuse / n) * 0.4);
  const score = Math.round(Math.max(0, Math.min(1, avg - penalty)) * 100);

  const weakest = ratios.reduce((min, r) => (r.ratio < min.ratio ? r : min), ratios[0]!);

  return {
    episodeCount: n,
    uniqueOpenings,
    uniqueEndings,
    uniqueHelpers,
    uniqueProtagonists,
    uniqueCategories,
    motifReuse,
    score,
    weakest: weakest.ratio < 0.9 ? weakest.name : null,
  };
}

/**
 * 다음 영상에 권하는 조합.
 * 최근 이력에서 가장 오래 쓰지 않은 값을 고른다.
 */
export function suggestNext(
  all: EpisodeRecord[],
  channel: string,
): { opening: OpeningVariant; ending: EndingType; helper: HelperType; protagonist: string } {
  const eps = episodesOfChannel(all, channel);

  /** 최근에 쓴 순서에서 가장 멀리 있는 값을 고른다 */
  function leastRecent<T extends string>(options: readonly T[], getter: (e: EpisodeRecord) => T): T {
    let best = options[0]!;
    let bestDistance = -1;
    for (const opt of options) {
      const idx = eps.findIndex((e) => getter(e) === opt);
      // 한 번도 안 쓴 값이 최우선
      const distance = idx < 0 ? Number.POSITIVE_INFINITY : idx;
      if (distance > bestDistance) {
        bestDistance = distance;
        best = opt;
      }
    }
    return best;
  }

  return {
    opening: leastRecent(OPENING_VARIANTS, (e) => e.opening),
    ending: leastRecent(ENDING_TYPES, (e) => e.ending),
    helper: leastRecent(HELPER_TYPES, (e) => e.helper),
    protagonist: leastRecent(PROTAGONIST_PRESETS, (e) => e.protagonist),
  };
}
