/**
 * 운영 실무 데이터와 근거 표기 검증.
 *
 * 이 데이터는 세무·저작권처럼 틀리면 사용자에게 실제 손해가 나는 영역이다.
 * 근거 수준이 빠지지 않았는지, 공식 근거를 주장한 항목에 출처가 있는지 확인한다.
 */
import { describe, expect, it } from 'vitest';
import {
  factsByCategory,
  OPS_CATEGORIES,
  OPS_FACTS,
  TAX_DISCLAIMER,
} from './opsFacts';
import { EVIDENCE_LABEL, NICHES, SCORE_DISCLAIMER, SCORE_WEIGHTS, scoreNiche } from './niches';
import { MIDROLL_FACTS, RPM_BASIS_LABEL, RPM_SCENARIOS, TTS_SPEED_META } from '../lib/revenue';

describe('운영 실무 데이터', () => {
  it('id가 중복되지 않는다', () => {
    const ids = OPS_FACTS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 항목에 근거 수준이 있다', () => {
    for (const f of OPS_FACTS) {
      expect(['official', 'reported', 'inferred']).toContain(f.level);
    }
  });

  it('공식이라고 주장한 항목에는 출처가 있다', () => {
    for (const f of OPS_FACTS.filter((x) => x.level === 'official')) {
      expect(f.source, `${f.id} 출처 없음`).toBeTruthy();
      expect(f.source!.length).toBeGreaterThan(8);
    }
  });

  it('모든 항목에 충분한 본문이 있다', () => {
    for (const f of OPS_FACTS) {
      expect(f.title.length, `${f.id} 제목`).toBeGreaterThan(8);
      expect(f.body.length, `${f.id} 본문`).toBeGreaterThan(40);
    }
  });

  it('다섯 분류가 모두 항목을 갖는다', () => {
    for (const c of OPS_CATEGORIES) {
      expect(factsByCategory(c).length, `${c} 비어 있음`).toBeGreaterThanOrEqual(2);
    }
  });

  it('세무 항목에 사업자등록 20일 규정이 있다', () => {
    const tax = factsByCategory('세무');
    const reg = tax.find((f) => f.id === 'tax-registration');
    expect(reg).toBeDefined();
    expect(reg?.body).toMatch(/20일/);
    expect(reg?.level).toBe('official');
  });

  it('저작권 항목이 줄거리와 채록본을 구분한다', () => {
    const c = factsByCategory('저작권').find((f) => f.id === 'copyright-motif');
    expect(c?.body).toMatch(/채록/);
    expect(c?.body).toMatch(/줄거리|골격/);
  });

  it('업로드 항목이 대량 업로드의 무용함을 밝힌다', () => {
    const u = factsByCategory('업로드 운영').find((f) => f.id === 'upload-cadence');
    expect(u?.body).toMatch(/상관관계가 없/);
    expect(u?.level).toBe('official');
  });

  it('중간광고 항목이 보장 없음을 공식 인용한다', () => {
    const m = factsByCategory('중간광고').find((f) => f.id === 'midroll-not-guaranteed');
    expect(m?.body).toContain('not guaranteed to serve ads');
    expect(m?.source).toMatch(/support\.google\.com/);
  });

  it('중간광고 항목이 차분한 콘텐츠 예외를 담는다', () => {
    const m = factsByCategory('중간광고').find((f) => f.id === 'midroll-calm-content');
    expect(m?.body).toMatch(/명상/);
    expect(m?.level).toBe('official');
  });

  it('세무 면책 문구가 상담을 대체하지 않는다고 밝힌다', () => {
    expect(TAX_DISCLAIMER).toMatch(/대체하지 않/);
    expect(TAX_DISCLAIMER).toMatch(/세무대리인|세무 상담/);
  });

  it('절반 이상이 공식 근거다', () => {
    const official = OPS_FACTS.filter((f) => f.level === 'official').length;
    expect(official / OPS_FACTS.length).toBeGreaterThan(0.5);
  });
});

