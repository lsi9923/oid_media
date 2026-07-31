import { describe, expect, it } from 'vitest';
import {
  calcRevenue,
  charsForRuntime,
  estimateMidrollSlots,
  estimateRuntime,
  formatRuntime,
  planForTarget,
  RPM_SCENARIOS,
  TTS_SPEED,
} from './revenue';
import { scoreIntro } from './introScore';

describe('estimateRuntime — 러닝타임 추정', () => {
  it('46,000자는 두 시간을 넘긴다', () => {
    // 강의는 46,000자를 두 시간이라고 하는데 실제로는 더 길다
    const r = estimateRuntime(46000, 'normal');
    expect(r.seconds).toBeGreaterThan(2 * 3600);
    expect(r.display).toContain('시간');
  });

  it('낭독 속도에 따라 결과가 달라진다', () => {
    const slow = estimateRuntime(46000, 'slow').seconds;
    const fast = estimateRuntime(46000, 'fast').seconds;
    expect(slow).toBeGreaterThan(fast);
  });

  it('빈 대본은 0초', () => {
    const r = estimateRuntime(0);
    expect(r.seconds).toBe(0);
    expect(r.midrollEligible).toBe(false);
    expect(r.midrollSlots).toBe(0);
  });

  it('8분 미만은 중간광고를 못 넣는다', () => {
    // 8분 = 480초. normal 4.8자/초 → 약 2,300자
    const r = estimateRuntime(2000, 'normal');
    expect(r.seconds).toBeLessThan(480);
    expect(r.midrollEligible).toBe(false);
    expect(r.midrollSlots).toBe(0);
  });

  it('8분 이상이면 중간광고가 가능하다', () => {
    const r = estimateRuntime(3000, 'normal');
    expect(r.seconds).toBeGreaterThanOrEqual(480);
    expect(r.midrollEligible).toBe(true);
    expect(r.midrollSlots).toBeGreaterThanOrEqual(1);
  });

  it('속도 상수가 상식적인 범위다', () => {
    expect(TTS_SPEED.slow).toBeGreaterThan(3);
    expect(TTS_SPEED.fast).toBeLessThan(7);
    expect(TTS_SPEED.slow).toBeLessThan(TTS_SPEED.normal);
    expect(TTS_SPEED.normal).toBeLessThan(TTS_SPEED.fast);
  });
});

describe('estimateMidrollSlots', () => {
  it('8분 미만은 0개', () => {
    expect(estimateMidrollSlots(479)).toBe(0);
  });

  it('길이가 늘면 슬롯도 늘어난다', () => {
    const a = estimateMidrollSlots(30 * 60);
    const b = estimateMidrollSlots(120 * 60);
    expect(b).toBeGreaterThan(a);
  });

  it('두 시간이면 스물다섯 개 이상', () => {
    // 4분 간격 기준
    expect(estimateMidrollSlots(120 * 60)).toBeGreaterThanOrEqual(25);
  });

  it('음수나 0을 넣어도 깨지지 않는다', () => {
    expect(estimateMidrollSlots(0)).toBe(0);
    expect(estimateMidrollSlots(-100)).toBe(0);
  });
});

describe('formatRuntime', () => {
  it('시간과 분을 표기한다', () => {
    expect(formatRuntime(3600)).toBe('1시간');
    expect(formatRuntime(3660)).toBe('1시간 1분');
    expect(formatRuntime(600)).toBe('10분');
  });

  it('0 이하는 0분', () => {
    expect(formatRuntime(0)).toBe('0분');
    expect(formatRuntime(-5)).toBe('0분');
  });
});

describe('charsForRuntime — 역산', () => {
  it('목표 시간에 필요한 글자수를 낸다', () => {
    const chars = charsForRuntime(120, 'normal');
    // 되돌려 계산하면 목표에 근접해야 한다
    const back = estimateRuntime(chars, 'normal');
    expect(Math.abs(back.seconds - 120 * 60)).toBeLessThan(60);
  });

  it('두 시간이면 3만자를 넘는다', () => {
    expect(charsForRuntime(120, 'normal')).toBeGreaterThan(30000);
  });
});

