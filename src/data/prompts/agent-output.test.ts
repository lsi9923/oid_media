/**
 * 프롬프트 1차 실행 결과 검증 (수정 전 프롬프트).
 *
 * 독립 서브에이전트가 프롬프트만 읽고 만든 산출물을, 앱의 실제 파서와
 * 프롬프트가 선언한 규칙으로 검사한다.
 *
 * 이 파일은 1차 실행 기록이다. 여기서 드러난 결함 4개를 고친 뒤의 확인은
 * retest.test.ts 에 있다. 두 파일을 함께 보면 무엇이 어떻게 고쳐졌는지 남는다.
 *
 * 1차에서 드러난 결함:
 *  1. 제목 길이 규칙이 공백 포함 여부를 밝히지 않아 초과 발생 → 규칙 명시 + 자기 검증 추가
 *  2. 파서가 본문의 low angle / high saturation 을 등급으로 오인 → detectIntensity 수정
 *  3. 안내문의 골뱅이 표기가 장면 태그로 오인 → 종료선 도입 + extractCharacterTags 추가
 *  4. 인트로 대사 6초 제한과 "대사 고치지 말라"가 충돌 → 컷 분할 절차 추가
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chunkScript, extractCharacterTags, hasCharacterTag, parseScenePrompts } from '../../lib/text';

const DIR = join(process.cwd(), '_verify', 'agent');

/**
 * 산출물은 로컬 검증 부산물이므로 저장소에 넣지 않는다(.gitignore).
 * 따라서 파일이 없는 환경(CI, 새 클론)에서는 이 스위트를 건너뛴다.
 * 검증 기록 자체는 README에 남아 있다.
 */
const HAS_ARTIFACTS = ['01-script.md', '02-image.md', '03-thumbnail.md', '04-intro.md'].every((f) =>
  existsSync(join(DIR, f)),
);

const describeIfArtifacts = HAS_ARTIFACTS ? describe : describe.skip;

function load(name: string): string {
  return readFileSync(join(DIR, name), 'utf8');
}

/** === MARKER === 구간을 잘라낸다 */
function section(text: string, marker: string): string {
  const re = new RegExp(`^===\\s*${marker}[^=]*===\\s*$`, 'im');
  const m = re.exec(text);
  if (!m) return '';
  const start = m.index + m[0].length;
  const next = /^===\s*[A-Z0-9 ]+\s*===\s*$/im.exec(text.slice(start));
  return next ? text.slice(start, start + next.index) : text.slice(start);
}

// ─────────────────────────── 대본 프롬프트 ───────────────────────────

