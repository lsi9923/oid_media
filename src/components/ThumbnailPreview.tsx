import { useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { Field } from './ui';

/**
 * 썸네일 가독성 시뮬레이터.
 *
 * 강의는 "휴대전화에서 엄지손톱 크기로 축소해 보라"는 검사를 제시하지만,
 * 실제로 그렇게 확인하는 도구는 없다. 만들고 나서야 알게 된다.
 *
 * 카피를 입력하면 YouTube가 실제로 노출하는 크기로 미리 보여준다.
 * 프롬프트가 지정한 스타일 수치(흰 글자, 외곽선, 채도 최대)를 그대로 적용한다.
 */

/** YouTube가 실제로 쓰는 썸네일 노출 폭 (px) */
const SIZES = [
  { id: 'sidebar', label: '추천 사이드바', width: 168, note: '가장 작게 노출되는 자리' },
  { id: 'mobile', label: '모바일 피드', width: 210, note: '가장 많은 노출이 일어나는 자리' },
  { id: 'search', label: '검색 결과', width: 360, note: '의도를 갖고 찾아온 시청자' },
] as const;

/** 강조할 단어를 뽑는다. 없으면 첫 어절 */
function splitEmphasis(copy: string, emphasis: string): { before: string; hit: string; after: string } {
  const e = emphasis.trim();
  if (!e) return { before: copy, hit: '', after: '' };
  const idx = copy.indexOf(e);
  if (idx < 0) return { before: copy, hit: '', after: '' };
  return {
    before: copy.slice(0, idx),
    hit: e,
    after: copy.slice(idx + e.length),
  };
}

export function ThumbnailPreview() {
  const { state } = useStore();
  const selected = state.thumbnailCopies.find((c) => c.selected);

  const [copy, setCopy] = useState('');
  const [emphasis, setEmphasis] = useState('');
  const [lines, setLines] = useState('2');

  const text = copy.trim() || selected?.text || '';
  const lineCount = Math.max(1, Math.min(3, Number.parseInt(lines, 10) || 2));

  /** 줄 단위로 나눈다. 어절 경계를 지킨다 */
  const rows = useMemo(() => {
    if (!text) return [];
    if (lineCount === 1) return [text];
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= 1) return [text];

    const perLine = Math.ceil(words.length / lineCount);
    const out: string[] = [];
    for (let i = 0; i < words.length; i += perLine) {
      out.push(words.slice(i, i + perLine).join(' '));
    }
    return out.slice(0, lineCount);
  }, [text, lineCount]);

  const noSpace = text.replace(/\s/g, '').length;
  const longestRow = rows.reduce((m, r) => Math.max(m, r.replace(/\s/g, '').length), 0);

  /** 길이 판정. 강의 기준 18자, 한 줄 9자 */
  const lengthVerdict = useMemo(() => {
    if (!text) return null;
    if (noSpace > 18) return { ok: false, msg: `${noSpace}자. 18자를 넘으면 작은 화면에서 읽히지 않습니다.` };
    if (longestRow > 10)
      return { ok: false, msg: `가장 긴 줄이 ${longestRow}자입니다. 한 줄 9자 안쪽이 목표입니다.` };
    return { ok: true, msg: `${noSpace}자, 가장 긴 줄 ${longestRow}자. 적정합니다.` };
  }, [text, noSpace, longestRow]);

  const parts = splitEmphasis(text, emphasis);

  return (
    <section className="widget" aria-labelledby="thumb-prev-title">
      <h3 className="widget__title" id="thumb-prev-title">
        썸네일 가독성 시뮬레이터
      </h3>
      <p className="widget__desc">
        강의는 "엄지손톱 크기로 축소해 읽히는지 보라"고 합니다. 만들고 나서 확인하면 늦습니다. 여기서
        먼저 보세요. YouTube가 실제로 노출하는 세 가지 크기로 보여줍니다.
      </p>

      <div className="draft-grid">
        <Field
          label="카피 (비우면 선택한 카피를 씁니다)"
          value={copy}
          onChange={setCopy}
          placeholder={selected?.text || '굶겨 죽인다던 시어머니'}
        />
        <Field
          label="강조할 단어"
          value={emphasis}
          onChange={setEmphasis}
          placeholder="시어머니"
          hint="한두 단어만. 전부 강조하면 강조가 없습니다"
        />
        <Field label="줄 수 (1~3)" type="number" value={lines} onChange={setLines} />
      </div>

      {!text ? (
        <p className="empty">
          카피를 입력하거나, <strong>카피 후보 받고 고르기</strong> 단계에서 하나를 선택하세요.
        </p>
      ) : (
        <>
          {lengthVerdict && (
            <p className={`alert ${lengthVerdict.ok ? 'alert--ok' : 'alert--warn'}`}>
              {lengthVerdict.msg}
            </p>
          )}

          <div className="thumb-row">
            {SIZES.map((s) => (
              <figure className="thumb-fig" key={s.id}>
                <div
                  className="thumb-canvas"
                  style={{ width: `${s.width}px`, height: `${Math.round((s.width * 9) / 16)}px` }}
                  aria-hidden="true"
                >
                  <div className="thumb-canvas__bg" />
                  <div
                    className="thumb-canvas__text"
                    style={{
                      // 캔버스 높이의 약 1/5을 한 줄 높이로 잡는다
                      fontSize: `${Math.max(8, Math.round(((s.width * 9) / 16) / (lineCount * 2.6)))}px`,
                    }}
                  >
                    {rows.map((r, i) => {
                      // 강조 단어가 이 줄에 있으면 색을 바꾼다
                      const hitInRow = parts.hit && r.includes(parts.hit);
                      if (!hitInRow) {
                        return (
                          <span className="thumb-line" key={`r${i}`}>
                            {r}
                          </span>
                        );
                      }
                      const at = r.indexOf(parts.hit);
                      return (
                        <span className="thumb-line" key={`r${i}`}>
                          {r.slice(0, at)}
                          <em className="thumb-em">{parts.hit}</em>
                          {r.slice(at + parts.hit.length)}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <figcaption className="thumb-cap">
                  <strong>{s.label}</strong> {s.width}px
                  <span>{s.note}</span>
                </figcaption>
              </figure>
            ))}
          </div>

          <p className="alert alert--info">
            가장 왼쪽(168px)에서 읽히지 않으면 카피를 줄이거나 줄 수를 바꾸세요. 실제 배경 이미지는
            더 복잡하므로, 여기서 겨우 읽히는 정도면 실전에서는 안 읽힙니다.
          </p>

          <h4 className="sub-title">미리캔버스 적용 수치</h4>
          <ul className="spec-list">
            <li>
              캔버스 <code>1280 × 720</code>
            </li>
            <li>
              글자색 <code>흰색</code> · 외곽선 <code>검정, 두께 50</code>
            </li>
            <li>
              서체 <code>수정해정체</code> 또는 명조 계열 굵게. 현대적 고딕은 분위기가 죽습니다
            </li>
            <li>
              자간 <code>-5</code> · 줄간격 좁게
            </li>
            <li>
              강조색 <code>채도 최대</code>, 밝은 노랑 또는 밝은 연두
            </li>
            <li>
              저장 <code>JPG</code>
            </li>
          </ul>
        </>
      )}
    </section>
  );
}
