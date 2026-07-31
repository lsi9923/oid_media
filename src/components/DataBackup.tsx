import { useCallback, useRef, useState } from 'react';
import { useStore } from '../state/store';
import type { AppState } from '../types';

/**
 * 작업 내용 내보내기·가져오기.
 *
 * 모든 데이터가 브라우저 localStorage에만 있으므로,
 * 브라우저 데이터를 지우거나 다른 기기로 옮기면 46,000자 대본이 사라진다.
 * 백엔드가 없는 구조에서 데이터 유실을 막는 유일한 방법이 파일 내보내기다.
 */
export function DataBackup() {
  const { state, importState } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState<AppState | null>(null);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `oid-media-백업-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage('백업 파일을 내려받았습니다.');
    window.setTimeout(() => setMessage(''), 4000);
  }, [state]);

  const exportScript = useCallback(() => {
    if (!state.script.trim()) {
      setMessage('저장된 대본이 없습니다.');
      window.setTimeout(() => setMessage(''), 4000);
      return;
    }
    const title = state.projectTitle.trim() || '대본';
    const blob = new Blob([state.script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage('대본을 텍스트 파일로 내려받았습니다.');
    window.setTimeout(() => setMessage(''), 4000);
  }, [state.script, state.projectTitle]);

  const pickFile = useCallback(() => fileRef.current?.click(), []);

  const onFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as unknown;
        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('형식이 올바르지 않습니다');
        }
        // 최소한의 형태 확인. 다른 앱의 JSON을 실수로 넣는 것을 막는다
        const obj = parsed as Partial<AppState>;
        const looksRight =
          'completedSteps' in obj || 'checks' in obj || 'claudeProjects' in obj || 'script' in obj;
        if (!looksRight) {
          throw new Error('이 앱의 백업 파일이 아닙니다');
        }
        setPending(obj as AppState);
        setMessage('');
      } catch (err) {
        setPending(null);
        setMessage(`불러오지 못했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      }
    };
    reader.onerror = () => setMessage('파일을 읽지 못했습니다.');
    reader.readAsText(file, 'utf-8');
    // 같은 파일을 다시 고를 수 있게 초기화
    e.target.value = '';
  }, []);

  const confirmImport = useCallback(() => {
    if (!pending) return;
    importState(pending);
    setPending(null);
    setMessage('불러왔습니다. 현재 작업 내용을 덮어썼습니다.');
    window.setTimeout(() => setMessage(''), 5000);
  }, [pending, importState]);

  const scriptChars = state.script.trim().length;

  return (
    <section className="widget" aria-labelledby="backup-title">
      <h3 className="widget__title" id="backup-title">
        작업 내용 백업
      </h3>
      <p className="widget__desc">
        이 앱은 백엔드가 없어 모든 내용이 <strong>브라우저에만</strong> 저장됩니다. 브라우저 데이터를 지우거나
        다른 기기에서 이어 작업하려면 파일로 내보내야 합니다.
      </p>

      <div className="stat-row">
        <div className="stat">
          <span className="stat__value">{scriptChars.toLocaleString('ko-KR')}</span>
          <span className="stat__label">대본 글자수</span>
        </div>
        <div className="stat">
          <span className="stat__value">{state.scenes.length}</span>
          <span className="stat__label">장면 기록</span>
        </div>
        <div className="stat">
          <span className="stat__value">{state.episodes.length}</span>
          <span className="stat__label">영상 이력</span>
        </div>
        <div className="stat">
          <span className="stat__value">{state.completedSteps.length}</span>
          <span className="stat__label">완료 단계</span>
        </div>
      </div>

      <div className="widget__footer" style={{ marginTop: 0 }}>
        <button type="button" className="primary-btn" onClick={exportJson}>
          전체 백업 내보내기 (.json)
        </button>
        <button type="button" className="ghost-btn" onClick={exportScript}>
          대본만 내보내기 (.txt)
        </button>
        <button type="button" className="ghost-btn" onClick={pickFile}>
          백업 불러오기
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          hidden
          aria-hidden="true"
        />
      </div>

      {message && (
        <p className="alert alert--info" role="status">
          {message}
        </p>
      )}

      {pending && (
        <div className="import-confirm">
          <p>
            불러올 백업에 대본 <strong>{(pending.script ?? '').trim().length.toLocaleString('ko-KR')}자</strong>,
            장면 <strong>{pending.scenes?.length ?? 0}개</strong>, 영상 이력{' '}
            <strong>{pending.episodes?.length ?? 0}건</strong>이 있습니다.
          </p>
          <p className="import-confirm__warn">
            불러오면 <strong>현재 작업 내용을 모두 덮어씁니다.</strong> 지금 내용을 먼저 백업하시려면 위
            버튼을 쓰세요.
          </p>
          <div className="widget__footer" style={{ marginTop: '0.6rem' }}>
            <button type="button" className="primary-btn" onClick={confirmImport}>
              덮어쓰고 불러오기
            </button>
            <button type="button" className="ghost-btn" onClick={() => setPending(null)}>
              취소
            </button>
          </div>
        </div>
      )}

      <p className="alert alert--warn">
        대본 생성에 15~20분이 걸립니다. 다 만든 뒤에는 바로 내보내 두세요. 브라우저 저장소는 용량 한도가
        있어 대본이 매우 길면 저장이 실패할 수도 있습니다.
      </p>
    </section>
  );
}
