import { useCallback, useEffect, useState } from 'react';
import { SOURCE } from './data/tools';
import { useStore } from './state/store';
import { Sidebar } from './components/Sidebar';
import { StepPanel } from './components/StepPanel';

export default function App() {
  const { state, setField, reset, goRelative } = useStore();
  const [navOpen, setNavOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // 단계 변경 시 본문 상단으로 이동. 스크롤 컨테이너는 window다.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.activeStepId]);

  // Alt+←/→ 로 단계 이동. 입력 중에는 동작하지 않게 한다.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
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
  }, [goRelative]);

  const handleReset = useCallback(() => {
    if (confirmReset) {
      reset();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      window.setTimeout(() => setConfirmReset(false), 4000);
    }
  }, [confirmReset, reset]);

  return (
    <div className="app">
      <a className="skip-link" href="#step-title">
        본문으로 건너뛰기
      </a>

      <header className="topbar">
        <div className="topbar__left">
          <button
            type="button"
            className="topbar__menu"
            onClick={() => setNavOpen((v) => !v)}
            aria-expanded={navOpen}
            aria-label="단계 목록 열기"
          >
            ☰
          </button>
          <div className="topbar__brand">
            <span className="topbar__logo" aria-hidden="true">
              민
            </span>
            <div>
              <p className="topbar__title">민담 스튜디오</p>
              <p className="topbar__sub">단계별 제작 워크플로우</p>
            </div>
          </div>
        </div>

        <div className="topbar__center">
          <label className="topbar__project">
            <span className="sr-only">작업 중인 영상 제목</span>
            <input
              type="text"
              value={state.projectTitle}
              placeholder="작업 중인 영상 제목 / 주제"
              onChange={(e) => setField('projectTitle', e.target.value)}
            />
          </label>
        </div>

        <div className="topbar__right">
          <a
            className="topbar__link"
            href={SOURCE.url}
            target="_blank"
            rel="noreferrer noopener"
            title={SOURCE.title}
          >
            원본 강의 ↗
          </a>
          <button
            type="button"
            className={`topbar__reset${confirmReset ? ' is-armed' : ''}`}
            onClick={handleReset}
          >
            {confirmReset ? '한 번 더 눌러 초기화' : '초기화'}
          </button>
        </div>
      </header>

      <div className={`layout${navOpen ? ' is-nav-open' : ''}`}>
        <div className="layout__nav">
          <Sidebar onNavigate={() => setNavOpen(false)} />
        </div>
        <div className="layout__main">
          <StepPanel />
        </div>
      </div>

      <footer className="footer">
        <p>
          제작 순서 출처:{' '}
          <a href={SOURCE.url} target="_blank" rel="noreferrer noopener">
            {SOURCE.title}
          </a>{' '}
          ({SOURCE.channel} 채널)
        </p>
        <p className="footer__note">
          프롬프트 원본은 강의 고정 댓글에서 받으세요. 이 앱은 진행 관리와 반복 작업 보조만 담당하며,
          입력한 내용은 브라우저(localStorage)에만 저장됩니다. 서버로 전송되지 않습니다.
        </p>
        <p className="footer__note">단계 이동 단축키: Alt + ← / →</p>
      </footer>
    </div>
  );
}
