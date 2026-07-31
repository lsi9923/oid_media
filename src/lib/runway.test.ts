import { describe, expect, it } from 'vitest';
import {
  calcRunway,
  fullMonthlyCost,
  minimumMonthlyCost,
  monthsToRecoup,
  SETUP_GATES,
  STARTUP_COSTS,
  watchHoursPerView,
  YPP_REQUIREMENTS,
  type RunwayInput,
} from './runway';

const base: RunwayInput = {
  videosPerMonth: 20,
  runtimeMinutes: 120,
  viewsPerVideo: 5000,
  retentionPercent: 25,
  subscribeRatePercent: 0.5,
  monthlyCostKrw: 89000,
  costPerVideoKrw: 1500,
  currentSubscribers: 0,
  currentWatchHours: 0,
};

describe('YPP 요건 상수', () => {
  it('공식 수치와 일치한다', () => {
    expect(YPP_REQUIREMENTS.subscribers).toBe(1000);
    expect(YPP_REQUIREMENTS.watchHours).toBe(4000);
    expect(YPP_REQUIREMENTS.watchHourWindowMonths).toBe(12);
    expect(YPP_REQUIREMENTS.shortsViews).toBe(10_000_000);
    expect(YPP_REQUIREMENTS.shortsWindowDays).toBe(90);
  });

  it('심사 기간이 기록돼 있다', () => {
    expect(YPP_REQUIREMENTS.reviewMonths).toBe(1);
  });

  it('공식 출처가 있다', () => {
    expect(YPP_REQUIREMENTS.sourceUrl).toMatch(/^https:\/\/support\.google\.com\/youtube/);
  });
});

describe('watchHoursPerView', () => {
  it('러닝타임과 지속률로 계산한다', () => {
    // 120분 × 25% = 30분 = 0.5시간
    expect(watchHoursPerView(120, 25)).toBe(0.5);
  });

  it('지속률 100%면 러닝타임 전체다', () => {
    expect(watchHoursPerView(60, 100)).toBe(1);
  });

  it('지속률 0이면 0이다', () => {
    expect(watchHoursPerView(120, 0)).toBe(0);
  });

  it('범위를 벗어난 값을 보정한다', () => {
    expect(watchHoursPerView(120, 150)).toBe(watchHoursPerView(120, 100));
    expect(watchHoursPerView(120, -10)).toBe(0);
    expect(watchHoursPerView(-60, 50)).toBe(0);
  });
});

describe('calcRunway — 기본 계산', () => {
  it('월 시청시간을 계산한다', () => {
    const r = calcRunway(base);
    // 20편 × 5,000조회 × 0.5시간 = 50,000시간
    expect(r.monthlyWatchHours).toBe(50000);
  });

  it('월 구독자를 계산한다', () => {
    const r = calcRunway(base);
    // 100,000조회 × 0.5% = 500명
    expect(r.monthlySubscribers).toBe(500);
  });

  it('시청시간 요건 도달 개월을 낸다', () => {
    const r = calcRunway(base);
    // 4,000시간 / 50,000시간 = 0.08 → 1개월
    expect(r.monthsToWatchHours).toBe(1);
  });

  it('구독자 요건 도달 개월을 낸다', () => {
    const r = calcRunway(base);
    // 1,000명 / 500명 = 2개월
    expect(r.monthsToSubscribers).toBe(2);
  });

  it('늦은 쪽이 자격 도달 시점이다', () => {
    const r = calcRunway(base);
    expect(r.monthsToEligible).toBe(2);
  });

  it('심사 기간을 더해 수익화 시점을 낸다', () => {
    const r = calcRunway(base);
    expect(r.monthsToMonetized).toBe(3);
  });

  it('병목을 판정한다', () => {
    const r = calcRunway(base);
    expect(r.bottleneck).toBe('subscribers');
  });

  it('★ 수익화 전 누적 지출을 계산한다', () => {
    const r = calcRunway(base);
    // 3개월 × 89,000 + 60편 × 1,500 = 267,000 + 90,000 = 357,000
    expect(r.sunkCostKrw).toBe(357000);
    expect(r.videosUntilMonetized).toBe(60);
  });
});

describe('calcRunway — 현실적인 소규모 채널', () => {
  // 편당 조회 300회는 신규 채널에서 흔한 수준이다
  const small: RunwayInput = {
    ...base,
    videosPerMonth: 8,
    viewsPerVideo: 300,
    retentionPercent: 20,
    subscribeRatePercent: 0.3,
  };

  it('★ 조회수가 적으면 수개월이 걸린다', () => {
    const r = calcRunway(small);
    // 월 조회 2,400 × 0.4시간 = 960시간 → 4,000시간까지 5개월
    expect(r.monthsToWatchHours).toBe(5);
    // 월 구독 2,400 × 0.3% = 7.2명 → 1,000명까지 139개월
    expect(r.monthsToSubscribers).toBeGreaterThan(100);
  });

  it('★ 구독자가 병목이 된다', () => {
    const r = calcRunway(small);
    expect(r.bottleneck).toBe('subscribers');
  });

  it('★ 12개월을 넘기면 시청시간 만료를 경고한다', () => {
    const verySmall = { ...small, videosPerMonth: 2, viewsPerVideo: 100 };
    const r = calcRunway(verySmall);
    expect(r.monthsToWatchHours!).toBeGreaterThan(12);
    expect(r.blocker).toMatch(/만료/);
  });

  it('누적 지출이 크게 늘어난다', () => {
    const r = calcRunway(small);
    // 100개월 이상이면 수백만원이 든다
    expect(r.sunkCostKrw!).toBeGreaterThan(5_000_000);
  });
});

