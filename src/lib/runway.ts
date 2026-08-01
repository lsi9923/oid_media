/**
 * 수익화 도달 계산.
 *
 * 이 앱의 손익 시뮬레이터에는 근본적인 구멍이 있었다.
 * 수익화가 이미 켜져 있다고 가정한 것이다.
 *
 * 신규 채널은 먼저 요건을 채워야 한다. 공식 기준은 이렇다.
 *   구독자 1,000명 + 최근 12개월 유효 공개 시청시간 4,000시간
 *   또는 구독자 1,000명 + 최근 90일 유효 공개 Shorts 조회 1,000만 회
 *   출처: https://support.google.com/youtube/answer/72851
 *
 * 그 기간에는 수익이 0원이고 도구 비용은 계속 나간다.
 * 얼마나 오래, 얼마를 쓰게 되는지 계산하는 것이 이 모듈의 목적이다.
 */

/** 공식 요건 수치 */
export const YPP_REQUIREMENTS = {
  subscribers: 1000,
  watchHours: 4000,
  /** 시청시간 산정 기간(개월) */
  watchHourWindowMonths: 12,
  /** Shorts 경로 */
  shortsViews: 10_000_000,
  shortsWindowDays: 90,
  /** 심사 기간(개월). 공식 문서: typically in about 1 month */
  reviewMonths: 1,
  sourceUrl: 'https://support.google.com/youtube/answer/72851',
} as const;

/** 계산 입력 */
export interface RunwayInput {
  /** 월 제작 편수 */
  videosPerMonth: number;
  /** 편당 러닝타임(분) */
  runtimeMinutes: number;
  /**
   * 편당 최종 누적 조회수.
   * 롱폼은 업로드 후 몇 달에 걸쳐 조회가 쌓인다.
   */
  viewsPerVideo: number;
  /**
   * 평균 시청 지속률(%).
   * 배경 청취 콘텐츠는 높을 수 있지만 이탈도 크다.
   * 자기 채널의 Studio에서 확인해야 정확하다.
   */
  retentionPercent: number;
  /**
   * 구독 전환율(%). 조회 100회당 몇 명이 구독하는가.
   * 배경 청취 콘텐츠는 낮은 편이다.
   */
  subscribeRatePercent: number;
  /** 월 고정비(원) */
  monthlyCostKrw: number;
  /** 편당 제작 원가(원) */
  costPerVideoKrw: number;
  /** 이미 확보한 구독자 */
  currentSubscribers: number;
  /** 이미 확보한 시청시간 */
  currentWatchHours: number;
}

export interface RunwayResult {
  /** 월 누적 시청시간 증가분 */
  monthlyWatchHours: number;
  /** 월 누적 구독자 증가분 */
  monthlySubscribers: number;
  /** 시청시간 요건 충족까지 남은 개월 */
  monthsToWatchHours: number | null;
  /** 구독자 요건 충족까지 남은 개월 */
  monthsToSubscribers: number | null;
  /** 두 요건을 모두 채우는 데 걸리는 개월 (둘 중 늦은 쪽) */
  monthsToEligible: number | null;
  /** 심사까지 포함한 총 개월 */
  monthsToMonetized: number | null;
  /** 무엇이 병목인가 */
  bottleneck: 'watchHours' | 'subscribers' | 'both' | null;
  /** 수익화 전까지 누적 지출(원) */
  sunkCostKrw: number | null;
  /** 그때까지 만들 영상 편수 */
  videosUntilMonetized: number | null;
  /** 달성 불가 판정 사유 */
  blocker: string | null;
}

/** 조회 1회당 시청시간(시간) */
export function watchHoursPerView(runtimeMinutes: number, retentionPercent: number): number {
  const r = Math.max(0, Math.min(100, retentionPercent)) / 100;
  return (Math.max(0, runtimeMinutes) * r) / 60;
}

/**
 * 수익화 도달까지의 기간과 누적 비용을 계산한다.
 *
 * 단순 선형 모델이다. 실제로는 조회수가 시간에 따라 비선형으로 쌓이고
 * 알고리즘 노출도 변한다. 대략적인 규모를 보는 용도다.
 */
