/**
 * 정책 데이터 무결성 검증.
 *
 * 정책 인용은 사용자의 수익화 여부에 직접 영향을 주므로,
 * 출처·원문·대응책이 빠지지 않았는지 기계적으로 확인한다.
 */
import { describe, expect, it } from 'vitest';
import {
  ALGORITHM_FACTS,
  DISCREPANCIES,
  INAUTHENTIC_CATEGORIES,
  POLICY_SOURCE,
  REVENUE_FACTS,
  RISK_ITEMS,
} from './policy';
import { SCRIPT_MAIN } from './prompts/scriptMain';
import { STEPS, PHASES, findStep } from './steps';

describe('정책 출처', () => {
  it('공식 문서 URL이 support.google.com이다', () => {
    expect(POLICY_SOURCE.url).toMatch(/^https:\/\/support\.google\.com\/youtube\//);
  });

  it('확인 날짜가 기록돼 있다', () => {
    expect(POLICY_SOURCE.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('정책 개칭 시점이 기록돼 있다', () => {
    expect(POLICY_SOURCE.renamedAt).toBe('2025-07-15');
  });
});

describe('수익화 불가 3개 범주', () => {
  it('세 개가 정의돼 있다', () => {
    expect(INAUTHENTIC_CATEGORIES).toHaveLength(3);
  });

  it('공식 영문 명칭이 정확하다', () => {
    const names = INAUTHENTIC_CATEGORIES.map((c) => c.nameEn);
    expect(names).toEqual([
      'Generic or Repetitive Content',
      'Unsatisfying or Off-putting Content',
      'AI Personas Related to Sensitive Topics',
    ]);
  });

  it('각 범주에 한국어 요약이 있다', () => {
    for (const c of INAUTHENTIC_CATEGORIES) {
      expect(c.summary.length, `${c.id} 요약 없음`).toBeGreaterThan(20);
    }
  });
});

describe('리스크 항목', () => {
  it('id가 중복되지 않는다', () => {
    const ids = RISK_ITEMS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 항목에 공식 원문이 있다', () => {
    for (const r of RISK_ITEMS) {
      expect(r.policyOriginal.length, `${r.id} 원문 없음`).toBeGreaterThan(30);
      // 원문은 영어여야 한다 (공식 문서가 영어 기준)
      const letters = (r.policyOriginal.match(/[A-Za-z]/g) ?? []).length;
      expect(letters, `${r.id} 원문이 영어가 아니다`).toBeGreaterThanOrEqual(25);
    }
  });

  it('모든 항목에 한국어 번역이 있다', () => {
    for (const r of RISK_ITEMS) {
      expect(r.policyText, `${r.id} 번역 없음`).toMatch(/[가-힣]{5}/);
    }
  });

  it('모든 항목에 적용 설명과 대응책이 있다', () => {
    for (const r of RISK_ITEMS) {
      expect(r.howItApplies.length, `${r.id} 적용 설명 없음`).toBeGreaterThan(40);
      expect(r.mitigation.length, `${r.id} 대응책 없음`).toBeGreaterThanOrEqual(2);
      for (const m of r.mitigation) {
        expect(m.length).toBeGreaterThan(10);
      }
    }
  });

  it('위험도 높음 항목이 3개 이상이다', () => {
    // 이 방식의 실제 리스크를 축소하지 않는지 확인
    const high = RISK_ITEMS.filter((r) => r.level === 'high');
    expect(high.length).toBeGreaterThanOrEqual(3);
  });

  it('가장 큰 위험인 템플릿 반복 항목이 있다', () => {
    const t = RISK_ITEMS.find((r) => r.id === 'template-storyline');
    expect(t).toBeDefined();
    expect(t?.level).toBe('high');
    expect(t?.policyOriginal).toContain('highly similar storyline template');
  });

  it('제재 전파 항목이 공식 원문을 인용한다', () => {
    const s = RISK_ITEMS.find((r) => r.id === 'multi-channel-spread');
    expect(s?.policyOriginal).toContain('all or any of your accounts');
    expect(s?.policyOriginal).toContain('termination of all channels');
  });

  it('대응책에 근거가 되는 허용 문구가 붙어 있다', () => {
    // 회피 방법은 공식 문서가 허용한다고 밝힌 것에 근거해야 한다
    const withBasis = RISK_ITEMS.filter((r) => r.allowedBasis);
    expect(withBasis.length).toBeGreaterThanOrEqual(3);
    for (const r of withBasis) {
      const basis = r.allowedBasis ?? '';
      // 공식 원문(영어)을 인용해야 한다. 영문자 총 개수로 판단한다.
      const letters = (basis.match(/[A-Za-z]/g) ?? []).length;
      expect(letters, `${r.id} 근거에 영문 원문 인용이 부족하다`).toBeGreaterThanOrEqual(30);
    }
  });
});

describe('강의와 정책의 불일치', () => {
  it('3개 이상 기록돼 있다', () => {
    expect(DISCREPANCIES.length).toBeGreaterThanOrEqual(3);
  });

  it('각 항목에 강의 타임스탬프가 있다', () => {
    for (const d of DISCREPANCIES) {
      expect(d.lectureTimestamp, `${d.id} 타임스탬프 형식 오류`).toMatch(/^\d{1,2}:\d{2}$/);
    }
  });

  it('각 항목에 주장·현실·결론이 모두 있다', () => {
    for (const d of DISCREPANCIES) {
      expect(d.lectureClaim.length, `${d.id} 주장 없음`).toBeGreaterThan(15);
      expect(d.policyReality.length, `${d.id} 정책 설명 없음`).toBeGreaterThan(50);
      expect(d.soWhat.length, `${d.id} 결론 없음`).toBeGreaterThan(20);
    }
  });

  it('핵심 불일치인 픽션 면제 오해가 포함돼 있다', () => {
    const f = DISCREPANCIES.find((d) => d.id === 'fiction-exempt');
    expect(f).toBeDefined();
    expect(f?.policyReality).toMatch(/픽션 면제|면제 조항/);
  });
});

describe('수치 데이터', () => {
  it('모든 수치에 출처가 있다', () => {
    for (const f of [...REVENUE_FACTS, ...ALGORITHM_FACTS]) {
      expect(f.source.length, `"${f.label}" 출처 없음`).toBeGreaterThan(8);
    }
  });

  it('모든 수치에 신뢰도가 표시돼 있다', () => {
    for (const f of [...REVENUE_FACTS, ...ALGORITHM_FACTS]) {
      expect(['official', 'analysis', 'estimate']).toContain(f.confidence);
    }
  });

  it('공식 출처 항목이 하나 이상 있다', () => {
    const official = [...REVENUE_FACTS, ...ALGORITHM_FACTS].filter(
      (f) => f.confidence === 'official',
    );
    expect(official.length).toBeGreaterThanOrEqual(3);
  });

  it('한국 CPM 격차를 명시한다', () => {
    const kr = REVENUE_FACTS.find((f) => f.label.includes('한국'));
    expect(kr).toBeDefined();
    expect(kr?.note).toMatch(/낮|기대하기 어렵/);
  });

  it('중간광고 8분 조건이 공식으로 표시돼 있다', () => {
    const mid = REVENUE_FACTS.find((f) => f.label.includes('중간광고'));
    expect(mid?.value).toContain('8분');
    expect(mid?.confidence).toBe('official');
  });
});

describe('워크플로우 통합', () => {
  it('판단 페이즈가 첫 번째다', () => {
    // 실행 전에 손익과 니치를 먼저 정하게 한다
    expect(PHASES[0]?.id).toBe('decide');
  });

  it('정책 페이즈가 두 번째다', () => {
    expect(PHASES[1]?.id).toBe('policy');
  });

  it('★ 채널 개설 페이즈가 정책 다음이다', () => {
    // 정책을 읽고 시작을 그만둘 수도 있으므로 정책이 먼저 와야 한다
    expect(PHASES[2]?.id).toBe('launch');
    expect(PHASES.findIndex((p) => p.id === 'policy')).toBeLessThan(
      PHASES.findIndex((p) => p.id === 'launch'),
    );
  });

  it('★ 채널 개설이 세팅·제작보다 앞이다', () => {
    const i = (id: string) => PHASES.findIndex((p) => p.id === id);
    expect(i('launch')).toBeLessThan(i('setup'));
    expect(i('launch')).toBeLessThan(i('script'));
  });

  it('★ 채널 개설 페이즈에 수익화 도달과 관문 두 단계가 있다', () => {
    const launch = STEPS.filter((s) => s.phaseId === 'launch');
    expect(launch.map((s) => s.id)).toEqual(['launch-runway', 'launch-gates']);
  });

  it('★ 수익화 도달 단계에 계산기와 비용표가 붙어 있다', () => {
    const s = findStep('launch-runway');
    expect(s?.judgment).toBe(true);
    expect(s?.widgets).toContain('runwayCalculator');
    expect(s?.widgets).toContain('startupCosts');
  });

  it('★ 수익화 도달 단계가 요건 수치를 명시한다', () => {
    const s = findStep('launch-runway');
    expect(s?.summary).toMatch(/1,000명/);
    expect(s?.summary).toMatch(/4,000시간/);
    expect(s?.keyPoint).toMatch(/0원|수입은 없/);
  });

  it('★ 수익화 도달 단계가 12개월 만료를 경고한다', () => {
    const s = findStep('launch-runway');
    const w = s?.checklist.find((c) => c.id === 'window');
    expect(w?.warning).toMatch(/12개월/);
  });

  it('★ 관문 단계가 중급·고급 기능 인증을 요구한다', () => {
    // 이 권한이 없으면 15분 넘는 영상을 못 올려 두 시간짜리 민담이 불가능하다
    const s = findStep('launch-gates');
    const g = s?.checklist.find((c) => c.id === 'g4');
    expect(g?.label).toMatch(/중급|고급|기능/);
    expect(g?.warning).toMatch(/15분/);
  });

  it('★ 관문 단계가 2단계 인증과 세금 정보를 요구한다', () => {
    const s = findStep('launch-gates');
    const ids = s?.checklist.map((c) => c.id) ?? [];
    expect(ids).toContain('g2');
    expect(ids).toContain('g6');
    expect(s?.checklist.find((c) => c.id === 'g6')?.warning).toMatch(/24%|30%/);
    expect(s?.widgets).toContain('setupGates');
  });

  it('손익 계산이 첫 번째 단계다', () => {
    expect(STEPS[0]?.id).toBe('decide-economics');
  });

  it('판단 페이즈에 손익·니치 두 단계가 있다', () => {
    const decide = STEPS.filter((s) => s.phaseId === 'decide');
    expect(decide.map((s) => s.id)).toEqual(['decide-economics', 'decide-niche']);
  });

  it('판단 단계 둘 다 사람 판단이 필요하다', () => {
    for (const id of ['decide-economics', 'decide-niche']) {
      expect(findStep(id)?.judgment, `${id}`).toBe(true);
    }
  });

  it('손익 단계에 시뮬레이터와 러닝타임 계산기가 붙어 있다', () => {
    const s = findStep('decide-economics');
    expect(s?.widgets).toContain('revenueSimulator');
    expect(s?.widgets).toContain('runtimeCalculator');
  });

  it('니치 단계에 진단 도구가 붙어 있다', () => {
    expect(findStep('decide-niche')?.widgets).toContain('nicheAdvisor');
  });

  it('인트로 검수 단계에 채점기가 붙어 있다', () => {
    const s = findStep('script-intro');
    expect(s?.widgets).toContain('introScorer');
    expect(s?.checklist.some((c) => c.id === 'scored')).toBe(true);
  });

  it('썸네일 단계에 가독성 미리보기가 붙어 있다', () => {
    expect(findStep('thumb-copy')?.widgets).toContain('thumbnailPreview');
    expect(findStep('thumb-text')?.widgets).toContain('thumbnailPreview');
  });

  it('정책 단계가 판단 필요로 표시돼 있다', () => {
    const s = findStep('policy-check');
    expect(s?.judgment).toBe(true);
  });

  it('정책 단계에 리스크 위젯이 붙어 있다', () => {
    const s = findStep('policy-check');
    expect(s?.widgets).toContain('policyRisk');
    expect(s?.widgets).toContain('lectureDiscrepancies');
    expect(s?.widgets).toContain('realityCheck');
    // 계획만 세우면 지켜지지 않으므로 이력 도구도 함께 붙인다
    expect(s?.widgets).toContain('episodeHistory');
  });

  it('전체 단계가 33개다', () => {
    expect(STEPS).toHaveLength(33);
  });

  it('세무·저작권 단계가 업로드 페이즈에 있다', () => {
    const s = findStep('publish-ops');
    expect(s).toBeDefined();
    expect(s?.phaseId).toBe('publish');
    expect(s?.widgets).toContain('opsTax');
    expect(s?.widgets).toContain('opsCopyright');
  });

  it('업로드 단계가 빨간 슬롯 확인을 요구한다', () => {
    const s = findStep('publish-upload');
    expect(s?.checklist.some((c) => c.id === 'slots')).toBe(true);
    expect(s?.widgets).toContain('opsUpload');
  });

  it('손익 단계가 슬롯 수 과대추정을 경고한다', () => {
    const s = findStep('decide-economics');
    const warn = s?.checklist.find((c) => c.id === 'slot-caveat');
    expect(warn).toBeDefined();
    expect(warn?.warning).toMatch(/not guaranteed|과대추정/);
  });

  it('페이즈가 10개다', () => {
    expect(PHASES).toHaveLength(10);
  });

  it('사람 판단이 필요한 단계가 7개다', () => {
    // 손익, 니치, 정책, 수익화 도달, 인트로 검수, 인트로 다듬기, 썸네일 카피
    const judgment = STEPS.filter((s) => s.judgment);
    expect(judgment).toHaveLength(7);
    expect(judgment.map((s) => s.id)).toContain('launch-runway');
  });

  it('모든 단계의 phaseId가 실제 페이즈를 가리킨다', () => {
    const ids = new Set(PHASES.map((p) => p.id));
    for (const s of STEPS) {
      expect(ids.has(s.phaseId), `${s.id}의 phaseId "${s.phaseId}"가 없다`).toBe(true);
    }
  });

  it('대본 생성 단계에 TTS 검사기와 백업이 붙어 있다', () => {
    const s = findStep('script-generate');
    expect(s?.widgets).toContain('scriptChecker');
    expect(s?.widgets).toContain('dataBackup');
  });

  it('Vrew TTS 단계에서 넣기 전 검사를 요구한다', () => {
    const s = findStep('vrew-tts');
    expect(s?.widgets).toContain('scriptChecker');
    expect(s?.checklist.some((c) => c.id === 'checked')).toBe(true);
  });

  it('줄거리 단계에 이력 도구가 붙어 있다', () => {
    const s = findStep('script-outline');
    expect(s?.widgets).toContain('episodeHistory');
  });

  it('줄거리 단계가 구조 겹침 확인을 요구한다', () => {
    const s = findStep('script-outline');
    const ids = s?.checklist.map((c) => c.id) ?? [];
    expect(ids).toContain('variant');
    expect(ids).toContain('record');
  });

  it('다채널 단계에 이력과 백업이 붙어 있다', () => {
    const s = findStep('publish-scale');
    expect(s?.widgets).toContain('episodeHistory');
    expect(s?.widgets).toContain('dataBackup');
  });

  it('대본 생성 단계가 백업을 요구한다', () => {
    const s = findStep('script-generate');
    const backup = s?.checklist.find((c) => c.id === 'backup');
    expect(backup).toBeDefined();
    expect(backup?.warning).toMatch(/사라진|유실|지우면/);
  });
});

describe('대본 프롬프트의 정책 대응', () => {
  it('수익화 정책 대응 규칙이 들어 있다', () => {
    expect(SCRIPT_MAIN).toContain('수익화 정책 대응');
  });

  it('골격 변주 규칙이 있다', () => {
    expect(SCRIPT_MAIN).toContain('골격 변주 규칙');
  });

  it('시작점 변주 방법이 3가지 이상 있다', () => {
    const section = SCRIPT_MAIN.slice(SCRIPT_MAIN.indexOf('시작점 바꾸기'));
    const variants = section.match(/변주 [가나다라]\)/g) ?? [];
    expect(variants.length).toBeGreaterThanOrEqual(3);
  });

  it('결말 유형이 5가지 이상 제시돼 있다', () => {
    const section = SCRIPT_MAIN.slice(SCRIPT_MAIN.indexOf('결말 유형 바꾸기'));
    const types = section.match(/^-\s*\S+형:/gm) ?? [];
    expect(types.length).toBeGreaterThanOrEqual(5);
  });

  it('반전 개수를 고정하지 말라고 지시한다', () => {
    expect(SCRIPT_MAIN).toMatch(/매번 여섯 개로 고정하지 않는다/);
  });

  it('앞 영상 구조를 물어보라고 지시한다', () => {
    expect(SCRIPT_MAIN).toMatch(/앞 영상과 다른 구조|이미 올린 영상/);
  });

  it('감동 지점을 같은 위치에 반복하지 말라고 지시한다', () => {
    expect(SCRIPT_MAIN).toMatch(/같은 위치에 같은 방식으로 넣지 않는다/);
  });

  it('일관된 서사 요구를 명시한다', () => {
    expect(SCRIPT_MAIN).toMatch(/일관된 서사/);
  });
});
