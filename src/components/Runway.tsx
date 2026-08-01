import { useMemo, useState } from 'react';
import {
  calcRunway,
  DEFAULT_USD_KRW,
  fullMonthlyCost,
  krwOf,
  minimumMonthlyCost,
  monthsToRecoup,
  SETUP_GATES,
  STARTUP_COSTS,
  USD_KRW_NOTE,
  watchHoursPerView,
  YPP_REQUIREMENTS,
} from '../lib/runway';
import { calcRevenue } from '../lib/revenue';
import { formatKrw } from '../lib/text';
import { Field } from './ui';
import { Note } from './Note';

/**
 * 채널 개설부터 첫 지급까지의 관문.
 * 처음 시작하는 사람이 무엇을 거쳐야 하는지, 각 단계에 얼마가 드는지 보여준다.
 */
export function SetupGates() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setChecked((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  return (
    <div className="widget">
      <p className="widget__desc">
        처음 시작하면 제작 전에 관문 {SETUP_GATES.length}개를 거칩니다. 대부분 무료지만{' '}
        <strong>수익화 요건 달성</strong> 하나가 수개월에서 1년 이상 걸립니다. 그 기간에는 수익이
        0원이고 도구 비용은 계속 나갑니다.
      </p>

      <ol className="gate-list">
        {SETUP_GATES.map((g, i) => {
          const on = checked.has(g.id);
          const isLong = g.id === 'threshold';
          return (
            <li className={`gate${on ? ' is-on' : ''}${isLong ? ' is-long' : ''}`} key={g.id}>
              <label className="gate__head">
                <input type="checkbox" checked={on} onChange={() => toggle(g.id)} />
                <span className="gate__no">{i + 1}</span>
                <span className="gate__name">{g.name}</span>
                <span className="gate__cost">{g.cost}</span>
                <span className="gate__dur">{g.duration}</span>
              </label>
              <p className="gate__what">{g.what}</p>
              {g.risk && (
                <p className="gate__risk">
                  <span aria-hidden="true">⚠</span> {g.risk}
                </p>
              )}
              {g.source && (
                <p className="gate__src">
                  <a href={g.source} target="_blank" rel="noreferrer noopener">
                    공식 문서 ↗
                  </a>
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <Note tone="warn" strong>
        수익화 요건은 <strong>구독자 {YPP_REQUIREMENTS.subscribers.toLocaleString('ko-KR')}명</strong>
        과 <strong>최근 {YPP_REQUIREMENTS.watchHourWindowMonths}개월 유효 공개 시청시간{' '}
        {YPP_REQUIREMENTS.watchHours.toLocaleString('ko-KR')}시간</strong>입니다. Shorts 경로는 구독자
        1,000명 + 90일간 조회 1,000만 회이며, <strong>Shorts 피드 시청시간은 4,000시간에 포함되지
        않습니다.</strong>
      </Note>
    </div>
  );
}

/**
 * 수익화 도달 계산기.
 *
 * 이 앱의 손익 시뮬레이터가 답하지 않던 질문에 답한다.
 * "수익화까지 몇 달이 걸리고, 그동안 얼마를 쓰게 되는가"
 */
export function RunwayCalculator() {
  const [videos, setVideos] = useState('12');
  const [runtime, setRuntime] = useState('120');
  const [views, setViews] = useState('1000');
  const [retention, setRetention] = useState('20');
  const [subRate, setSubRate] = useState('0.5');
  const [curSubs, setCurSubs] = useState('0');
  const [curHours, setCurHours] = useState('0');
  const [useMin, setUseMin] = useState(false);
  const [rpm, setRpm] = useState('2200');

  const monthlyCost = useMin ? minimumMonthlyCost() : fullMonthlyCost();

  const input = useMemo(
    () => ({
      videosPerMonth: Number.parseInt(videos, 10) || 0,
      runtimeMinutes: Number.parseInt(runtime, 10) || 0,
      viewsPerVideo: Number.parseInt(views, 10) || 0,
      retentionPercent: Number.parseFloat(retention) || 0,
      subscribeRatePercent: Number.parseFloat(subRate) || 0,
      monthlyCostKrw: monthlyCost,
      costPerVideoKrw: 1500,
      currentSubscribers: Number.parseInt(curSubs, 10) || 0,
      currentWatchHours: Number.parseInt(curHours, 10) || 0,
    }),
    [videos, runtime, views, retention, subRate, monthlyCost, curSubs, curHours],
  );

  const r = useMemo(() => calcRunway(input), [input]);

  /** 수익화 이후 월 순이익과 회수 기간 */
  const after = useMemo(() => {
    const rev = calcRevenue({
      monthlyCostKrw: monthlyCost,
      videosPerMonth: input.videosPerMonth,
      viewsPerVideo: input.viewsPerVideo,
      rpmKrw: Number.parseInt(rpm, 10) || 0,
      costPerVideoKrw: 1500,
    });
    const recoup =
      r.sunkCostKrw !== null ? monthsToRecoup(r.sunkCostKrw, rev.monthlyProfitKrw) : null;
    return { rev, recoup };
  }, [input, monthlyCost, rpm, r.sunkCostKrw]);

  const hpv = watchHoursPerView(input.runtimeMinutes, input.retentionPercent);

  return (
    <div className="widget">
      <p className="widget__desc">
        수익화까지 <strong>몇 달이 걸리고 그동안 얼마를 쓰는지</strong> 계산합니다. 조회수와 지속률은
        자기 채널의 Studio에서 확인한 값을 넣으세요. 없으면 신규 채널 기준으로 낮게 잡아 보십시오.
      </p>

      <div className="seg" style={{ marginBottom: 'var(--s3)' }}>
        <button
          type="button"
          className={`seg__btn${useMin ? '' : ' is-active'}`}
          onClick={() => setUseMin(false)}
        >
          전체 구성 {formatKrw(fullMonthlyCost())}
        </button>
        <button
          type="button"
          className={`seg__btn${useMin ? ' is-active' : ''}`}
          onClick={() => setUseMin(true)}
        >
          최소 구성 {formatKrw(minimumMonthlyCost())}
        </button>
      </div>

      <div className="draft-grid">
        <Field label="월 제작 편수" type="number" value={videos} onChange={setVideos} />
        <Field label="편당 러닝타임(분)" type="number" value={runtime} onChange={setRuntime} />
        <Field
          label="편당 누적 조회수"
          type="number"
          value={views}
          onChange={setViews}
          hint="신규 채널은 수백 회가 흔합니다"
        />
        <Field
          label="평균 시청 지속률(%)"
          value={retention}
          onChange={setRetention}
          hint="롱폼은 15~30%가 흔합니다"
        />
        <Field
          label="구독 전환율(%)"
          value={subRate}
          onChange={setSubRate}
          hint="조회 100회당 구독 수. 배경 청취는 낮습니다"
        />
        <Field label="현재 구독자" type="number" value={curSubs} onChange={setCurSubs} />
        <Field label="현재 시청시간" type="number" value={curHours} onChange={setCurHours} />
      </div>

      <div className="stat-row">
        <div className="stat">
          <span className="stat__value">{hpv.toFixed(2)}</span>
          <span className="stat__label">조회 1회당 시청시간</span>
        </div>
        <div className="stat">
          <span className="stat__value">
            {Math.round(r.monthlyWatchHours).toLocaleString('ko-KR')}
          </span>
          <span className="stat__label">월 시청시간</span>
        </div>
        <div className="stat">
          <span className="stat__value">
            {Math.round(r.monthlySubscribers).toLocaleString('ko-KR')}
          </span>
          <span className="stat__label">월 구독자</span>
        </div>
      </div>

      {r.monthsToEligible === null ? (
        <Note tone="warn" strong>
          {r.blocker}
        </Note>
      ) : (
        <>
          <div className="runway">
            <div className="runway__row">
              <span className="runway__label">
                시청시간 {YPP_REQUIREMENTS.watchHours.toLocaleString('ko-KR')}시간
              </span>
              <span
                className={`runway__val${r.bottleneck === 'watchHours' || r.bottleneck === 'both' ? ' is-bottleneck' : ''}`}
              >
                {r.monthsToWatchHours}개월
              </span>
            </div>
            <div className="runway__row">
              <span className="runway__label">
                구독자 {YPP_REQUIREMENTS.subscribers.toLocaleString('ko-KR')}명
              </span>
              <span
                className={`runway__val${r.bottleneck === 'subscribers' || r.bottleneck === 'both' ? ' is-bottleneck' : ''}`}
              >
                {r.monthsToSubscribers}개월
              </span>
            </div>
            <div className="runway__row runway__row--sum">
              <span className="runway__label">심사 {YPP_REQUIREMENTS.reviewMonths}개월 포함</span>
              <span className="runway__val runway__val--big">{r.monthsToMonetized}개월</span>
            </div>
          </div>

          <div className="stat-row">
            <div className="stat">
              <span className="stat__value is-off">{formatKrw(r.sunkCostKrw ?? 0)}</span>
              <span className="stat__label">수익화 전 누적 지출</span>
            </div>
            <div className="stat">
              <span className="stat__value">{r.videosUntilMonetized}편</span>
              <span className="stat__label">그때까지 만들 영상</span>
            </div>
            <div className="stat">
              <span className="stat__value">
                {after.rev.monthlyProfitKrw > 0 ? formatKrw(after.rev.monthlyProfitKrw) : '적자'}
              </span>
              <span className="stat__label">수익화 후 월 순이익</span>
            </div>
            <div className="stat">
              <span className="stat__value">
                {after.recoup !== null ? `${after.recoup}개월` : '회수 불가'}
              </span>
              <span className="stat__label">투자 회수 기간</span>
            </div>
          </div>

          <div className="widget__controls">
            <Field label="수익화 후 RPM(원)" type="number" value={rpm} onChange={setRpm} />
          </div>

          <Note tone={r.bottleneck === 'subscribers' ? 'warn' : 'info'} strong>
            {r.bottleneck === 'subscribers' && (
              <>
                <strong>구독자가 병목입니다.</strong> 시청시간은 {r.monthsToWatchHours}개월에
                채우지만 구독자는 {r.monthsToSubscribers}개월이 걸립니다. 배경 청취 콘텐츠는 구독
                전환이 낮습니다. 영상 안에서 구독을 요청하거나, 채널 성격을 뚜렷하게 만들어야 합니다.
              </>
            )}
            {r.bottleneck === 'watchHours' && (
              <>
                <strong>시청시간이 병목입니다.</strong> 편수를 늘리거나 지속률을 높여야 합니다.
                인트로에서 이탈이 크면 지속률이 떨어집니다.
              </>
            )}
            {r.bottleneck === 'both' && (
              <>두 요건이 비슷한 시점에 채워집니다. 현재 계획대로 진행하면 됩니다.</>
            )}
          </Note>

          {r.blocker && (
            <Note tone="warn" strong>
              {r.blocker}
            </Note>
          )}

          {after.recoup !== null && after.recoup > 12 && (
            <Note tone="warn">
              투자 회수까지 {after.recoup}개월이 걸립니다. 수익화 시점부터 세어도 1년이 넘습니다.
              편수나 조회수 가정을 다시 보십시오.
            </Note>
          )}
        </>
      )}

      <Note tone="info">
        단순 선형 모델입니다. 실제로는 조회수가 시간에 따라 비선형으로 쌓이고 알고리즘 노출도
        변합니다. 대략적인 규모를 보는 용도로 쓰세요.
      </Note>
    </div>
  );
}

/** 비용 구성표 */
export function StartupCosts() {
  const [rate, setRate] = useState(String(DEFAULT_USD_KRW));
  const [vat, setVat] = useState(false);
  const usdKrw = Number.parseInt(rate, 10) || DEFAULT_USD_KRW;

  const monthly = STARTUP_COSTS.filter((c) => c.when === '월 반복');
  const oneTime = STARTUP_COSTS.filter((c) => c.when === '일회성');
  const min = minimumMonthlyCost(usdKrw, vat);
  const full = fullMonthlyCost(usdKrw, vat);

  return (
    <div className="widget">
      <p className="widget__desc">
        일회성 비용은 사실상 없습니다. 영상 편집이 아니라 조합이므로 고성능 컴퓨터가 필요하지
        않습니다. 매월 나가는 구독료가 전부입니다. 달러로 결제하는 도구는 환율에 따라 청구액이
        달라지므로 아래에서 환율을 바꿔 보세요.
      </p>

      <div className="widget__controls">
        <Field label="환율 (원/$)" type="number" value={rate} onChange={setRate} />
        <label className="check">
          <input type="checkbox" checked={vat} onChange={(e) => setVat(e.target.checked)} />
          부가세 10% 포함해서 보기
        </label>
      </div>

      <table className="cost-table">
        <thead>
          <tr>
            <th>항목</th>
            <th>정가</th>
            <th>월 청구</th>
            <th>필수</th>
          </tr>
        </thead>
        <tbody>
          {monthly.map((c) => {
            const krw = krwOf(c, usdKrw, vat);
            return (
              <tr key={c.label} className={c.optional ? 'is-optional' : ''}>
                <td>
                  <strong>{c.label}</strong>
                  <span className="cost-note">{c.note}</span>
                  {c.source && (
                    <span className="cost-note">
                      <a href={c.source} target="_blank" rel="noreferrer noopener">
                        가격 출처 ↗
                      </a>
                      {c.lastVerified && ` · ${c.lastVerified} 확인`}
                    </span>
                  )}
                </td>
                <td>{c.usdAmount !== undefined ? `$${c.usdAmount}` : c.amountKrw === 0 ? '—' : '원화'}</td>
                <td className={krw === 0 ? 'is-free' : ''}>{krw === 0 ? '무료' : formatKrw(krw)}</td>
                <td>{c.optional ? '선택' : '필수'}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td>최소 구성 (선택 항목 제외)</td>
            <td colSpan={3}>
              <strong>{formatKrw(min)}</strong> / 월
            </td>
          </tr>
          <tr>
            <td>전체 구성</td>
            <td colSpan={3}>
              <strong>{formatKrw(full)}</strong> / 월
            </td>
          </tr>
        </tfoot>
      </table>

      <Note tone="warn">{USD_KRW_NOTE}</Note>

      {oneTime.length > 0 && (
        <>
          <h4 className="sub-title">일회성</h4>
          <ul className="spec-list">
            {oneTime.map((c) => (
              <li key={c.label}>
                <strong>{c.label}</strong>{' '}
                {c.amountKrw === 0 ? '추가 비용 없음' : formatKrw(c.amountKrw)}
                {c.note && ` — ${c.note}`}
              </li>
            ))}
          </ul>
        </>
      )}

      <Note tone="info" strong>
        첫 달은 <strong>최소 구성 {formatKrw(min)}</strong>으로 시작하세요. 인트로 영상을 정지
        이미지로 대체하면 Grok을 생략할 수 있습니다. 수익화가 승인된 뒤에 늘리는 편이 안전합니다.
      </Note>
    </div>
  );
}
