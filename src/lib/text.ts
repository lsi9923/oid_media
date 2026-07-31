import type { SceneIntensity } from '../types';

/**
 * 대본을 Vrew 입력 한도(기본 1만자)에 맞춰 나눈다.
 * 문장 중간에서 끊기면 TTS 억양이 어긋나므로 문장 경계를 우선한다.
 */
export function chunkScript(text: string, limit: number): string[] {
  const source = text.trim();
  if (!source) return [];
  if (limit <= 0) return [source];
  if (source.length <= limit) return [source];

  // 문장 종결부(. ! ? 。 줄바꿈) 뒤에서 자른다.
  const sentences = source.split(/(?<=[.!?。…]|\n)\s*/g).filter((s) => s.length > 0);

  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    // 한 문장이 한도보다 길면 어쩔 수 없이 강제 분할한다.
    if (sentence.length > limit) {
      if (current) {
        chunks.push(current);
        current = '';
      }
      for (let i = 0; i < sentence.length; i += limit) {
        chunks.push(sentence.slice(i, i + limit));
      }
      continue;
    }

    if (current.length + sentence.length > limit) {
      chunks.push(current);
      current = sentence;
    } else {
      current += sentence;
    }
  }

  if (current) chunks.push(current);
  return chunks.map((c) => c.trim()).filter((c) => c.length > 0);
}

/**
 * Claude가 출력한 40장면 프롬프트 덩어리에서 개별 장면을 뽑아낸다.
 * 강의 산출물은 형식이 조금씩 달라지므로, 번호 표기 여러 형태를 허용한다.
 */
export function parseScenePrompts(raw: string): { prompt: string; intensity: SceneIntensity }[] {
  const text = raw.trim();
  if (!text) return [];

  // "1." "01)" "[1]" "Scene 1" "장면 1" 등 앞머리 번호로 분리
  const marker = /(?:^|\n)\s*(?:\[?\s*(?:scene|씬|장면)?\s*0*(\d{1,3})\s*[\].):\-]|\((\d{1,3})\))/gi;

  const positions: { index: number; start: number }[] = [];
  for (const match of text.matchAll(marker)) {
    const num = Number.parseInt(match[1] ?? match[2] ?? '', 10);
    if (!Number.isFinite(num)) continue;
    positions.push({ index: num, start: match.index ?? 0 });
  }

  // 번호 표기를 못 찾으면 빈 줄 기준으로 나눈다.
  if (positions.length < 2) {
    return text
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((prompt) => ({ prompt, intensity: detectIntensity(prompt) }));
  }

  const result: { prompt: string; intensity: SceneIntensity }[] = [];
  for (let i = 0; i < positions.length; i += 1) {
    const start = positions[i]!.start;
    const end = i + 1 < positions.length ? positions[i + 1]!.start : text.length;
    const prompt = text.slice(start, end).trim();
    if (prompt) result.push({ prompt, intensity: detectIntensity(prompt) });
  }
  return result;
}

/**
 * 프롬프트 앞머리의 [H] / [M] / [L] 등급 표기만 읽는다.
 *
 * 주의: 본문에는 low angle, high saturation 같은 표현이 흔히 등장한다.
 * 앞부분을 넓게 훑으면 이런 단어를 등급으로 오인하므로,
 * 반드시 줄머리의 대괄호 표기만 본다. 표기가 없으면 M으로 둔다.
 */
function detectIntensity(prompt: string): SceneIntensity {
  // "12. [H] @인물" 또는 "[H]" 형태. 줄머리에서만 찾는다.
  const tag = /^\s*(?:\[?\s*(?:scene|씬|장면)?\s*\d{1,3}\s*[\].):\-]\s*)?\[\s*([HML])\s*\]/i.exec(
    prompt,
  );
  if (tag) {
    const letter = tag[1]?.toUpperCase();
    if (letter === 'H' || letter === 'M' || letter === 'L') return letter;
  }

  // 대괄호 없이 "1. H - ..." 형태로 오는 경우도 허용한다.
  const bare = /^\s*(?:\d{1,3}\s*[.)]\s*)?(HIGH|MED(?:IUM)?|LOW|[HML])\s*[-—:|]/i.exec(prompt);
  if (bare) {
    const word = bare[1]?.toUpperCase() ?? '';
    if (word.startsWith('H')) return 'H';
    if (word.startsWith('L')) return 'L';
    if (word.startsWith('M')) return 'M';
  }

  return 'M';
}

/**
 * 프롬프트에 @인물 태그가 있는지 확인한다.
 *
 * 안내문에 섞이는 "@태그가", "@인물" 같은 일반 명사는 태그로 보지 않는다.
 * Flow 캐릭터 이름은 인물 고유명사이므로 이런 일반어를 제외한다.
 */
const TAG_STOPWORDS = new Set([
  '태그',
  '태그가',
  '태그를',
  '태그는',
  '인물',
  '인물이',
  '인물을',
  '이름',
  '캐릭터',
  'tag',
  'character',
  'name',
]);

export function hasCharacterTag(prompt: string): boolean {
  return extractCharacterTags(prompt).length > 0;
}

/** 프롬프트에서 실제 인물 태그만 뽑는다. */
export function extractCharacterTags(prompt: string): string[] {
  const raw = prompt.match(/@([\w가-힣]+)/g) ?? [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const token of raw) {
    const name = token.slice(1);
    if (TAG_STOPWORDS.has(name.toLowerCase())) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    result.push(name);
  }
  return result;
}

export function countChars(text: string): number {
  return Array.from(text.trim()).length;
}

export function formatKrw(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`;
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0초';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours) parts.push(`${hours}시간`);
  if (minutes) parts.push(`${minutes}분`);
  if (seconds && !hours) parts.push(`${seconds}초`);
  return parts.join(' ');
}

/** 브라우저 crypto가 없는 환경도 고려한 id 생성 */
export function makeId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}