describeIfArtifacts('대본 프롬프트 실행 결과', () => {
  const doc = load('01-script.md');

  it('8개 관문이 모두 실행됐다', () => {
    for (let i = 1; i <= 8; i += 1) {
      expect(section(doc, `GATE ${i}`).trim().length, `GATE ${i} 비어 있음`).toBeGreaterThan(50);
    }
  });

  it('관문 1이 카테고리 4개를 A~D로 제시했다', () => {
    const g1 = section(doc, 'GATE 1');
    for (const letter of ['A', 'B', 'C', 'D']) {
      expect(g1, `카테고리 ${letter} 누락`).toMatch(new RegExp(`^\\s*${letter}[.)]\\s`, 'm'));
    }
  });

  it('관문 2가 주제 10개를 냈다', () => {
    const g2 = section(doc, 'GATE 2');
    const numbered = g2.match(/^\s*(?:10|[1-9])[.)]\s/gm) ?? [];
    expect(numbered.length).toBe(10);
  });

  it('제목이 25자 규칙을 지켰다 — 1차 실행에서는 위반했다 (결함 기록)', () => {
    const g2 = section(doc, 'GATE 2');
    const titles = (g2.match(/^\s*(?:10|[1-9])[.)]\s*(.+)$/gm) ?? [])
      .map((l) => l.replace(/^\s*(?:10|[1-9])[.)]\s*/, '').trim())
      .filter((t) => t.length > 0);
    expect(titles.length).toBe(10);

    // 1차 프롬프트는 "스물다섯 자 안쪽"이라고만 적어 공백 포함 여부를 밝히지 않았고,
    // 출력 전 자기 검증 단계도 없었다. 그 결과 공백 포함 25자를 넘는 제목이 나왔다.
    const overWithSpace = titles.filter((t) => t.length > 25);
    expect(
      overWithSpace.length,
      '1차 실행에서 길이 초과가 발생했다는 기록. 수정 확인은 retest.test.ts 참조',
    ).toBeGreaterThan(0);

    // 공백을 제외하면 모두 통과했다. 즉 규칙의 모호함이 원인이었다.
    const overNoSpace = titles.filter((t) => t.replace(/\s/g, '').length > 25);
    expect(overNoSpace, `공백 제외로도 초과: ${JSON.stringify(overNoSpace)}`).toHaveLength(0);
  });

  it('관문 3이 인트로 3안을 냈고 각 안이 대사로 시작한다', () => {
    const g3 = section(doc, 'GATE 3');
    const plans = g3.match(/인트로\s*[1-3]\s*안/g) ?? [];
    expect(plans.length).toBeGreaterThanOrEqual(3);
    // 각 안에 대사 항목이 있어야 한다
    const dialogues = g3.match(/대사\s*:/g) ?? [];
    expect(dialogues.length).toBeGreaterThanOrEqual(3);
  });

  it('관문 4가 인물표를 냈고 교체 내역을 보고했다', () => {
    const g4 = section(doc, 'GATE 4');
    expect(g4).toMatch(/\/\s*\S+\s*\//); // "이름 / 나이 / 신분" 슬래시 구분
    // 이름 규칙 파일을 적용했다면 교체 내역이나 검사 언급이 있어야 한다
    expect(g4).toMatch(/교체|검사|규칙|TTS/);
  });

  it('관문 5가 반전 6개와 감동 지점 3개를 냈다', () => {
    const g5 = section(doc, 'GATE 5');
    const twists = g5.match(/반전\s*[1-6]/g) ?? [];
    expect(new Set(twists).size).toBe(6);
    expect(g5).toMatch(/감동/);
  });

  it('관문 6이 스토리 팩트를 틀에 맞춰 냈다', () => {
    const g6 = section(doc, 'GATE 6');
    for (const key of ['인물표', '시간표', '관계']) {
      expect(g6, `${key} 누락`).toContain(key);
    }
    expect(g6).toMatch(/어긋나면 안 되는|어휘 통일/);
  });

  it('관문 7 챕터 1이 목표 분량(5,100자)에 근접한다', () => {
    const g7 = section(doc, 'GATE 7');
    // 메타 표기를 제거한 본문 길이를 센다
    const bodyOnly = g7
      .replace(/^\s*\[점검\][\s\S]*?(?=\n\n)/gm, '')
      .replace(/^\s*\[팩트 갱신\][\s\S]*?(?=\n\n|$)/gm, '')
      .replace(/^---.*$/gm, '')
      .replace(/^\s*#+.*$/gm, '')
      .trim();
    // 목표 5,100자. 하한을 넉넉히 두되, 명백한 미달은 잡는다
    expect(bodyOnly.length, `챕터 1 본문 ${bodyOnly.length}자`).toBeGreaterThan(2500);
  });

  it('대본 본문에 TTS 금지 표기가 없다', () => {
    const g7 = section(doc, 'GATE 7');
    // 메타 블록(점검/갱신)은 제외하고 실제 낭독될 본문만 검사
    const narration = g7
      .split('\n')
      .filter(
        (l) =>
          !/^\s*\[/.test(l) && // [점검] [팩트 갱신]
          !/^\s*---/.test(l) &&
          !/^\s*#/.test(l) &&
          !/^\s*\|/.test(l) && // 표
          !/챕터\s*\d+\s*(끝|시작)/.test(l),
      )
      .join('\n');

    // 한자
    const hanja = narration.match(/[\u4E00-\u9FFF]/g) ?? [];
    expect(hanja, `한자 발견: ${hanja.slice(0, 5).join('')}`).toHaveLength(0);

    // 아라비아 숫자 (지침: 숫자는 반드시 한글로)
    const digits = narration.match(/\d/g) ?? [];
    expect(digits.length, `아라비아 숫자 ${digits.length}개 발견`).toBeLessThanOrEqual(2);

    // 이모지
    const emoji = narration.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) ?? [];
    expect(emoji).toHaveLength(0);
  });

  it('관문 8 썸네일 브리프가 지정 형식을 지켰다', () => {
    const g8 = section(doc, 'GATE 8');
    for (const key of [
      '제목',
      '한 줄 상황',
      '핵심 시각 요소',
      '장소',
      '시간대',
      '감정 톤',
      '밝히지 말아야 할 것',
      '인트로 첫 대사',
    ]) {
      expect(g8, `브리프 항목 "${key}" 누락`).toContain(key);
    }
  });

  it('대본이 Vrew 분할기와 호환된다', () => {
    const g7 = section(doc, 'GATE 7');
    const chunks = chunkScript(g7, 10000);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(10000);
  });
});

