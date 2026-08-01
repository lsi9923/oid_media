import { PHASES, STEPS } from '../data/steps';
import { SOURCE, TOOLS, timestampUrl } from '../data/tools';
import { useStore } from '../state/store';
import type { Step, StepWidget } from '../types';
import { PromptBox } from './ui';
import { Panel } from './Note';
import { ScriptChunker, ScriptVault } from './ScriptTools';
import { CharacterVault, SceneQueue } from './ImageTools';
import { PromptLibrary } from './PromptLibrary';
import { LectureDiscrepancies, PolicyRisk, RealityCheck } from './PolicyRisk';
import { ScriptChecker } from './ScriptChecker';
import { EpisodeHistory } from './EpisodeHistory';
import { DataBackup } from './DataBackup';
import { RevenueSimulator, RuntimeCalculator } from './RevenueSimulator';
import { IntroScorer, NicheAdvisor } from './IntroScorer';
import { ThumbnailPreview } from './ThumbnailPreview';
import { OpsFacts } from './OpsFacts';
import { RunwayCalculator, SetupGates, StartupCosts } from './Runway';
import {
  ChannelTracker,
  CostCalculator,
  DisclosureHelper,
  ProjectSetup,
  ThumbnailCopyPicker,
} from './WorkflowTools';

/** 위젯 이름. 접힌 상태에서 무엇인지 알 수 있게 한다 */
const WIDGET_LABEL: Record<StepWidget, string> = {
  scriptVault: '재료 보관함',
  characterVault: '인물 레퍼런스',
  sceneQueue: '장면 큐',
  thumbnailCopy: '카피 고르기',
  scriptChunker: '대본 분할기',
  projectSetup: 'Claude 프로젝트 설치표',
  costCalculator: '비용 계산',
  channelTracker: '채널 관리',
  disclosure: 'AI 제작 표시',
  promptLibrary: '프롬프트 라이브러리',
  promptLibraryScript: '프롬프트 — 대본',
  promptLibraryImage: '프롬프트 — 이미지',
  promptLibraryIntro: '프롬프트 — 인트로',
  promptLibraryThumbnail: '프롬프트 — 썸네일',
  promptLibraryVrew: '프롬프트 — Vrew',
  policyRisk: '정책 리스크 점검',
  lectureDiscrepancies: '강의와 정책의 불일치',
  realityCheck: '수익·노출 실제 수치',
  scriptChecker: '대본 TTS 검사',
  episodeHistory: '템플릿 반복 방지 이력',
  dataBackup: '작업 백업',
  revenueSimulator: '손익 시뮬레이터',
  runtimeCalculator: '러닝타임 계산',
  introScorer: '인트로 채점',
  nicheAdvisor: '니치 진단',
  thumbnailPreview: '썸네일 가독성',
  opsFacts: '운영 실무',
  opsTax: '세무',
  opsCopyright: '저작권',
  opsUpload: '업로드 운영',
  opsMidroll: '중간광고',
  setupGates: '관문 체크리스트',
  runwayCalculator: '수익화 도달 계산',
  startupCosts: '비용 구성표',
};

function renderWidget(widget: StepWidget) {
  switch (widget) {
    case 'scriptVault':
      return <ScriptVault />;
    case 'scriptChunker':
      return <ScriptChunker />;
    case 'characterVault':
      return <CharacterVault />;
    case 'sceneQueue':
      return <SceneQueue />;
    case 'thumbnailCopy':
      return <ThumbnailCopyPicker />;
    case 'projectSetup':
      return <ProjectSetup />;
    case 'costCalculator':
      return <CostCalculator />;
    case 'channelTracker':
      return <ChannelTracker />;
    case 'disclosure':
      return <DisclosureHelper />;
    case 'promptLibrary':
      return <PromptLibrary />;
    case 'promptLibraryScript':
      return <PromptLibrary filterProject="민담 대본" />;
    case 'promptLibraryImage':
      return <PromptLibrary filterProject="민담 이미지" />;
    case 'promptLibraryIntro':
      return <PromptLibrary filterProject="민담 인트로" />;
    case 'promptLibraryThumbnail':
      return <PromptLibrary filterProject="민담 썸네일" />;
    case 'promptLibraryVrew':
      return <PromptLibrary filterProject="Vrew" />;
    case 'policyRisk':
      return <PolicyRisk />;
    case 'lectureDiscrepancies':
      return <LectureDiscrepancies />;
    case 'realityCheck':
      return <RealityCheck />;
    case 'scriptChecker':
      return <ScriptChecker />;
    case 'episodeHistory':
      return <EpisodeHistory />;
    case 'dataBackup':
      return <DataBackup />;
    case 'revenueSimulator':
      return <RevenueSimulator />;
    case 'runtimeCalculator':
      return <RuntimeCalculator />;
    case 'introScorer':
      return <IntroScorer />;
    case 'nicheAdvisor':
      return <NicheAdvisor />;
    case 'thumbnailPreview':
      return <ThumbnailPreview />;
    case 'opsFacts':
      return <OpsFacts />;
    case 'opsTax':
      return <OpsFacts only="세무" />;
    case 'opsCopyright':
      return <OpsFacts only="저작권" />;
    case 'opsUpload':
      return <OpsFacts only="업로드 운영" />;
    case 'opsMidroll':
      return <OpsFacts only="중간광고" />;
    case 'setupGates':
      return <SetupGates />;
    case 'runwayCalculator':
      return <RunwayCalculator />;
    case 'startupCosts':
      return <StartupCosts />;
    default:
      return null;
  }
}

