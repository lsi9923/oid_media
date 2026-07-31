import { describe, expect, it } from 'vitest';
import type { SceneIntensity } from '../types';
import {
  chunkScript,
  countChars,
  extractCharacterTags,
  formatDuration,
  formatKrw,
  hasCharacterTag,
  parseScenePrompts,
} from './text';

describe('chunkScript — Vrew 1만자 분할', () => {
  it('한도 이하면 그대로 한 조각', () => {
    expect(chunkScript('짧은 대본입니다.', 10000)).toEqual(['짧은 대본입니다.']);
  });

  it('빈 입력은 빈 배열', () => {
    expect(chunkScript('', 10000)).toEqual([]);
    expect(chunkScript('   \n  ', 10000)).toEqual([]);
  });

  it('모든 조각이 한도를 넘지 않는다', () => {
    // 문장 200개 × 약 30자 = 약 6,000자
    const script = Array.from({ length: 200 }, (_, i) => `이것은 ${i}번째 문장입니다.`).join(' ');
    const chunks = chunkScript(script, 500);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(500);
    }
  });

  it('분할해도 내용이 유실되지 않는다', () => {
    const script = Array.from({ length: 120 }, (_, i) => `문장${i}.`).join(' ');
    const chunks = chunkScript(script, 300);
    const rejoined = chunks.join(' ').replace(/\s+/g, '');
    expect(rejoined).toBe(script.replace(/\s+/g, ''));
  });

  it('문장 경계에서 자른다 — 조각이 문장부호로 끝난다', () => {
    const script = Array.from({ length: 60 }, (_, i) => `이것은 ${i}번 문장입니다.`).join(' ');
    const chunks = chunkScript(script, 200);
    // 마지막 조각을 제외한 모든 조각은 마침표로 끝나야 한다
    for (const c of chunks.slice(0, -1)) {
      expect(c.endsWith('.')).toBe(true);
    }
  });

  it('한 문장이 한도보다 길면 강제 분할한다', () => {
    const long = 'ㄱ'.repeat(1000);
    const chunks = chunkScript(long, 300);
    expect(chunks.length).toBe(4);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(300);
  });

  it('46,000자 대본은 1만자 기준 5조각이 된다', () => {
    // '열글자짜리문장이다.' = 정확히 10자
    const script = Array.from({ length: 4600 }, () => '열글자짜리문장이다.').join('');
    expect(countChars(script)).toBe(46000);
    const chunks = chunkScript(script, 10000);
    expect(chunks.length).toBe(5);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(10000);
  });
});

