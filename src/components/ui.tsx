import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 클립보드 복사 버튼. 복사 결과를 스크린리더에도 알린다.
 * navigator.clipboard가 없는 환경(비 HTTPS 등)에서는 textarea 폴백을 쓴다.
 */
export function CopyButton({
  text,
  label = '복사',
  disabled = false,
}: {
  text: string;
  label?: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(async () => {
    if (!text) return;
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch {
      ok = false;
    }

    if (!ok) {
      // 폴백: 임시 textarea를 통해 복사
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }

    if (ok) {
      setCopied(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    }
  }, [text]);

  return (
    <button
      type="button"
      className={`copy-btn${copied ? ' is-copied' : ''}`}
      onClick={copy}
      disabled={disabled || !text}
    >
      <span aria-hidden="true">{copied ? '✓' : '⧉'}</span>
      {copied ? '복사됨' : label}
    </button>
  );
}

/** 프롬프트/명령어 표시 + 복사 */
export function PromptBox({ label, text }: { label: string; text: string }) {
  return (
    <div className="prompt-box">
      <div className="prompt-box__head">
        <span className="prompt-box__label">{label}</span>
        <CopyButton text={text} />
      </div>
      <pre className="prompt-box__body">{text}</pre>
    </div>
  );
}

/** 접히는 섹션 */
export function Collapsible({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="collapsible" open={defaultOpen}>
      <summary className="collapsible__summary">{title}</summary>
      <div className="collapsible__body">{children}</div>
    </details>
  );
}

/** 라벨 붙은 텍스트 입력 */
export function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: 'text' | 'number';
}) {
  const id = `field-${label.replace(/\s+/g, '-')}`;
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="field__input"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="field__hint">{hint}</p>}
    </div>
  );
}

/** 라벨 붙은 여러 줄 입력 + 글자수 표시 */
export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
  showCount = false,
  targetCount,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  showCount?: boolean;
  targetCount?: number;
}) {
  const id = `ta-${label.replace(/\s+/g, '-')}`;
  const count = value.trim().length;
  return (
    <div className="field">
      <div className="field__row">
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
        {showCount && (
          <span className="field__count">
            {count.toLocaleString('ko-KR')}자
            {targetCount ? ` / 목표 ${targetCount.toLocaleString('ko-KR')}자` : ''}
          </span>
        )}
      </div>
      <textarea
        id={id}
        className="field__textarea"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
