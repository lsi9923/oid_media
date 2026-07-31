import { useCallback, useMemo, useState } from 'react';
import { PROMPT_ASSETS, type PromptAsset } from '../data/prompts';
import { CopyButton } from './ui';

/** 텍스트를 .txt 파일로 내려받는다. */
function downloadText(fileName: string, body: string): void {
  const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const TARGET_LABEL: Record<PromptAsset['target'], string> = {
  'claude-instructions': '지침 칸',
  'claude-file': '파일 업로드',
  'vrew-agent': 'Vrew 에이전트',
  reference: '참고 문서',
};

/**
 * 프롬프트 라이브러리.
 * 9개 프롬프트를 복사하거나 .txt로 내려받아 Claude 프로젝트에 그대로 설치한다.
 */
export function PromptLibrary({ filterProject }: { filterProject?: PromptAsset['project'] }) {
  const assets = useMemo(
    () => (filterProject ? PROMPT_ASSETS.filter((p) => p.project === filterProject) : PROMPT_ASSETS),
    [filterProject],
  );

  const [openId, setOpenId] = useState<string | null>(null);

  const downloadAll = useCallback(() => {
    // 브라우저가 연속 다운로드를 차단하지 않도록 간격을 둔다.
    assets.forEach((asset, i) => {
      window.setTimeout(() => downloadText(asset.fileName, asset.body), i * 350);
    });
  }, [assets]);

  return (
    <section className="widget" aria-labelledby="prompts-lib-title">
      <h3 className="widget__title" id="prompts-lib-title">
        프롬프트 {assets.length}개
        {filterProject ? ` — ${filterProject}` : ''}
      </h3>
      <p className="widget__desc">
        각 프롬프트를 복사하거나 <code>.txt</code>로 내려받아 지정된 위치에 넣으세요.{' '}
        <strong>지침 칸</strong>과 <strong>파일 업로드</strong>를 구분하는 것이 중요합니다. 이 둘을 섞으면
        작동하지 않습니다.
      </p>

      <div className="widget__footer" style={{ marginTop: 0, marginBottom: '1rem' }}>
        <button type="button" className="primary-btn" onClick={downloadAll}>
          {assets.length}개 전부 .txt로 받기
        </button>
      </div>

      <ul className="asset-list">
        {assets.map((asset) => {
          const isOpen = openId === asset.id;
          return (
            <li className="asset" key={asset.id}>
              <div className="asset__head">
                <div className="asset__ident">
                  <span className="asset__title">{asset.title}</span>
                  <div className="asset__badges">
                    <span className="badge">{asset.project}</span>
                    <span
                      className={`badge${
                        asset.target === 'claude-instructions'
                          ? ' badge--accent'
                          : asset.target === 'claude-file'
                            ? ' badge--ok'
                            : ''
                      }`}
                    >
                      {TARGET_LABEL[asset.target]}
                    </span>
                    <span className="badge">{asset.body.length.toLocaleString('ko-KR')}자</span>
                  </div>
                </div>
                <div className="asset__actions">
                  <CopyButton text={asset.body} label="복사" />
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => downloadText(asset.fileName, asset.body)}
                  >
                    .txt
                  </button>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setOpenId(isOpen ? null : asset.id)}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? '접기' : '내용 보기'}
                  </button>
                </div>
              </div>

              <p className="asset__role">{asset.role}</p>
              <p className="asset__install">
                <span aria-hidden="true">→</span> {asset.install}
              </p>

              {isOpen && <pre className="asset__body">{asset.body}</pre>}
            </li>
          );
        })}
      </ul>

      <p className="alert alert--warn">
        이 프롬프트는 강의 명세를 바탕으로 새로 작성한 것입니다. 강의 제작자의 원본 자료가 아니며, 원본을
        받으셨다면 그것을 쓰시는 편이 낫습니다. 검증된 실적이 있는 자료이기 때문입니다.
      </p>
    </section>
  );
}
