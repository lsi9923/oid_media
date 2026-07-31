/**
 * 손익 계산과 러닝타임 추정.
 *
 * 이 앱이 지금까지 답하지 않은 질문에 답한다.
 *   "이걸 하면 언제부터 남는가"
 *   "46,000자는 실제로 몇 시간인가"
 *   "중간광고는 몇 개 붙는가"
 *
 * 강의는 특정 사례(조회수 6만에 80만원)만 제시한다.
 * 그 수치는 RPM 약 13,000원/1,000회에 해당하는데,
 * 한국 시청자 기반 엔터테인먼트 콘텐츠에서 일반적인 수준이 아니다.
 * 사용자가 자기 조건으로 직접 계산해볼 수 있어야 한다.
 */

/**
 * 한국어 TTS 낭독 속도 (초당 글자수, 공백 포함).
 *
 * ⚠ 이 값은 실측 데이터가 아니라 추정치다.
 * 저자가 Vrew 기본 속도를 기준으로 잡은 값이며, 공식 문서나 논문 근거가 없다.
 * TTS 엔진, 목소리, 속도 설정, 문장 구조에 따라 크게 달라진다.
 *
 * 정확한 값이 필요하면 직접 측정해야 한다.
 *   1. Vrew에 1,000자를 넣어 렌더링한다
 *   2. 결과 영상 길이(초)를 1,000으로 나눈다
 *   3. 세 번 반복해 평균을 낸다
 * 앱의 UI에서 이 값을 직접 바꿀 수 있게 해둔 이유가 이것이다.
 */
export const TTS_SPEED = {
  slow: 4.0,
  normal: 4.8,
  fast: 5.6,
} as const;

/** 추정치의 신뢰 수준을 UI에 알리기 위한 메타데이터 */
export const TTS_SPEED_META = {
  confidence: 'estimate' as const,
  note: '실측이 아닌 추정치입니다. TTS 엔진과 속도 설정에 따라 20% 이상 차이날 수 있습니다.',
  howToMeasure:
    'Vrew에 1,000자를 넣어 렌더링하고, 결과 길이(초)를 1,000으로 나누면 실제 값이 나옵니다.',
} as const;

export type TtsSpeed = keyof typeof TTS_SPEED;

/** 러닝타임 추정 결과 */
export interface RuntimeEstimate {
  /** 공백 포함 글자수 */
  chars: number;
  /** 추정 초 */
  seconds: number;
  /** 표시용 문자열 */
  display: string;
  /** 중간광고 슬롯 추정 개수 */
  midrollSlots: number;
  /** 8분 미만이면 중간광고를 못 넣는다 */
  midrollEligible: boolean;
}

/**
 * 글자수로 러닝타임을 추정한다.
 * 낭독 대상이 아닌 메타 표기는 미리 제거해서 넘겨야 정확하다.
 */
export function estimateRuntime(chars: number, speed: TtsSpeed = 'normal'): RuntimeEstimate {
  const cps = TTS_SPEED[speed];
  const seconds = chars > 0 ? Math.round(chars / cps) : 0;
  return {
    chars,
    seconds,
    display: formatRuntime(seconds),
    midrollSlots: estimateMidrollSlots(seconds),
    midrollEligible: seconds >= 8 * 60,
  };
}

/** 초를 사람이 읽는 형태로 */
export function formatRuntime(seconds: number): string {
  if (seconds <= 0) return '0분';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
  return `${m}분`;
}

/**
 * 중간광고 슬롯 개수를 추정한다.
 *
 * ⚠ 중요한 한계가 있다. 이 함수는 "넣을 수 있는 슬롯의 대략적 상한"만 센다.
 * 실제 광고 게재 수와는 다르다. YouTube 공식 문서의 원문은 이렇다.
 *
 *   "Ad slots are not guaranteed to serve ads. Our ad systems decide which ad
 *    slots may get an ad based on a number of factors to best balance viewer
 *    experience, creator earnings, and advertiser values."
 *   — https://support.google.com/youtube/answer/6175006
 *
 * 게재 확률에 영향을 주는 요소도 공식 문서에 나온다.
 *   "Ad slots placed at natural breakpoints, such as a pause in audio or
 *    transition in visual, are more likely to serve ads ... Mid-roll ad slots
 *    that can be disruptive to the viewer experience, such as mid-sentence or
 *    mid-action are less likely to serve ads."
 *
 * TTS 낭독은 끊김 없이 이어지므로 자연 중단점이 적다.
 * 따라서 이 방식의 영상은 슬롯이 빨간색(게재 가능성 낮음)으로 표시될 소지가 있다.
 *
 * 4분 간격은 저자의 추정이며 공식 근거가 없다.
 * YouTube는 간격 수치를 공개하지 않는다.
 */
const ESTIMATED_SLOT_INTERVAL_SEC = 4 * 60;

