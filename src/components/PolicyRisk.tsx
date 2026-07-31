import { useMemo } from 'react';
import {
  ALGORITHM_FACTS,
  DISCREPANCIES,
  INAUTHENTIC_CATEGORIES,
  POLICY_SOURCE,
  REVENUE_FACTS,
  RISK_ITEMS,
  type RevenueFact,
  type RiskLevel,
} from '../data/policy';
import { useStore } from '../state/store';
import { SOURCE, timestampUrl } from '../data/tools';

const LEVEL_LABEL: Record<RiskLevel, string> = {
  high: '높음',
  medium: '중간',
  low: '낮음',
};

const CONFIDENCE_LABEL: Record<RevenueFact['confidence'], string> = {
  official: '공식',
  analysis: '상업 분석',
  estimate: '추정',
};

/**
 * 정책 리스크 점검표.
 * 공식 문서의 금지 문구를 그대로 보여주고, 이 제작 방식이 어디서 걸리는지 짚는다.
 * 완화 조치는 체크리스트로 관리한다.
 */
export function PolicyRisk() {
  const { state, toggleCheck, isChecked } = useStore();

  const stats = useMemo(() => {
    let done = 0;
    let total = 0;
    for (const risk of RISK_ITEMS) {
      for (let i = 0; i < risk.mitigation.length; i += 1) {
        total += 1;
        if (state.checks[`policy-${risk.id}::m${i}`]) done += 1;
      }
    }
    const high = RISK_ITEMS.filter((r) => r.level === 'high').length;
    return { done, total, high };
  }, [state.checks]);

  return (
    <section className="widget" aria-labelledby="risk-title">
      <h3 className="widget__title" id="risk-title">
        정책 리스크 점검 — 완화 조치 {stats.done}/{stats.total}
      </h3>
      <p className="widget__desc">
        YouTube는 2025년 7월 <code>repetitious content</code> 정책을 <code>inauthentic content</code>로
        개칭하고, 2026년 7월 수익화 불가 3개 범주를 명시했습니다. 이 제작 방식은 그중 두 범주에 걸릴 소지가
        있습니다. 아래는 공식 문서 원문과 대응책입니다.
      </p>

      <p className="alert alert--info">
        출처:{' '}
        <a href={POLICY_SOURCE.url} target="_blank" rel="noreferrer noopener">
          {POLICY_SOURCE.title} ↗
        </a>{' '}
        · {POLICY_SOURCE.checkedAt} 확인. 정책은 수시로 바뀌므로 업로드 전 직접 확인하세요.
      </p>

      <div className="stat-row">
        <div className="stat">
          <span className="stat__value">{stats.high}</span>
          <span className="stat__label">위험도 높음 항목</span>
        </div>
        <div className="stat">
          <span className="stat__value">
            {stats.done}/{stats.total}
          </span>
          <span className="stat__label">완화 조치 이행</span>
        </div>
      </div>

      <h4 className="sub-title">수익화 불가 3개 범주</h4>
      <ul className="cat-list">
        {INAUTHENTIC_CATEGORIES.map((c) => (
          <li className="cat" key={c.id}>
            <span className="cat__name">{c.name}</span>
            <span className="cat__en">{c.nameEn}</span>
            <p className="cat__summary">{c.summary}</p>
          </li>
        ))}
      </ul>

      <h4 className="sub-title">이 방식이 부딪치는 지점 {RISK_ITEMS.length}개</h4>
      <ul className="risk-list">
        {RISK_ITEMS.map((risk) => {
          const doneCount = risk.mitigation.filter((_, i) =>
            isChecked(`policy-${risk.id}`, `m${i}`),
          ).length;
          return (
            <li className={`risk risk--${risk.level}`} key={risk.id}>
              <div className="risk__head">
                <span className={`badge badge--${risk.level === 'high' ? 'warn' : ''}`}>
                  위험 {LEVEL_LABEL[risk.level]}
                </span>
                <span className="risk__cat">{risk.category}</span>
                <span className="risk__count">
                  {doneCount}/{risk.mitigation.length}
                </span>
              </div>

              <blockquote className="risk__policy">
                <p className="risk__policy-ko">{risk.policyText}</p>
                <p className="risk__policy-en">{risk.policyOriginal}</p>
              </blockquote>

              <p className="risk__applies">
                <strong>이 방식에서는</strong> {risk.howItApplies}
              </p>

              <p className="risk__mit-title">대응</p>
              <ul className="mit-list">
                {risk.mitigation.map((m, i) => {
                  const checked = isChecked(`policy-${risk.id}`, `m${i}`);
                  return (
                    <li className={`mit${checked ? ' is-checked' : ''}`} key={`${risk.id}-m${i}`}>
                      <label className="mit__label">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCheck(`policy-${risk.id}`, `m${i}`)}
                        />
                        <span>{m}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>

              {risk.allowedBasis && (
                <p className="risk__basis">
                  <span aria-hidden="true">✓</span> {risk.allowedBasis}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** 강의 설명과 공식 정책이 어긋나는 지점 */
export function LectureDiscrepancies() {
  return (
    <section className="widget" aria-labelledby="disc-title">
      <h3 className="widget__title" id="disc-title">
        강의 설명과 공식 정책이 어긋나는 지점 {DISCREPANCIES.length}개
      </h3>
      <p className="widget__desc">
        강의는 실전 경험을 담고 있지만, 정책 해석에서 사실과 다른 부분이 있습니다. 그대로 믿고 진행하면
        수익화가 막힐 수 있으므로 짚어둡니다.
      </p>

      <ul className="disc-list">
        {DISCREPANCIES.map((d) => (
          <li className="disc" key={d.id}>
            <div className="disc__head">
              <span className="badge">강의 주장</span>
              <a
                className="badge badge--link"
                href={timestampUrl(d.lectureTimestamp)}
                target="_blank"
                rel="noreferrer noopener"
                title={SOURCE.title}
              >
                {d.lectureTimestamp} ↗
              </a>
            </div>
            <p className="disc__claim">{d.lectureClaim}</p>

            <p className="disc__label">공식 정책</p>
            <p className="disc__reality">{d.policyReality}</p>

            <p className="disc__so">
              <strong>그래서</strong> {d.soWhat}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 수익 구조와 노출 실무의 실제 수치 */
export function RealityCheck() {
  return (
    <section className="widget" aria-labelledby="reality-title">
      <h3 className="widget__title" id="reality-title">
        수익과 노출의 실제 수치
      </h3>
      <p className="widget__desc">
        강의에 나온 수익 사례는 특정 채널의 결과입니다. 아래는 공개 자료로 확인되는 일반적인 수준입니다. 각
        수치의 출처와 신뢰도를 함께 표시했습니다.
      </p>

      <h4 className="sub-title">수익 구조</h4>
      <ul className="fact-list">
        {REVENUE_FACTS.map((f) => (
          <li className="fact" key={f.label}>
            <div className="fact__head">
              <span className="fact__label">{f.label}</span>
              <span className={`badge badge--${f.confidence === 'official' ? 'ok' : ''}`}>
                {CONFIDENCE_LABEL[f.confidence]}
              </span>
            </div>
            <p className="fact__value">{f.value}</p>
            <p className="fact__source">{f.source}</p>
            {f.note && <p className="fact__note">{f.note}</p>}
          </li>
        ))}
      </ul>

      <h4 className="sub-title">노출과 지속시간</h4>
      <ul className="fact-list">
        {ALGORITHM_FACTS.map((f) => (
          <li className="fact" key={f.label}>
            <div className="fact__head">
              <span className="fact__label">{f.label}</span>
              <span className={`badge badge--${f.confidence === 'official' ? 'ok' : ''}`}>
                {CONFIDENCE_LABEL[f.confidence]}
              </span>
            </div>
            <p className="fact__value">{f.value}</p>
            <p className="fact__source">{f.source}</p>
            {f.note && <p className="fact__note">{f.note}</p>}
          </li>
        ))}
      </ul>

      <p className="alert alert--warn">
        한국 시청자 기반 채널의 CPM은 미국 대비 약 4분의 1 수준입니다. 강의의 수익 사례를 그대로 기대하기
        어렵습니다. 2026년에는 롱폼 영상당 광고 수익이 전년 대비 하락했다는 분석도 있습니다.
      </p>
    </section>
  );
}