export function calcRunway(input: RunwayInput): RunwayResult {
  const videos = Math.max(0, input.videosPerMonth);
  const views = Math.max(0, input.viewsPerVideo);
  const hoursPerView = watchHoursPerView(input.runtimeMinutes, input.retentionPercent);

  const monthlyViews = videos * views;
  const monthlyWatchHours = monthlyViews * hoursPerView;
  const monthlySubscribers =
    monthlyViews * (Math.max(0, Math.min(100, input.subscribeRatePercent)) / 100);

  const needHours = Math.max(0, YPP_REQUIREMENTS.watchHours - Math.max(0, input.currentWatchHours));
  const needSubs = Math.max(
    0,
    YPP_REQUIREMENTS.subscribers - Math.max(0, input.currentSubscribers),
  );

  const monthsToWatchHours =
    needHours === 0 ? 0 : monthlyWatchHours > 0 ? Math.ceil(needHours / monthlyWatchHours) : null;
  const monthsToSubscribers =
    needSubs === 0 ? 0 : monthlySubscribers > 0 ? Math.ceil(needSubs / monthlySubscribers) : null;

  // 둘 중 하나라도 도달 불가면 전체 불가
  if (monthsToWatchHours === null || monthsToSubscribers === null) {
    const reasons: string[] = [];
    if (monthsToWatchHours === null) reasons.push('시청시간이 쌓이지 않습니다');
    if (monthsToSubscribers === null) reasons.push('구독자가 늘지 않습니다');
    return {
      monthlyWatchHours,
      monthlySubscribers,
      monthsToWatchHours,
      monthsToSubscribers,
      monthsToEligible: null,
      monthsToMonetized: null,
      bottleneck: null,
      sunkCostKrw: null,
      videosUntilMonetized: null,
      blocker: `${reasons.join(', ')}. 편수·조회수·지속률·구독 전환율을 확인하세요.`,
    };
  }

  const monthsToEligible = Math.max(monthsToWatchHours, monthsToSubscribers);
  const monthsToMonetized = monthsToEligible + YPP_REQUIREMENTS.reviewMonths;

  let bottleneck: RunwayResult['bottleneck'];
  if (monthsToWatchHours === monthsToSubscribers) bottleneck = 'both';
  else if (monthsToWatchHours > monthsToSubscribers) bottleneck = 'watchHours';
  else bottleneck = 'subscribers';

  const videosUntilMonetized = videos * monthsToMonetized;
  const sunkCostKrw =
    monthsToMonetized * Math.max(0, input.monthlyCostKrw) +
    videosUntilMonetized * Math.max(0, input.costPerVideoKrw);

  // 시청시간은 최근 12개월 기준이다. 그보다 오래 걸리면 앞부분이 만료된다
  let blocker: string | null = null;
  if (monthsToWatchHours > YPP_REQUIREMENTS.watchHourWindowMonths) {
    blocker =
      `시청시간 요건까지 ${monthsToWatchHours}개월이 걸립니다. ` +
      `시청시간은 최근 ${YPP_REQUIREMENTS.watchHourWindowMonths}개월만 집계되므로, ` +
      `이 속도로는 앞서 쌓은 시간이 만료돼 요건을 채우지 못할 수 있습니다.`;
  }

  // 구독자 요건이 36개월(3년) 이상이면 사실상 도달 불가 수준
  const SUBSCRIBER_BLOCKER_THRESHOLD_MONTHS = 36;
  if (!blocker && monthsToSubscribers > SUBSCRIBER_BLOCKER_THRESHOLD_MONTHS) {
    blocker =
      `구독자 요건까지 ${monthsToSubscribers}개월(약 ${Math.round(monthsToSubscribers / 12)}년)이 걸립니다. ` +
      `누적 지출이 ${Math.round(sunkCostKrw / 10000).toLocaleString()}만원에 달하며, ` +
      `이 전환율로는 사실상 도달이 어렵습니다. 구독 전환율을 높이거나 조회수를 늘려야 합니다.`;
  }

  return {
    monthlyWatchHours,
    monthlySubscribers,
    monthsToWatchHours,
    monthsToSubscribers,
    monthsToEligible,
    monthsToMonetized,
    bottleneck,
    sunkCostKrw,
    videosUntilMonetized,
    blocker,
  };
}

