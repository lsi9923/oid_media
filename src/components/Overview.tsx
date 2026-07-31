import { useMemo } from 'react';
import { PHASES, STEPS } from '../data/steps';
import { SOURCE, TOOLS, totalMonthlyCost } from '../data/tools';
import { formatKrw } from '../lib/text';
import { useStore } from '../state/store';

/**
 * 개요 화면.
 *
 * 31단계를 처음 보는 사람은 어디서 시작할지 모른다.
 * 전체 흐름과 지금 위치, 다음에 할 일을 한 화면에 보여준다.
 */
export function Overview({ onStart }: { onStart: () => void }) {
  const { state, setActiveStep, progress, stepProgress } = useStore();

  const phaseStats = useMemo(
    () =>
      PHASES.map((p) => {
        const steps = STEPS.filter((s) => s.phaseId === p.id);
        const done = steps.filter((s) => state.completedSteps.includes(s.id)).length;
        return { phase: p, steps, done, total: steps.length };
      }),
    [state.completedSteps],
  );

  /** 아직 완료하지 않은 첫 단계 */
  const nextStep = useMemo(
    () => STEPS.find((s) => !state.completedSteps.includes(s.id)),
    [state.completedSteps],
  );

  const started = state.completedSteps.length > 0;
  const judgmentSteps = STEPS.filter((s) => s.judgment);

  return (
    <div className="ov">
      <header className="ov__hero">
        <h1 className="ov__title">
          {started ? '이어서 만들기' : '민담 유튜브, 어디서 시작하나'}
        </h1>
        <p className="ov__lead">
          {started ? (
            <>
              {STEPS.length}단계 중 {state.completedSteps.length}개를 마쳤습니다.
              {nextStep && (
                <>
                  {' '}
                  다음은 <strong>{nextStep.title.replace(/\s*★\s*$/, '')}</strong>입니다.
                </>
              )}
            </>
          ) : (
            <>
              대본부터 업로드까지 {STEPS.length}단계로 나눠 하나씩 따라갑니다. 만들기 전에{' '}
              <strong>손익이 맞는지, 어떤 니치로 갈지</strong>부터 정합니다.
            </>
          )}
        </p>

        {nextStep && (
          <button
            type="button"
            className="ov__cta"
            onClick={() => {
              setActiveStep(nextStep.id);
              onStart();
            }}
          >
            {started ? '이어서 진행' : '첫 단계 시작'} →
          </button>
        )}

        {progress > 0 && (
          <div className="ov__bar">
            <div className="bar">
              <div className="bar__fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="ov__bar-num">{progress}%</span>
          </div>
        )}
      </header>

      <section className="ov__section" aria-labelledby="ov-flow">
        <h2 className="ov__h2" id="ov-flow">
          전체 흐름
        </h2>
        <p className="ov__note">
          제작은 도구 네 개를 거쳐 갑니다. Claude가 대본과 프롬프트를 만들고, Flow가 이미지를, Grok이
          인트로 영상을, Vrew가 이 모두를 합칩니다.
        </p>

        <ol className="ov__phases">
          {phaseStats.map(({ phase, steps, done, total }) => {
            const complete = total > 0 && done === total;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <li className={`ovp${complete ? ' is-done' : ''}`} key={phase.id}>
                <div className="ovp__head">
                  <span className="ovp__badge" aria-hidden="true">
                    {complete ? '✓' : phase.badge}
                  </span>
                  <span className="ovp__name">{phase.title}</span>
                  <span className="ovp__count">
                    {done}/{total}
                  </span>
                </div>
                <p className="ovp__goal">{phase.goal}</p>
                <div className="ovp__bar">
                  <div className="ovp__fill" style={{ width: `${pct}%` }} />
                </div>
                <ul className="ovp__steps">
                  {steps.map((s) => {
                    const sDone = state.completedSteps.includes(s.id);
                    const { done: cd, total: ct } = stepProgress(s.id);
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          className={`ovs${sDone ? ' is-done' : ''}`}
                          onClick={() => {
                            setActiveStep(s.id);
                            onStart();
                          }}
                        >
                          <span className="ovs__mark" aria-hidden="true">
                            {sDone ? '✓' : '○'}
                          </span>
                          {s.title.replace(/\s*★\s*$/, '')}
                          {ct > 0 && !sDone && (
                            <span className="ovs__count">
                              {cd}/{ct}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="ov__cols">
        <section className="ov__card" aria-labelledby="ov-cost">
          <h2 className="ov__h3" id="ov-cost">
            필요한 도구
          </h2>
          <ul className="ov__tools">
            {Object.values(TOOLS)
              .filter((t) => t.id !== 'youtube')
              .map((t) => (
                <li key={t.id}>
                  <a href={t.url} target="_blank" rel="noreferrer noopener">
                    {t.name}
                  </a>
                  <span className={t.monthlyCostKrw === 0 ? 'is-free' : ''}>
                    {t.monthlyCostKrw === 0 ? '무료' : formatKrw(t.monthlyCostKrw)}
                  </span>
                </li>
              ))}
          </ul>
          <p className="ov__total">
            월 <strong>{formatKrw(totalMonthlyCost())}</strong>
          </p>
          <p className="ov__note">
            첫 달은 Claude만으로 시작할 수 있습니다. 필요해지면 늘리는 편이 낫습니다.
          </p>
        </section>

        <section className="ov__card" aria-labelledby="ov-judge">
          <h2 className="ov__h3" id="ov-judge">
            사람이 판단할 {judgmentSteps.length}곳
          </h2>
          <p className="ov__note">
            나머지는 AI가 합니다. 이 여섯 곳만 직접 정하면 됩니다. 정책이 요구하는 "제작자의 관점"도
            여기서 나옵니다.
          </p>
          <ul className="ov__judge">
            {judgmentSteps.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="ov__judge-btn"
                  onClick={() => {
                    setActiveStep(s.id);
                    onStart();
                  }}
                >
                  <span aria-hidden="true">★</span>
                  {s.title.replace(/\s*★\s*$/, '')}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="ov__section" aria-labelledby="ov-warn">
        <h2 className="ov__h2" id="ov-warn">
          시작 전에 알아야 할 것
        </h2>
        <div className="ov__warns">
          <div className="ovw">
            <h3 className="ovw__t">정책 두 범주에 걸릴 소지가 있습니다</h3>
            <p>
              YouTube는 "여러 영상에 매우 비슷한 줄거리 템플릿"을 수익화 불가로 규정합니다. 이 방식은
              고정 골격을 쓰므로 매 영상 구조를 바꿔야 합니다.
            </p>
          </div>
          <div className="ovw">
            <h3 className="ovw__t">이미 포화된 니치입니다</h3>
            <p>
              강의 진행자 본인이 "만 명 넘게 배웠다"고 밝혔습니다. 차별점이 없으면 묻힙니다. 다른
              니치도 검토해 보세요.
            </p>
          </div>
          <div className="ovw">
            <h3 className="ovw__t">수익 기대치를 낮추세요</h3>
            <p>
              한국 시청자 기반 CPM은 미국의 약 4분의 1입니다. 강의 사례를 그대로 기대하기 어렵습니다.
            </p>
          </div>
        </div>
      </section>

      <footer className="ov__foot">
        <p>
          제작 순서 출처:{' '}
          <a href={SOURCE.url} target="_blank" rel="noreferrer noopener">
            {SOURCE.title}
          </a>{' '}
          ({SOURCE.channel})
        </p>
        <p className="ov__foot-note">
          입력한 내용은 브라우저에만 저장됩니다. 서버로 전송되지 않습니다.
        </p>
      </footer>
    </div>
  );
}