export function estimateMidrollSlots(seconds: number): number {
  if (seconds < 8 * 60) return 0;
  // 첫 슬롯은 도입 이후, 마지막은 끝나기 전에 배치된다고 본다
  return Math.max(1, Math.floor((seconds - ESTIMATED_SLOT_INTERVAL_SEC) / ESTIMATED_SLOT_INTERVAL_SEC));
}

/** 중간광고에 관한 공식 사실. UI에서 그대로 보여주기 위한 것 */
export const MIDROLL_FACTS = {
  sourceUrl: 'https://support.google.com/youtube/answer/6175006',
  notGuaranteed:
    'Ad slots are not guaranteed to serve ads. 슬롯을 넣어도 광고가 붙는다는 보장이 없습니다.',
  naturalBreakpoints:
    '오디오가 멈추거나 화면이 전환되는 자연 중단점에 놓인 슬롯이 광고를 받을 가능성이 높습니다. 문장 중간이나 동작 중간은 낮습니다.',
  ttsRisk:
    'TTS 낭독은 끊김 없이 이어져 자연 중단점이 적습니다. 챕터 사이나 장면 전환 지점에 수동으로 슬롯을 놓는 편이 유리합니다.',
  qualityFeedback:
    'YouTube Studio는 게재 가능성이 낮은 슬롯을 빨간색으로 표시합니다. 업로드 후 한 시간 안에 확인하고 조정하세요.',
  meditationCaveat:
    'YouTube 공식 FAQ는 "명상 영상은 중간광고에 적합하지 않을 수 있다"고 밝힙니다. 잠들기 전 듣는 용도라면 광고가 시청 이탈을 부를 수 있으므로, 슬롯을 늘리는 것이 항상 이득은 아닙니다.',
  intervalIsEstimate:
    '이 앱의 슬롯 개수 추정은 4분 간격을 가정한 것이며 공식 근거가 없습니다. YouTube는 간격을 공개하지 않습니다.',
} as const;

/** 목표 러닝타임을 맞추려면 몇 자가 필요한가 */
export function charsForRuntime(minutes: number, speed: TtsSpeed = 'normal'): number {
  return Math.round(minutes * 60 * TTS_SPEED[speed]);
}

// ─────────────────────────── 손익 ───────────────────────────

/** 손익 계산 입력 */
export interface RevenueInput {
  /** 월 고정비(원) — 도구 구독료 */
  monthlyCostKrw: number;
  /** 월 제작 편수 */
  videosPerMonth: number;
  /** 편당 평균 조회수 (한 달 누적 기준) */
  viewsPerVideo: number;
  /** RPM (원 / 1,000회). 한국 시청자 기반이면 1,500~3,500이 흔하다 */
  rpmKrw: number;
  /** 편당 제작 원가(원) — AI 생성 비용 */
  costPerVideoKrw: number;
}

export interface RevenueResult {
  /** 월 총 조회수 */
  monthlyViews: number;
  /** 월 광고 수익(원) */
  monthlyRevenueKrw: number;
  /** 월 총비용(원) = 고정비 + 편당 원가 × 편수 */
  monthlyCostKrw: number;
  /** 월 순이익(원) */
  monthlyProfitKrw: number;
  /** 편당 순이익(원) */
  profitPerVideoKrw: number;
  /** 손익분기에 필요한 월 조회수 */
  breakevenViews: number;
  /** 손익분기에 필요한 편당 조회수 */
  breakevenViewsPerVideo: number;
  /** 흑자인가 */
  profitable: boolean;
  /** 시간당 수익(원) — 제작 시간을 넣었을 때만 */
  hourlyKrw: number | null;
}

/**
 * 손익을 계산한다.
 * @param hoursPerVideo 편당 사람이 들이는 시간. 넣으면 시간당 수익을 함께 낸다
 */
export function calcRevenue(input: RevenueInput, hoursPerVideo?: number): RevenueResult {
  const videos = Math.max(0, input.videosPerMonth);
  const monthlyViews = videos * Math.max(0, input.viewsPerVideo);
  const monthlyRevenueKrw = Math.round((monthlyViews / 1000) * Math.max(0, input.rpmKrw));
  const totalCost = Math.max(0, input.monthlyCostKrw) + videos * Math.max(0, input.costPerVideoKrw);
  const profit = monthlyRevenueKrw - totalCost;

  // 손익분기 조회수: (고정비 + 편당원가 × 편수) / RPM × 1000
  const breakevenViews =
    input.rpmKrw > 0 ? Math.ceil((totalCost / input.rpmKrw) * 1000) : Number.POSITIVE_INFINITY;

  const totalHours = hoursPerVideo !== undefined ? hoursPerVideo * videos : null;

  return {
    monthlyViews,
    monthlyRevenueKrw,
    monthlyCostKrw: totalCost,
    monthlyProfitKrw: profit,
    profitPerVideoKrw: videos > 0 ? Math.round(profit / videos) : 0,
    breakevenViews: Number.isFinite(breakevenViews) ? breakevenViews : 0,
    breakevenViewsPerVideo:
      videos > 0 && Number.isFinite(breakevenViews) ? Math.ceil(breakevenViews / videos) : 0,
    profitable: profit > 0,
    hourlyKrw: totalHours && totalHours > 0 ? Math.round(profit / totalHours) : null,
  };
}