// ─────────────────────────── 이미지 프롬프트 ───────────────────────────

describeIfArtifacts('이미지 프롬프트 실행 결과', () => {
  const doc = load('02-image.md');
  // 장면 블록만 잘라낸다. 뒤에 붙는 요약·안내문은 제외해야 한다.
  const scenesRaw = (() => {
    const sec = section(doc, 'GATE 4 SCENES');
    const endIdx = sec.search(/^===\s*장면 끝\s*===|^\s*\[요약\]|^\s*\[안내\]/m);
    return endIdx > 0 ? sec.slice(0, endIdx) : sec;
  })();

  it('STYLE ANCHOR가 필수 요소를 담았다', () => {
    const anchor = section(doc, 'GATE 2 STYLE ANCHOR');
    expect(anchor).toMatch(/Joseon/i);
    expect(anchor).toMatch(/16:9/);
    expect(anchor).toMatch(/no text/i);
    expect(anchor).toMatch(/not Japanese/i);
    expect(anchor).toMatch(/not Chinese/i);
  });

  it('인물 5명을 CHARACTER 형식으로 고정했다', () => {
    const chars = section(doc, 'GATE 3 CHARACTERS');
    const blocks = chars.match(/\[CHARACTER\s*\d+\]/gi) ?? [];
    expect(blocks.length).toBe(5);
    // 레퍼런스 시트 필수 요소
    expect(chars).toMatch(/plain light gray background/i);
    expect(chars).toMatch(/character reference sheet|reference sheet/i);
  });

  it('★ 앱의 실제 파서가 장면을 정확히 40개로 분리한다', () => {
    const scenes = parseScenePrompts(scenesRaw);
    expect(scenes.length, `파서가 ${scenes.length}개로 분리했다`).toBe(40);
  });

  it('★ 강도 배분이 H8 / M16 / L16이다', () => {
    const scenes = parseScenePrompts(scenesRaw);
    const h = scenes.filter((s) => s.intensity === 'H').length;
    const m = scenes.filter((s) => s.intensity === 'M').length;
    const l = scenes.filter((s) => s.intensity === 'L').length;
    expect({ h, m, l }).toEqual({ h: 8, m: 16, l: 16 });
  });

  it('장면 번호가 1부터 40까지 빠짐없이 있다', () => {
    const nums = (scenesRaw.match(/^\s*(\d{1,2})\.\s*\[/gm) ?? []).map((s) =>
      Number.parseInt(s.trim(), 10),
    );
    const unique = [...new Set(nums)].sort((a, b) => a - b);
    expect(unique).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
  });

  it('대부분의 장면에 @인물 태그가 있다', () => {
    const scenes = parseScenePrompts(scenesRaw);
    const tagged = scenes.filter((s) => hasCharacterTag(s.prompt)).length;
    // 지침은 인물 없는 풍경 장면을 허용한다. 과반 이상은 태그가 있어야 한다
    expect(tagged, `태그 있는 장면 ${tagged}/40`).toBeGreaterThanOrEqual(25);
  });

  it('@태그가 관문 3에서 저장한 인물 이름과 일치한다', () => {
    const chars = section(doc, 'GATE 3 CHARACTERS');
    // "[CHARACTER n] 이름" 에서 이름을 뽑는다
    const names = (chars.match(/\[CHARACTER\s*\d+\]\s*([^\n\r]+)/gi) ?? []).map((l) =>
      l.replace(/\[CHARACTER\s*\d+\]\s*/i, '').trim(),
    );
    expect(names.length).toBe(5);

    // 장면 본문에서만 태그를 뽑는다. 앱과 같은 추출기를 쓴다.
    const scenes = parseScenePrompts(scenesRaw);
    const usedTags = [...new Set(scenes.flatMap((s) => extractCharacterTags(s.prompt)))];
    expect(usedTags.length, '태그가 하나도 없다').toBeGreaterThan(0);

    const unknown = usedTags.filter((t) => !names.some((n) => n.includes(t) || t.includes(n)));
    expect(unknown, `등록되지 않은 태그: ${JSON.stringify(unknown)}`).toHaveLength(0);
  });

  it('장면 프롬프트가 영어로 작성됐다', () => {
    const scenes = parseScenePrompts(scenesRaw);
    for (const [i, s] of scenes.slice(0, 10).entries()) {
      // 태그와 등급 표기를 뺀 본문에 한글 문장이 없어야 한다
      const body = s.prompt.replace(/@[\w가-힣]+/g, '').replace(/^\s*\d+\.\s*\[[HML]\]/, '');
      const korean = body.match(/[가-힣]{3,}/g) ?? [];
      expect(korean, `장면 ${i + 1}에 한글 본문: ${korean.join(',')}`).toHaveLength(0);
    }
  });

  it('카메라 지시가 등급별로 다양하다', () => {
    const scenes = parseScenePrompts(scenesRaw);
    const cams = scenes
      .map((s) => /(wide shot|medium shot|close-?up|over the shoulder|low angle|from above)/i.exec(s.prompt)?.[1]?.toLowerCase())
      .filter(Boolean);
    expect(cams.length, '카메라 지시가 있는 장면 수').toBeGreaterThanOrEqual(30);
    expect(new Set(cams).size, '카메라 종류 수').toBeGreaterThanOrEqual(3);
  });

  it('글자 생성 방지 지시가 있다', () => {
    expect(scenesRaw + section(doc, 'GATE 2 STYLE ANCHOR')).toMatch(/no text/i);
  });
});

// ─────────────────────────── 썸네일 프롬프트 ───────────────────────────

describeIfArtifacts('썸네일 프롬프트 실행 결과', () => {
  const doc = load('03-thumbnail.md');
  const copiesRaw = section(doc, 'GATE 1 COPIES');

  /** 번호 붙은 카피 첫 줄만 뽑는다 */
  function extractCopies(): string[] {
    return (copiesRaw.match(/^\s*[1-8][.)]\s*(.+)$/gm) ?? [])
      .map((l) => l.replace(/^\s*[1-8][.)]\s*/, '').trim())
      // 괄호 주석 제거: "카피 (12자, 한 줄)"
      .map((l) => l.replace(/\s*\([^)]*\)\s*$/, '').trim())
      .filter((l) => l.length > 0);
  }

  it('카피 8개를 냈다', () => {
    const copies = extractCopies();
    expect(copies.length, JSON.stringify(copies)).toBe(8);
  });

  it('★ 모든 카피가 18자 이내다', () => {
    const copies = extractCopies();
    const tooLong = copies.filter((c) => c.replace(/\s/g, '').length > 18);
    expect(tooLong, `18자 초과: ${JSON.stringify(tooLong)}`).toHaveLength(0);
  });

  it('★ 물음표·느낌표·따옴표를 쓰지 않았다', () => {
    const copies = extractCopies();
    const bad = copies.filter((c) => /[?!？！"'“”‘’]/.test(c));
    expect(bad, `금지 문자 포함: ${JSON.stringify(bad)}`).toHaveLength(0);
  });

  it('배경 프롬프트에 네거티브 스페이스 지시가 있다', () => {
    const p = section(doc, 'GATE 2 PROMPT');
    expect(p).toMatch(/negative space|uncluttered|dark and/i);
    expect(p).toMatch(/16:9/);
    expect(p).toMatch(/no text/i);
  });

  it('미리캔버스 수치가 그대로 전달됐다', () => {
    const m = section(doc, 'GATE 3 MIRICANVAS');
    expect(m).toContain('1280');
    expect(m).toMatch(/50/);
    expect(m).toMatch(/JPG/i);
    expect(m).toMatch(/채도/);
  });

  it('인트로 정합성 점검을 수행했다', () => {
    expect(doc).toMatch(/정합성|인트로 첫 대사/);
  });
});