/**
 * 수익화 이후 투자 회수까지 걸리는 기간.
 * 승인 전까지 쓴 돈을 월 순이익으로 나눈다.
 */
export function monthsToRecoup(sunkCostKrw: number, monthlyProfitKrw: number): number | null {
  if (monthlyProfitKrw <= 0) return null;
  return Math.ceil(sunkCostKrw / monthlyProfitKrw);
}

/** 채널 개설부터 첫 수익까지의 관문 */
export interface Gate {
  id: string;
  name: string;
  /** 무엇을 해야 하는가 */
  what: string;
  /** 비용 */
  cost: string;
  /** 걸리는 시간 */
  duration: string;
  /** 공식 근거 */
  source?: string;
  /** 놓치면 생기는 문제 */
  risk?: string;
}

/**
 * 처음 시작하는 사람이 거쳐야 하는 관문.
 * 모두 공식 문서에 근거한다.
 */
export const SETUP_GATES: Gate[] = [
  {
    id: 'age-requirement',
    name: '연령 요건',
    what:
      '한국에서 구글 계정을 직접 관리하려면 만 14세 이상이어야 합니다. ' +
      'AdSense는 만 18세(한국은 만 19세) 이상만 가입 가능합니다. 미성년자가 직접 수익화를 설정할 수 없습니다.',
    cost: '무료',
    duration: '해당 없음',
    source: 'https://support.google.com/accounts/answer/1350409',
    risk:
      '만 19세 미만은 보호자 계정이 필요하며, AdSense 계정 소유자는 반드시 성인이어야 합니다.',
  },
  {
    id: 'google-account',
    name: '구글 계정',
    what: '구글 계정을 만듭니다. 이미 있으면 그것을 씁니다.',
    cost: '무료',
    duration: '5분',
  },
  {
    id: 'two-step',
    name: '2단계 인증',
    what:
      '구글 계정에 2단계 인증을 켭니다. YPP 가입 요건에 명시된 항목이므로 반드시 켜야 합니다.',
    cost: '무료',
    duration: '5분',
    source: 'https://support.google.com/youtube/answer/72851',
    risk: '켜지 않으면 수익화 신청 자체가 안 됩니다.',
  },
  {
    id: 'channel',
    name: '채널 개설',
    what:
      '채널을 만듭니다. 여러 채널을 운영할 계획이면 개인 채널이 아니라 브랜드 채널로 만드는 편이 낫습니다.',
    cost: '무료',
    duration: '10분',
  },
  {
    id: 'advanced-features',
    name: '중급·고급 기능 인증',
    what:
      'YouTube는 기능 접근을 Standard → Intermediate → Advanced 3단계로 구분합니다. ' +
      '15분 초과 영상을 올리려면 전화번호 인증(중급, Intermediate)이 필요합니다. ' +
      '수익화 신청은 고급(Advanced) 기능이며, 충분한 채널 활동 기록으로 자동 부여되거나 신분증·영상 인증으로 즉시 잠금해제됩니다.',
    cost: '무료',
    duration: '즉시 ~ 며칠',
    source: 'https://support.google.com/youtube/answer/9890437',
    risk: '중급 권한이 없으면 두 시간짜리 영상을 올릴 수 없고, 고급 권한이 없으면 수익화 신청이 불가합니다.',
  },
  {
    id: 'tools',
    name: '제작 도구 결제',
    what: 'Claude, Grok, Vrew를 결제합니다. Flow와 미리캔버스는 무료입니다.',
    cost: '월 59,000~114,000원 (VAT 별도, Grok 선택 시 상한)',
    duration: '20분',
    risk: '이 시점부터 비용이 나가지만 수익은 아직 0원입니다. 해외 SaaS 결제에는 부가세 10%가 추가됩니다.',
  },
  {
    id: 'no-strikes',
    name: '커뮤니티 가이드라인 무위반',
    what:
      '활성 상태의 커뮤니티 가이드라인 경고가 없어야 YPP 신청이 가능합니다.',
    cost: '무료',
    duration: '위반 시 경고 1건당 90일 대기',
    source: 'https://support.google.com/youtube/answer/72851',
    risk: '경고가 있으면 수익화 신청 자체가 차단됩니다. 만료될 때까지 대기해야 합니다.',
  },
  {
    id: 'threshold',
    name: '수익화 요건 달성',
    what:
      '구독자 1,000명과 최근 12개월 유효 공개 시청시간 4,000시간을 채웁니다. Shorts 경로는 구독자 1,000명 + 90일간 조회 1,000만 회입니다. Shorts 피드 시청시간은 4,000시간에 포함되지 않습니다.',
    cost: '이 기간 누적 도구비 (아래 계산기로 산출)',
    duration: '수개월 ~ 1년 이상',
    source: 'https://support.google.com/youtube/answer/72851',
    risk:
      '가장 긴 관문입니다. 이 기간 수익은 0원입니다. 시청시간은 최근 12개월만 집계되므로 속도가 너무 느리면 앞서 쌓은 것이 만료됩니다.',
  },
  {
    id: 'adsense-link',
    name: 'AdSense 계정 연동',
    what:
      '수익화 신청 시 AdSense for YouTube 계정을 연결하거나 새로 생성해야 합니다. ' +
      '반드시 YouTube Studio 내에서 생성해야 합니다.',
    cost: '무료',
    duration: '10분',
    source: 'https://support.google.com/youtube/answer/72851',
    risk:
      '기존 AdSense 계정이 정지 상태이거나, YouTube Studio 외부에서 잘못 생성한 경우 연동이 거부될 수 있습니다.',
  },
  {
    id: 'apply',
    name: '수익화 신청 · 심사',
    what:
      'Studio → 수익 창출에서 신청합니다. AdSense 계정을 연결하고 약관에 동의합니다. 심사는 사람과 자동 시스템이 함께 합니다.',
    cost: '무료',
    duration: '약 1개월',
    source: 'https://support.google.com/youtube/answer/72851',
    risk:
      '거절되면 21일 내 항소하거나 30일 후 재신청합니다. 두 번째 이후 거절은 90일을 기다려야 합니다.',
  },
  {
    id: 'tax-info',
    name: 'AdSense 세금 정보 제출',
    what:
      '모든 크리에이터가 세금 정보를 제출해야 합니다. 한국 거주자는 한미 조세조약(제14조, 저작권 로열티)에 따라 미국 시청자 수익의 원천징수율을 10%로 낮출 수 있습니다.',
    cost: '무료',
    duration: '30분',
    source: 'https://support.google.com/youtube/answer/10391362',
    risk:
      '제출하지 않으면 개인 계정은 전 세계 수익의 최대 24%를, 사업자 계정은 미국 시청자 수익의 30%를 원천징수당할 수 있습니다. ' +
      '한미 조세조약을 적용하면 미국 시청자 수익의 10%(저작권 로열티)로 낮출 수 있습니다.',
  },
  {
    id: 'first-payout',
    name: '첫 지급',
    what:
      '잔액이 지급 임계값(USD $100 — 한국 계정은 USD 기준, 공식 threshold 표에 KRW 없음)을 넘고 ' +
      '지급 보류가 없으면 매월 21일에서 26일 사이에 지급됩니다. ' +
      '수익이 인증 임계값($10 상당)에 도달하면 구글이 우편으로 6자리 PIN을 보내며, 3주 소요, 4개월 내 입력해야 합니다.',
    cost: '무료',
    duration: '임계값 도달 후 다음 지급 주기',
    source: 'https://support.google.com/adsense/answer/7164703',
    risk:
      '임계값($100)을 못 넘으면 다음 달로 넘어갑니다. 수익이 적으면 첫 입금까지 여러 달이 걸릴 수 있습니다. ' +
      'PIN 우편을 4개월 내 입력하지 않으면 광고 게재가 중지됩니다.',
  },
  {
    id: 'stay-active',
    name: '채널 활성 유지',
    what:
      '6개월 이상 영상 업로드나 커뮤니티 게시물이 없으면 수익화가 해제될 수 있습니다.',
    cost: '무료',
    duration: '지속적',
    source: 'https://support.google.com/youtube/answer/72851',
    risk:
      '수익화 승인 후에도 6개월 방치하면 수익화가 꺼질 수 있습니다. 재승인에 시간이 걸립니다.',
  },
];

