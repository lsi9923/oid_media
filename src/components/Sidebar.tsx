import { PHASES, STEPS } from '../data/steps';
import { useStore } from '../state/store';

/** 페이즈 → 단계 목록 네비게이션 + 전체 진행률 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { state, setActiveStep, progress, stepProgress } = useStore();

  return (
    <nav className="sidebar" aria-label="제작 단계 목록">
      <div className="sidebar__progress">
        <div className="sidebar__progress-head">
          <span>전체 진행률</span>
          <strong>{progress}%</strong>
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
        <p className="sidebar__progress-note">
          {state.completedSteps.length} / {STEPS.length} 단계 완료
        </p>
      </div>

      {PHASES.map((phase) => {
        const steps = STEPS.filter((s) => s.phaseId === phase.id);
        const doneCount = steps.filter((s) => state.completedSteps.includes(s.id)).length;
        return (
          <section className="nav-phase" key={phase.id}>
            <h2 className="nav-phase__title">
              <span className="nav-phase__badge" aria-hidden="true">
                {phase.badge}
              </span>
              {phase.title}
              <span className="nav-phase__count">
                {doneCount}/{steps.length}
              </span>
            </h2>
            <ul className="nav-list">
              {steps.map((step) => {
                const isActive = state.activeStepId === step.id;
                const isDone = state.completedSteps.includes(step.id);
                const { done, total } = stepProgress(step.id);
                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      className={`nav-item${isActive ? ' is-active' : ''}${isDone ? ' is-done' : ''}`}
                      onClick={() => {
                        setActiveStep(step.id);
                        onNavigate?.();
                      }}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      <span className="nav-item__mark" aria-hidden="true">
                        {isDone ? '✓' : '○'}
                      </span>
                      <span className="nav-item__text">
                        {step.title}
                        {step.judgment && (
                          <span className="nav-item__star" title="사람의 판단이 필요한 단계">
                            ★
                          </span>
                        )}
                      </span>
                      {total > 0 && (
                        <span className="nav-item__count">
                          {done}/{total}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}
