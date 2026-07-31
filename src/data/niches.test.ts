/**
 * 니치 진단 데이터 검증.
 *
 * 이 데이터는 사용자가 "무엇을 만들지"를 결정하는 데 쓰인다.
 * 판단이 섞인 지표이므로, 최소한 근거가 빠지지 않았고
 * 점수 계산이 일관적인지는 기계적으로 확인해야 한다.
 */
import { describe, expect, it } from 'vitest';
import { NICHES, rankNiches, scoreNiche } from './niches';

describe('니치 목록', () => {
  it('id가 중복되지 않는다', () => {
    const ids = NICHES.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 항목에 필수 근거가 있다', () => {
    for (const n of NICHES) {
      expect(n.name.length, `${n.id} 이름`).toBeGreaterThan(1);
      expect(n.description.length, `${n.id} 설명`).toBeGreaterThan(15);
      expect(n.policyReason.length, `${n.id} 정책 근거`).toBeGreaterThan(25);
      expect(n.saturationReason.length, `${n.id} 포화 근거`).toBeGreaterThan(15);
      expect(n.rpmReason.length, `${n.id} 단가 근거`).toBeGreaterThan(15);
      expect(n.audience.length, `${n.id} 시청층`).toBeGreaterThan(3);
    }
  });

  it('모든 항목에 유의사항이 2개 이상 있다', () => {
    for (const n of NICHES) {
      expect(n.caveats.length, `${n.id}`).toBeGreaterThanOrEqual(2);
      for (const c of n.caveats) expect(c.length).toBeGreaterThan(15);
    }
  });

  it('민담이 포함돼 있고 포화도가 매우 높다고 표시된다', () => {
    const m = NICHES.find((n) => n.id === 'mindam');
    expect(m).toBeDefined();
    expect(m?.saturation).toBe('매우 높음');
    // 강의 진행자 본인의 발언을 근거로 든다
    expect(m?.saturationReason).toMatch(/만 명/);
  });

  it('정책상 수익화가 막히는 니치가 명시돼 있다', () => {
    const blocked = NICHES.filter((n) => n.policyFit === 'blocked');
    expect(blocked.length).toBeGreaterThanOrEqual(2);
    const ids = blocked.map((n) => n.id);
    // AI 페르소나 정책에 걸리는 건강 정보
    expect(ids).toContain('health-advice');
    // 재사용 콘텐츠 정책에 걸리는 고전 낭독
    expect(ids).toContain('classic-lit');
  });

  it('건강 정보는 AI 페르소나 정책을 근거로 든다', () => {
    const h = NICHES.find((n) => n.id === 'health-advice');
    expect(h?.policyReason).toMatch(/AI 페르소나|건강.*법률.*금융/);
  });

  it('고전 낭독은 재사용 콘텐츠 정책을 근거로 든다', () => {
    const c = NICHES.find((n) => n.id === 'classic-lit');
    expect(c?.policyReason).toMatch(/재사용 콘텐츠|낭독으로만/);
  });

  it('안전한 니치가 하나 이상 있다', () => {
    expect(NICHES.filter((n) => n.policyFit === 'safe').length).toBeGreaterThanOrEqual(1);
  });
});

describe('scoreNiche — 점수 계산', () => {
  it('점수는 0에서 100 사이다', () => {
    for (const n of NICHES) {
      const s = scoreNiche(n).score;
      expect(s, `${n.id}`).toBeGreaterThanOrEqual(0);
      expect(s, `${n.id}`).toBeLessThanOrEqual(100);
    }
  });

  it('수익화 불가는 항상 비권장이다', () => {
    for (const n of NICHES.filter((x) => x.policyFit === 'blocked')) {
      const r = scoreNiche(n);
      expect(r.recommendation, `${n.id}`).toBe('비권장');
      expect(r.summary).toMatch(/수익화가 막히/);
    }
  });

  it('정책이 안전하고 포화도가 낮으면 권장이다', () => {
    const safe = NICHES.filter((n) => n.policyFit === 'safe' && n.saturation === '낮음');
    expect(safe.length).toBeGreaterThanOrEqual(1);
    for (const n of safe) {
      expect(scoreNiche(n).recommendation, `${n.id}`).not.toBe('비권장');
    }
  });

  it('민담은 조건부 또는 비권장이다', () => {
    // 포화도가 매우 높고 단가가 낮으므로 권장이 될 수 없다
    const r = scoreNiche(NICHES.find((n) => n.id === 'mindam')!);
    expect(['조건부', '비권장']).toContain(r.recommendation);
  });

  it('같은 조건이면 같은 점수가 나온다 — 결정적이다', () => {
    for (const n of NICHES) {
      expect(scoreNiche(n).score).toBe(scoreNiche(n).score);
    }
  });

  it('모든 항목에 요약이 있다', () => {
    for (const n of NICHES) {
      expect(scoreNiche(n).summary.length, `${n.id}`).toBeGreaterThan(15);
    }
  });
});

describe('rankNiches — 정렬', () => {
  it('점수 내림차순으로 정렬한다', () => {
    const r = rankNiches();
    for (let i = 1; i < r.length; i += 1) {
      expect(r[i - 1]!.score).toBeGreaterThanOrEqual(r[i]!.score);
    }
  });

  it('모든 니치를 포함한다', () => {
    expect(rankNiches()).toHaveLength(NICHES.length);
  });

  it('수익화 불가 니치가 하위에 온다', () => {
    const r = rankNiches();
    const blockedPositions = r
      .map((x, i) => ({ fit: x.niche.policyFit, i }))
      .filter((x) => x.fit === 'blocked')
      .map((x) => x.i);
    const safePositions = r
      .map((x, i) => ({ fit: x.niche.policyFit, i }))
      .filter((x) => x.fit === 'safe')
      .map((x) => x.i);
    // 가장 안전한 것이 가장 막힌 것보다 앞에 와야 한다
    expect(Math.min(...safePositions)).toBeLessThan(Math.max(...blockedPositions));
  });

  it('민담이 1위가 아니다', () => {
    // 포화된 니치를 최우선으로 권하면 진단의 의미가 없다
    expect(rankNiches()[0]?.niche.id).not.toBe('mindam');
  });
});
