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
 * 한국어 TTS 낭독 속도 (초당 글자수).
 *
 * 공백 포함 기준. Vrew 기본 속도에서 측정되는 일반적 범위다.
 * 50~70대 시청층을 겨냥하면 느린 쪽을 택하는 편이 낫다.
 */
export const TTS_SPEED = {
  slow: 4.0,
  normal: 4.8,
  fast: 5.6,
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
 * YouTube 공식: 8분 이상이면 중간광고를 넣을 수 있다.
 * 슬롯 개수 상한은 공식 문서에 명시가 없고 자동 배치는 시스템이 결정한다.
 * 실제 서빙 간격은 대체로 3~5분 사이로 보고되므로 4분을 기준으로 잡는다.
 * 추정치이며 실제 수익과 다를 수 있다.
 */
export function estimateMidrollSlots(seconds: number): number {
  if (seconds < 8 * 60) return 0;
  const INTERVAL = 4 * 60;
  // 첫 슬롯은 도입 이후, 마지막은 끝나기 전에 배치된다고 본다
  return Math.max(1, Math.floor((seconds - INTERVAL) / INTERVAL));
}

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

/** 참고용 RPM 시나리오. 사용자가 감을 잡을 기준점 */
export const RPM_SCENARIOS = [
  {
    id: 'pessimistic',
    label: '보수적',
    rpmKrw: 1200,
    note: '한국 시청자 위주, 시청 지속시간이 짧은 경우',
  },
  {
    id: 'typical',
    label: '일반적',
    rpmKrw: 2200,
    note: '한국 엔터테인먼트 롱폼의 흔한 구간',
  },
  {
    id: 'good',
    label: '양호',
    rpmKrw: 3500,
    note: '중간광고가 잘 붙고 지속시간이 긴 경우',
  },
  {
    id: 'lecture',
    label: '강의 사례',
    rpmKrw: 13000,
    note: '조회수 6만에 80만원. 한국 기준으로는 이례적인 수치다',
  },
] as const;