export function StepPanel() {
  const { state, toggleCheck, isChecked, toggleStepComplete, goRelative, stepProgress } = useStore();

  const step = STEPS.find((s) => s.id === state.activeStepId);
  if (!step) {
    return (
      <main className="sp">
        <p className="empty">단계를 선택해 주세요.</p>
      </main>
    );
  }

  const phase = PHASES.find((p) => p.id === step.phaseId);
  const index = STEPS.findIndex((s) => s.id === step.id);
  const isDone = state.completedSteps.includes(step.id);
  const { done, total } = stepProgress(step.id);
  const allChecked = total > 0 && done === total;
  const widgets = step.widgets ?? [];

  return (
    <main className="sp" aria-labelledby="step-title">
      {/* 상단 고정 바 — 어디에 있는지 늘 보인다 */}
      <div className="sp__sticky">
        <span className="sp__crumb">
          {phase?.title} · {index + 1}/{STEPS.length}
        </span>
        <span className="sp__sticky-title">{step.title.replace(/\s*★\s*$/, '')}</span>
        {total > 0 && (
          <span className={`sp__sticky-count${allChecked ? ' is-done' : ''}`}>
            {done}/{total}
          </span>
        )}
        <button
          type="button"
          className={`sp__sticky-btn${isDone ? ' is-done' : ''}`}
          onClick={() => toggleStepComplete(step.id)}
        >
          {isDone ? '✓ 완료' : '완료로 표시'}
        </button>
      </div>

      <div className="sp__inner">
        <StepHeader step={step} />

        {step.keyPoint && (
          <aside className={`kp${step.judgment ? ' is-judge' : ''}`}>
            <span className="kp__tag">{step.judgment ? '판단 지점' : '핵심'}</span>
            <p>{step.keyPoint}</p>
          </aside>
        )}

        <section className="blk" aria-labelledby="act-title">
          <h2 className="blk__t" id="act-title">
            실행 순서
          </h2>
          <ol className="ord">
            {step.actions.map((a, i) => (
              <li key={`a-${i}`}>{a}</li>
            ))}
          </ol>
        </section>

        {step.prompts && step.prompts.length > 0 && (
          <section className="blk" aria-labelledby="pr-title">
            <h2 className="blk__t" id="pr-title">
              붙여넣을 명령
            </h2>
            {step.prompts.map((p, i) => (
              <PromptBox key={`p-${i}`} label={p.label} text={p.text} />
            ))}
          </section>
        )}

        {step.checklist.length > 0 && (
          <section className="blk" aria-labelledby="ck-title">
            <h2 className="blk__t" id="ck-title">
              확인 목록
              <span className="blk__n">
                {done}/{total}
              </span>
            </h2>
            <ul className="cks">
              {step.checklist.map((item) => {
                const checked = isChecked(step.id, item.id);
                return (
                  <li className={`ck${checked ? ' is-on' : ''}`} key={item.id}>
                    <label className="ck__l">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCheck(step.id, item.id)}
                      />
                      <span>{item.label}</span>
                    </label>
                    {item.warning && !checked && (
                      <p className="ck__w">
                        <span aria-hidden="true">⚠</span> {item.warning}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {widgets.length > 0 && (
          <section className="blk" aria-label="이 단계의 도구">
            <h2 className="blk__t">
              도구
              {widgets.length > 1 && <span className="blk__n">{widgets.length}개</span>}
            </h2>
            <div className="tools">
              {widgets.map((w, i) => (
                <Panel
                  key={w}
                  id={`w-${w}`}
                  title={WIDGET_LABEL[w] ?? w}
                  collapsible={widgets.length > 1}
                  // 여럿이면 첫 번째만 펼친다. 페이지가 끝없이 길어지는 것을 막는다
                  defaultOpen={widgets.length === 1 || i === 0}
                >
                  {renderWidget(w)}
                </Panel>
              ))}
            </div>
          </section>
        )}

        <nav className="sp__nav" aria-label="단계 이동">
          <button
            type="button"
            className="ghost-btn"
            onClick={() => goRelative(-1)}
            disabled={index <= 0}
          >
            ← 이전
          </button>
          <button
            type="button"
            className={`complete-btn${isDone ? ' is-done' : ''}`}
            onClick={() => toggleStepComplete(step.id)}
          >
            {isDone ? '✓ 완료됨 — 취소' : allChecked ? '이 단계 완료' : '완료로 표시'}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => goRelative(1)}
            disabled={index >= STEPS.length - 1}
          >
            다음 →
          </button>
        </nav>
      </div>
    </main>
  );
}

function StepHeader({ step }: { step: Step }) {
  return (
    <header className="sh">
      <div className="sh__meta">
        {step.duration && <span className="chip chip--plain">⏱ {step.duration}</span>}
        {step.judgment && <span className="chip chip--star">★ 판단 필요</span>}
        <a
          className="chip chip--link"
          href={timestampUrl(step.timestamp)}
          target="_blank"
          rel="noreferrer noopener"
          title={`${SOURCE.title} — ${step.timestamp}`}
        >
          강의 {step.timestamp} ↗
        </a>
        {step.tools.map((id) => {
          const t = TOOLS[id];
          return (
            <a
              className="chip"
              key={id}
              href={t.url}
              target="_blank"
              rel="noreferrer noopener"
              title={t.role}
            >
              {t.name} ↗
            </a>
          );
        })}
      </div>

      <h1 className="sh__t" id="step-title">
        {step.title.replace(/\s*★\s*$/, '')}
      </h1>
      <p className="sh__s">{step.summary}</p>
    </header>
  );
}
