import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../state/store';
import type { SceneItem } from '../types';
import { formatDuration, hasCharacterTag, makeId, parseScenePrompts } from '../lib/text';
import { CopyButton, Field, TextArea } from './ui';

/** 강의 기준 장면 수 */
const TARGET_SCENES = 40;

/**
 * 인물 레퍼런스 보관함.
 * 강의: Flow에서 인물 5명을 고정해두고 이후 장면·인트로·썸네일에서 계속 참조한다.
 */
export function CharacterVault() {
  const { state, setCharacters } = useStore();
  const { characters } = state;

  const add = useCallback(() => {
    setCharacters([
      ...characters,
      { id: makeId('char'), name: '', prompt: '', saved: false },
    ]);
  }, [characters, setCharacters]);

  const update = useCallback(
    (id: string, patch: Partial<(typeof characters)[number]>) => {
      setCharacters(characters.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    },
    [characters, setCharacters],
  );

  const remove = useCallback(
    (id: string) => setCharacters(characters.filter((c) => c.id !== id)),
    [characters, setCharacters],
  );

  const savedCount = characters.filter((c) => c.saved).length;

  return (
    <section className="widget" aria-labelledby="chars-title">
      <h3 className="widget__title" id="chars-title">
        인물 레퍼런스 — {savedCount}/{characters.length || 5}명 고정
      </h3>
      <p className="widget__desc">
        AI에 그냥 그려달라고 하면 매번 얼굴이 달라집니다. Flow 캐릭터 탭에서 인물을 미리 만들어 저장해두고,
        장면 프롬프트의 <code>@이름</code> 태그로 참조합니다. 강의 기준 <strong>5명</strong>.
      </p>

      {characters.length === 0 && (
        <p className="empty">
          아직 등록한 인물이 없습니다. 아래 버튼으로 추가하고, Claude Step1에서 나온 인물 프롬프트를
          붙여넣으세요.
        </p>
      )}

      <ul className="char-list">
        {characters.map((c, i) => (
          <li className={`char${c.saved ? ' is-saved' : ''}`} key={c.id}>
            <div className="char__head">
              <span className="char__no">인물 {i + 1}</span>
              <label className="inline-check">
                <input
                  type="checkbox"
                  checked={c.saved}
                  onChange={(e) => update(c.id, { saved: e.target.checked })}
                />
                Flow에 저장 완료
              </label>
              <button
                type="button"
                className="ghost-btn ghost-btn--danger"
                onClick={() => remove(c.id)}
                aria-label={`인물 ${i + 1} 삭제`}
              >
                삭제
              </button>
            </div>
            <Field
              label="이름 (NamePicker 확정본)"
              value={c.name}
              onChange={(v) => update(c.id, { name: v })}
              placeholder="예: 해주"
            />
            <TextArea
              label="Flow 인물 프롬프트"
              value={c.prompt}
              onChange={(v) => update(c.id, { prompt: v })}
              placeholder="Claude Step1에서 나온 영어 프롬프트"
              rows={3}
            />
            <div className="char__foot">
              <CopyButton text={c.prompt} label="프롬프트 복사" />
              <CopyButton text={c.name ? `@${c.name}` : ''} label="@태그 복사" />
            </div>
          </li>
        ))}
      </ul>

      <button type="button" className="primary-btn" onClick={add}>
        인물 추가
      </button>
    </section>
  );
}

/**
 * 40장면 생성 큐.
 * 강의: 이미지당 2분 간격으로 40장, 약 80분. 돌려놓고 다른 일을 한다.
 * 타이머로 다음 붙여넣기 시점을 알려주고, @태그 누락을 표시한다.
 */
export function SceneQueue() {
  const { state, setScenes, setField } = useStore();
  const { scenes, sceneIntervalSec } = state;

  const [raw, setRaw] = useState('');
  const [importError, setImportError] = useState('');

  // 다음 이미지 생성까지 남은 초
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    },
    [],
  );

  const startTimer = useCallback(() => {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    setRemaining(sceneIntervalSec);
    intervalRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
          intervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [sceneIntervalSec]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRemaining(0);
  }, []);

  const importScenes = useCallback(() => {
    const parsed = parseScenePrompts(raw);
    if (parsed.length === 0) {
      setImportError('장면을 찾지 못했습니다. 번호(1. 2. …)나 빈 줄로 구분된 형태인지 확인해 주세요.');
      return;
    }
    const items: SceneItem[] = parsed.map((p, i) => ({
      id: makeId('scene'),
      index: i + 1,
      intensity: p.intensity,
      prompt: p.prompt,
      done: false,
      tagVerified: hasCharacterTag(p.prompt),
    }));
    setScenes(items);
    setImportError('');
    setRaw('');
  }, [raw, setScenes]);

  const update = useCallback(
    (id: string, patch: Partial<SceneItem>) => {
      setScenes(scenes.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    },
    [scenes, setScenes],
  );

  const stats = useMemo(() => {
    const done = scenes.filter((s) => s.done).length;
    const missingTag = scenes.filter((s) => !s.tagVerified).length;
    const byIntensity = { H: 0, M: 0, L: 0 };
    for (const s of scenes) byIntensity[s.intensity] += 1;
    const remainingCount = scenes.length - done;
    return {
      done,
      missingTag,
      byIntensity,
      etaSeconds: remainingCount * sceneIntervalSec,
    };
  }, [scenes, sceneIntervalSec]);

  // 아직 생성하지 않은 다음 장면
  const nextScene = scenes.find((s) => !s.done);

  return (
    <section className="widget" aria-labelledby="scenes-title">
      <h3 className="widget__title" id="scenes-title">
        장면 큐 — {stats.done}/{scenes.length || TARGET_SCENES}장 완료
      </h3>
      <p className="widget__desc">
        Claude가 만든 40장면 프롬프트를 붙여넣으면 자동으로 분리됩니다. 이미지 1장 생성에 1분이지만
        강의는 <strong>2분 간격</strong>을 권장합니다. Flow가 무료로 풀어준 자원이라 과하게 쓰면 제한이 걸립니다.
      </p>

      {scenes.length === 0 ? (
        <>
          <TextArea
            label="40장면 프롬프트 전체 붙여넣기"
            value={raw}
            onChange={setRaw}
            placeholder={'1. [H] A dimly lit Joseon-era kitchen... @해주\n\n2. [M] ...'}
            rows={8}
          />
          {importError && (
            <p className="alert alert--warn" role="alert">
              {importError}
            </p>
          )}
          <button type="button" className="primary-btn" onClick={importScenes} disabled={!raw.trim()}>
            장면 불러오기
          </button>
        </>
      ) : (
        <>
          <div className="stat-row">
            <div className="stat">
              <span className="stat__value">{scenes.length}</span>
              <span className="stat__label">전체 장면</span>
            </div>
            <div className="stat">
              <span className="stat__value">
                H{stats.byIntensity.H} · M{stats.byIntensity.M} · L{stats.byIntensity.L}
              </span>
              <span className="stat__label">강도 분배 (강의: H8/M16/L16)</span>
            </div>
            <div className="stat">
              <span className="stat__value">{formatDuration(stats.etaSeconds)}</span>
              <span className="stat__label">남은 예상 시간</span>
            </div>
          </div>

          {stats.missingTag > 0 && (
            <p className="alert alert--warn" role="status">
              <strong>@인물 태그가 없는 장면 {stats.missingTag}개.</strong> 태그가 빠지면 인물 얼굴이
              바뀝니다. 해당 장면은 Claude에서 다시 받거나 직접 태그를 넣으세요.
            </p>
          )}

          <div className="timer-bar">
            <div className="timer-bar__info">
              <Field
                label="생성 간격(초)"
                type="number"
                value={String(sceneIntervalSec)}
                onChange={(v) => {
                  const n = Number.parseInt(v, 10);
                  setField('sceneIntervalSec', Number.isFinite(n) && n > 0 ? n : 120);
                }}
              />
              <div className="timer-bar__readout" aria-live="polite">
                {remaining > 0 ? (
                  <>
                    <span className="timer-bar__count">{remaining}</span>초 후 다음 장면
                  </>
                ) : (
                  <span className="timer-bar__idle">대기 중 아님</span>
                )}
              </div>
            </div>
            <div className="timer-bar__actions">
              <button type="button" className="primary-btn" onClick={startTimer}>
                간격 타이머 시작
              </button>
              <button type="button" className="ghost-btn" onClick={stopTimer}>
                정지
              </button>
            </div>
          </div>

          {nextScene && (
            <div className="next-scene">
              <div className="next-scene__head">
                <span className="badge badge--accent">다음: {nextScene.index}번</span>
                <span className={`badge badge--${nextScene.intensity.toLowerCase()}`}>
                  강도 {nextScene.intensity}
                </span>
                <CopyButton text={nextScene.prompt} label="Flow에 붙여넣기용 복사" />
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => {
                    update(nextScene.id, { done: true });
                    startTimer();
                  }}
                >
                  생성 완료 · 타이머 시작
                </button>
              </div>
              <pre className="next-scene__prompt">{nextScene.prompt}</pre>
            </div>
          )}

          <ol className="scene-list">
            {scenes.map((s) => (
              <li className={`scene${s.done ? ' is-done' : ''}`} key={s.id}>
                <label className="scene__check">
                  <input
                    type="checkbox"
                    checked={s.done}
                    onChange={(e) => update(s.id, { done: e.target.checked })}
                    aria-label={`${s.index}번 장면 완료`}
                  />
                  <span className="scene__no">{s.index}</span>
                </label>
                <span className={`badge badge--${s.intensity.toLowerCase()}`}>{s.intensity}</span>
                <span className="scene__text">{s.prompt.slice(0, 70)}</span>
                {!s.tagVerified && (
                  <span className="badge badge--warn" title="@인물 태그 없음">
                    태그 없음
                  </span>
                )}
                <CopyButton text={s.prompt} label="복사" />
              </li>
            ))}
          </ol>

          <button
            type="button"
            className="ghost-btn ghost-btn--danger"
            onClick={() => setScenes([])}
          >
            장면 목록 비우기
          </button>
        </>
      )}
    </section>
  );
}
