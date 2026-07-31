import { useCallback, useMemo, useState } from 'react';
import {
  diversityReport,
  ENDING_TYPES,
  episodesOfChannel,
  findOverlaps,
  HELPER_TYPES,
  OPENING_VARIANTS,
  PROTAGONIST_PRESETS,
  suggestNext,
  type EndingType,
  type EpisodeRecord,
  type HelperType,
  type OpeningVariant,
} from '../lib/episodeHistory';
import { makeId } from '../lib/text';
import { useStore } from '../state/store';
import { Field } from './ui';

const CATEGORIES = [
  '권선징악-귀신',
  '권선징악-추리',
  '권선징악-혼인',
  '권선징악-은혜',
];

/**
 * 템플릿 반복 방지 이력.
 *
 * 정책의 최대 리스크는 "여러 영상에 매우 비슷한 줄거리 템플릿"이다.
 * 무엇을 이미 썼는지 기록해두고, 다음 영상 계획이 겹치는지 즉시 판정한다.
 */
export function EpisodeHistory() {
  const { state, setEpisodes } = useStore();
  const { episodes } = state;

  const channels = useMemo(() => {
    const set = new Set(episodes.map((e) => e.channel).filter(Boolean));
    for (const c of state.channels) if (c.name) set.add(c.name);
    return [...set];
  }, [episodes, state.channels]);

  const [channel, setChannel] = useState(channels[0] ?? '');
  const [draft, setDraft] = useState<{
    title: string;
    category: string;
    motifs: string;
    opening: OpeningVariant;
    ending: EndingType;
    helper: HelperType;
    protagonist: string;
    twistCount: string;
  }>({
    title: '',
    category: CATEGORIES[0]!,
    motifs: '',
    opening: OPENING_VARIANTS[0]!,
    ending: ENDING_TYPES[0]!,
    helper: HELPER_TYPES[0]!,
    protagonist: PROTAGONIST_PRESETS[0]!,
    twistCount: '6',
  });

  const motifList = useMemo(
    () =>
      draft.motifs
        .split(/[,\s]+/)
        .map((m) => m.trim().toUpperCase())
        .filter((m) => m.length > 0),
    [draft.motifs],
  );

  const overlaps = useMemo(
    () =>
      channel
        ? findOverlaps(episodes, {
            channel,
            category: draft.category,
            motifs: motifList,
            opening: draft.opening,
            ending: draft.ending,
            helper: draft.helper,
            protagonist: draft.protagonist,
          })
        : [],
    [episodes, channel, draft, motifList],
  );

  const diversity = useMemo(
    () => (channel ? diversityReport(episodes, channel) : null),
    [episodes, channel],
  );

  const history = useMemo(
    () => (channel ? episodesOfChannel(episodes, channel) : []),
    [episodes, channel],
  );

  const applySuggestion = useCallback(() => {
    if (!channel) return;
    const s = suggestNext(episodes, channel);
    setDraft((d) => ({ ...d, ...s }));
  }, [episodes, channel]);

  const save = useCallback(() => {
    if (!channel) return;
    const rec: EpisodeRecord = {
      id: makeId('ep'),
      title: draft.title.trim() || `${history.length + 1}편`,
      channel,
      category: draft.category,
      motifs: motifList,
      opening: draft.opening,
      ending: draft.ending,
      helper: draft.helper,
      protagonist: draft.protagonist,
      twistCount: Number.parseInt(draft.twistCount, 10) || 6,
      createdAt: new Date().toISOString(),
    };
    setEpisodes([...episodes, rec]);
    setDraft((d) => ({ ...d, title: '', motifs: '' }));
  }, [channel, draft, motifList, episodes, history.length, setEpisodes]);

  const remove = useCallback(
    (id: string) => setEpisodes(episodes.filter((e) => e.id !== id)),
    [episodes, setEpisodes],
  );

  const errorCount = overlaps.filter((o) => o.severity === 'error').length;

  return (
    <section className="widget" aria-labelledby="hist-title">
      <h3 className="widget__title" id="hist-title">
        템플릿 반복 방지 이력 — {history.length}편 기록
      </h3>
      <p className="widget__desc">
        정책의 최대 리스크는 여러 영상에 비슷한 줄거리 템플릿을 쓰는 것입니다. 영상을 만들 때마다 어떤 구조를
        썼는지 기록해두면, 다음 영상이 겹치는지 바로 알 수 있습니다.
      </p>

      {channels.length === 0 ? (
        <p className="empty">
          먼저 <strong>다채널로 확장</strong> 단계에서 채널을 등록하거나, 아래에 채널명을 직접 입력하세요.
        </p>
      ) : null}

      <Field
        label="채널"
        value={channel}
        onChange={setChannel}
        placeholder="예: 하루 야담"
        hint={channels.length > 0 ? `등록된 채널: ${channels.join(', ')}` : undefined}
      />

      {diversity && diversity.score !== null && (
        <div className="stat-row">
          <div className="stat">
            <span className={`stat__value${diversity.score < 50 ? ' is-off' : ''}`}>
              {diversity.score}
            </span>
            <span className="stat__label">다양성 점수 (100점 만점)</span>
          </div>
          <div className="stat">
            <span className="stat__value">{diversity.motifReuse}</span>
            <span className="stat__label">모티프 재사용</span>
          </div>
          {diversity.weakest && (
            <div className="stat">
              <span className="stat__value">{diversity.weakest}</span>
              <span className="stat__label">가장 쏠린 축</span>
            </div>
          )}
        </div>
      )}

      {diversity && diversity.score !== null && diversity.score < 50 && (
        <p className="alert alert--warn">
          다양성 점수가 낮습니다. 지금 구조로 계속 올리면 정책이 금지한 "매우 비슷한 줄거리 템플릿"에
          가까워집니다. 특히 <strong>{diversity.weakest}</strong>을 바꿔 보세요.
        </p>
      )}

      <h4 className="sub-title">다음 영상 계획</h4>

      <div className="widget__footer" style={{ marginTop: 0, marginBottom: '0.8rem' }}>
        <button type="button" className="primary-btn" onClick={applySuggestion} disabled={!channel}>
          겹치지 않는 조합 추천받기
        </button>
      </div>

      <div className="draft-grid">
        <Field
          label="제목 또는 메모"
          value={draft.title}
          onChange={(v) => setDraft((d) => ({ ...d, title: v }))}
          placeholder="비워두면 순번으로 기록됩니다"
        />
        <Select
          label="갈래"
          value={draft.category}
          options={CATEGORIES}
          onChange={(v) => setDraft((d) => ({ ...d, category: v }))}
        />
        <Select
          label="시작점"
          value={draft.opening}
          options={OPENING_VARIANTS}
          onChange={(v) => setDraft((d) => ({ ...d, opening: v as OpeningVariant }))}
        />
        <Select
          label="결말 유형"
          value={draft.ending}
          options={ENDING_TYPES}
          onChange={(v) => setDraft((d) => ({ ...d, ending: v as EndingType }))}
        />
        <Select
          label="조력자"
          value={draft.helper}
          options={HELPER_TYPES}
          onChange={(v) => setDraft((d) => ({ ...d, helper: v as HelperType }))}
        />
        <Select
          label="주인공 신분"
          value={draft.protagonist}
          options={PROTAGONIST_PRESETS}
          onChange={(v) => setDraft((d) => ({ ...d, protagonist: v }))}
        />
        <Field
          label="반전 개수"
          type="number"
          value={draft.twistCount}
          onChange={(v) => setDraft((d) => ({ ...d, twistCount: v }))}
        />
        <Field
          label="사용 모티프"
          value={draft.motifs}
          onChange={(v) => setDraft((d) => ({ ...d, motifs: v }))}
          placeholder="C-01 A-05"
          hint="쉼표나 공백으로 구분"
        />
      </div>

      {overlaps.length > 0 ? (
        <ul className="overlap-list">
          {overlaps.map((o, i) => (
            <li className={`overlap overlap--${o.severity}`} key={`${o.field}-${o.value}-${i}`}>
              <span className={`badge badge--${o.severity === 'error' ? 'warn' : ''}`}>
                {o.severity === 'error' ? '겹침' : '주의'}
              </span>
              {o.message}
            </li>
          ))}
        </ul>
      ) : (
        channel && (
          <p className="alert alert--ok">
            앞 영상들과 겹치는 요소가 없습니다. 이 조합으로 진행하세요.
          </p>
        )
      )}

      <div className="widget__footer">
        <button type="button" className="primary-btn" onClick={save} disabled={!channel}>
          {errorCount > 0 ? '겹침을 무릅쓰고 기록' : '이 구조로 기록'}
        </button>
      </div>

      {history.length > 0 && (
        <>
          <h4 className="sub-title">기록 (최신순)</h4>
          <ul className="ep-list">
            {history.map((e) => (
              <li className="ep" key={e.id}>
                <div className="ep__main">
                  <span className="ep__title">{e.title}</span>
                  <span className="ep__meta">
                    {e.category} · {e.opening} · {e.ending} · {e.helper} · {e.protagonist} · 반전{' '}
                    {e.twistCount}
                  </span>
                  {e.motifs.length > 0 && <span className="ep__motifs">{e.motifs.join(' ')}</span>}
                </div>
                <button
                  type="button"
                  className="ghost-btn ghost-btn--danger"
                  onClick={() => remove(e.id)}
                  aria-label={`${e.title} 기록 삭제`}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  const id = `sel-${label.replace(/\s+/g, '-')}`;
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="field__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
