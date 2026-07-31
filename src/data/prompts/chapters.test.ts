/**
 * 관문 7 검증 — 챕터 연속 집필의 일관성.
 *
 * 가장 위험한 미검증 구간이었다. 46,000자를 9챕터로 나눠 쓰는 동안
 * 인물의 아는 범위, 설정, 어휘가 어긋나지 않는지가 관건이다.
 *
 * 독립 에이전트가 다섯 챕터를 실제로 쓴 결과를 검사한다.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkScript } from '../../lib/scriptCheck';
import { chunkScript } from '../../lib/text';

const FILE = join(process.cwd(), '_verify', 'agent3', '05-chapters.md');
const HAS = existsSync(FILE);
const describeIf = HAS ? describe : describe.skip;
const doc = HAS ? readFileSync(FILE, 'utf8') : '';

/** === CHn === 구간을 잘라낸다 */
function chapter(n: number): string {
  const re = new RegExp(`^===\\s*CH${n}\\s*===\\s*$`, 'm');
  const m = re.exec(doc);
  if (!m) return '';
  const start = m.index + m[0].length;
  const nextRe = new RegExp(`^===\\s*CH${n + 1}\\s*===\\s*$`, 'm');
  const next = nextRe.exec(doc.slice(start));
  return next ? doc.slice(start, start + next.index) : doc.slice(start);
}

/**
 * 메타 블록을 제거한 낭독 본문만 남긴다.
 *
 * [점검]과 [팩트 갱신]은 여러 줄에 걸친 블록이다.
 * 첫 줄만 걸러내면 "반전 1 배치: ..." 같은 이어지는 줄이 본문으로 오인된다.
 * 빈 줄을 만날 때까지 블록으로 취급한다.
 */