/** 수익화 전 단계의 총 비용 항목 */
export interface CostItem {
  label: string;
  /**
   * 원화 금액.
   * usdAmount가 있는 항목은 이 값이 참고용이다. 실제 청구액은
   * krwOf()로 환율을 적용해 계산한다.
   */
  amountKrw: number;
  when: '일회성' | '월 반복';
  note?: string;
  /** 없어도 되는가 */
  optional: boolean;
  /** 표기 금액에 부가세 10%가 포함돼 있는가. 미표기면 불명확 */
  vatIncluded?: boolean;
  /** 달러로 청구되는 항목의 정가. 이쪽이 원본이다 */
  usdAmount?: number;
  /** 마지막 가격 확인일 */
  lastVerified?: string;
  /** 가격 출처 */
  source?: string;
}

/**
 * 원화 환산에 쓰는 기본 환율.
 *
 * 달러 정가는 변하지 않아도 환율은 매일 변한다. 원화를 코드에 박으면
 * 반드시 낡는다. 그래서 달러 금액을 원본으로 두고 환율을 곱한다.
 *
 * 이 기본값은 확인된 공식 수치가 아니다. 한국은행 ECOS에서 조회하려
 * 했으나 API 호출 제한에 걸렸다. 사용자가 직접 고칠 수 있게 해두었으니
 * 계산 전에 실제 환율로 바꾸는 것이 좋다.
 */
