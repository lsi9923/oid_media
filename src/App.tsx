import { useCallback, useEffect, useState } from 'react';
import { useStore } from './state/store';
import { Sidebar } from './components/Sidebar';
import { StepPanel } from './components/StepPanel';
import { Overview } from './components/Overview';

type View = 'overview' | 'step';

export default function App() {
  const { state, setField, reset, goRelative } = useStore();
  const [navOpen, setNavOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  // 처음 들어오면 개요를 보여준다. 진행 중이면 바로 단계로 간다.
  const [view, setView] = useState<View>(() =>
    state.completedSteps.length > 0 ? 'step' : 'overview',
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.activeStepId, view]);

  // Alt + ←/→ 로 단계 이동
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!e.altKey || view !== 'step') return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goRelative(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goRelative(1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goRelative, view]);

  const handleReset = useCallback(() => {
    if (confirmReset) {
      reset();
      setConfirmReset(false);
      setView('overview');
    } else {
      setConfirmReset(true);
      window.setTimeout(() => setConfirmReset(false), 4000);
    }
  }, [confirmReset, reset]);

  return (
    <div className="app">
      <a className="skip" href="#main">
        본문으로 건너뛰기
      </a>

      <header className="top">
        <button
          type="button"
          className="top__menu"
          onClick={() => setNavOpen((v) => !v)}
          aria-expanded={navOpen}
          aria-label="단계 목록"
        >
          ☰
        </button>

        <button type="button" className="top__brand" onClick={() => setView('overview')}>
          <span className="top__logo" aria-hidden="true">
            민
          </span>
          <span className="top__name">민담 스튜디오</span>
        </button>

        <div className="top__tabs" role="tablist" aria-label="화면 전환">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'overview'}
            className={`top__tab${view === 'overview' ? ' is-on' : ''}`}
            onClick={() => setView('overview')}
          >
            개요
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'step'}
            className={`top__tab${view === 'step' ? ' is-on' : ''}`}
            onClick={() => setView('step')}
          >
            작업
          </button>
        </div>

        <label className="top__proj">
          <span className="sr-only">작업 중인 영상 제목</span>
          <input
            type="text"
            value={state.projectTitle}
            placeholder="작업 중인 영상 제목"
            onChange={(e) => setField('projectTitle', e.target.value)}
          />
        </label>

        <button
          type="button"
          className={`top__reset${confirmReset ? ' is-armed' : ''}`}
          onClick={handleReset}
        >
          {confirmReset ? '한 번 더 눌러 초기화' : '초기화'}
        </button>
      </header>

      {view === 'overview' ? (
        <div className="shell shell--wide" id="main">
          <Overview onStart={() => setView('step')} />
        </div>
      ) : (
        <div className={`shell${navOpen ? ' is-nav' : ''}`} id="main">
          <div className="shell__nav">
            <Sidebar onNavigate={() => setNavOpen(false)} />
          </div>
          <div className="shell__main">
            <StepPanel />
          </div>
        </div>
      )}
    </div>
  );
}
