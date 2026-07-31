import { useCallback, useState } from 'react';
import { useStore } from '../state/store';
import type { ChannelEntry, ClaudeProjectKey } from '../types';
import { TOOLS, totalMonthlyCost } from '../data/tools';
import { formatKrw, makeId } from '../lib/text';
import { CopyButton, Field, TextArea } from './ui';

/** Claude 프로젝트 4종 정의 — 대본만 파일 업로드가 필요하다 */
const CLAUDE_PROJECTS: {
  key: ClaudeProjectKey;
  name: string;
  needsFiles: boolean;
  role: string;
  /** 지침 칸에 넣을 파일 */
  instructionFile: string;
  /** 파일 영역에 업로드할 파일들 */
  uploadFiles: string[];
}[] = [
  {
    key: 'script',
    name: '민담 대본',
    needsFiles: true,
    role: '주제 추천 → 인트로 → 인물 → 줄거리 → 46,000자 대본 + 썸네일 브리프',
    instructionFile: '01_민담대본_MAIN.txt',
    uploadFiles: ['02_모티프뱅크.txt', '03_이름규칙.txt', '04_스토리팩트틀.txt'],
  },
  {
    key: 'image',
    name: '민담 이미지',
    needsFiles: false,
    role: '화풍 추출 → 인물 고정 프롬프트 → 40장면 프롬프트',
    instructionFile: '05_민담이미지_MAIN.txt',
    uploadFiles: [],
  },
  {
    key: 'intro',
    name: '민담 인트로',
    needsFiles: false,
    role: 'Grok에 넣을 Scene 1~4 (대사 · 인물 · 이미지 프롬프트)',
    instructionFile: '06_민담인트로_MAIN.txt',
    uploadFiles: [],
  },
  {
    key: 'thumbnail',
    name: '민담 썸네일',
    needsFiles: false,
    role: '썸네일 카피 추천 → 선택한 카피의 영어 이미지 프롬프트',
    instructionFile: '07_민담썸네일_MAIN.txt',
    uploadFiles: [],
  },
];

