import { useMemo, useState } from 'react';
import { scoreIntro, type CheckState } from '../lib/introScore';
import { rankNiches, type PolicyFit } from '../data/niches';
import { useStore } from '../state/store';
import { TextArea } from './ui';

const STATE_LABEL: Record<CheckState, string> = {
  pass: '통과',
  fail: '실패',
  unsure: '판정보류',
};

/**
 * 인트로 채점.
 * 강의가 "감각"으로 남긴 판단을 검사 가능한 규칙으로 옮겼다.
 */
export function IntroScorer() {
  const { state, setField } = useStore();
  const [draft, setDraft] = useState('');

  // 보관함에 저장된 인트로가 있으면 그것을 기본값으로 쓴다
  const text = draft.trim() ? draft : state.introLine;
  const result = useMemo(() => scoreIntro(text), [text]);

  return (
    <section className="widget" aria-labelledby="intro-score-title">
      <h3 className="widget__title" id="intro-score-title">
        인트로 채점 — {result.score}점
      </h3>
      <p className="widget__desc">
        강의는 인트로가 성패를 가른다고 하면서 판단은 "감각"으로 남깁니다. 그 감각의 상당 부분은
        검사 가능한 규칙입니다. <strong>점수가 조회수를 보장하지는 않습니다.</strong> 규칙 위반을
        잡아내는 것이 목적입니다.
      </p>

      <TextArea
        label="채점할 인트로 (비우면 보관함의 것을 씁니다)"
        value={draft}
        onChange={setDraft}
        placeholder={state.introLine || '큰마님: 친정에는 저 재를 한 짐 지고 가거라.\n시집온 지 세 해...'}
        rows={5}
      />

      <div className="stat-row">
        <div className="stat">
          <span
            className={`stat__value${result.score < 60 ? ' is-off' : ''}`}
          >
            {result.score}
          </span>
          <span className="stat__label">점수 (100점 만점)</span>
        </div>
        <div className="stat">
          <span className="stat__value">
            {result.passed}·{result.failed}·{result.unsure}
          </span>
          <span className="stat__label">통과 · 실패 · 보류</span>
        </div>
        <div className="stat">
          <span className="stat__value">{result.charCount}</span>
          <span className="stat__label">글자수</span>
        </div>
        <div className="stat">
          <span className={`stat__value${result.runtimeSeconds > 45 ? ' is-off' : ''}`}>
            {result.runtimeDisplay}
          </span>
          <span className="stat__label">낭독 추정 (목표 30초)</span>
        </div>
      </div>

      <p
        className={`alert ${
          result.failed > 0 ? 'alert--warn' : result.score >= 75 ? 'alert--ok' : 'alert--info'
        }`}
      >
        {result.verdict}
      </p>

      <ul className="check-score-list">
        {result.checks.map((c) => (
          <li className={`cs cs--${c.state}`} key={c.id}>
            <div className="cs__head">
              <span
                className={`badge badge--${
                  c.state === 'pass' ? 'ok' : c.state === 'fail' ? 'warn' : ''
                }`}
              >
                {STATE_LABEL[c.state]}
              </span>
              <span className="cs__label">{c.label}</span>
              <span className="cs__weight">{c.weight}점</span>
            </div>
            <p className="cs__reason">{c.reason}</p>
            {c.state !== 'pass' && c.fix && (
              <p className="cs__fix">
                <span aria-hidden="true">→</span> {c.fix}
              </p>
            )}
          </li>
        ))}
      </ul>

      {draft.trim() && (
        <div className="widget__footer">
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              setField('introLine', draft.trim());
              setDraft('');
            }}
          >
            이 인트로를 보관함에 확정 저장
          </button>
        </div>
      )}

      <p className="alert alert--info">
        마지막 판단은 기계가 못 합니다. <strong>소리 내어 읽어 보세요.</strong> 읽고 나서 "왜?"가
        떠오르지 않으면 점수가 높아도 실패입니다.
      </p>
    </section>
  );
}