describe('calcRevenue — 손익 계산', () => {
  const base = {
    monthlyCostKrw: 89000,
    videosPerMonth: 20,
    viewsPerVideo: 5000,
    rpmKrw: 2200,
    costPerVideoKrw: 1500,
  };

  it('월 조회수를 곱셈으로 낸다', () => {
    expect(calcRevenue(base).monthlyViews).toBe(100000);
  });

  it('RPM으로 수익을 계산한다', () => {
    const r = calcRevenue(base);
    // 10만 조회 × 2,200원/1,000회 = 220,000원
    expect(r.monthlyRevenueKrw).toBe(220000);
  });

  it('편당 원가를 총비용에 더한다', () => {
    const r = calcRevenue(base);
    // 89,000 + 1,500 × 20 = 119,000
    expect(r.monthlyCostKrw).toBe(119000);
  });

  it('순이익을 낸다', () => {
    const r = calcRevenue(base);
    expect(r.monthlyProfitKrw).toBe(220000 - 119000);
    expect(r.profitable).toBe(true);
  });

  it('손익분기 조회수를 낸다', () => {
    const r = calcRevenue(base);
    // 119,000 / 2,200 × 1000 = 약 54,091
    expect(r.breakevenViews).toBeGreaterThan(54000);
    expect(r.breakevenViews).toBeLessThan(55000);
  });

  it('편당 손익분기 조회수를 낸다', () => {
    const r = calcRevenue(base);
    expect(r.breakevenViewsPerVideo).toBe(Math.ceil(r.breakevenViews / 20));
  });

  it('적자를 판정한다', () => {
    const r = calcRevenue({ ...base, viewsPerVideo: 500 });
    expect(r.profitable).toBe(false);
    expect(r.monthlyProfitKrw).toBeLessThan(0);
  });

  it('시간당 수익을 계산한다', () => {
    // 편당 1시간, 20편 = 20시간
    const r = calcRevenue(base, 1);
    expect(r.hourlyKrw).toBe(Math.round((220000 - 119000) / 20));
  });

  it('시간을 넣지 않으면 시간당 수익은 null', () => {
    expect(calcRevenue(base).hourlyKrw).toBeNull();
  });

  it('편수 0이면 0으로 나누지 않는다', () => {
    const r = calcRevenue({ ...base, videosPerMonth: 0 });
    expect(r.monthlyViews).toBe(0);
    expect(r.profitPerVideoKrw).toBe(0);
    expect(Number.isNaN(r.profitPerVideoKrw)).toBe(false);
  });

  it('RPM 0이면 손익분기가 무한이 아니라 0으로 처리된다', () => {
    const r = calcRevenue({ ...base, rpmKrw: 0 });
    expect(Number.isFinite(r.breakevenViews)).toBe(true);
  });

  it('음수 입력을 0으로 보정한다', () => {
    const r = calcRevenue({
      monthlyCostKrw: -100,
      videosPerMonth: -5,
      viewsPerVideo: -1000,
      rpmKrw: -50,
      costPerVideoKrw: -10,
    });
    expect(r.monthlyViews).toBe(0);
    expect(r.monthlyRevenueKrw).toBe(0);
    expect(r.monthlyCostKrw).toBe(0);
  });
});

describe('calcRevenue — 강의 사례 검증', () => {
  it('강의 사례 RPM은 일반 수준의 다섯 배가 넘는다', () => {
    const lecture = RPM_SCENARIOS.find((s) => s.id === 'lecture')!;
    const typical = RPM_SCENARIOS.find((s) => s.id === 'typical')!;
    expect(lecture.rpmKrw / typical.rpmKrw).toBeGreaterThan(5);
  });

  it('일반 RPM으로는 강의 사례 수익이 나오지 않는다', () => {
    // 조회수 6만에 80만원이 나왔다는 주장
    const typical = RPM_SCENARIOS.find((s) => s.id === 'typical')!;
    const r = calcRevenue({
      monthlyCostKrw: 0,
      videosPerMonth: 1,
      viewsPerVideo: 60000,
      rpmKrw: typical.rpmKrw,
      costPerVideoKrw: 0,
    });
    // 일반 RPM이면 약 13만원. 80만원과 큰 차이가 있다
    expect(r.monthlyRevenueKrw).toBeLessThan(200000);
  });

  it('RPM 시나리오가 오름차순이다', () => {
    const rpms = RPM_SCENARIOS.map((s) => s.rpmKrw);
    const sorted = [...rpms].sort((a, b) => a - b);
    expect(rpms).toEqual(sorted);
  });
});

describe('planForTarget — 목표 역산', () => {
  const base = {
    monthlyCostKrw: 89000,
    videosPerMonth: 20,
    viewsPerVideo: 5000,
    rpmKrw: 2200,
    costPerVideoKrw: 1500,
  };

  it('월 300만원에 필요한 조회수를 낸다', () => {
    const p = planForTarget(base, 3_000_000);
    // (3,000,000 + 119,000) / 2,200 × 1000 = 약 141만 조회
    expect(p.requiredMonthlyViews).toBeGreaterThan(1_400_000);
    expect(p.requiredMonthlyViews).toBeLessThan(1_500_000);
  });

  it('월 300만원은 다채널 전제라고 판정한다', () => {
    const p = planForTarget(base, 3_000_000);
    expect(p.verdict).toMatch(/다채널|현실적이지 않/);
  });

  it('작은 목표는 도달 가능하다고 판정한다', () => {
    const p = planForTarget(base, 50_000);
    expect(p.verdict).toMatch(/도달 가능/);
  });

  it('필요한 편수와 편당 조회수를 함께 낸다', () => {
    const p = planForTarget(base, 1_000_000);
    expect(p.requiredVideos).toBeGreaterThan(0);
    expect(p.requiredViewsPerVideo).toBeGreaterThan(0);
  });

  it('편당 조회수가 0이면 필요 편수는 null', () => {
    const p = planForTarget({ ...base, viewsPerVideo: 0 }, 1_000_000);
    expect(p.requiredVideos).toBeNull();
  });

  it('목표가 클수록 필요 조회수도 크다', () => {
    const a = planForTarget(base, 500_000).requiredMonthlyViews;
    const b = planForTarget(base, 5_000_000).requiredMonthlyViews;
    expect(b).toBeGreaterThan(a);
  });
});

