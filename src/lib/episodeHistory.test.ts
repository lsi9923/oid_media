import { describe, expect, it } from 'vitest';
import {
  diversityReport,
  episodesOfChannel,
  findOverlaps,
  suggestNext,
  type EndingType,
  type EpisodeRecord,
  type HelperType,
  type OpeningVariant,
} from './episodeHistory';

/** 테스트용 기록 생성기. createdAt은 순번으로 오름차순 */
function ep(
  n: number,
  over: Partial<EpisodeRecord> = {},
  channel = '하루야담',
): EpisodeRecord {
  return {
    id: `e${n}`,
    title: `${n}편`,
    channel,
    category: '권선징악-혼인',
    motifs: [`C-${String(n).padStart(2, '0')}`],
    opening: '순차',
    ending: '응보',
    helper: '초자연',
    protagonist: '며느리',
    twistCount: 6,
    // 번호가 클수록 최신
    createdAt: `2026-01-${String(n).padStart(2, '0')}T00:00:00.000Z`,
    ...over,
  };
}

describe('episodesOfChannel', () => {
  it('해당 채널만 최신순으로 반환한다', () => {
    const all = [ep(1), ep(2), ep(3, {}, '다른채널')];
    const r = episodesOfChannel(all, '하루야담');
    expect(r).toHaveLength(2);
    expect(r[0]?.id).toBe('e2'); // 최신이 앞
  });

  it('없는 채널은 빈 배열', () => {
    expect(episodesOfChannel([ep(1)], '없음')).toEqual([]);
  });
});

describe('findOverlaps — 결말 유형', () => {
  const draft = {
    channel: '하루야담',
    category: '권선징악-귀신',
    motifs: ['A-01'],
    opening: '위기시작' as OpeningVariant,
    ending: '응보' as EndingType,
    helper: '동물' as HelperType,
    protagonist: '나무꾼',
  };

  it('바로 앞 영상과 결말이 같으면 error를 낸다', () => {
    const o = findOverlaps([ep(1, { ending: '응보' })], draft);
    const e = o.find((x) => x.field === '결말 유형');
    expect(e?.severity).toBe('error');
    expect(e?.withinRecent).toBe(1);
    expect(e?.message).toContain('바로 앞 영상');
  });

  it('최근 3편 안에 있으면 잡는다', () => {
    const all = [
      ep(1, { ending: '응보' }),
      ep(2, { ending: '용서' }),
      ep(3, { ending: '대가' }),
    ];
    // 최신순: e3(대가), e2(용서), e1(응보) → 응보는 3번째
    const o = findOverlaps(all, draft);
    const e = o.find((x) => x.field === '결말 유형');
    expect(e?.withinRecent).toBe(3);
  });

  it('4편 전이면 잡지 않는다', () => {
    const all = [
      ep(1, { ending: '응보' }),
      ep(2, { ending: '용서' }),
      ep(3, { ending: '대가' }),
      ep(4, { ending: '폭로' }),
    ];
    const o = findOverlaps(all, draft);
    expect(o.find((x) => x.field === '결말 유형')).toBeUndefined();
  });
});

describe('findOverlaps — 모티프', () => {
  it('채널 전체에서 재사용을 금지한다', () => {
    const all = Array.from({ length: 10 }, (_, i) => ep(i + 1, { motifs: [`C-0${i}`] }));
    const draft = {
      channel: '하루야담',
      category: '권선징악-귀신',
      motifs: ['C-00'], // 10편 전에 쓴 것
      opening: '위기시작' as OpeningVariant,
      ending: '화해' as EndingType,
      helper: '동물' as HelperType,
      protagonist: '나무꾼',
    };
    const o = findOverlaps(all, draft);
    const m = o.find((x) => x.field === '모티프');
    expect(m?.severity).toBe('error');
    expect(m?.value).toBe('C-00');
  });

  it('여러 모티프 중 겹치는 것만 잡는다', () => {
    const all = [ep(1, { motifs: ['C-01', 'A-05'] })];
    const draft = {
      channel: '하루야담',
      category: '권선징악-귀신',
      motifs: ['C-01', 'B-09'],
      opening: '위기시작' as OpeningVariant,
      ending: '화해' as EndingType,
      helper: '동물' as HelperType,
      protagonist: '나무꾼',
    };
    const o = findOverlaps(all, draft).filter((x) => x.field === '모티프');
    expect(o).toHaveLength(1);
    expect(o[0]?.value).toBe('C-01');
  });

  it('빈 모티프는 무시한다', () => {
    const draft = {
      channel: '하루야담',
      category: '권선징악-귀신',
      motifs: ['', '  '],
      opening: '위기시작' as OpeningVariant,
      ending: '화해' as EndingType,
      helper: '동물' as HelperType,
      protagonist: '나무꾼',
    };
    expect(findOverlaps([ep(1, { motifs: [''] })], draft).filter((x) => x.field === '모티프')).toHaveLength(0);
  });
});

describe('findOverlaps — 다른 채널은 간섭하지 않는다', () => {
  it('다른 채널의 이력은 무시한다', () => {
    const all = [ep(1, { ending: '응보', motifs: ['C-01'] }, '다른채널')];
    const draft = {
      channel: '하루야담',
      category: '권선징악-혼인',
      motifs: ['C-01'],
      opening: '순차' as OpeningVariant,
      ending: '응보' as EndingType,
      helper: '초자연' as HelperType,
      protagonist: '며느리',
    };
    expect(findOverlaps(all, draft)).toHaveLength(0);
  });
});