export const DEFAULT_USD_KRW = 1400;
export const USD_KRW_NOTE =
  '환율 기본값은 확인된 공식 수치가 아닙니다. 결제 시점의 실제 환율로 바꿔서 보세요. ' +
  '카드사 해외결제 수수료(보통 1~2%)가 더 붙습니다.';

/** 부가세율. 해외 디지털 서비스에 붙는다 */
export const VAT_RATE = 0.1;

/**
 * 항목의 실제 청구 원화를 계산한다.
 * 달러 항목은 환율을 곱하고, 원화 항목은 그대로 쓴다.
 */
export function krwOf(item: CostItem, usdKrw: number = DEFAULT_USD_KRW, withVat = false): number {
  const rate = usdKrw > 0 ? usdKrw : DEFAULT_USD_KRW;
  const base = item.usdAmount !== undefined ? item.usdAmount * rate : item.amountKrw;
  if (!withVat) return Math.round(base);
  // 이미 부가세가 포함된 표기면 더하지 않는다
  return Math.round(item.vatIncluded ? base : base * (1 + VAT_RATE));
}

export const STARTUP_COSTS: CostItem[] = [
  {
    label: 'Claude Pro',
    amountKrw: 28000,
    when: '월 반복',
    note: '대본·프롬프트 생성. $20/월. 이 방식의 핵심이므로 대체가 어렵습니다.',
    optional: false,
    usdAmount: 20,
    vatIncluded: false,
    lastVerified: '2026-08',
    source: 'https://www.anthropic.com/pricing',
  },
  {
    label: 'Vrew Standard',
    amountKrw: 29000,
    when: '월 반복',
    note:
      'TTS와 조합. 국내 서비스라 원화로 청구됩니다. 무료 플랜은 분량 제한이 커서 ' +
      '장편 1편도 어렵습니다. 실제 필요한 플랜은 만들 편수로 정해지므로 직접 확인하세요.',
    optional: false,
    vatIncluded: true,
    lastVerified: '2026-08',
    source: 'https://vrew.ai',
  },
  {
    label: 'Grok (SuperGrok)',
    amountKrw: 42000,
    when: '월 반복',
    note:
      '인트로 영상용. $30/월. 공식 요금표에 이미지·영상 생성이 이 플랜에 포함돼 있습니다. ' +
      'X Premium+($40)는 X 안에서 쓰는 Grok이라 영상 제작에는 필요하지 않습니다. ' +
      '더 비싼 쪽이 Grok 용도로 더 나은 것이 아닙니다. ' +
      '인트로를 정지 이미지로 대체하면 아예 생략할 수 있습니다.',
    optional: true,
    usdAmount: 30,
    vatIncluded: false,
    lastVerified: '2026-08',
    source: 'https://x.ai/pricing',
  },
  {
    label: 'Google Flow',
    amountKrw: 0,
    when: '월 반복',
    note: '이미지 생성. 무료지만 하루 생성 장수 제한이 있습니다.',
    optional: false,
    vatIncluded: true,
  },
  {
    label: '미리캔버스',
    amountKrw: 0,
    when: '월 반복',
    note: '썸네일 글자. 무료로 충분합니다.',
    optional: false,
    vatIncluded: true,
  },
  {
    label: '컴퓨터·인터넷',
    amountKrw: 0,
    when: '일회성',
    note: '이미 가진 것으로 충분합니다. 영상 편집이 아니라 조합이므로 고성능이 필요하지 않습니다.',
    optional: false,
    vatIncluded: true,
  },
];