describe('scoreIntro — 인트로 채점', () => {
  const good = [
    '큰마님: 친정에는 저 재를 한 짐 지고 가거라.',
    '시집온 지 세 해, 첫 친정 나들이를 앞둔 며느리에게 노부인이 내린 뜻밖의 분부였습니다.',
    '그 무렵 임씨 집 담 너머에는 밤마다 누군가의 눈길이 어른거렸습니다.',
    '그런데 노부인이 하필 그 재더미를 골라 며느리 등에 지운 데에는 아무도 모르는 까닭이 숨어 있었지요.',
  ].join('\n');

  it('좋은 인트로는 높은 점수를 받는다', () => {
    const s = scoreIntro(good);
    expect(s.score).toBeGreaterThanOrEqual(75);
    expect(s.failed).toBe(0);
  });

  it('첫 문장이 대사인지 판정한다', () => {
    const s = scoreIntro(good);
    const c = s.checks.find((x) => x.id === 'dialogue-start');
    expect(c?.state).toBe('pass');
  });

  it('나레이션으로 시작하면 실패로 잡는다', () => {
    const bad = '깊은 산속 바위틈에 버려진 여인이 있었습니다.\n아무도 그를 찾지 않았습니다.';
    const c = scoreIntro(bad).checks.find((x) => x.id === 'dialogue-start');
    expect(c?.state).toBe('fail');
  });

  it('따옴표 대사를 인식한다', () => {
    const s = scoreIntro('"이것만은 열지 마세요."\n그렇게 말하고 떠났습니다. 까닭이 있었지요.');
    const c = s.checks.find((x) => x.id === 'dialogue-start');
    expect(c?.state).toBe('pass');
  });

  it('★ 이유를 설명하면 실패로 잡는다', () => {
    const bad = [
      '큰마님: 밥을 주지 마라.',
      '왜냐하면 며느리가 도둑질을 했기 때문이었습니다.',
    ].join('\n');
    const c = scoreIntro(bad).checks.find((x) => x.id === 'no-explain');
    expect(c?.state).toBe('fail');
    expect(c?.reason).toContain('왜냐하면');
  });

  it('이유를 감추면 통과한다', () => {
    const c = scoreIntro(good).checks.find((x) => x.id === 'no-explain');
    expect(c?.state).toBe('pass');
  });

  it('부당함 표현을 찾는다', () => {
    const c = scoreIntro(good).checks.find((x) => x.id === 'anomaly');
    expect(c?.state).toBe('pass');
  });

  it('부당함이 없으면 판정보류로 남긴다', () => {
    const bland = '해주: 오늘 날씨가 좋구나.\n마당에 햇살이 들었습니다. 그런 날이었습니다.';
    const c = scoreIntro(bland).checks.find((x) => x.id === 'anomaly');
    expect(c?.state).toBe('unsure');
  });

  it('길이를 검사한다', () => {
    const tooShort = scoreIntro('큰마님: 가거라.');
    expect(tooShort.checks.find((x) => x.id === 'length')?.state).toBe('fail');

    const tooLong = scoreIntro(`큰마님: 가거라.\n${'가'.repeat(400)}`);
    expect(tooLong.checks.find((x) => x.id === 'length')?.state).toBe('fail');
  });

  it('낭독 시간을 추정한다', () => {
    const s = scoreIntro(good);
    expect(s.runtimeSeconds).toBeGreaterThan(0);
    expect(s.runtimeDisplay).toBeTruthy();
    // 인트로는 30초 안쪽이 목표다
    expect(s.runtimeSeconds).toBeLessThan(90);
  });

  it('빈 입력을 안전하게 처리한다', () => {
    const s = scoreIntro('');
    expect(s.charCount).toBe(0);
    expect(s.verdict).toContain('붙여넣으면');
    expect(Number.isNaN(s.score)).toBe(false);
  });

  it('점수는 0에서 100 사이다', () => {
    for (const t of ['', '가', good, '가'.repeat(1000)]) {
      const s = scoreIntro(t);
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
    }
  });

  it('모든 항목에 고치는 방법이 있다', () => {
    for (const c of scoreIntro(good).checks) {
      expect(c.fix, `${c.id} 수정안 없음`).toBeTruthy();
    }
  });

  it('가중치 합이 100이다', () => {
    const total = scoreIntro(good).checks.reduce((s, c) => s + c.weight, 0);
    expect(total).toBe(100);
  });

  it('실패가 많으면 다시 뽑으라고 한다', () => {
    const bad = '평범한 이야기입니다. 왜냐하면 그랬기 때문입니다.';
    const s = scoreIntro(bad);
    expect(s.verdict).toMatch(/다시 뽑|고칠 여지/);
  });
});
