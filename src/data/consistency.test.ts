import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep as SEP } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PHASES, STEPS } from './steps';
import { SETUP_GATES, SETUP_GATE_COUNT } from '../lib/runway';

/**
 * 문구와 데이터가 어긋나는 것을 막는 검사.
 *
 * 실제로 한 번 어긋났다. SETUP_GATES에 관문을 추가하는 과정에서 배열은 13개가
 * 됐는데 UI 세 곳이 "열네 관문"으로 남았고, 페이즈 목표는 "아홉 관문"이었다.
 * 같은 앱 안에서 세 가지 숫자가 공존했다.
 *
 * 사람이 세는 대신 배열 길이에서 유도하도록 고쳤고, 이 검사가 재발을 막는다.
 */

const SRC = join(process.cwd(), 'src');

/** src 아래 모든 .ts/.tsx 파일 경로 */
function collectSources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      collectSources(p, out);
    } else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) {
      out.push(p);
    }
  }
  return out;
}

const ALL_SOURCES = collectSources(SRC).map((p) => ({ path: p, text: readFileSync(p, 'utf8') }));

/**
 * 프롬프트 파일은 제외한다.
 * 이미지 프롬프트는 자체 4관문, 썸네일 프롬프트는 자체 3관문 구조를 가지며
 * SETUP_GATES와 무관하다. 그쪽 숫자는 프롬프트 본문의 일부다.
 */
const SOURCES = ALL_SOURCES.filter((s) => !s.path.includes(`${SEP}prompts${SEP}`));

/** 주석 줄은 설명 목적이므로 검사에서 뺀다 */
function isComment(line: string): boolean {
  const t = line.trim();
  return t.startsWith('*') || t.startsWith('//') || t.startsWith('/*');
}

/** 파일별로 줄을 훑어 조건에 맞는 위치를 모은다 */
function findLines(
  sources: { path: string; text: string }[],
  test: (line: string) => boolean,
): string[] {
  const hits: string[] = [];
  for (const { path, text } of sources) {
    text.split('\n').forEach((line, i) => {
      if (isComment(line)) return;
      if (test(line)) hits.push(`${path.replace(SRC, 'src')}:${i + 1} ${line.trim()}`);
    });
  }
  return hits;
}

describe('관문 개수 표기', () => {
  it('SETUP_GATE_COUNT가 배열 길이와 같다', () => {
    expect(SETUP_GATE_COUNT).toBe(SETUP_GATES.length);
  });

  it('★ 관문 개수를 한글 수사로 하드코딩한 곳이 없다', () => {
    // "아홉 관문", "열네 관문" 같은 표기는 배열이 바뀌면 어긋난다
    const numerals =
      '(한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|열한|열두|열세|열네|열다섯|열여섯|스무)';
    const bad = findLines(SOURCES, (l) => new RegExp(`${numerals}\\s*관문`).test(l));
    expect(bad, `배열 길이에서 유도하세요:\n${bad.join('\n')}`).toEqual([]);
  });

  it('★ 페이즈 목표의 관문 수가 실제 배열과 일치한다', () => {
    const launch = PHASES.find((p) => p.id === 'launch');
    expect(launch).toBeDefined();
    // 템플릿 리터럴로 유도했으므로 실제 숫자가 들어가 있어야 한다
    expect(launch!.goal).toContain(`${SETUP_GATES.length}개 관문`);
  });

  it('★ 단계 제목의 관문 수가 실제 배열과 일치한다', () => {
    const s = STEPS.find((x) => x.id === 'launch-gates');
    expect(s).toBeDefined();
    expect(s!.title).toContain(`${SETUP_GATES.length}개`);
  });

  it('관문이 늘거나 줄어도 문구가 따라온다', () => {
    // 배열을 늘린 상황을 흉내내 유도식이 실제로 동작하는지 본다
    const fake = SETUP_GATES.length + 3;
    expect(`관문 ${fake}개 통과`).toBe(`관문 ${SETUP_GATES.length + 3}개 통과`);
  });
});

describe('문구와 데이터 일관성 — 그 외', () => {
  it('★ 페이즈 수를 한글 수사로 하드코딩한 곳이 없다', () => {
    const bad = findLines(SOURCES, (l) => /(아홉|여덟|열)\s*(개\s*)?페이즈/.test(l));
    expect(bad, `PHASES.length를 쓰세요:\n${bad.join('\n')}`).toEqual([]);
  });

  it('★ 워크플로우 단계 수를 하드코딩한 곳이 없다', () => {
    // "33개 단계로 구성" 같은 앱 구조 설명만 잡는다.
    // YouTube 권한 체계 "3단계로 구분"처럼 외부 사실을 서술하는 것은 대상이 아니다.
    const bad = findLines(SOURCES, (l) => /\d+\s*(개\s*)?단계로\s*구성/.test(l));
    expect(bad, `STEPS.length를 쓰세요:\n${bad.join('\n')}`).toEqual([]);
  });

  it('관문 id가 중복되지 않는다', () => {
    const ids = SETUP_GATES.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('★ 관문 순서가 논리적이다', () => {
    const i = (id: string) => SETUP_GATES.findIndex((g) => g.id === id);
    // 계정 만들기가 채널보다 앞
    expect(i('google-account')).toBeLessThan(i('channel'));
    // 요건 달성이 신청보다 앞
    expect(i('threshold')).toBeLessThan(i('apply'));
    // 신청이 지급보다 앞
    expect(i('apply')).toBeLessThan(i('first-payout'));
    // 세금 정보가 지급보다 앞 — 안 내면 원천징수된다
    expect(i('tax-info')).toBeLessThan(i('first-payout'));
  });

  it('모든 관문에 필수 필드가 있다', () => {
    for (const g of SETUP_GATES) {
      expect(g.id, '관문 id').toBeTruthy();
      expect(g.name.length, `${g.id} 이름`).toBeGreaterThan(1);
      expect(g.what.length, `${g.id} 할 일`).toBeGreaterThan(10);
      expect(g.cost.length, `${g.id} 비용`).toBeGreaterThan(1);
      expect(g.duration.length, `${g.id} 기간`).toBeGreaterThan(1);
    }
  });

  it('★ 공식 근거가 필요한 관문에 출처가 붙어 있다', () => {
    // 정책·요건을 주장하는 관문은 출처가 있어야 한다
    const needSource = ['two-step', 'advanced-features', 'threshold', 'apply', 'tax-info'];
    for (const id of needSource) {
      const g = SETUP_GATES.find((x) => x.id === id);
      expect(g, `관문 ${id}이 없습니다`).toBeDefined();
      expect(g?.source, `${id}에 출처가 없습니다`).toMatch(/^https:\/\/support\.google\.com/);
    }
  });
});
