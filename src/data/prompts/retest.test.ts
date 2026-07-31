/**
 * 프롬프트 수정 후 재실행 결과 검증.
 *
 * 1차 실행에서 드러난 결함을 고친 뒤, 새 독립 에이전트가 만든 산출물을
 * 같은 기준으로 다시 검사한다. 이 파일이 통과하면 수정이 실효를 본 것이다.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractCharacterTags, parseScenePrompts } from '../../lib/text';

const DIR = join(process.cwd(), '_verify', 'agent2');

/**
 * 산출물은 로컬 검증 부산물이므로 저장소에 넣지 않는다(.gitignore).
 * 파일이 없는 환경에서는 건너뛴다. 검증 기록은 README에 남아 있다.
 */
const HAS_ARTIFACTS = ['01-script.md', '02-image.md', '03-thumbnail.md'].every((f) =>
  existsSync(join(DIR, f)),
);

const describeIfArtifacts = HAS_ARTIFACTS ? describe : describe.skip;

/**
 * describe.skip 이라도 콜백 본문은 수집 단계에서 실행된다.
 * 따라서 파일이 없을 때 예외를 던지면 안 되고, 빈 문자열을 반환해야 한다.
 * 실제 단언은 describeIfArtifacts 가 막아준다.
 */
function load(name: string): string {
  const path = join(DIR, name);
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf8');
}

function section(text: string, marker: string): string {
  const re = new RegExp(`^===\\s*${marker}[^=]*===\\s*$`, 'im');
  const m = re.exec(text);
  if (!m) return '';
  const start = m.index + m[0].length;
  const next = /^===\s*[A-Z0-9 ]+\s*===\s*$/im.exec(text.slice(start));
  return next ? text.slice(start, start + next.index) : text.slice(start);
}

/** 공백을 제외한 글자수 */
function lenNoSpace(s: string): number {
  return s.replace(/\s/g, '').length;
}

// ─────────── 결함 1: 제목 길이 초과 ───────────

describeIfArtifacts('결함 1 수정 확인 — 주제 제목 길이', () => {
  const g2 = section(load('01-script.md'), 'GATE 2');

  function titles(): string[] {
    return (g2.match(/^\s*(?:10|[1-9])[.)]\s*(.+)$/gm) ?? [])
      .map((l) => l.replace(/^\s*(?:10|[1-9])[.)]\s*/, '').trim())
      // "[20자] 제목" 형태의 길이 표기를 떼어낸다
      .map((l) => l.replace(/^\[\s*\d+\s*자\s*\]\s*/, ''))
      // 뒤에 붙은 괄호 주석 제거
      .map((l) => l.replace(/\s*\(\s*\d+\s*자[^)]*\)\s*$/, '').trim())
      .filter((l) => l.length > 0);
  }

  it('주제 10개를 냈다', () => {
    expect(titles().length).toBe(10);
  });

  it('★ 모든 제목이 공백 제외 25자 이내다', () => {
    const over = titles()
      .map((t) => ({ t, n: lenNoSpace(t) }))
      .filter((x) => x.n > 25);
    expect(over, `25자 초과: ${JSON.stringify(over)}`).toHaveLength(0);
  });

  it('길이 검증 결과를 스스로 보고했다', () => {
    expect(g2).toMatch(/길이 검증|자 이내|글자수/);
  });
});

// ─────────── 결함 2: 강도 배분 오탐 (파서 버그) ───────────

describeIfArtifacts('결함 2 수정 확인 — 강도 배분과 파서', () => {
  const doc = load('02-image.md');
  const scenesRaw = (() => {
    const sec = section(doc, 'GATE 4 SCENES');
    const end = sec.search(/^===\s*장면 끝\s*===|^\s*\[요약\]/m);
    return end > 0 ? sec.slice(0, end) : sec;
  })();

  it('장면이 정확히 40개다', () => {
    expect(parseScenePrompts(scenesRaw)).toHaveLength(40);
  });

  it('★ 파서가 읽은 강도가 H8 / M16 / L16이다', () => {
    const scenes = parseScenePrompts(scenesRaw);
    const count = { H: 0, M: 0, L: 0 };
    for (const s of scenes) count[s.intensity] += 1;
    expect(count).toEqual({ H: 8, M: 16, L: 16 });
  });

  it('★ 파서 결과가 줄머리 표기와 일치한다 (오탐 없음)', () => {
    const scenes = parseScenePrompts(scenesRaw);
    const literal = {
      H: (scenesRaw.match(/^\s*\d+\.\s*\[H\]/gm) ?? []).length,
      M: (scenesRaw.match(/^\s*\d+\.\s*\[M\]/gm) ?? []).length,
      L: (scenesRaw.match(/^\s*\d+\.\s*\[L\]/gm) ?? []).length,
    };
    const parsed = { H: 0, M: 0, L: 0 };
    for (const s of scenes) parsed[s.intensity] += 1;
    expect(parsed).toEqual(literal);
  });

  it('본문에 low/high 표현이 실제로 존재한다 (오탐 조건이 갖춰졌다)', () => {
    // 이 조건이 없으면 위 테스트가 우연히 통과한 것이 된다
    expect(scenesRaw).toMatch(/low angle|high saturation|low|high/i);
  });

  it('앞부분에 H가 몰려 있지 않다', () => {
    const scenes = parseScenePrompts(scenesRaw);
    const firstTen = scenes.slice(0, 10).filter((s) => s.intensity === 'H').length;
    expect(firstTen, `앞 10장면에 H가 ${firstTen}개`).toBeLessThanOrEqual(2);
  });
});