/** 목표 월수입을 달성하려면 무엇이 필요한가 */
export interface TargetPlan {
  targetProfitKrw: number;
  /** 필요한 월 조회수 */
  requiredMonthlyViews: number;
  /** 현재 편당 조회수 유지 시 필요한 편수 */
  requiredVideos: number | null;
  /** 현재 편수 유지 시 필요한 편당 조회수 */
  requiredViewsPerVideo: number | null;
  /** 달성 가능성 평가 */
  verdict: string;
}

/**
 * 목표 순이익을 넣으면 필요한 조건을 역산한다.
 * 강의가 말하는 "월 300만원"이 실제로 어떤 규모인지 보여주는 것이 목적이다.
 */
export function planForTarget(input: RevenueInput, targetProfitKrw: number): TargetPlan {
  const videos = Math.max(1, input.videosPerMonth);
  const requiredRevenue =
    targetProfitKrw + input.monthlyCostKrw + videos * input.costPerVideoKrw;
  const requiredMonthlyViews =
    input.rpmKrw > 0 ? Math.ceil((requiredRevenue / input.rpmKrw) * 1000) : 0;

  const requiredViewsPerVideo =
    videos > 0 ? Math.ceil(requiredMonthlyViews / videos) : null;

  const requiredVideos =
    input.viewsPerVideo > 0 ? Math.ceil(requiredMonthlyViews / input.viewsPerVideo) : null;

  let verdict: string;
  if (requiredMonthlyViews <= 0) {
    verdict = 'RPM을 입력해야 계산할 수 있습니다.';
  } else if (requiredMonthlyViews < 100_000) {
    verdict = '작은 채널로도 도달 가능한 규모입니다.';
  } else if (requiredMonthlyViews < 1_000_000) {
    verdict = '채널이 어느 정도 자리를 잡아야 하는 규모입니다.';
  } else if (requiredMonthlyViews < 5_000_000) {
    verdict = '월 백만 조회를 넘겨야 합니다. 다채널 운영이 사실상 전제됩니다.';
  } else {
    verdict = '월 오백만 조회 이상입니다. 이 방식만으로는 현실적이지 않습니다.';
  }

  return {
    targetProfitKrw,
    requiredMonthlyViews,
    requiredVideos,
    requiredViewsPerVideo,
    verdict,
  };
}

/**
 * 참고용 RPM 시나리오.
 *
 * ⚠ 이 값들은 공식 통계가 아니다. 아래 근거에서 도출한 참고 구간이다.
 *
 * 도출 근거
 *   - 전 니치 RPM 중위값 약 $2.30 (AIR Media-Tech, 300개 채널 실데이터, 2026)
 *   - Entertainment 니치 RPM 약 $2.43 (같은 자료)
 *   - 한국 CPM 약 $2.7 / 미국 약 $11.1 (isthischannelmonetized.com 국가별 CPM)
 *     → 한국은 미국의 약 4분의 1
 *   - YouTube 수익 배분 제작자 55% (공식)
 *
 * 한국 시청자 기반 채널은 위 글로벌 중위값보다 낮은 구간에 놓일 가능성이 높다.
 * 환율은 1달러 1,350원 전후로 계산했다.
 *
 * 실제 값은 자기 채널의 YouTube Studio에서 확인해야 한다.
 * Analytics → 수익 → RPM 항목에 실측치가 나온다.
 */
export const RPM_SCENARIOS = [
  {
    id: 'pessimistic',
    label: '보수적',
    rpmKrw: 1200,
    note: '한국 시청자 위주에 시청 지속시간이 짧은 경우. 글로벌 중위값의 절반 아래를 가정한 하한.',
    basis: 'estimate' as const,
  },
  {
    id: 'typical',
    label: '일반적',
    rpmKrw: 2200,
    note: '한국 CPM $2.7에 배분율 55%를 적용하면 약 $1.5, 원화 2,000원 전후. 여기에 중간광고 효과를 조금 얹은 값.',
    basis: 'derived' as const,
  },
  {
    id: 'good',
    label: '양호',
    rpmKrw: 3500,
    note: 'Entertainment 글로벌 중위값 $2.43(약 3,300원) 수준. 중간광고가 잘 붙고 지속시간이 긴 경우.',
    basis: 'derived' as const,
  },
  {
    id: 'lecture',
    label: '강의 사례',
    rpmKrw: 13000,
    note: '조회수 6만에 80만원이라는 강의 주장에서 역산한 값. 일반 구간의 약 여섯 배로, 재현 가능성이 낮습니다.',
    basis: 'claim' as const,
  },
] as const;

/** RPM 시나리오의 근거 수준 설명 */
export const RPM_BASIS_LABEL = {
  estimate: '저자 추정',
  derived: '공개 자료에서 도출',
  claim: '강의 주장에서 역산',
} as const;