/** Claude 프로젝트 4개 세팅 추적 */
export function ProjectSetup() {
  const { state, setClaudeProject } = useStore();

  return (
    <section className="widget" aria-labelledby="projects-title">
      <h3 className="widget__title" id="projects-title">
        Claude 프로젝트 4개 설치표
      </h3>
      <p className="widget__desc">
        프롬프트는 반드시 <strong>지침(Instructions)</strong> 칸에 넣습니다. 프로젝트 설명란에 넣는 것이
        가장 흔한 실수입니다. 설명란은 프로젝트를 설명하는 칸일 뿐 지침으로 작동하지 않습니다.
      </p>

      <ul className="proj-list">
        {CLAUDE_PROJECTS.map((p) => {
          const st = state.claudeProjects[p.key];
          const complete = st.created && st.instructionsPasted && (!p.needsFiles || st.filesUploaded);
          return (
            <li className={`proj${complete ? ' is-complete' : ''}`} key={p.key}>
              <div className="proj__head">
                <span className="proj__name">{p.name}</span>
                {complete && <span className="badge badge--ok">완료</span>}
                {!p.needsFiles && <span className="badge">파일 불필요</span>}
              </div>
              <p className="proj__role">{p.role}</p>

              <dl className="proj__files">
                <dt>지침 칸</dt>
                <dd>
                  <code>{p.instructionFile}</code>
                </dd>
                {p.uploadFiles.length > 0 && (
                  <>
                    <dt>파일 업로드</dt>
                    <dd>
                      {p.uploadFiles.map((f) => (
                        <code key={f}>{f}</code>
                      ))}
                    </dd>
                  </>
                )}
              </dl>

              <div className="proj__checks">
                <label className="inline-check">
                  <input
                    type="checkbox"
                    checked={st.created}
                    onChange={(e) => setClaudeProject(p.key, { created: e.target.checked })}
                  />
                  프로젝트 생성
                </label>
                <label className="inline-check">
                  <input
                    type="checkbox"
                    checked={st.instructionsPasted}
                    onChange={(e) =>
                      setClaudeProject(p.key, { instructionsPasted: e.target.checked })
                    }
                  />
                  지침 칸에 붙여넣기
                </label>
                {p.needsFiles && (
                  <label className="inline-check">
                    <input
                      type="checkbox"
                      checked={st.filesUploaded}
                      onChange={(e) => setClaudeProject(p.key, { filesUploaded: e.target.checked })}
                    />
                    파일 3개 업로드
                  </label>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="alert alert--info">
        모델은 <strong>Sonnet</strong>으로 맞추세요. Opus는 더 똑똑하지만 사용량 한도 때문에 긴 대본을
        끝까지 만들지 못합니다.
      </p>
    </section>
  );
}

/** 비용 계산기 */
export function CostCalculator() {
  const [videosPerMonth, setVideosPerMonth] = useState('20');
  const monthly = totalMonthlyCost();
  const count = Math.max(1, Number.parseInt(videosPerMonth, 10) || 1);
  const perVideo = Math.round(monthly / count);

  return (
    <section className="widget" aria-labelledby="cost-title">
      <h3 className="widget__title" id="cost-title">
        비용 계산
      </h3>

      <ul className="tool-list">
        {Object.values(TOOLS).map((t) => (
          <li className="tool" key={t.id}>
            <div className="tool__main">
              <a className="tool__name" href={t.url} target="_blank" rel="noreferrer noopener">
                {t.name} ↗
              </a>
              <span className={`tool__cost${t.monthlyCostKrw === 0 ? ' is-free' : ''}`}>
                {t.monthlyCostKrw === 0 ? '무료' : formatKrw(t.monthlyCostKrw)}
              </span>
            </div>
            <p className="tool__role">{t.role}</p>
            {t.note && <p className="tool__note">{t.note}</p>}
          </li>
        ))}
      </ul>

      <div className="widget__controls">
        <Field
          label="월 제작 편수"
          type="number"
          value={videosPerMonth}
          onChange={setVideosPerMonth}
        />
      </div>

      <div className="stat-row">
        <div className="stat">
          <span className="stat__value">{formatKrw(monthly)}</span>
          <span className="stat__label">월 고정비</span>
        </div>
        <div className="stat">
          <span className="stat__value">{formatKrw(perVideo)}</span>
          <span className="stat__label">영상 1편당 원가</span>
        </div>
      </div>

      <p className="alert alert--info">
        강의 기준 월 약 8만원, 영상 1편 원가 1,000~2,000원. Flow와 미리캔버스는 현재 무료지만 정책은
        계속 축소되는 추세입니다.
      </p>
    </section>
  );
}

/** 썸네일 카피 후보 관리 — 사람의 판단이 필요한 지점 */
export function ThumbnailCopyPicker() {
  const { state, setThumbnailCopies } = useStore();
  const { thumbnailCopies } = state;
  const [draft, setDraft] = useState('');

  const addBulk = useCallback(() => {
    const lines = draft
      .split('\n')
      .map((l) => l.replace(/^\s*[-•*\d.)\]]+\s*/, '').trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return;
    setThumbnailCopies([
      ...thumbnailCopies,
      ...lines.map((text) => ({ id: makeId('copy'), text, selected: false })),
    ]);
    setDraft('');
  }, [draft, thumbnailCopies, setThumbnailCopies]);

  const select = useCallback(
    (id: string) => {
      setThumbnailCopies(
        thumbnailCopies.map((c) => ({ ...c, selected: c.id === id ? !c.selected : false })),
      );
    },
    [thumbnailCopies, setThumbnailCopies],
  );

  const remove = useCallback(
    (id: string) => setThumbnailCopies(thumbnailCopies.filter((c) => c.id !== id)),
    [thumbnailCopies, setThumbnailCopies],
  );

  const chosen = thumbnailCopies.find((c) => c.selected);

  return (
    <section className="widget" aria-labelledby="copy-title">
      <h3 className="widget__title" id="copy-title">
        썸네일 카피 고르기
      </h3>
      <p className="widget__desc">
        카피는 썸네일에 들어가는 글자입니다. 여기서 선택을 못 받으면 영상을 보지도 않습니다. Claude가 준
        후보를 붙여넣고 <strong>궁금증이 가장 큰 것</strong> 하나를 고르세요.
      </p>

      <TextArea
        label="카피 후보 붙여넣기 (한 줄에 하나)"
        value={draft}
        onChange={setDraft}
        placeholder={'산에 버려진 전신불수 과부를 아내로 삼은 나무꾼\n굶어 죽어도 사랑은 못 준다'}
        rows={4}
      />
      <button type="button" className="primary-btn" onClick={addBulk} disabled={!draft.trim()}>
        후보 추가
      </button>

      {thumbnailCopies.length > 0 && (
        <ul className="copy-list">
          {thumbnailCopies.map((c) => (
            <li className={`copy-item${c.selected ? ' is-selected' : ''}`} key={c.id}>
              <label className="copy-item__label">
                <input
                  type="radio"
                  name="thumbnail-copy"
                  checked={c.selected}
                  onChange={() => select(c.id)}
                />
                <span>{c.text}</span>
              </label>
              <span className="copy-item__len">{c.text.length}자</span>
              <CopyButton text={c.text} label="복사" />
              <button
                type="button"
                className="ghost-btn ghost-btn--danger"
                onClick={() => remove(c.id)}
                aria-label="후보 삭제"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      {chosen && (
        <p className="alert alert--ok">
          선택한 카피: <strong>{chosen.text}</strong> — 이 카피를 Claude에 알려주고 영어 이미지
          프롬프트를 받으세요. 인트로 첫인상도 이 방향과 일치해야 합니다.
        </p>
      )}
    </section>
  );
}

/** AI 제작 고지 문구 */
export function DisclosureHelper() {
  const TEXT = 'AI를 활용해 제작한 창작물입니다';
  return (
    <section className="widget" aria-labelledby="disc-title">
      <h3 className="widget__title" id="disc-title">
        AI 제작 표시
      </h3>
      <p className="widget__desc">
        두 곳 모두 표기하는 것이 안전합니다. YouTube 설정에만 하면 시청자가 모를 수 있으니 화면에도 한 번 더
        알립니다.
      </p>

      <div className="disclosure">
        <div className="disclosure__preview" aria-hidden="true">
          {TEXT}
        </div>
        <CopyButton text={TEXT} label="문구 복사" />
      </div>

      <ol className="ordered">
        <li>영상 도입부 화면에 위 문구를 자막으로 넣는다.</li>
        <li>
          YouTube 업로드 → 세부정보 → <strong>변경된 콘텐츠 또는 합성 콘텐츠</strong> 항목을 체크한다.
        </li>
      </ol>

      <p className="alert alert--warn">
        클릭 한 번으로 영상까지 나오는 완전 자동화는 채널 삭제 사유입니다. 주제 선택 · 인트로 검수 ·
        썸네일 카피 선택처럼 사람이 판단하는 단계를 반드시 남겨두세요.
      </p>
    </section>
  );
}

/** 다채널 운영 추적 */
export function ChannelTracker() {
  const { state, setChannels } = useStore();
  const { channels } = state;

  const add = useCallback(() => {
    setChannels([
      ...channels,
      { id: makeId('ch'), name: '', uploads: 0, monetized: false, memo: '' },
    ]);
  }, [channels, setChannels]);

  const update = useCallback(
    (id: string, patch: Partial<ChannelEntry>) => {
      setChannels(channels.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    },
    [channels, setChannels],
  );

  const remove = useCallback(
    (id: string) => setChannels(channels.filter((c) => c.id !== id)),
    [channels, setChannels],
  );

  const totalUploads = channels.reduce((sum, c) => sum + c.uploads, 0);
  const monetizedCount = channels.filter((c) => c.monetized).length;

  return (
    <section className="widget" aria-labelledby="ch-title">
      <h3 className="widget__title" id="ch-title">
        채널 관리
      </h3>
      <p className="widget__desc">
        이 방식은 필연적으로 다채널 운영으로 갑니다. 하나의 구글 계정에서 브랜드 채널로 여러 개를 운영할 수
        있고, 그 자체로 제재받지 않습니다.
      </p>

      {channels.length > 0 && (
        <div className="stat-row">
          <div className="stat">
            <span className="stat__value">{channels.length}</span>
            <span className="stat__label">운영 채널</span>
          </div>
          <div className="stat">
            <span className="stat__value">{totalUploads}</span>
            <span className="stat__label">총 업로드</span>
          </div>
          <div className="stat">
            <span className="stat__value">{monetizedCount}</span>
            <span className="stat__label">수익 창출 승인</span>
          </div>
        </div>
      )}

      <ul className="ch-list">
        {channels.map((c) => (
          <li className="ch" key={c.id}>
            <Field
              label="채널명"
              value={c.name}
              onChange={(v) => update(c.id, { name: v })}
              placeholder="예: 하루 야담"
            />
            <Field
              label="업로드 수"
              type="number"
              value={String(c.uploads)}
              onChange={(v) => update(c.id, { uploads: Number.parseInt(v, 10) || 0 })}
            />
            <label className="inline-check">
              <input
                type="checkbox"
                checked={c.monetized}
                onChange={(e) => update(c.id, { monetized: e.target.checked })}
              />
              수익 창출 승인
            </label>
            <Field label="메모" value={c.memo} onChange={(v) => update(c.id, { memo: v })} />
            <button
              type="button"
              className="ghost-btn ghost-btn--danger"
              onClick={() => remove(c.id)}
            >
              채널 삭제
            </button>
          </li>
        ))}
      </ul>

      <button type="button" className="primary-btn" onClick={add}>
        채널 추가
      </button>

      <p className="alert alert--info">
        수익 창출 정지는 항소로 풀 수 있습니다. 채널 삭제와는 다른 문제입니다.
      </p>
    </section>
  );
}
