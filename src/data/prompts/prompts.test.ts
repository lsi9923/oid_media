// 프롬프트 자산의 무결성 검증.
// 실제 LLM 동작은 사용자가 확인해야 하지만, 구조적 결함은 여기서 잡는다.
import { describe, expect, it } from 'vitest';
import { PROMPT_ASSETS, assetsByProject, findPromptAsset } from './index';
import { parseScenePrompts } from '../../lib/text';

describe('프롬프트 자산 목록', () => {
  it('9개 자산이 있다', () => {
    expect(PROMPT_ASSETS).toHaveLength(9);
  });

  it('id가 중복되지 않는다', () => {
    const ids = PROMPT_ASSETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('파일명이 중복되지 않고 번호 순서대로다', () => {
    const names = PROMPT_ASSETS.map((p) => p.fileName);
    expect(new Set(names).size).toBe(names.length);
    const numbers = names.map((n) => Number.parseInt(n.slice(0, 2), 10));
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('모든 자산에 본문이 있고 충분히 상세하다', () => {
    for (const asset of PROMPT_ASSETS) {
      expect(asset.body.trim().length, `${asset.id} 본문이 비었거나 너무 짧다`).toBeGreaterThan(500);
      expect(asset.role.trim().length).toBeGreaterThan(10);
      expect(asset.install.trim().length).toBeGreaterThan(10);
    }
  });

  it('지침용 4개는 각각 다른 Claude 프로젝트에 속한다', () => {
    const instructions = PROMPT_ASSETS.filter((p) => p.target === 'claude-instructions');
    expect(instructions).toHaveLength(4);
    const projects = instructions.map((p) => p.project);
    expect(new Set(projects)).toEqual(
      new Set(['민담 대본', '민담 이미지', '민담 인트로', '민담 썸네일']),
    );
  });

  it('파일 업로드용 3개는 모두 대본 프로젝트다', () => {
    const files = PROMPT_ASSETS.filter((p) => p.target === 'claude-file');
    expect(files).toHaveLength(3);
    for (const f of files) expect(f.project).toBe('민담 대본');
  });

  it('대본 프로젝트는 지침 1개 + 파일 3개다', () => {
    const script = assetsByProject('민담 대본');
    expect(script).toHaveLength(4);
    expect(script.filter((p) => p.target === 'claude-instructions')).toHaveLength(1);
    expect(script.filter((p) => p.target === 'claude-file')).toHaveLength(3);
  });

  it('findPromptAsset이 동작한다', () => {
    expect(findPromptAsset('script-main')?.project).toBe('민담 대본');
    expect(findPromptAsset('없는id')).toBeUndefined();
  });
});

describe('대본 프롬프트 내용 검증', () => {
  const body = findPromptAsset('script-main')!.body;

  it('8개 관문이 순서대로 정의돼 있다', () => {
    for (let i = 1; i <= 8; i += 1) {
      expect(body, `관문 ${i} 누락`).toContain(`## 관문 ${i} —`);
    }
  });

  it('TTS 금지 표기 규칙이 있다', () => {
    expect(body).toContain('한자');
    expect(body).toContain('괄호');
    expect(body).toContain('숫자는 반드시 한글로');
  });

  it('시청층 정의가 있다', () => {
    expect(body).toContain('50~70대');
    expect(body).toContain('화면을 보지 않는다');
  });

  it('분량 기준표에 세 가지 길이가 있다', () => {
    expect(body).toContain('이만삼천 자');
    expect(body).toContain('삼만사천 자');
    expect(body).toContain('사만육천 자');
  });

  it('관문마다 멈추라는 지시가 있다', () => {
    expect(body).toContain('멈추고');
    expect(body).toContain('사용자의 선택을 기다린다');
  });

  it('참고 파일 3개를 모두 참조한다', () => {
    expect(body).toContain('모티프 뱅크');
    expect(body).toContain('이름 규칙');
    expect(body).toContain('스토리 팩트');
  });

  // 서브에이전트 실행에서 제목 길이 초과가 발견돼 보강한 규칙
  it('제목 길이를 공백 제외로 명시했다', () => {
    expect(body).toMatch(/공백을?\s*제외하고\s*스물다섯\s*자/);
  });

  it('제목 출력 전 자기 검증 단계가 있다', () => {
    expect(body).toContain('출력 전 자기 검증');
    expect(body).toContain('[길이 검증]');
  });

  it('길이 초과 나쁜 예를 제시한다', () => {
    expect(body).toMatch(/길이 초과/);
  });
});

describe('모티프 뱅크 검증', () => {
  const body = findPromptAsset('motif-bank')!.body;

  it('4개 갈래가 있다', () => {
    for (const g of ['갈래 A', '갈래 B', '갈래 C', '갈래 D']) {
      expect(body).toContain(g);
    }
  });

  it('모티프 항목이 40개 이상이다', () => {
    const items = body.match(/^[A-D]-\d\d /gm) ?? [];
    expect(items.length).toBeGreaterThanOrEqual(40);
  });

  it('갈래별 항목 번호가 중복되지 않는다', () => {
    const codes = (body.match(/^([A-D]-\d\d) /gm) ?? []).map((s) => s.trim());
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('이름 규칙 검증', () => {
  const body = findPromptAsset('name-rules')!.body;

  it('발음 위험 검사 항목이 6개다', () => {
    expect(body).toContain('### 위험 1.');
    for (const n of ['두 번째', '세 번째', '네 번째', '다섯 번째', '여섯 번째']) {
      expect(body, `${n} 항목 누락`).toContain(`### ${n}.`);
    }
  });

  it('금지 목록과 권장 목록이 모두 있다', () => {
    expect(body).toContain('## 2단계 — 금지 목록');
    expect(body).toContain('## 3단계 — 권장 이름 목록');
  });

  it('권장 이름이 100개 이상이다', () => {
    // 권장 목록 구간에서 쉼표로 나열된 이름을 센다
    const start = body.indexOf('## 3단계');
    const end = body.indexOf('## 4단계');
    const section = body.slice(start, end);
    const names = section
      .split('\n')
      .filter((l) => l.includes(',') && !l.startsWith('#'))
      .flatMap((l) => l.split(','))
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && /[가-힣]/.test(s));
    expect(names.length).toBeGreaterThanOrEqual(100);
  });

  it('교체 내역을 보고하도록 지시한다', () => {
    expect(body).toContain('교체 내역');
  });
});

describe('이미지 프롬프트 검증', () => {
  const body = findPromptAsset('image-main')!.body;

  it('4개 관문이 있다', () => {
    for (let i = 1; i <= 4; i += 1) {
      expect(body).toContain(`## 관문 ${i} —`);
    }
  });

  it('H8/M16/L16 강도 배분이 명시돼 있다', () => {
    expect(body).toContain('| H (High) | 8개');
    expect(body).toContain('| M (Medium) | 16개');
    expect(body).toContain('| L (Low) | 16개');
  });

  it('출력 형식이 파서와 호환된다', () => {
    // 프롬프트가 지시한 형식의 예시를 실제 파서로 통과시킨다
    const sample = `1. [L] @해주
Interior of a dim Joseon kitchen at dawn, wide shot,
+ [STYLE ANCHOR]
---
2. [M] @해주 @큰마님
Medium shot of two women facing each other,
+ [STYLE ANCHOR]
---
3. [H] @큰마님
Close-up of an older woman, dramatic low angle,
+ [STYLE ANCHOR]`;
    const scenes = parseScenePrompts(sample);
    expect(scenes).toHaveLength(3);
    expect(scenes[0]!.intensity).toBe('L');
    expect(scenes[1]!.intensity).toBe('M');
    expect(scenes[2]!.intensity).toBe('H');
  });

  it('영어로 출력하라고 지시한다', () => {
    expect(body).toContain('한국어로 출력하지 않는다');
  });

  it('한국 양식을 일본·중국과 구별하라고 지시한다', () => {
    expect(body).toContain('not Japanese');
    expect(body).toContain('not Chinese');
  });

  it('글자가 이미지에 생기지 않게 하는 지시가 있다', () => {
    expect(body).toContain('no text');
    expect(body).toContain('illegible brush strokes');
  });

  it('@인물 태그 형식을 지시한다', () => {
    expect(body).toContain('@인물');
    expect(body).toContain('@이름 형식으로 태그한다');
  });

  // 서브에이전트 실행에서 안내문의 골뱅이가 장면 태그로 오인돼 보강한 규칙
  it('장면 블록과 안내문의 경계를 분리한다', () => {
    expect(body).toContain('=== 장면 끝 ===');
    expect(body).toMatch(/안내에서는 앞에 골뱅이를 붙이지 않는다|골뱅이 표기가 장면 프롬프트와 섞이면/);
  });

  it('출력 전 자기 검증 항목이 5개 있다', () => {
    expect(body).toContain('출력 전 자기 검증');
    const section = body.slice(body.indexOf('출력 전 자기 검증'));
    const items = section.match(/^\d\.\s/gm) ?? [];
    expect(items.length).toBeGreaterThanOrEqual(5);
  });

  it('등급 개수를 세어 확인하라고 지시한다', () => {
    expect(body).toMatch(/H 여덟 개, M 열여섯 개, L 열여섯 개/);
    expect(body).toContain('세어보지 않고 적지 않는다');
  });
});

describe('인트로 프롬프트 검증', () => {
  const body = findPromptAsset('intro-main')!.body;

  it('4컷 구성표가 있다', () => {
    for (const s of ['Scene 1', 'Scene 2', 'Scene 3', 'Scene 4']) {
      expect(body).toContain(s);
    }
  });

  it('입력 재료 3개를 요구한다', () => {
    expect(body).toContain('인물 고정 프롬프트');
    expect(body).toContain('썸네일 브리프');
    expect(body).toContain('인트로 대본');
  });

  it('Grok 움직임 절제 지시가 있다', () => {
    expect(body).toContain('Subtle motion only');
    expect(body).toContain('Camera holds still');
    expect(body).toContain('손동작이나 걷기를 지시하지 않는다');
  });

  it('Grok과 직접 대화하지 말라고 지시한다', () => {
    expect(body).toContain('Grok에서 고치라고 안내하지 않는다');
  });

  it('Vrew 음성 중복 문제를 경고한다', () => {
    expect(body).toContain('목소리가 두 겹으로');
  });

  it('6초 대사 길이 기준을 준다', () => {
    expect(body).toMatch(/스물다섯 자에서 서른 자/);
  });

  // 서브에이전트가 "대사 고치지 말라"와 "6초 제한"의 충돌을 지적해 보강한 규칙
  it('대사가 6초를 넘을 때의 처리 순서가 있다', () => {
    expect(body).toContain('대사 길이 처리');
    expect(body).toMatch(/Scene 1과 Scene 2에 나눠 배치/);
  });

  it('지시 충돌 시 우선순위를 정해뒀다', () => {
    expect(body).toContain('판단이 어긋날 때의 우선순위');
    expect(body).toMatch(/사용자의 실시간 수정 요청/);
  });

  it('얼굴을 감추는 컷에서도 태그를 붙이라고 지시한다', () => {
    expect(body).toMatch(/얼굴을 감추는 컷/);
    expect(body).toMatch(/@태그는 그대로 붙인다/);
  });
});

describe('썸네일 프롬프트 검증', () => {
  const body = findPromptAsset('thumbnail-main')!.body;

  it('카피 후보 8개를 요구한다', () => {
    expect(body).toContain('카피 후보 여덟 개');
  });

  it('카피 길이 제한이 있다', () => {
    expect(body).toMatch(/열여덟\s*(자|글자)\s*이내/);
  });

  it('길이를 공백 제외로 세도록 명시했다', () => {
    expect(body).toMatch(/공백을?\s*제외/);
  });

  it('출력 전 자기 검증 단계가 있다', () => {
    expect(body).toContain('출력 전 자기 검증');
    expect(body).toMatch(/세어|글자수를 센다/);
  });

  it('미리캔버스 수치가 구체적이다', () => {
    expect(body).toContain('1280 x 720');
    expect(body).toContain('외곽선: 검정, 두께 50');
    expect(body).toContain('JPG');
    expect(body).toContain('채도 슬라이더');
  });

  it('네거티브 스페이스 지시가 있다', () => {
    expect(body).toContain('negative space for text overlay');
  });

  it('인트로와의 정합성 점검을 요구한다', () => {
    expect(body).toContain('정합성 점검');
    expect(body).toContain('인트로 첫 대사');
  });

  it('물음표 등 금지 기호 규칙이 있다', () => {
    expect(body).toMatch(/물음표[^\n]*쓰지 않는다/);
  });
});

describe('Vrew 자산 검증', () => {
  const agent = findPromptAsset('vrew-agent')!.body;
  const notes = findPromptAsset('vrew-notes')!.body;

  it('배치 명령에 일대일 매핑 규칙이 있다', () => {
    expect(agent).toContain('일대일로 맞춰');
  });

  it('배치 명령이 자막·음악 추가를 금지한다', () => {
    expect(agent).toContain('자막을 추가하지 마세요');
    expect(agent).toContain('배경 음악을 추가하지 마세요');
  });

  it('인트로 구간을 건드리지 말라고 지시한다', () => {
    expect(agent).toContain('인트로 구간에는 이미지를 넣지 마세요');
  });

  it('주의점 문서에 1만자 제한이 있다', () => {
    expect(notes).toContain('만 자');
    expect(notes).toContain('다섯 번 나눠');
  });

  it('주의점 문서에 문제/원인/해결 구조가 있다', () => {
    const problems = notes.match(/^문제: /gm) ?? [];
    expect(problems.length).toBeGreaterThanOrEqual(4);
    const causes = notes.match(/^원인: /gm) ?? [];
    const fixes = notes.match(/^해결: /gm) ?? [];
    expect(causes.length).toBe(problems.length);
    expect(fixes.length).toBe(problems.length);
  });
});

describe('전체 일관성 — 단계 간 재료 연결', () => {
  it('대본이 만든 썸네일 브리프를 인트로와 썸네일이 모두 받는다', () => {
    expect(findPromptAsset('script-main')!.body).toContain('[썸네일 브리프]');
    expect(findPromptAsset('intro-main')!.body).toContain('썸네일 브리프');
    expect(findPromptAsset('thumbnail-main')!.body).toContain('썸네일 브리프');
  });

  it('이미지가 만든 인물 프롬프트를 인트로와 썸네일이 모두 받는다', () => {
    expect(findPromptAsset('image-main')!.body).toContain('[CHARACTER 1]');
    expect(findPromptAsset('intro-main')!.body).toContain('인물 고정 프롬프트');
    expect(findPromptAsset('thumbnail-main')!.body).toContain('인물 고정 프롬프트');
  });

  it('어떤 프롬프트도 TTS 금지 표기를 본문 규칙에서 허용하지 않는다', () => {
    // 대본 프롬프트는 한자·영문·괄호를 금지해야 한다
    const script = findPromptAsset('script-main')!.body;
    expect(script).toContain('다음 표기를 절대 쓰지 않는다');
  });
});