describe('findOverlaps — 첫 영상', () => {
  it('이력이 없으면 겹침이 없다', () => {
    const draft = {
      channel: '새채널',
      category: '권선징악-귀신',
      motifs: ['A-01'],
      opening: '순차' as OpeningVariant,
      ending: '응보' as EndingType,
      helper: '초자연' as HelperType,
      protagonist: '며느리',
    };
    expect(findOverlaps([], draft)).toEqual([]);
  });
});

describe('findOverlaps — 모든 축이 겹치는 최악의 경우', () => {
  it('여러 경고를 동시에 낸다', () => {
    const prev = ep(1);
    const draft = {
      channel: prev.channel,
      category: prev.category,
      motifs: prev.motifs,
      opening: prev.opening,
      ending: prev.ending,
      helper: prev.helper,
      protagonist: prev.protagonist,
    };
    const o = findOverlaps([prev], draft);
    // 시작점, 결말, 조력자, 주인공, 갈래, 모티프 = 6건
    expect(o.length).toBe(6);
    expect(o.filter((x) => x.severity === 'error').length).toBeGreaterThanOrEqual(3);
  });
});

describe('diversityReport', () => {
  it('3편 미만이면 점수를 보류한다', () => {
    const r = diversityReport([ep(1), ep(2)], '하루야담');
    expect(r.episodeCount).toBe(2);
    expect(r.score).toBeNull();
    expect(r.weakest).toBeNull();
  });

  it('모두 같은 구조면 점수가 낮다', () => {
    const all = Array.from({ length: 6 }, (_, i) => ep(i + 1));
    const r = diversityReport(all, '하루야담');
    expect(r.score).not.toBeNull();
    expect(r.score!).toBeLessThan(40);
    expect(r.uniqueEndings).toBe(1);
    expect(r.weakest).not.toBeNull();
  });

  it('구조를 골고루 쓰면 점수가 높다', () => {
    const openings: OpeningVariant[] = ['순차', '위기시작', '결말선행', '폭로선행'];
    const endings: EndingType[] = ['응보', '용서', '대가', '폭로', '화해', '순환'];
    const helpers: HelperType[] = ['초자연', '동물', '사람', '없음', '뜻밖'];
    const prot = ['며느리', '나무꾼', '과객', '노비', '젖어미', '무당'];
    const cats = ['권선징악-귀신', '권선징악-추리', '권선징악-혼인', '권선징악-은혜'];

    const all = Array.from({ length: 6 }, (_, i) =>
      ep(i + 1, {
        opening: openings[i % openings.length]!,
        ending: endings[i % endings.length]!,
        helper: helpers[i % helpers.length]!,
        protagonist: prot[i % prot.length]!,
        category: cats[i % cats.length]!,
        motifs: [`M-${i}`],
      }),
    );
    const r = diversityReport(all, '하루야담');
    expect(r.score!).toBeGreaterThan(80);
    expect(r.motifReuse).toBe(0);
  });

  it('모티프 재사용을 감점한다', () => {
    const base = Array.from({ length: 6 }, (_, i) =>
      ep(i + 1, {
        opening: (['순차', '위기시작', '결말선행', '폭로선행'] as OpeningVariant[])[i % 4]!,
        ending: (['응보', '용서', '대가', '폭로', '화해', '순환'] as EndingType[])[i]!,
        helper: (['초자연', '동물', '사람', '없음', '뜻밖'] as HelperType[])[i % 5]!,
        protagonist: ['며느리', '나무꾼', '과객', '노비', '젖어미', '무당'][i]!,
        motifs: [`M-${i}`],
      }),
    );
    const clean = diversityReport(base, '하루야담').score!;

    // 같은 모티프를 반복한 판
    const dirty = base.map((e) => ({ ...e, motifs: ['C-01'] }));
    const dirtyScore = diversityReport(dirty, '하루야담').score!;

    expect(dirtyScore).toBeLessThan(clean);
  });

  it('점수는 0에서 100 사이다', () => {
    const all = Array.from({ length: 20 }, (_, i) => ep(i + 1, { motifs: ['C-01'] }));
    const r = diversityReport(all, '하루야담');
    expect(r.score!).toBeGreaterThanOrEqual(0);
    expect(r.score!).toBeLessThanOrEqual(100);
  });
});

describe('suggestNext', () => {
  it('이력이 없으면 첫 선택지를 준다', () => {
    const s = suggestNext([], '새채널');
    expect(s.opening).toBe('순차');
    expect(s.ending).toBe('응보');
  });

  it('한 번도 쓰지 않은 값을 우선 권한다', () => {
    const all = [ep(1, { ending: '응보' }), ep(2, { ending: '용서' })];
    const s = suggestNext(all, '하루야담');
    // 응보와 용서는 이미 썼으므로 다른 것을 권해야 한다
    expect(['대가', '폭로', '화해', '순환']).toContain(s.ending);
  });

  it('모두 써봤으면 가장 오래된 것을 권한다', () => {
    const endings: EndingType[] = ['응보', '용서', '대가', '폭로', '화해', '순환'];
    // e1이 가장 오래됐고 응보를 씀
    const all = endings.map((e, i) => ep(i + 1, { ending: e }));
    const s = suggestNext(all, '하루야담');
    expect(s.ending).toBe('응보');
  });

  it('권한 조합은 겹침 경고를 일으키지 않는다', () => {
    const all = [ep(1), ep(2, { ending: '용서', opening: '위기시작' })];
    const s = suggestNext(all, '하루야담');
    const o = findOverlaps(all, {
      channel: '하루야담',
      category: '권선징악-추리',
      motifs: ['NEW-01'],
      opening: s.opening,
      ending: s.ending,
      helper: s.helper,
      protagonist: s.protagonist,
    });
    // 권한 값들로는 error가 없어야 한다
    expect(o.filter((x) => x.severity === 'error')).toHaveLength(0);
  });
});