describe('parseScenePrompts — 40장면 분리', () => {
  it('번호 표기(1. 2. 3.)를 인식한다', () => {
    const raw = `1. [H] A Joseon kitchen at night. @해주
2. [M] A quiet courtyard. @두식
3. [L] Distant mountains.`;
    const scenes = parseScenePrompts(raw);
    expect(scenes).toHaveLength(3);
    expect(scenes[0]!.intensity).toBe('H');
    expect(scenes[1]!.intensity).toBe('M');
    expect(scenes[2]!.intensity).toBe('L');
  });

  it('Scene / 장면 표기도 인식한다', () => {
    const raw = `Scene 1: first shot\nScene 2: second shot\nScene 3: third shot`;
    expect(parseScenePrompts(raw)).toHaveLength(3);
  });

  it('번호가 없으면 빈 줄 기준으로 나눈다', () => {
    const raw = `첫 번째 장면 묘사\n\n두 번째 장면 묘사\n\n세 번째 장면 묘사`;
    expect(parseScenePrompts(raw)).toHaveLength(3);
  });

  it('강도 표기가 없으면 M으로 둔다', () => {
    const scenes = parseScenePrompts('1. plain scene\n2. another scene');
    expect(scenes[0]!.intensity).toBe('M');
  });

  it('40장면을 모두 분리한다', () => {
    const raw = Array.from(
      { length: 40 },
      (_, i) => `${i + 1}. [${i < 8 ? 'H' : i < 24 ? 'M' : 'L'}] scene ${i + 1} @인물`,
    ).join('\n');
    const scenes = parseScenePrompts(raw);
    expect(scenes).toHaveLength(40);
    expect(scenes.filter((s) => s.intensity === 'H')).toHaveLength(8);
    expect(scenes.filter((s) => s.intensity === 'M')).toHaveLength(16);
    expect(scenes.filter((s) => s.intensity === 'L')).toHaveLength(16);
  });

  it('빈 입력은 빈 배열', () => {
    expect(parseScenePrompts('')).toEqual([]);
  });

  // ── 회귀 테스트 ──
  // 서브에이전트가 만든 실제 산출물에서 발견된 버그.
  // 본문의 low angle / high saturation 을 강도 등급으로 오인했다.
  it('본문의 low angle을 L 등급으로 오인하지 않는다', () => {
    const raw = `1. [M] @해주
Medium shot of a woman, low angle looking up at the gate,
---
2. [M] @덕구
Medium shot, high saturation warm tones, dramatic rim lighting,`;
    const scenes = parseScenePrompts(raw);
    expect(scenes.map((s) => s.intensity)).toEqual(['M', 'M']);
  });

  it('본문의 High/Low 단어가 등급을 덮어쓰지 않는다', () => {
    const cases: { raw: string; expected: SceneIntensity }[] = [
      { raw: '5. [H] a wide shot with low light', expected: 'H' },
      { raw: '6. [L] close-up with high contrast', expected: 'L' },
      { raw: '7. [M] low angle, high saturation', expected: 'M' },
    ];
    for (const c of cases) {
      const [scene] = parseScenePrompts(c.raw);
      expect(scene?.intensity, c.raw).toBe(c.expected);
    }
  });

  it('40장면 전체에서 등급 배분이 정확히 유지된다', () => {
    // 모든 장면 본문에 low/high 를 일부러 섞는다
    const raw = Array.from({ length: 40 }, (_, i) => {
      const grade = i < 8 ? 'H' : i < 24 ? 'M' : 'L';
      return `${i + 1}. [${grade}] @해주\nlow angle shot with high saturation lighting,\n+ [STYLE ANCHOR]`;
    }).join('\n---\n');
    const scenes = parseScenePrompts(raw);
    expect(scenes).toHaveLength(40);
    expect(scenes.filter((s) => s.intensity === 'H')).toHaveLength(8);
    expect(scenes.filter((s) => s.intensity === 'M')).toHaveLength(16);
    expect(scenes.filter((s) => s.intensity === 'L')).toHaveLength(16);
  });
});

describe('extractCharacterTags — 안내문 오탐 방지', () => {
  it('실제 인물 이름만 뽑는다', () => {
    expect(extractCharacterTags('scene with @해주 and @덕구')).toEqual(['해주', '덕구']);
  });

  it('안내문의 "@태그가"를 인물로 보지 않는다', () => {
    expect(extractCharacterTags('@태그가 실제로 반영됐는지 확인하십시오')).toEqual([]);
  });

  it('"@인물" 같은 일반어도 제외한다', () => {
    expect(extractCharacterTags('형식은 @인물 태그를 쓴다')).toEqual([]);
  });

  it('중복 태그를 한 번만 반환한다', () => {
    expect(extractCharacterTags('@해주 and @해주 again')).toEqual(['해주']);
  });

  it('hasCharacterTag가 안내문에 속지 않는다', () => {
    expect(hasCharacterTag('@태그가 빠지면 얼굴이 달라집니다')).toBe(false);
    expect(hasCharacterTag('a kitchen scene @해주 standing')).toBe(true);
  });
});

describe('hasCharacterTag — @인물 태그 검증', () => {
  it('한글 태그를 찾는다', () => {
    expect(hasCharacterTag('a kitchen scene @해주 standing')).toBe(true);
  });
  it('영문 태그를 찾는다', () => {
    expect(hasCharacterTag('scene with @haeju')).toBe(true);
  });
  it('태그가 없으면 false', () => {
    expect(hasCharacterTag('a plain landscape with no people')).toBe(false);
  });
  it('@ 뒤에 문자가 없으면 false', () => {
    expect(hasCharacterTag('email @ sign only')).toBe(false);
  });
});

describe('포맷 헬퍼', () => {
  it('formatKrw는 천 단위를 구분한다', () => {
    expect(formatKrw(89000)).toBe('89,000원');
    expect(formatKrw(0)).toBe('0원');
  });

  it('formatDuration은 시/분으로 표기한다', () => {
    expect(formatDuration(4800)).toBe('1시간 20분');
    expect(formatDuration(120)).toBe('2분');
    expect(formatDuration(45)).toBe('45초');
    expect(formatDuration(0)).toBe('0초');
  });

  it('40장 × 2분은 1시간 20분', () => {
    expect(formatDuration(40 * 120)).toBe('1시간 20분');
  });

  it('countChars는 앞뒤 공백을 제외한다', () => {
    expect(countChars('  가나다  ')).toBe(3);
  });
});
