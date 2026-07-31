import { useMemo } from 'react';
import { useStore } from '../state/store';
import { chunkScript, countChars } from '../lib/text';
import { CopyButton, Field, TextArea } from './ui';

/**
 * Vrew 대본 분할기.
 * 강의: Vrew는 클립당 1만자까지만 받으므로 46,000자 대본을 여러 번 나눠 넣어야 한다.
 * 문장 경계에서 자르기 때문에 TTS 억양이 끊기지 않는다.
 */
export function ScriptChunker() {
  const { state, setField } = useStore();
  const { script, chunkSize } = state;

  const chunks = useMemo(() => chunkScript(script, chunkSize), [script, chunkSize]);
  const total = countChars(script);

  return (
    <section className="widget" aria-labelledby="chunker-title">
      <h3 className="widget__title" id="chunker-title">
        대본 분할기 — Vrew 투입용
      </h3>
      <p className="widget__desc">
        Vrew는 클립 하나에 {chunkSize.toLocaleString('ko-KR')}자까지만 받습니다. 아래 조각을 순서대로
        복사해 <strong>클립 추가 → AI 목소리</strong>로 넣으세요. 문장이 중간에 끊기지 않도록 문장 경계에서
        나눕니다.
      </p>

      <div className="widget__controls">
        <Field
          label="클립당 최대 글자수"
          type="number"
          value={String(chunkSize)}
          onChange={(v) => {
            const n = Number.parseInt(v, 10);
            setField('chunkSize', Number.isFinite(n) && n > 0 ? n : 10000);
          }}
          hint="Vrew 기본 제한은 10,000자입니다."
        />
      </div>

      {total === 0 ? (
        <p className="empty">
          1단계에서 저장한 대본이 아직 없습니다. <strong>대본 생성</strong> 단계에서 대본을 붙여넣으면 여기에
          자동으로 조각이 만들어집니다.
        </p>
      ) : (
        <>
          <div className="stat-row">
            <div className="stat">
              <span className="stat__value">{total.toLocaleString('ko-KR')}</span>
              <span className="stat__label">전체 글자수</span>
            </div>
            <div className="stat">
              <span className="stat__value">{chunks.length}</span>
              <span className="stat__label">필요한 클립 수</span>
            </div>
          </div>

          <ol className="chunk-list">
            {chunks.map((chunk, i) => (
              <li className="chunk" key={`chunk-${i}`}>
                <div className="chunk__head">
                  <span className="chunk__no">{i + 1}번 클립</span>
                  <span className="chunk__count">{chunk.length.toLocaleString('ko-KR')}자</span>
                  <CopyButton text={chunk} label="이 조각 복사" />
                </div>
                <p className="chunk__preview">
                  {chunk.slice(0, 90)}
                  {chunk.length > 90 ? '…' : ''}
                </p>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

/**
 * 대본 · 썸네일 브리프 보관함.
 * 이후 이미지/인트로/썸네일 단계에서 계속 재사용되는 재료를 한 곳에 둔다.
 */
export function ScriptVault() {
  const { state, setField } = useStore();

  return (
    <section className="widget" aria-labelledby="vault-title">
      <h3 className="widget__title" id="vault-title">
        재료 보관함
      </h3>
      <p className="widget__desc">
        여기에 저장한 내용은 이후 단계에서 그대로 다시 쓰입니다. 특히{' '}
        <strong>썸네일 브리프</strong>는 인트로와 썸네일 단계에서 반드시 필요합니다.
      </p>

      <Field
        label="확정한 카테고리"
        value={state.category}
        onChange={(v) => setField('category', v)}
        placeholder="예: 권선징악 — 귀신과 도깨비"
      />
      <Field
        label="확정한 주제"
        value={state.topic}
        onChange={(v) => setField('topic', v)}
        placeholder="예: 죽어가는 은인을 헛간에 숨긴 며느리"
      />
      <TextArea
        label="확정한 인트로 대사"
        value={state.introLine}
        onChange={(v) => setField('introLine', v)}
        placeholder="등장인물의 대사로 시작하는 첫 문장"
        rows={3}
      />
      <TextArea
        label="최종 대본"
        value={state.script}
        onChange={(v) => setField('script', v)}
        placeholder="Claude가 생성한 대본 전문을 붙여넣으세요"
        rows={8}
        showCount
        targetCount={46000}
      />
      <TextArea
        label="썸네일 브리프"
        value={state.thumbnailBrief}
        onChange={(v) => setField('thumbnailBrief', v)}
        placeholder="대본과 함께 나온 썸네일 브리프"
        rows={4}
      />

      <div className="widget__footer">
        <CopyButton text={state.script} label="대본 전체 복사" />
        <CopyButton text={state.thumbnailBrief} label="썸네일 브리프 복사" />
      </div>
    </section>
  );
}