function narrationOnly(text: string): string {
  const out: string[] = [];
  let inMeta = false;

  for (const raw of text.split('\n')) {
    const t = raw.trim();

    if (/^\[(점검|팩트 갱신)\]/.test(t)) {
      inMeta = true;
      continue;
    }
    // 빈 줄이 메타 블록의 끝이다
    if (inMeta) {
      if (t === '') inMeta = false;
      continue;
    }

    if (t === '') continue;
    if (/^={3,}/.test(t)) continue;
    if (/^#{1,6}\s/.test(t)) continue;
    if (/^-{3,}/.test(t)) continue;
    if (/^(챕터|Chapter)\s*\d+\s*(끝|시작)?/.test(t)) continue;

    out.push(raw);
  }
  return out.join('\n');
}

describeIf('관문 7 — 다섯 챕터 생성', () => {
  it('CH1부터 CH5까지 모두 있다', () => {
    for (let i = 1; i <= 5; i += 1) {
      expect(chapter(i).trim().length, `CH${i} 없음`).toBeGreaterThan(500);
    }
  });

  it('각 챕터에 점검 블록이 있다', () => {
    for (let i = 1; i <= 5; i += 1) {
      expect(chapter(i), `CH${i} 점검 없음`).toMatch(/\[점검\]/);
    }
  });

  it('각 챕터에 팩트 갱신 블록이 있다', () => {
    for (let i = 1; i <= 5; i += 1) {
      expect(chapter(i), `CH${i} 팩트 갱신 없음`).toMatch(/\[팩트 갱신\]/);
    }
  });

  it('★ 한 시간 분량 목표(23,000자)에 근접한다', () => {
    const total = [1, 2, 3, 4, 5]
      .map((i) => narrationOnly(chapter(i)).replace(/\s/g, '').length)
      .reduce((a, b) => a + b, 0);
    // 목표의 85% 이상이면 통과로 본다
    expect(total, `실제 ${total}자`).toBeGreaterThan(19500);
  });

  it('챕터별 분량이 크게 들쭉날쭉하지 않다', () => {
    const lens = [1, 2, 3, 4, 5].map((i) => narrationOnly(chapter(i)).replace(/\s/g, '').length);
    const max = Math.max(...lens);
    const min = Math.min(...lens);
    // 최대가 최소의 두 배를 넘지 않아야 균형 있다
    expect(max / min, `분량 ${JSON.stringify(lens)}`).toBeLessThan(2);
  });
});

describeIf('관문 7 — TTS 규칙 준수', () => {
  const all = [1, 2, 3, 4, 5].map((i) => narrationOnly(chapter(i))).join('\n');

  it('★ 본문에 한자가 없다', () => {
    const r = checkScript(all);
    const hanja = r.issues.filter((i) => i.rule === 'hanja');
    expect(hanja, `발견: ${hanja.map((h) => h.text).join(',')}`).toHaveLength(0);
  });

  it('★ 본문에 아라비아 숫자가 없다', () => {
    const r = checkScript(all);
    const digits = r.issues.filter((i) => i.rule === 'digit');
    expect(digits, `발견: ${digits.map((d) => `${d.line}행 ${d.text}`).join(', ')}`).toHaveLength(0);
  });

  it('본문에 영문이 없다', () => {
    const r = checkScript(all);
    expect(r.issues.filter((i) => i.rule === 'latin')).toHaveLength(0);
  });

  it('본문에 이모지가 없다', () => {
    const r = checkScript(all);
    expect(r.issues.filter((i) => i.rule === 'emoji')).toHaveLength(0);
  });

  it('대사 비율이 목표 범위에 있다', () => {
    const r = checkScript(all);
    const pct = Math.round(r.dialogueRatio * 100);
    // 듣는 콘텐츠이므로 대사가 어느 정도 있어야 한다
    expect(pct, `대사 비율 ${pct}%`).toBeGreaterThan(10);
  });

  it('Vrew 분할기와 호환된다', () => {
    const chunks = chunkScript(all, 10000);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(10000);
  });
});

describeIf('관문 7 — 설정 일관성', () => {
  const all = [1, 2, 3, 4, 5].map((i) => narrationOnly(chapter(i))).join('\n');

  it('어휘 통일표를 지켰다 — 곳간을 창고나 광으로 부르지 않는다', () => {
    expect(all).toMatch(/곳간/);
    // 같은 대상을 다른 말로 부르면 안 된다
    const alt = all.match(/(?<![가-힣])(창고|광|고방)(?![가-힣])/g) ?? [];
    expect(alt, `대체어 발견: ${alt.join(',')}`).toHaveLength(0);
  });

  it('어휘 통일표를 지켰다 — 큰마님으로 일관되게 부른다', () => {
    expect(all).toMatch(/큰마님/);
    const alt = all.match(/(?<![가-힣])노부인(?![가-힣])/g) ?? [];
    // 나레이션에서 노부인으로 섞어 부르면 안 된다
    expect(alt.length, `노부인 ${alt.length}회 등장`).toBeLessThanOrEqual(1);
  });

  it('★ 해주가 글을 읽는 서술이 없다 — 문맹 설정 유지', () => {
    // 부정문("읽지 못했다", "읽을 수 없었다")은 설정을 지킨 것이므로 제외해야 한다.
    // 긍정으로 읽는 서술만 위반이다.
    const sentences = all.split(/(?<=[.!?])\s*/);
    const bad = sentences.filter((s) => {
      if (!/해주/.test(s)) return false;
      if (!/(글|문서|편지|장부|이름)[을를]?\s*[^.!?]{0,10}읽/.test(s)) return false;
      // 부정 표현이 있으면 설정을 지킨 것이다
      if (/읽지\s*(못|않)|읽을\s*수\s*없|읽지\s*모르|못\s*읽/.test(s)) return false;
      return true;
    });
    expect(bad, `설정 위반: ${bad.join(' | ')}`).toHaveLength(0);
  });

  it('문맹 설정을 실제로 서술에 반영했다', () => {
    // 제약을 무시하고 그냥 안 쓴 것이 아니라, 이야기 안에서 다룬 흔적이 있어야 한다
    expect(all).toMatch(/읽지\s*못|읽을\s*수\s*없|글을\s*모르/);
  });

  it('★ 만춘 영감이 산에 오르는 서술이 없다 — 다리 설정 유지', () => {
    const sentences = all.split(/(?<=[.!?])\s*/);
    const bad = sentences.filter((s) => {
      if (!/만춘/.test(s)) return false;
      if (!/산[에을]\s*[^.!?]{0,10}(올라|오르)/.test(s)) return false;
      if (/못\s*(올라|오르)|오르지\s*못|올라가지\s*못|오를\s*수\s*없/.test(s)) return false;
      return true;
    });
    expect(bad, `설정 위반: ${bad.join(' | ')}`).toHaveLength(0);
  });

  it('주요 인물 다섯 명이 모두 등장한다', () => {
    for (const name of ['해주', '큰마님', '만춘', '봉선', '덕구']) {
      expect(all, `${name} 미등장`).toContain(name);
    }
  });

  it('인물 이름이 대본 전체에서 일관되게 유지된다', () => {
    // 오탈자로 이름이 변형되지 않았는지
    const variants = all.match(/해주|해준|헤주/g) ?? [];
    const wrong = variants.filter((v) => v !== '해주');
    expect(wrong, `이름 변형: ${[...new Set(wrong)].join(',')}`).toHaveLength(0);
  });
});

describeIf('관문 7 — 구조 변주 반영', () => {
  it('지정한 결말 유형(폭로형)이 반영됐다', () => {
    const last = chapter(5);
    // 폭로형은 진실이 밝혀지되 직접 처벌하지 않는다
    expect(last).toMatch(/밝혀|드러|알려|읽어/);
  });

  it('조력자 없음 설정이 지켜졌다 — 초자연 개입이 없다', () => {
    const all = [1, 2, 3, 4, 5].map((i) => narrationOnly(chapter(i))).join('\n');
    // 귀신, 도깨비, 산신이 사건을 해결하면 안 된다
    const supernatural = all.match(/귀신|도깨비|산신|신령/g) ?? [];
    expect(supernatural.length, `초자연 언급 ${supernatural.length}회`).toBeLessThanOrEqual(3);
  });

  it('점검 블록이 골격 단계를 명시한다', () => {
    const checks = doc.match(/\[점검\][^\n]*/g) ?? [];
    expect(checks.length).toBeGreaterThanOrEqual(5);
    const withStage = checks.filter((c) => /골격|단계/.test(c));
    expect(withStage.length, '골격 단계를 밝힌 점검').toBeGreaterThanOrEqual(3);
  });
});
