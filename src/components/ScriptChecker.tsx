import { useCallback, useMemo, useState } from 'react';
import { autoFixScript, checkScript, type ScriptIssue } from '../lib/scriptCheck';
import { useStore } from '../state/store';
import { CopyButton, Field } from './ui';

const RULE_LABEL: Record<string, string> = {
  hanja: '한자',
  latin: '영문',
  emoji: '이모지',
  bracket: '괄호',
  symbol: '특수기호',
  ellipsis: '말줄임표',
  markdown: '강조 표기',
  digit: '숫자',
  longSentence: '긴 문장',
};

/**
 * 대본 TTS 검사기.
 * 프롬프트가 지시한 금지 표기를 Vrew에 넣기 전에 기계적으로 걸러낸다.
 */
export function ScriptChecker() {
  const { state, setField } = useStore();
  const [maxLen, setMaxLen] = useState('45');
  const [filter, setFilter] = useState<'all' | 'error' | 'warn'>('all');
  const [fixResult, setFixResult] = useState<string>('');

  const limit = Number.parseInt(maxLen, 10) || 45;
  const report = useMemo(() => checkScript(state.script, limit), [state.script, limit]);

  const shown = useMemo(() => {
    const list = filter === 'all' ? report.issues : report.issues.filter((i) => i.severity === filter);
    // 오류를 먼저, 그다음 줄 번호 순
    return list
      .slice()
      .sort((a, b) => {
        if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1;
        return a.line - b.line || a.column - b.column;
      })
      .slice(0, 200);
  }, [report.issues, filter]);

  const grouped = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of report.issues) m.set(i.rule, (m.get(i.rule) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [report.issues]);

  const applyAutoFix = useCallback(() => {
    const { fixed, changed } = autoFixScript(state.script);
    if (changed > 0) {
      setField('script', fixed);
      setFixResult(`${changed}곳을 고쳤습니다.`);
    } else {
      setFixResult('자동으로 고칠 수 있는 항목이 없습니다.');
    }
    window.setTimeout(() => setFixResult(''), 4000);
  }, [state.script, setField]);

  if (!state.script.trim()) {
    return (
      <section className="widget" aria-labelledby="checker-title">
        <h3 className="widget__title" id="checker-title">
          대본 TTS 검사
        </h3>
        <p className="empty">
          저장된 대본이 없습니다. <strong>영상 길이 선택 → 대본 생성</strong> 단계에서 대본을 붙여넣으면
          여기서 검사합니다.
        </p>
      </section>
    );
  }

  const dialoguePct = Math.round(report.dialogueRatio * 100);
  const dialogueOk = dialoguePct >= 30 && dialoguePct <= 60;

  return (
    <section className="widget" aria-labelledby="checker-title">
      <h3 className="widget__title" id="checker-title">
        대본 TTS 검사 — 오류 {report.errorCount} · 경고 {report.warnCount}
      </h3>
      <p className="widget__desc">
        프롬프트가 금지한 표기가 대본에 남아 있는지 확인합니다. <strong>오류</strong>는 TTS가 그대로 읽거나
        깨지는 항목이고, <strong>경고</strong>는 억양이 어긋나는 항목입니다. Vrew에 넣기 전에 처리하세요.
      </p>

      <div className="stat-row">
        <div className="stat">
          <span className="stat__value">{report.totalChars.toLocaleString('ko-KR')}</span>
          <span className="stat__label">전체 글자수</span>
        </div>
        <div className="stat">
          <span className="stat__value">{report.sentenceCount.toLocaleString('ko-KR')}</span>
          <span className="stat__label">문장 수</span>
        </div>
        <div className="stat">
          <span className="stat__value">{report.longSentenceCount}</span>
          <span className="stat__label">{limit}자 초과 문장</span>
        </div>
        <div className="stat">
          <span className={`stat__value${dialogueOk ? '' : ' is-off'}`}>{dialoguePct}%</span>
          <span className="stat__label">대사 비율 (목표 30~60%)</span>
        </div>
      </div>

      {report.errorCount === 0 && report.warnCount === 0 && (
        <p className="alert alert--ok">
          금지 표기가 없습니다. Vrew에 넣어도 됩니다.
        </p>
      )}

      {grouped.length > 0 && (
        <div className="rule-summary">
          {grouped.map(([rule, count]) => (
            <span className="rule-chip" key={rule}>
              {RULE_LABEL[rule] ?? rule} <strong>{count}</strong>
            </span>
          ))}
        </div>
      )}

      <div className="widget__controls">
        <Field label="문장 길이 기준(자)" type="number" value={maxLen} onChange={setMaxLen} />
        <div className="field">
          <span className="field__label">표시</span>
          <div className="seg">
            {(['all', 'error', 'warn'] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`seg__btn${filter === f ? ' is-active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? '전체' : f === 'error' ? '오류' : '경고'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="widget__footer" style={{ marginTop: 0 }}>
        <button type="button" className="primary-btn" onClick={applyAutoFix}>
          자동 교정 (숫자 · 강조 · 말줄임표)
        </button>
        {fixResult && <span className="fix-result">{fixResult}</span>}
      </div>
      <p className="field__hint">
        한자와 영문은 문맥을 알아야 하므로 자동으로 고치지 않습니다. 직접 확인해 주세요.
      </p>

      {shown.length > 0 && (
        <>
          <ol className="issue-list">
            {shown.map((issue, idx) => (
              <IssueRow key={`${issue.rule}-${issue.line}-${issue.column}-${idx}`} issue={issue} />
            ))}
          </ol>
          {report.issues.length > shown.length && (
            <p className="field__hint">
              {report.issues.length.toLocaleString('ko-KR')}건 중 {shown.length}건만 표시했습니다. 고친 뒤
              다시 검사하세요.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function IssueRow({ issue }: { issue: ScriptIssue }) {
  return (
    <li className={`issue issue--${issue.severity}`}>
      <div className="issue__head">
        <span className={`badge badge--${issue.severity === 'error' ? 'warn' : ''}`}>
          {issue.severity === 'error' ? '오류' : '경고'}
        </span>
        <span className="issue__rule">{RULE_LABEL[issue.rule] ?? issue.rule}</span>
        <span className="issue__loc">
          {issue.line}행 {issue.column + 1}열
        </span>
        <code className="issue__text">{issue.text}</code>
      </div>
      <p className="issue__msg">{issue.message}</p>
      {issue.suggestion && (
        <p className="issue__sug">
          <span aria-hidden="true">→</span> 이렇게 바꾸세요: <strong>{issue.suggestion}</strong>
          <CopyButton text={issue.suggestion} label="복사" />
        </p>
      )}
      <p className="issue__ctx">{issue.context}</p>
    </li>
  );
}