describe('calcRunway — 이미 확보한 실적 반영', () => {
  it('현재 구독자를 차감한다', () => {
    const r = calcRunway({ ...base, currentSubscribers: 900 });
    // 100명만 남았으므로 1개월
    expect(r.monthsToSubscribers).toBe(1);
  });

  it('현재 시청시간을 차감한다', () => {
    const r = calcRunway({ ...base, currentWatchHours: 3900 });
    expect(r.monthsToWatchHours).toBe(1);
  });

  it('요건을 이미 채웠으면 0개월이다', () => {
    const r = calcRunway({ ...base, currentSubscribers: 1200, currentWatchHours: 5000 });
    expect(r.monthsToWatchHours).toBe(0);
    expect(r.monthsToSubscribers).toBe(0);
    expect(r.monthsToEligible).toBe(0);
    // 심사만 남는다
    expect(r.monthsToMonetized).toBe(1);
  });

  it('요건 초과분을 음수로 처리하지 않는다', () => {
    const r = calcRunway({ ...base, currentSubscribers: 99999, currentWatchHours: 99999 });
    expect(r.monthsToEligible).toBe(0);
    expect(r.sunkCostKrw).toBeGreaterThanOrEqual(0);
  });
});

describe('calcRunway — 도달 불가 판정', () => {
  it('편수가 0이면 불가로 판정한다', () => {
    const r = calcRunway({ ...base, videosPerMonth: 0 });
    expect(r.monthsToEligible).toBeNull();
    expect(r.blocker).toBeTruthy();
  });

  it('구독 전환율이 0이면 불가로 판정한다', () => {
    const r = calcRunway({ ...base, subscribeRatePercent: 0 });
    expect(r.monthsToSubscribers).toBeNull();
    expect(r.monthsToEligible).toBeNull();
    expect(r.blocker).toMatch(/구독자/);
  });

  it('지속률이 0이면 시청시간이 쌓이지 않는다', () => {
    const r = calcRunway({ ...base, retentionPercent: 0 });
    expect(r.monthsToWatchHours).toBeNull();
    expect(r.blocker).toMatch(/시청시간/);
  });

  it('불가일 때 누적 비용을 null로 둔다', () => {
    const r = calcRunway({ ...base, videosPerMonth: 0 });
    expect(r.sunkCostKrw).toBeNull();
    expect(r.videosUntilMonetized).toBeNull();
  });

  it('음수 입력을 안전하게 처리한다', () => {
    const r = calcRunway({
      ...base,
      videosPerMonth: -5,
      viewsPerVideo: -100,
      monthlyCostKrw: -1000,
    });
    expect(r.monthlyWatchHours).toBe(0);
    expect(Number.isNaN(r.monthlyWatchHours)).toBe(false);
  });
});

describe('monthsToRecoup — 투자 회수', () => {
  it('누적 지출을 월 순이익으로 나눈다', () => {
    expect(monthsToRecoup(357000, 100000)).toBe(4);
  });

  it('순이익이 0 이하면 회수 불가다', () => {
    expect(monthsToRecoup(357000, 0)).toBeNull();
    expect(monthsToRecoup(357000, -50000)).toBeNull();
  });

  it('지출이 0이면 0개월이다', () => {
    expect(monthsToRecoup(0, 100000)).toBe(0);
  });
});

