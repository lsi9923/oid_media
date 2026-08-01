import { describe, expect, it } from 'vitest';
import { TOOLS, totalMonthlyCost } from '../data/tools';
import {
  calcRunway,
  DEFAULT_USD_KRW,
  fullMonthlyCost,
  krwOf,
  minimumMonthlyCost,
  monthsToRecoup,
  POST_MONETIZATION_COSTS,
  SETUP_GATES,
  STARTUP_COSTS,
  USD_KRW_NOTE,
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
    expect(g?.risk).toMatch(/두 시간|15분|업로드|수익화/);
  });

  it('★ 세금 정보 제출이 원천징수 경고와 함께 있다', () => {
    const g = SETUP_GATES.find((x) => x.id === 'tax-info');
    expect(g?.risk).toMatch(/24%|30%|원천징수/);
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
    // 연령 → 계정 → 인증 → 채널 → 고급기능 → 도구 → 무위반 → 요건 → AdSense → 신청 → 세금 → 지급 → 활성유지
    expect(ids.indexOf('age-requirement')).toBeLessThan(ids.indexOf('google-account'));
    expect(ids.indexOf('google-account')).toBeLessThan(ids.indexOf('channel'));
    expect(ids.indexOf('channel')).toBeLessThan(ids.indexOf('threshold'));
    expect(ids.indexOf('threshold')).toBeLessThan(ids.indexOf('apply'));
    expect(ids.indexOf('apply')).toBeLessThan(ids.indexOf('first-payout'));
    expect(ids.indexOf('first-payout')).toBeLessThan(ids.indexOf('stay-active'));
  });

  it('★ 새 관문(연령·무위반·AdSense 연동·활성 유지)이 추가돼 있다', () => {
    const ids = SETUP_GATES.map((g) => g.id);
    expect(ids).toContain('age-requirement');
    expect(ids).toContain('no-strikes');
    expect(ids).toContain('adsense-link');
    expect(ids).toContain('stay-active');
  });
});