const FIT_LABEL: Record<PolicyFit, string> = {
  safe: '안전',
  caution: '주의',
  blocked: '수익화 불가',
};

/**
 * 니치 진단.
 *
 * 이 앱은 지금까지 "민담을 만든다"를 전제로 했다. 그 전제를 의심하는 도구다.
 * 강의 진행자 본인이 만 명 넘게 가르쳤다고 밝혔으므로, 포화도를 따져봐야 한다.
 */
export function NicheAdvisor() {
  const ranked = useMemo(() => rankNiches(), []);
  const [openId, setOpenId] = useState<string | null>('mindam');

  return (
    <section className="widget" aria-labelledby="niche-title">
      <h3 className="widget__title" id="niche-title">
        니치 진단 — 민담이 최선인가
      </h3>
      <p className="widget__desc">
        이 앱은 민담을 전제로 만들었지만, 그 전제를 의심할 필요가 있습니다. 강의 진행자 본인이{' '}
        <strong>"만 명 넘게 배웠다"</strong>고 밝혔습니다. 같은 프롬프트로 같은 구조를 만 명이 만들고
        있다면, 그 자체가 정책이 말하는 반복 콘텐츠에 가까워지는 조건입니다.
      </p>
      <p className="widget__desc">
        방법론(한국어 롱폼 + AI 보조 + 정지 이미지)은 다른 니치에도 씁니다. 아래는 정책 위험, 포화도,
        광고 단가를 종합한 비교입니다.
      </p>

      <ul className="niche-list">
        {ranked.map(({ niche: n, score, recommendation, summary }) => {
          const open = openId === n.id;
          return (
            <li className={`niche niche--${recommendation === '권장' ? 'good' : recommendation === '조건부' ? 'mid' : 'bad'}`} key={n.id}>
              <button
                type="button"
                className="niche__head"
                onClick={() => setOpenId(open ? null : n.id)}
                aria-expanded={open}
              >
                <span className="niche__score">{score}</span>
                <span className="niche__name">{n.name}</span>
                <span
                  className={`badge badge--${
                    recommendation === '권장' ? 'ok' : recommendation === '비권장' ? 'warn' : ''
                  }`}
                >
                  {recommendation}
                </span>
                <span className={`badge badge--${n.policyFit === 'blocked' ? 'warn' : ''}`}>
                  정책 {FIT_LABEL[n.policyFit]}
                </span>
                <span className="badge">포화 {n.saturation}</span>
                <span className="badge">단가 {n.rpmTier}</span>
                <span className="niche__toggle" aria-hidden="true">
                  {open ? '−' : '+'}
                </span>
              </button>

              <p className="niche__summary">{summary}</p>

              {open && (
                <div className="niche__detail">
                  <p className="niche__desc">{n.description}</p>

                  <dl className="niche__facts">
                    <dt>방법론 재사용</dt>
                    <dd>{n.methodReuse}</dd>
                    <dt>정책 판단</dt>
                    <dd>{n.policyReason}</dd>
                    <dt>포화도</dt>
                    <dd>{n.saturationReason}</dd>
                    <dt>광고 단가</dt>
                    <dd>{n.rpmReason}</dd>
                    <dt>주 시청층</dt>
                    <dd>{n.audience}</dd>
                  </dl>

                  <p className="niche__caveat-title">유의할 점</p>
                  <ul className="niche__caveats">
                    {n.caveats.map((c, i) => (
                      <li key={`${n.id}-c${i}`}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="alert alert--info">
        점수는 정책 안전성(40점) · 낮은 포화도(35점) · 광고 단가(25점)를 합한 것입니다. 제 판단이
        섞인 지표이며 절대적 기준이 아닙니다. 포화도는 공식 통계가 없어 정성적으로 매겼습니다.
      </p>

      <p className="alert alert--warn">
        민담을 고르더라도 이 진단을 읽어두세요. <strong>포화된 니치에 진입한다는 사실</strong>을 알고
        시작하는 것과 모르고 시작하는 것은 다릅니다. 차별점이 없으면 묻힙니다.
      </p>
    </section>
  );
}
