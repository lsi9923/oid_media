import { useState } from 'react';
import {
  factsByCategory,
  OPS_CATEGORIES,
  OPS_FACTS,
  TAX_DISCLAIMER,
  type FactLevel,
  type OpsFact,
} from '../data/opsFacts';

const LEVEL_LABEL: Record<FactLevel, string> = {
  official: '공식',
  reported: '보도·발언',
  inferred: '추론',
};

/**
 * 운영 실무 — 세무·저작권·업로드·중간광고·비용.
 *
 * 강의는 제작 방법만 다룬다. 실제로 수익이 생긴 뒤 필요한 것은 다루지 않는다.
 * 조사에서 앱에 빠져 있던 영역으로 확인된 것들을 모았다.
 */
export function OpsFacts({ only }: { only?: OpsFact['category'] }) {
  const [tab, setTab] = useState<OpsFact['category']>(only ?? '세무');
  const facts = only ? factsByCategory(only) : factsByCategory(tab);

  const officialCount = OPS_FACTS.filter((f) => f.level === 'official').length;

  return (
    <section className="widget" aria-labelledby="ops-title">
      <h3 className="widget__title" id="ops-title">
        {only ? `운영 실무 — ${only}` : '운영 실무'}
      </h3>
      <p className="widget__desc">
        강의는 제작 방법만 다룹니다. 수익이 실제로 발생한 뒤에 필요한 것들입니다. 전체{' '}
        {OPS_FACTS.length}건 중 {officialCount}건은 공식 문서·법령에 근거합니다.
      </p>

      {!only && (
        <div className="seg" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
          {OPS_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`seg__btn${tab === c ? ' is-active' : ''}`}
              onClick={() => setTab(c)}
            >
              {c} {factsByCategory(c).length}
            </button>
          ))}
        </div>
      )}

      <ul className="ops-list">
        {facts.map((f) => (
          <li className={`ops ops--${f.level}`} key={f.id}>
            <div className="ops__head">
              <span className={`badge badge--${f.level === 'official' ? 'ok' : ''}`}>
                {LEVEL_LABEL[f.level]}
              </span>
              <span className="ops__title">{f.title}</span>
            </div>
            <p className="ops__body">{f.body}</p>

            {f.action && (
              <p className="ops__action">
                <span aria-hidden="true">→</span> <strong>할 일</strong> {f.action}
              </p>
            )}
            {f.risk && (
              <p className="ops__risk">
                <span aria-hidden="true">⚠</span> <strong>놓치면</strong> {f.risk}
              </p>
            )}
            {f.source && (
              <p className="ops__source">
                근거:{' '}
                {f.source.startsWith('http') ? (
                  <a href={f.source} target="_blank" rel="noreferrer noopener">
                    {f.source} ↗
                  </a>
                ) : (
                  f.source
                )}
              </p>
            )}
          </li>
        ))}
      </ul>

      {(only === '세무' || !only) && (
        <p className="alert alert--warn">{TAX_DISCLAIMER}</p>
      )}
    </section>
  );
}