describe('감사 회귀 — 추정치 표기', () => {
  it('TTS 속도가 추정치임을 밝힌다', () => {
    expect(TTS_SPEED_META.confidence).toBe('estimate');
    expect(TTS_SPEED_META.note).toMatch(/추정|실측이 아닌/);
    // 직접 측정하는 방법을 알려줘야 한다
    expect(TTS_SPEED_META.howToMeasure).toMatch(/1,000자|측정/);
  });

  it('중간광고 슬롯 간격이 추정임을 밝힌다', () => {
    expect(MIDROLL_FACTS.intervalIsEstimate).toMatch(/추정|공식 근거가 없/);
  });

  it('중간광고 보장 없음을 공식 원문으로 인용한다', () => {
    expect(MIDROLL_FACTS.notGuaranteed).toContain('not guaranteed');
    expect(MIDROLL_FACTS.sourceUrl).toMatch(/^https:\/\/support\.google\.com/);
  });

  it('TTS 낭독이 중간광고에 불리한 이유를 설명한다', () => {
    expect(MIDROLL_FACTS.ttsRisk).toMatch(/자연 중단점/);
  });

  it('모든 RPM 시나리오에 근거 수준이 있다', () => {
    for (const s of RPM_SCENARIOS) {
      expect(['estimate', 'derived', 'claim']).toContain(s.basis);
      expect(s.note.length, `${s.id} 근거 설명`).toBeGreaterThan(20);
    }
  });

  it('강의 사례 시나리오가 재현 가능성이 낮다고 밝힌다', () => {
    const l = RPM_SCENARIOS.find((s) => s.id === 'lecture');
    expect(l?.basis).toBe('claim');
    expect(l?.note).toMatch(/재현 가능성이 낮/);
  });

  it('도출된 시나리오는 출처 수치를 언급한다', () => {
    for (const s of RPM_SCENARIOS.filter((x) => x.basis === 'derived')) {
      // 근거가 되는 수치나 자료명이 있어야 한다
      expect(s.note, `${s.id}`).toMatch(/\$|CPM|배분율|중위값/);
    }
  });

  it('근거 수준 라벨이 모두 정의돼 있다', () => {
    for (const b of ['estimate', 'derived', 'claim'] as const) {
      expect(RPM_BASIS_LABEL[b]).toBeTruthy();
    }
  });
});

describe('감사 회귀 — 니치 점수 투명성', () => {
  it('가중치가 외부에 공개돼 있다', () => {
    expect(SCORE_WEIGHTS.policy.max).toBe(40);
    expect(SCORE_WEIGHTS.saturation.max).toBe(35);
    expect(SCORE_WEIGHTS.rpm.max).toBe(25);
    // 합이 100이어야 점수 해석이 가능하다
    expect(
      SCORE_WEIGHTS.policy.max + SCORE_WEIGHTS.saturation.max + SCORE_WEIGHTS.rpm.max,
    ).toBe(100);
  });

  it('점수가 편의적 지표임을 밝히는 문구가 있다', () => {
    expect(SCORE_DISCLAIMER).toMatch(/편의적|객관적 근거가 없/);
    expect(SCORE_DISCLAIMER).toMatch(/40|35|25/);
  });

  it('축별 획득 점수를 분해해 반환한다', () => {
    for (const n of NICHES) {
      const r = scoreNiche(n);
      expect(r.breakdown.policy + r.breakdown.saturation + r.breakdown.rpm).toBe(r.score);
      expect(r.breakdown.policy).toBeLessThanOrEqual(SCORE_WEIGHTS.policy.max);
      expect(r.breakdown.saturation).toBeLessThanOrEqual(SCORE_WEIGHTS.saturation.max);
      expect(r.breakdown.rpm).toBeLessThanOrEqual(SCORE_WEIGHTS.rpm.max);
    }
  });

  it('모든 니치에 세 축의 근거 수준이 있다', () => {
    for (const n of NICHES) {
      for (const key of ['policyEvidence', 'saturationEvidence', 'rpmEvidence'] as const) {
        expect(['official', 'reported', 'inferred'], `${n.id}.${key}`).toContain(n[key]);
      }
    }
  });

  it('가장 약한 근거 수준을 계산한다', () => {
    for (const n of NICHES) {
      const r = scoreNiche(n);
      const levels = [n.policyEvidence, n.saturationEvidence, n.rpmEvidence];
      // 추론이 하나라도 있으면 가장 약한 것은 추론이다
      if (levels.includes('inferred')) expect(r.weakestEvidence).toBe('inferred');
    }
  });

  it('근거가 추론뿐이면 요약에 그 사실을 덧붙인다', () => {
    const inferredOnes = NICHES.filter(
      (n) =>
        n.policyFit !== 'blocked' &&
        [n.policyEvidence, n.saturationEvidence, n.rpmEvidence].includes('inferred'),
    );
    expect(inferredOnes.length).toBeGreaterThan(0);
    for (const n of inferredOnes) {
      expect(scoreNiche(n).summary, `${n.id}`).toMatch(/추론/);
    }
  });

  it('민담의 포화도 근거는 보도·발언 수준이다', () => {
    // 실제 채널 수 집계가 없으므로 공식이라고 해서는 안 된다
    const m = NICHES.find((n) => n.id === 'mindam');
    expect(m?.saturationEvidence).toBe('reported');
  });

  it('수익화 불가 판정은 공식 근거여야 한다', () => {
    for (const n of NICHES.filter((x) => x.policyFit === 'blocked')) {
      expect(n.policyEvidence, `${n.id}`).toBe('official');
    }
  });

  it('근거 수준 라벨이 모두 정의돼 있다', () => {
    for (const l of ['official', 'reported', 'inferred'] as const) {
      expect(EVIDENCE_LABEL[l]).toBeTruthy();
    }
  });
});