describe('SETUP_GATES — 관문 정의', () => {
  it('id가 중복되지 않는다', () => {
    const ids = SETUP_GATES.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 관문에 할 일·비용·기간이 있다', () => {
    for (const g of SETUP_GATES) {
      expect(g.what.length, `${g.id} 할 일`).toBeGreaterThan(15);
      expect(g.cost.length, `${g.id} 비용`).toBeGreaterThan(1);
      expect(g.duration.length, `${g.id} 기간`).toBeGreaterThan(1);
    }
  });

  it('2단계 인증이 요건으로 포함돼 있다', () => {
    const g = SETUP_GATES.find((x) => x.id === 'two-step');
    expect(g).toBeDefined();
    expect(g?.risk).toMatch(/신청/);
    expect(g?.source).toMatch(/support\.google\.com/);
  });

  it('★ 고급 기능 인증이 포함돼 있다', () => {
    // 15분 초과 업로드에 필요한데 놓치기 쉽다
    const g = SETUP_GATES.find((x) => x.id === 'advanced-features');
    expect(g).toBeDefined();
    expect(g?.risk).toMatch(/두 시간|15분|업로드/);
  });

  it('★ 세금 정보 제출이 원천징수 경고와 함께 있다', () => {
    const g = SETUP_GATES.find((x) => x.id === 'tax-info');
    expect(g?.risk).toMatch(/24%|원천징수/);
  });

  it('★ 요건 달성 관문이 가장 오래 걸린다고 밝힌다', () => {
    const g = SETUP_GATES.find((x) => x.id === 'threshold');
    expect(g?.risk).toMatch(/가장 긴|0원/);
    expect(g?.what).toMatch(/1,000명/);
    expect(g?.what).toMatch(/4,000시간/);
  });

  it('Shorts 시청시간 제외를 명시한다', () => {
    const g = SETUP_GATES.find((x) => x.id === 'threshold');
    expect(g?.what).toMatch(/Shorts 피드 시청시간은 4,000시간에 포함되지 않/);
  });

  it('재신청 대기 기간을 명시한다', () => {
    const g = SETUP_GATES.find((x) => x.id === 'apply');
    expect(g?.risk).toMatch(/30일/);
    expect(g?.risk).toMatch(/90일/);
  });

  it('관문 순서가 논리적이다', () => {
    const ids = SETUP_GATES.map((g) => g.id);
    // 계정 → 인증 → 채널 → 고급기능 → 도구 → 요건 → 신청 → 세금 → 지급
    expect(ids.indexOf('google-account')).toBeLessThan(ids.indexOf('channel'));
    expect(ids.indexOf('channel')).toBeLessThan(ids.indexOf('threshold'));
    expect(ids.indexOf('threshold')).toBeLessThan(ids.indexOf('apply'));
    expect(ids.indexOf('apply')).toBeLessThan(ids.indexOf('first-payout'));
  });
});

describe('STARTUP_COSTS — 비용 구성', () => {
  it('최소 구성이 전체보다 싸다', () => {
    expect(minimumMonthlyCost()).toBeLessThan(fullMonthlyCost());
  });

  it('★ 최소 구성은 59,000원이다', () => {
    // Claude 30,000 + Vrew 29,000. Grok은 선택
    expect(minimumMonthlyCost()).toBe(59000);
  });

  it('전체 구성은 89,000원이다', () => {
    expect(fullMonthlyCost()).toBe(89000);
  });

  it('선택 가능한 항목이 표시돼 있다', () => {
    const optional = STARTUP_COSTS.filter((c) => c.optional);
    expect(optional.length).toBeGreaterThanOrEqual(1);
    expect(optional.map((c) => c.label)).toContain('Grok');
  });

  it('무료 항목이 0원으로 표시된다', () => {
    const free = STARTUP_COSTS.filter((c) => c.amountKrw === 0);
    expect(free.length).toBeGreaterThanOrEqual(2);
    expect(free.map((c) => c.label)).toContain('Google Flow');
  });

  it('모든 항목에 설명이 있다', () => {
    for (const c of STARTUP_COSTS) {
      expect(c.note, `${c.label} 설명 없음`).toBeTruthy();
    }
  });

  it('컴퓨터 사양 부담이 없다고 밝힌다', () => {
    const pc = STARTUP_COSTS.find((c) => c.label.includes('컴퓨터'));
    expect(pc?.amountKrw).toBe(0);
    expect(pc?.note).toMatch(/고성능이 필요하지 않/);
  });
});

describe('실전 시나리오 — 처음 시작하는 사람', () => {
  it('★ 최소 구성으로 시작하면 누적 비용이 준다', () => {
    const full = calcRunway({ ...base, monthlyCostKrw: fullMonthlyCost() });
    const min = calcRunway({ ...base, monthlyCostKrw: minimumMonthlyCost() });
    expect(min.sunkCostKrw!).toBeLessThan(full.sunkCostKrw!);
  });

  it('★ 낙관과 비관 시나리오의 차이가 크다', () => {
    const optimistic = calcRunway({
      ...base,
      viewsPerVideo: 8000,
      retentionPercent: 30,
      subscribeRatePercent: 1,
    });
    const pessimistic = calcRunway({
      ...base,
      videosPerMonth: 8,
      viewsPerVideo: 200,
      retentionPercent: 15,
      subscribeRatePercent: 0.2,
    });
    expect(pessimistic.monthsToMonetized!).toBeGreaterThan(optimistic.monthsToMonetized! * 5);
  });

  it('구독 전환율이 시청시간보다 병목이 되기 쉽다', () => {
    // 롱폼은 시청시간이 빨리 쌓이지만 구독은 느리다
    const r = calcRunway(base);
    expect(r.monthsToSubscribers!).toBeGreaterThanOrEqual(r.monthsToWatchHours!);
  });
});