// ─────────── 결함 3: 안내문이 장면 블록을 오염 ───────────

describeIfArtifacts('결함 3 수정 확인 — 장면 블록과 안내문 분리', () => {
  const doc = load('02-image.md');

  it('★ 장면 종료선이 있다', () => {
    expect(doc).toMatch(/===\s*장면 끝\s*===/);
  });

  it('★ 종료선 이전 구간에 골뱅이 일반어가 없다', () => {
    const sec = section(doc, 'GATE 4 SCENES');
    const end = sec.search(/^===\s*장면 끝\s*===/m);
    const scenesOnly = end > 0 ? sec.slice(0, end) : sec;

    const tags = [...new Set(scenesOnly.match(/@[\w가-힣]+/g) ?? [])].map((t) => t.slice(1));
    const generic = tags.filter((t) => /^(태그|인물|이름|캐릭터)/.test(t));
    expect(generic, `장면 구간에 일반어 태그: ${JSON.stringify(generic)}`).toHaveLength(0);
  });

  it('★ 파서로 뽑은 태그가 모두 등록된 인물이다', () => {
    const chars = section(doc, 'GATE 3 CHARACTERS');
    const names = (chars.match(/\[CHARACTER\s*\d+\]\s*([^\n\r]+)/gi) ?? []).map((l) =>
      l.replace(/\[CHARACTER\s*\d+\]\s*/i, '').trim(),
    );
    expect(names.length).toBe(5);

    const sec = section(doc, 'GATE 4 SCENES');
    const end = sec.search(/^===\s*장면 끝\s*===/m);
    const scenesOnly = end > 0 ? sec.slice(0, end) : sec;

    const scenes = parseScenePrompts(scenesOnly);
    const used = [...new Set(scenes.flatMap((s) => extractCharacterTags(s.prompt)))];
    expect(used.length).toBeGreaterThan(0);

    const unknown = used.filter((t) => !names.some((n) => n.includes(t) || t.includes(n)));
    expect(unknown, `등록 안 된 태그: ${JSON.stringify(unknown)}`).toHaveLength(0);
  });

  it('요약과 안내가 종료선 뒤에 있다', () => {
    const endIdx = doc.search(/===\s*장면 끝\s*===/);
    const summaryIdx = doc.indexOf('[요약]');
    expect(endIdx).toBeGreaterThan(0);
    expect(summaryIdx).toBeGreaterThan(endIdx);
  });
});

// ─────────── 결함 4: 카피 길이 기준 모호 ───────────

describeIfArtifacts('결함 4 수정 확인 — 카피 길이', () => {
  const g1 = section(load('03-thumbnail.md'), 'GATE 1 COPIES');

  function copies(): string[] {
    return (g1.match(/^\s*[1-8][.)]\s*(.+)$/gm) ?? [])
      .map((l) => l.replace(/^\s*[1-8][.)]\s*/, '').trim())
      // "→ 10자" 같은 표기 제거
      .map((l) => l.replace(/\s*(?:→|->)\s*\d+\s*자.*$/, '').trim())
      .map((l) => l.replace(/\s*\([^)]*\)\s*$/, '').trim())
      .filter((l) => l.length > 0);
  }

  it('카피 8개를 냈다', () => {
    const c = copies();
    expect(c.length, JSON.stringify(c)).toBe(8);
  });

  it('★ 모든 카피가 공백 제외 18자 이내다', () => {
    const over = copies()
      .map((c) => ({ c, n: lenNoSpace(c.replace(/\s*\/\s*/g, '')) }))
      .filter((x) => x.n > 18);
    expect(over, `18자 초과: ${JSON.stringify(over)}`).toHaveLength(0);
  });

  it('★ 금지 기호가 없다', () => {
    const bad = copies().filter((c) => /[?!？！"'“”‘’]/.test(c));
    expect(bad, `금지 기호: ${JSON.stringify(bad)}`).toHaveLength(0);
  });

  it('검증 결과를 스스로 보고했다', () => {
    expect(g1).toMatch(/검증/);
  });

  it('인물 이름을 쓰지 않았다', () => {
    // 신분·처지로만 호칭해야 한다. 흔한 이름 패턴이 없어야 한다
    const c = copies().join(' ');
    expect(c).not.toMatch(/해주|봉선|덕구|서삼|개돌/);
  });
});
