import { useState, type ReactNode } from 'react';

/**
 * 참고 정보 묶음.
 *
 * 이전에는 위젯마다 alert를 3~4개씩 세로로 쌓아 화면을 잡아먹었다.
 * 중요한 것 하나만 펼쳐 두고 나머지는 접는다.
 * 정보를 없애지 않으면서 화면을 정리하는 것이 목적이다.
 */

export type NoteTone = 'info' | 'warn' | 'ok';

export interface NoteItem {
  tone: NoteTone;
  /** 접힌 상태에서 보이는 한 줄 */
  title: string;
  /** 펼쳤을 때 보이는 본문 */
  body?: ReactNode;
}

const TONE_MARK: Record<NoteTone, string> = {
  info: 'ℹ',
  warn: '⚠',
  ok: '✓',
};

/**
 * 단일 알림. 짧으면 그대로, 길면 접는다.
 */
export function Note({
  tone = 'info',
  children,
  strong = false,
}: {
  tone?: NoteTone;
  children: ReactNode;
  /** 반드시 보여야 하는 것이면 true */
  strong?: boolean;
}) {
  return (
    <p className={`note note--${tone}${strong ? ' note--strong' : ''}`}>
      <span className="note__mark" aria-hidden="true">
        {TONE_MARK[tone]}
      </span>
      <span className="note__body">{children}</span>
    </p>
  );
}

/**
 * 여러 참고 사항을 하나로 접는다.
 * 기본은 접힌 상태이고, 개수를 요약해 보여준다.
 */
export function NoteGroup({
  items,
  label = '참고',
  defaultOpen = false,
}: {
  items: NoteItem[];
  label?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (items.length === 0) return null;

  const warnCount = items.filter((i) => i.tone === 'warn').length;

  return (
    <div className={`ngroup${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="ngroup__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="ngroup__chev" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
        {label} {items.length}건
        {warnCount > 0 && <span className="ngroup__warn">주의 {warnCount}</span>}
      </button>

      {open && (
        <ul className="ngroup__list">
          {items.map((n, i) => (
            <li className={`ngroup__item ngroup__item--${n.tone}`} key={`${label}-${i}`}>
              <span className="ngroup__mark" aria-hidden="true">
                {TONE_MARK[n.tone]}
              </span>
              <span>
                <strong className="ngroup__title">{n.title}</strong>
                {n.body && <span className="ngroup__text">{n.body}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * 위젯 공통 껍데기.
 * 제목·설명·본문 구조를 통일하고, 여러 위젯이 쌓일 때 접을 수 있게 한다.
 */
export function Panel({
  id,
  title,
  desc,
  children,
  /** 접을 수 있게 할지. 한 단계에 위젯이 여럿이면 true */
  collapsible = false,
  defaultOpen = true,
  /** 제목 옆에 표시할 요약 (예: 3/8) */
  badge,
}: {
  id: string;
  title: string;
  desc?: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const titleId = `${id}-title`;
  const isOpen = collapsible ? open : true;

  return (
    <section className={`panel-box${isOpen ? '' : ' is-closed'}`} aria-labelledby={titleId}>
      {collapsible ? (
        <button
          type="button"
          className="panel-box__head panel-box__head--btn"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <h3 className="panel-box__title" id={titleId}>
            {title}
          </h3>
          {badge && <span className="panel-box__badge">{badge}</span>}
          <span className="panel-box__chev" aria-hidden="true">
            {open ? '−' : '+'}
          </span>
        </button>
      ) : (
        <div className="panel-box__head">
          <h3 className="panel-box__title" id={titleId}>
            {title}
          </h3>
          {badge && <span className="panel-box__badge">{badge}</span>}
        </div>
      )}

      {isOpen && (
        <div className="panel-box__body">
          {desc && <p className="panel-box__desc">{desc}</p>}
          {children}
        </div>
      )}
    </section>
  );
}