// ─────────────────────────── 인트로 프롬프트 ───────────────────────────

describeIfArtifacts('인트로 프롬프트 실행 결과', () => {
  const doc = load('04-intro.md');
  const scenesRaw = section(doc, 'SCENES');

  it('Scene 1~4를 모두 냈다', () => {
    for (let i = 1; i <= 4; i += 1) {
      expect(scenesRaw, `SCENE ${i} 누락`).toMatch(new RegExp(`SCENE\\s*${i}\\b`, 'i'));
    }
  });

  it('각 씬에 필수 항목이 있다', () => {
    const blocks = scenesRaw.split(/SCENE\s*\d/i).slice(1);
    expect(blocks.length).toBe(4);
    for (const [i, b] of blocks.entries()) {
      expect(b, `Scene ${i + 1} 등장인물 누락`).toMatch(/등장인물/);
      expect(b, `Scene ${i + 1} 이미지 프롬프트 누락`).toMatch(/이미지 프롬프트|Grok 이미지/);
      expect(b, `Scene ${i + 1} 영상 변환 지시 누락`).toMatch(/영상 변환/);
    }
  });

  it('★ 모든 씬이 Subtle motion only로 절제됐다', () => {
    const subtle = scenesRaw.match(/Subtle motion only/gi) ?? [];
    expect(subtle.length, `${subtle.length}/4 씬`).toBe(4);
  });

  it('★ 모든 씬에서 카메라를 고정했다', () => {
    const still = scenesRaw.match(/Camera holds still/gi) ?? [];
    expect(still.length).toBe(4);
  });

  it('대사 있는 씬에만 립싱크 지시가 있다', () => {
    const lip = scenesRaw.match(/Lip sync/gi) ?? [];
    expect(lip.length).toBeGreaterThanOrEqual(1);
    expect(lip.length).toBeLessThanOrEqual(2);
  });

  it('손동작·걷기를 지시하지 않았다', () => {
    // 지침이 금지한 항목. 영상 변환 지시 구간만 검사한다
    const motionBlocks = (scenesRaw.match(/영상 변환[^\n]*\n([\s\S]*?)(?=━|SCENE|\n===|$)/gi) ?? []).join(
      '\n',
    );
    expect(motionBlocks).not.toMatch(/\bwalking\b|\bwalks\b|hand gesture|gesturing/i);
  });

  it('Scene 1 대사가 대본 확정본과 일치한다', () => {
    const script = load('01-script.md');
    const g3 = section(script, 'GATE 3');
    // 대본에서 대사 후보들을 뽑는다
    const scriptLines = (g3.match(/대사\s*:\s*(.+)/g) ?? []).map((l) =>
      l.replace(/대사\s*:\s*/, '').replace(/^["'“”]|["'“”]$/g, '').trim(),
    );
    const introLine = /대사\]?\s*\n?[^\n]*?[:：]\s*"?([^"\n]+)"?/.exec(scenesRaw)?.[1]?.trim() ?? '';
    expect(introLine.length, '인트로 대사를 찾지 못했다').toBeGreaterThan(5);
    // 대본의 세 후보 중 하나와 상당 부분 일치해야 한다
    const matched = scriptLines.some((sl) => {
      const a = sl.replace(/[\s"'“”.,]/g, '');
      const b = introLine.replace(/[\s"'“”.,]/g, '');
      return a.includes(b.slice(0, 10)) || b.includes(a.slice(0, 10));
    });
    expect(matched, `인트로 대사 "${introLine}" 가 대본 후보와 불일치`).toBe(true);
  });

  it('프롬프트가 영어로 작성됐다 (대사 제외)', () => {
    // [Grok 이미지 프롬프트] 라벨 다음부터 [Grok 영상 변환 지시] 라벨 전까지
    const blocks = [...scenesRaw.matchAll(/\[Grok 이미지 프롬프트\]\s*\n([\s\S]*?)(?=\n\s*\[Grok 영상)/g)]
      .map((m) => m[1] ?? '')
      // + [STYLE ANCHOR] 는 자리표시자이므로 제외
      .map((b) => b.replace(/\+\s*\[STYLE ANCHOR\]/g, ''));

    expect(blocks.length, '이미지 프롬프트 블록을 찾지 못했다').toBe(4);

    for (const [i, b] of blocks.entries()) {
      // @인물 태그의 한글 이름은 허용된다. 태그를 제거한 뒤 검사한다.
      const stripped = b.replace(/@[\w가-힣]+/g, '');
      const korean = stripped.match(/[가-힣]{2,}/g) ?? [];
      expect(korean, `Scene ${i + 1} 프롬프트에 한글: ${korean.slice(0, 3).join(',')}`).toHaveLength(
        0,
      );
    }
  });

  it('수정 요청을 Claude 쪽에서 처리했다', () => {
    const rev = section(doc, 'REVISION');
    expect(rev.trim().length).toBeGreaterThan(50);
    // 수정본에도 절제 규칙이 유지돼야 한다
    expect(rev).toMatch(/Subtle motion only|감정 지시|표정/);
  });

  it('Vrew 음성 중복 경고를 전달했다', () => {
    const guide = section(doc, 'GROK GUIDE');
    expect(guide + doc).toMatch(/두 겹|중복|목소리/);
  });
});

// ─────────────────────────── 단계 간 연결 ───────────────────────────

describeIfArtifacts('파이프라인 정합성 — 산출물이 실제로 이어지는가', () => {
  it('대본의 썸네일 브리프가 썸네일 단계로 전달됐다', () => {
    const script = load('01-script.md');
    const thumb = load('03-thumbnail.md');
    const title = /제목\s*[:：]\s*(.+)/.exec(section(script, 'GATE 8'))?.[1]?.trim() ?? '';
    expect(title.length).toBeGreaterThan(3);
    // 제목의 핵심 어절이 썸네일 산출물에 나타나야 한다
    const keywords = title.split(/\s+/).filter((w) => w.length >= 2);
    const hit = keywords.some((k) => thumb.includes(k));
    expect(hit, `제목 "${title}" 의 어절이 썸네일 산출물에 없다`).toBe(true);
  });

  it('이미지의 인물 이름이 인트로 단계로 전달됐다', () => {
    const image = load('02-image.md');
    const intro = load('04-intro.md');
    const names = (section(image, 'GATE 3 CHARACTERS').match(/\[CHARACTER\s*\d+\]\s*([^\n\r]+)/gi) ?? [])
      .map((l) => l.replace(/\[CHARACTER\s*\d+\]\s*/i, '').trim())
      .filter((n) => /[가-힣]/.test(n));
    expect(names.length).toBeGreaterThanOrEqual(3);
    const hit = names.some((n) => intro.includes(n.split(/\s/)[0] ?? n));
    expect(hit, `인물 ${JSON.stringify(names)} 중 아무도 인트로에 없다`).toBe(true);
  });
});