/**
 * 수익화 후 발생하는 운영 비용.
 * STARTUP_COSTS와 별도이며, 수익이 발생한 뒤에야 의미가 생긴다.
 * 출처: 03-koreatax.md 분석 (2026-08-01)
 */
export const POST_MONETIZATION_COSTS: CostItem[] = [
  {
    label: '세무사 종합소득세 신고 대행',
    amountKrw: 165000,
    when: '일회성',
    note: '간편장부 기준 연 11~22만원 (추정). 복식부기 시 상승. 연 1회 발생.',
    optional: true,
    lastVerified: '2026-08',
    source: '추정. 시중 세무사 비교 견적 기준(간편장부 11~22만원 범위 중간값)',
  },
  {
    label: '환전 손실 + 외화 수취 수수료',
    amountKrw: 10000,
    when: '월 반복',
    note: '수령액의 약 1.5% + 건당 5,000~10,000원 (추정). 은행·수익 규모에 따라 변동.',
    optional: false,
    lastVerified: '2026-08',
    source: '추정. 시중 은행 외화 수취 수수료 일반 범위(5,000~10,000원/건)',
  },
];

/**
 * 최소 구성 월 비용 (선택 항목 제외).
 * 달러 항목은 환율을 적용한다.
 */
export function minimumMonthlyCost(usdKrw: number = DEFAULT_USD_KRW, withVat = false): number {
  return STARTUP_COSTS.filter((c) => c.when === '월 반복' && !c.optional).reduce(
    (s, c) => s + krwOf(c, usdKrw, withVat),
    0,
  );
}

/**
 * 관문 개수.
 *
 * 문구에 숫자를 직접 쓰면 관문을 추가·삭제할 때 어긋난다.
 * 실제로 한 번 어긋났다 — 배열은 13개인데 UI는 "열네 관문"이라고 표시했다.
 * 그래서 배열 길이에서 유도한다.
 */
export const SETUP_GATE_COUNT = SETUP_GATES.length;

/** 전체 구성 월 비용 */
export function fullMonthlyCost(usdKrw: number = DEFAULT_USD_KRW, withVat = false): number {
  return STARTUP_COSTS.filter((c) => c.when === '월 반복').reduce(
    (s, c) => s + krwOf(c, usdKrw, withVat),
    0,
  );
}
