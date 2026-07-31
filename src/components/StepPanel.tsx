import { PHASES, STEPS } from '../data/steps';
import { SOURCE, TOOLS, timestampUrl } from '../data/tools';
import { useStore } from '../state/store';
import type { Step, StepWidget } from '../types';
import { PromptBox } from './ui';
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
import {
  ChannelTracker,
  CostCalculator,
  DisclosureHelper,
  ProjectSetup,
  ThumbnailCopyPicker,
} from './WorkflowTools';

/** 위젯 id → 컴포넌트 매핑 */
function renderWidget(widget: StepWidget) {
  switch (widget) {
    case 'scriptVault':
      return <ScriptVault key={widget} />;
    case 'scriptChunker':
      return <ScriptChunker key={widget} />;
    case 'characterVault':
      return <CharacterVault key={widget} />;
    case 'sceneQueue':
      return <SceneQueue key={widget} />;
    case 'thumbnailCopy':
      return <ThumbnailCopyPicker key={widget} />;
    case 'projectSetup':
      return <ProjectSetup key={widget} />;
    case 'costCalculator':
      return <CostCalculator key={widget} />;
    case 'channelTracker':
      return <ChannelTracker key={widget} />;
    case 'disclosure':
      return <DisclosureHelper key={widget} />;
    case 'promptLibrary':
      return <PromptLibrary key={widget} />;
    case 'promptLibraryScript':
      return <PromptLibrary key={widget} filterProject="민담 대본" />;
    case 'promptLibraryImage':
      return <PromptLibrary key={widget} filterProject="민담 이미지" />;
    case 'promptLibraryIntro':
      return <PromptLibrary key={widget} filterProject="민담 인트로" />;
    case 'promptLibraryThumbnail':
      return <PromptLibrary key={widget} filterProject="민담 썸네일" />;
    case 'promptLibraryVrew':
      return <PromptLibrary key={widget} filterProject="Vrew" />;
    case 'policyRisk':
      return <PolicyRisk key={widget} />;
    case 'lectureDiscrepancies':
      return <LectureDiscrepancies key={widget} />;
    case 'realityCheck':
      return <RealityCheck key={widget} />;
    case 'scriptChecker':
      return <ScriptChecker key={widget} />;
    case 'episodeHistory':
      return <EpisodeHistory key={widget} />;
    case 'dataBackup':
      return <DataBackup key={widget} />;
    case 'revenueSimulator':
      return <RevenueSimulator key={widget} />;
    case 'runtimeCalculator':
      return <RuntimeCalculator key={widget} />;
    case 'introScorer':
      return <IntroScorer key={widget} />;
    case 'nicheAdvisor':
      return <NicheAdvisor key={widget} />;
    case 'thumbnailPreview':
      return <ThumbnailPreview key={widget} />;
    case 'opsFacts':
      return <OpsFacts key={widget} />;
    case 'opsTax':
      return <OpsFacts key={widget} only="세무" />;
    case 'opsCopyright':
      return <OpsFacts key={widget} only="저작권" />;
    case 'opsUpload':
      return <OpsFacts key={widget} only="업로드 운영" />;
    case 'opsMidroll':
      return <OpsFacts key={widget} only="중간광고" />;
    default:
      return null;
  }
}

export function StepPanel() {
  const { state, toggleCheck, isChecked, toggleStepComplete, goRelative, stepProgress } = useStore();

  const step = STEPS.find((s) => s.id === state.activeStepId);
  if (!step) {
    return (
      <main className="panel">
        <p className="empty">단계를 선택해 주세요.</p>
      </main>
    );
  }

  const phase = PHASES.find((p) => p.id === step.phaseId);
  const index = STEPS.findIndex((s) => s.id === step.id);
  const isDone = state.completedSteps.includes(step.id);
  const { done, total } = stepProgress(step.id);
  const allChecked = total > 0 && done === total;

  return (
    <main className="panel" aria-labelledby="step-title">
      <StepHeader step={step} phaseTitle={phase?.title ?? ''} index={index} />

      {step.keyPoint && (
        <aside className={`keypoint${step.judgment ? ' is-judgment' : ''}`}>
          <span className="keypoint__tag">{step.judgment ? '판단 지점' : '핵심'}</span>
          <p>{step.keyPoint}</p>
        </aside>
      )}

      <section className="block" aria-labelledby="actions-title">
        <h3 className="block__title" id="actions-title">
          실행 순서
        </h3>
        <ol className="ordered">
          {step.actions.map((action, i) => (
            <li key={`action-${i}`}>{action}</li>
          ))}
        </ol>
      </section>

      {step.prompts && step.prompts.length > 0 && (
        <section className="block" aria-labelledby="prompts-title">
          <h3 className="block__title" id="prompts-title">
            붙여넣을 명령
          </h3>
          {step.prompts.map((p, i) => (
            <PromptBox key={`prompt-${i}`} label={p.label} text={p.text} />
          ))}
        </section>
      )}

      {step.checklist.length > 0 && (
        <section className="block" aria-labelledby="check-title">
          <h3 className="block__title" id="check-title">
            확인 목록
            <span className="block__count">
              {done}/{total}
            </span>
          </h3>
          <ul className="checklist">
            {step.checklist.map((item) => {
              const checked = isChecked(step.id, item.id);
              return (
                <li className={`check${checked ? ' is-checked' : ''}`} key={item.id}>
                  <label className="check__label">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCheck(step.id, item.id)}
                    />
                    <span>{item.label}</span>
                  </label>
                  {item.warning && (
                    <p className="check__warning">
                      <span aria-hidden="true">⚠</span> {item.warning}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {step.widgets?.map(renderWidget)}

      <nav className="step-nav" aria-label="단계 이동">
        <button
          type="button"
          className="ghost-btn"
          onClick={() => goRelative(-1)}
          disabled={index <= 0}
        >
          ← 이전 단계
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
          다음 단계 →
        </button>
      </nav>
    </main>
  );
}

function StepHeader({
  step,
  phaseTitle,
  index,
}: {
  step: Step;
  phaseTitle: string;
  index: number;
}) {
  return (
    <header className="step-head">
      <div className="step-head__meta">
        <span className="badge badge--accent">
          {phaseTitle} · {index + 1}/{STEPS.length}
        </span>
        {step.duration && <span className="badge">⏱ {step.duration}</span>}
        {step.judgment && <span className="badge badge--star">★ 판단 필요</span>}
        <a
          className="badge badge--link"
          href={timestampUrl(step.timestamp)}
          target="_blank"
          rel="noreferrer noopener"
          title={`${SOURCE.title} — ${step.timestamp} 지점으로 이동`}
        >
          강의 {step.timestamp} ↗
        </a>
      </div>

      <h1 className="step-head__title" id="step-title">
        {step.title}
      </h1>
      <p className="step-head__summary">{step.summary}</p>

      {step.tools.length > 0 && (
        <ul className="tool-chips" aria-label="이 단계에서 쓰는 도구">
          {step.tools.map((id) => {
            const tool = TOOLS[id];
            return (
              <li key={id}>
                <a
                  className="chip"
                  href={tool.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  title={tool.role}
                >
                  {tool.name} ↗
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </header>
  );
}