describe('STARTUP_COSTS — 비용 구성', () => {
  it('최소 구성이 전체보다 싸다', () => {
    expect(minimumMonthlyCost()).toBeLessThan(fullMonthlyCost());
  });

  it('★ 최소 구성은 Claude + Vrew다', () => {
    // $20 × 1,400 = 28,000 + Vrew 29,000. Grok은 선택
    expect(minimumMonthlyCost()).toBe(28000 + 29000);
  });

  it('★ 전체 구성에 Grok이 더해진다', () => {
    // + $30 × 1,400 = 42,000
    expect(fullMonthlyCost()).toBe(28000 + 29000 + 42000);
  });

  it('★ Grok은 SuperGrok $30이다 (X Premium+ $40 아님)', () => {
    // 공식 요금표에 이미지·영상 생성이 SuperGrok에 포함돼 있다.
    // X Premium+는 X 안의 Grok이라 영상 제작에 필요하지 않다.
    const g = STARTUP_COSTS.find((c) => c.label.includes('Grok'));
    expect(g?.usdAmount).toBe(30);
    expect(g?.source).toBe('https://x.ai/pricing');
    expect(g?.note).toMatch(/X Premium\+/);
    expect(g?.note).toMatch(/필요하지 않/);
  });

  it('★ 달러 항목은 usdAmount가 원본이다', () => {
    const usd = STARTUP_COSTS.filter((c) => c.usdAmount !== undefined);
    expect(usd.length).toBeGreaterThanOrEqual(2);
    for (const c of usd) {
      // 환율을 바꾸면 원화도 따라 바뀌어야 한다
      expect(krwOf(c, 1000)).toBe(c.usdAmount! * 1000);
      expect(krwOf(c, 1500)).toBe(c.usdAmount! * 1500);
    }
  });

  it('★ 환율이 오르면 총비용도 오른다', () => {
    expect(fullMonthlyCost(1500)).toBeGreaterThan(fullMonthlyCost(1300));
    // 원화 항목(Vrew)은 환율에 안 움직인다. 달러 항목 $50만 움직인다
    expect(fullMonthlyCost(1500) - fullMonthlyCost(1400)).toBe((20 + 30) * 100);
  });

  it('★ 부가세를 더할 수 있다', () => {
    const noVat = fullMonthlyCost(1400, false);
    const withVat = fullMonthlyCost(1400, true);
    expect(withVat).toBeGreaterThan(noVat);
    // Vrew는 부가세 포함 표기이므로 더해지지 않는다
    expect(withVat - noVat).toBe(Math.round((28000 + 42000) * 0.1));
  });

  it('환율이 0이나 음수면 기본값으로 대체한다', () => {
    expect(fullMonthlyCost(0)).toBe(fullMonthlyCost(DEFAULT_USD_KRW));
    expect(fullMonthlyCost(-100)).toBe(fullMonthlyCost(DEFAULT_USD_KRW));
  });

  it('★ 환율 기본값이 확인된 수치가 아니라고 밝힌다', () => {
    expect(USD_KRW_NOTE).toMatch(/확인된 공식 수치가 아닙니다/);
    expect(USD_KRW_NOTE).toMatch(/수수료/);
  });

  it('★ 달러 항목에 가격 출처와 확인일이 있다', () => {
    for (const c of STARTUP_COSTS.filter((x) => x.usdAmount !== undefined)) {
      expect(c.source, `${c.label} 출처 없음`).toMatch(/^https:\/\//);
      expect(c.lastVerified, `${c.label} 확인일 없음`).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it('선택 가능한 항목이 표시돼 있다', () => {
    const optional = STARTUP_COSTS.filter((c) => c.optional);
    expect(optional.length).toBeGreaterThanOrEqual(1);
    expect(optional.map((c) => c.label).join()).toMatch(/Grok/);
  });

  it('무료 항목이 0원으로 표시된다', () => {
    const free = STARTUP_COSTS.filter((c) => c.amountKrw === 0 && c.usdAmount === undefined);
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

describe('★ 도구 가격 단일 출처', () => {
  // 두 곳에 가격을 따로 두면 어긋난다. 실제로 어긋났다 —
  // tools.ts는 Grok 30,000원, runway.ts는 55,000원이라 같은 앱에서
  // 총 고정비가 89,000원과 114,000원으로 갈렸다.
  it('Claude 가격이 두 파일에서 같다', () => {
    const b = STARTUP_COSTS.find((c) => c.label.includes('Claude'))!;
    expect(TOOLS.claude.monthlyCostKrw).toBe(krwOf(b));
  });

  it('Grok 가격이 두 파일에서 같다', () => {
    const b = STARTUP_COSTS.find((c) => c.label.includes('Grok'))!;
    expect(TOOLS.grok.monthlyCostKrw).toBe(krwOf(b));
  });

  it('Vrew 가격이 두 파일에서 같다', () => {
    const b = STARTUP_COSTS.find((c) => c.label.includes('Vrew'))!;
    expect(TOOLS.vrew.monthlyCostKrw).toBe(krwOf(b));
  });

  it('★ 손익 시뮬레이터와 수익화 계산기의 총 고정비가 같다', () => {
    // 사용자가 두 화면에서 다른 숫자를 보면 어느 쪽을 믿어야 할지 알 수 없다
    expect(totalMonthlyCost()).toBe(fullMonthlyCost());
  });

  it('요금제 표기에 달러 금액이 들어 있다', () => {
    expect(TOOLS.claude.plan).toMatch(/\$20/);
    expect(TOOLS.grok.plan).toMatch(/\$30/);
  });

  it('★ Grok 설명이 잘못된 요금제를 고르지 않게 경고한다', () => {
    expect(TOOLS.grok.note).toMatch(/X Premium\+/);
    expect(TOOLS.grok.plan).toMatch(/SuperGrok/);
  });
});

describe('POST_MONETIZATION_COSTS — 수익화 후 운영 비용', () => {  it('항목이 2개 이상이다', () => {
    expect(POST_MONETIZATION_COSTS.length).toBeGreaterThanOrEqual(2);
  });

  it('모든 항목에 설명과 출처 힌트가 있다', () => {
    for (const c of POST_MONETIZATION_COSTS) {
      expect(c.note, `${c.label} 설명 없음`).toBeTruthy();
      // 추정이면 note에 '추정'이 포함돼야 한다
      expect(c.note).toMatch(/추정|공식|출처/);
    }
  });

  it('환전 손실 항목이 있다', () => {
    const fx = POST_MONETIZATION_COSTS.find((c) => c.label.includes('환전'));
    expect(fx).toBeDefined();
    expect(fx?.when).toBe('월 반복');
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
