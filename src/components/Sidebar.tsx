import { useMemo, useState } from 'react';
import { PHASES, STEPS } from '../data/steps';
import { useStore } from '../state/store';

/**
 * 단계 네비게이션.
 *
 * 31개를 한 줄로 늘어놓으면 지금 어디인지 알 수 없다.
 * 현재 페이즈만 펼치고 나머지는 접는다. 다른 페이즈는 눌러서 펼친다.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { state, setActiveStep, progress, stepProgress } = useStore();

  const activePhaseId = useMemo(
    () => STEPS.find((s) => s.id === state.activeStepId)?.phaseId ?? PHASES[0]?.id,
    [state.activeStepId],
  );

  // 현재 페이즈는 항상 펼친다. 사용자가 따로 펼친 것은 기억한다.
  const [manuallyOpen, setManuallyOpen] = useState<Set<string>>(new Set());

  const phaseStats = useMemo(() => {
    const m = new Map<string, { done: number; total: number }>();
    for (const p of PHASES) {
      const steps = STEPS.filter((s) => s.phaseId === p.id);
      m.set(p.id, {
        done: steps.filter((s) => state.completedSteps.includes(s.id)).length,
        total: steps.length,
      });
    }
    return m;
  }, [state.completedSteps]);

  function togglePhase(id: string) {
    setManuallyOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <nav className="nav" aria-label="제작 단계">
      <div className="nav__progress">
        <div className="nav__progress-top">
          <span className="nav__progress-label">진행률</span>
          <strong className="nav__progress-num">{progress}%</strong>
        </div>
        <div
          className="bar"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="전체 진행률"
        >
          <div className="bar__fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="nav__progress-sub">
          {state.completedSteps.length} / {STEPS.length} 단계
        </p>
      </div>

      <ul className="nav__phases">
        {PHASES.map((phase) => {
          const stat = phaseStats.get(phase.id) ?? { done: 0, total: 0 };
          const isActive = phase.id === activePhaseId;
          const isOpen = isActive || manuallyOpen.has(phase.id);
          const isDone = stat.total > 0 && stat.done === stat.total;
          const steps = STEPS.filter((s) => s.phaseId === phase.id);

          return (
            <li
              className={`ph${isActive ? ' is-active' : ''}${isDone ? ' is-done' : ''}`}
              key={phase.id}
            >
              <button
                type="button"
                className="ph__head"
                onClick={() => togglePhase(phase.id)}
                aria-expanded={isOpen}
              >
                <span className="ph__badge" aria-hidden="true">
                  {isDone ? '✓' : phase.badge}
                </span>
                <span className="ph__name">{phase.title}</span>
                <span className="ph__count">
                  {stat.done}/{stat.total}
                </span>
                <span className="ph__chev" aria-hidden="true">
                  {isOpen ? '−' : '+'}
                </span>
              </button>

              {isOpen && (
                <ul className="ph__steps">
                  {steps.map((step) => {
                    const current = state.activeStepId === step.id;
                    const done = state.completedSteps.includes(step.id);
                    const { done: cDone, total: cTotal } = stepProgress(step.id);
                    return (
                      <li key={step.id}>
                        <button
                          type="button"
                          className={`st${current ? ' is-current' : ''}${done ? ' is-done' : ''}`}
                          onClick={() => {
                            setActiveStep(step.id);
                            onNavigate?.();
                          }}
                          aria-current={current ? 'step' : undefined}
                        >
                          <span className="st__mark" aria-hidden="true">
                            {done ? '✓' : current ? '▸' : ''}
                          </span>
                          <span className="st__name">
                            {step.title.replace(/\s*★\s*$/, '')}
                            {step.judgment && (
                              <span className="st__star" title="사람의 판단이 필요합니다">
                                ★
                              </span>
                            )}
                          </span>
                          {cTotal > 0 && !done && (
                            <span className="st__count">
                              {cDone}/{cTotal}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
