import { useMemo, useState } from 'react';
import {
  calcRevenue,
  estimateRuntime,
  formatRuntime,
  planForTarget,
  RPM_SCENARIOS,
  TTS_SPEED,
  type TtsSpeed,
} from '../lib/revenue';
import { formatKrw } from '../lib/text';
import { totalMonthlyCost } from '../data/tools';
import { useStore } from '../state/store';
import { Field } from './ui';

/**
 * 손익 시뮬레이터.
 *
 * 이 앱이 지금까지 답하지 않은 질문에 답한다.
 * "이걸 하면 언제부터 남는가", "월 300만원은 어떤 규모인가"
 */
export function RevenueSimulator() {
  const [videos, setVideos] = useState('20');
  const [views, setViews] = useState('5000');
  const [rpm, setRpm] = useState('2200');
  const [perVideo, setPerVideo] = useState('1500');
  const [hours, setHours] = useState('1');
  const [target, setTarget] = useState('3000000');

  const input = useMemo(
    () => ({
      monthlyCostKrw: totalMonthlyCost(),
      videosPerMonth: Number.parseInt(videos, 10) || 0,
      viewsPerVideo: Number.parseInt(views, 10) || 0,
      rpmKrw: Number.parseInt(rpm, 10) || 0,
      costPerVideoKrw: Number.parseInt(perVideo, 10) || 0,
    }),
    [videos, views, rpm, perVideo],
  );

  const hoursNum = Number.parseFloat(hours);
  const result = useMemo(
    () => calcRevenue(input, Number.isFinite(hoursNum) && hoursNum > 0 ? hoursNum : undefined),
    [input, hoursNum],
  );

  const plan = useMemo(
    () => planForTarget(input, Number.parseInt(target, 10) || 0),
    [input, target],
  );

  return (
    <section className="widget" aria-labelledby="sim-title">
      <h3 className="widget__title" id="sim-title">
        손익 시뮬레이터
      </h3>
      <p className="widget__desc">
        강의는 특정 사례만 제시합니다. 자기 조건을 넣어 <strong>언제부터 남는지</strong> 직접
        계산하세요. RPM은 아래 시나리오 버튼으로 바꿔 볼 수 있습니다.
      </p>

      <div className="seg" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
        {RPM_SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`seg__btn${rpm === String(s.rpmKrw) ? ' is-active' : ''}`}
            onClick={() => setRpm(String(s.rpmKrw))}
            title={s.note}
          >
            {s.label} {s.rpmKrw.toLocaleString('ko-KR')}
          </button>
        ))}
      </div>

      <div className="draft-grid">
        <Field label="월 제작 편수" type="number" value={videos} onChange={setVideos} />
        <Field label="편당 월 조회수" type="number" value={views} onChange={setViews} />
        <Field
          label="RPM (원/1,000회)"
          type="number"
          value={rpm}
          onChange={setRpm}
          hint="한국 시청자 기반은 1,500~3,500이 흔합니다"
        />
        <Field label="편당 제작 원가(원)" type="number" value={perVideo} onChange={setPerVideo} />
        <Field
          label="편당 사람 작업 시간"
          value={hours}
          onChange={setHours}
          hint="시간당 수익 계산용"
        />
      </div>

      <div className="stat-row">
        <div className="stat">
          <span className="stat__value">{result.monthlyViews.toLocaleString('ko-KR')}</span>
          <span className="stat__label">월 총 조회수</span>
        </div>
        <div className="stat">
          <span className="stat__value">{formatKrw(result.monthlyRevenueKrw)}</span>
          <span className="stat__label">월 광고 수익</span>
        </div>
        <div className="stat">
          <span className="stat__value">{formatKrw(result.monthlyCostKrw)}</span>
          <span className="stat__label">월 총비용</span>
        </div>
        <div className="stat">
          <span className={`stat__value${result.profitable ? '' : ' is-off'}`}>
            {formatKrw(result.monthlyProfitKrw)}
          </span>
          <span className="stat__label">월 순이익</span>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat">
          <span className="stat__value">{result.breakevenViews.toLocaleString('ko-KR')}</span>
          <span className="stat__label">손익분기 월 조회수</span>
        </div>
        <div className="stat">
          <span className="stat__value">
            {result.breakevenViewsPerVideo.toLocaleString('ko-KR')}
          </span>
          <span className="stat__label">손익분기 편당 조회수</span>
        </div>
        {result.hourlyKrw !== null && (
          <div className="stat">
            <span className={`stat__value${result.hourlyKrw < 10000 ? ' is-off' : ''}`}>
              {formatKrw(result.hourlyKrw)}
            </span>
            <span className="stat__label">시간당 수익</span>
          </div>
        )}
      </div>

      <p className={`alert ${result.profitable ? 'alert--ok' : 'alert--warn'}`}>
        {result.profitable ? (
          <>
            흑자입니다. 편당 {formatKrw(result.profitPerVideoKrw)} 남습니다.
            {result.hourlyKrw !== null && result.hourlyKrw < 10000 && (
              <> 다만 시간당 수익이 최저임금 수준을 밑돕니다. 작업 시간을 줄이거나 편수를 늘려야 합니다.</>
            )}
          </>
        ) : (
          <>
            적자입니다. 손익분기까지 월 {result.breakevenViews.toLocaleString('ko-KR')}회, 편당{' '}
            {result.breakevenViewsPerVideo.toLocaleString('ko-KR')}회가 필요합니다.
          </>
        )}
      </p>

      <h4 className="sub-title">목표 역산</h4>
      <div className="widget__controls">
        <Field label="목표 월 순이익(원)" type="number" value={target} onChange={setTarget} />
      </div>
      <div className="stat-row">
        <div className="stat">
          <span className="stat__value">{plan.requiredMonthlyViews.toLocaleString('ko-KR')}</span>
          <span className="stat__label">필요한 월 조회수</span>
        </div>
        {plan.requiredViewsPerVideo !== null && (
          <div className="stat">
            <span className="stat__value">
              {plan.requiredViewsPerVideo.toLocaleString('ko-KR')}
            </span>
            <span className="stat__label">현재 편수 유지 시 편당 조회수</span>
          </div>
        )}
        {plan.requiredVideos !== null && (
          <div className="stat">
            <span className="stat__value">{plan.requiredVideos.toLocaleString('ko-KR')}</span>
            <span className="stat__label">현재 조회수 유지 시 필요 편수</span>
          </div>
        )}
      </div>
      <p className="alert alert--info">{plan.verdict}</p>

      <p className="alert alert--warn">
        강의 사례(조회수 6만에 80만원)는 RPM 약 13,000원에 해당합니다. 한국 시청자 기반
        엔터테인먼트 콘텐츠에서 일반적인 수준이 아닙니다. 시나리오 버튼으로 두 경우를 비교해 보세요.
      </p>
    </section>
  );
}

/**
 * 러닝타임 계산기.
 * 46,000자가 실제로 몇 시간인지, 중간광고가 몇 개 붙는지 계산한다.
 */
export function RuntimeCalculator() {
  const { state } = useStore();
  const [speed, setSpeed] = useState<TtsSpeed>('normal');
  const [manual, setManual] = useState('');

  const chars = manual.trim()
    ? Number.parseInt(manual, 10) || 0
    : state.script.length;

  const est = useMemo(() => estimateRuntime(chars, speed), [chars, speed]);
  const targetSec = state.targetMinutes * 60;
  const gap = est.seconds - targetSec;

  return (
    <section className="widget" aria-labelledby="rt-title">
      <h3 className="widget__title" id="rt-title">
        러닝타임 계산
      </h3>
      <p className="widget__desc">
        글자수로 실제 영상 길이를 추정합니다. 중간광고는 <strong>8분 이상</strong>에서만 넣을 수
        있고, 길수록 슬롯이 늘어납니다. 슬롯 수는 추정치이며 실제 광고 서빙은 YouTube가 결정합니다.
      </p>

      <div className="seg" style={{ marginBottom: '1rem' }}>
        {(['slow', 'normal', 'fast'] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`seg__btn${speed === s ? ' is-active' : ''}`}
            onClick={() => setSpeed(s)}
          >
            {s === 'slow' ? '느리게' : s === 'normal' ? '보통' : '빠르게'} {TTS_SPEED[s]}자/초
          </button>
        ))}
      </div>

      <div className="widget__controls">
        <Field
          label="글자수 (비우면 저장된 대본 사용)"
          type="number"
          value={manual}
          onChange={setManual}
          placeholder={String(state.script.length)}
        />
      </div>

      <div className="stat-row">
        <div className="stat">
          <span className="stat__value">{chars.toLocaleString('ko-KR')}</span>
          <span className="stat__label">글자수</span>
        </div>
        <div className="stat">
          <span className="stat__value">{est.display}</span>
          <span className="stat__label">추정 러닝타임</span>
        </div>
        <div className="stat">
          <span className={`stat__value${est.midrollEligible ? '' : ' is-off'}`}>
            {est.midrollSlots}
          </span>
          <span className="stat__label">중간광고 슬롯 (추정)</span>
        </div>
      </div>

      {chars > 0 && (
        <p className={`alert ${Math.abs(gap) < 600 ? 'alert--ok' : 'alert--info'}`}>
          목표 {state.targetMinutes}분 대비{' '}
          {gap > 0 ? (
            <>
              <strong>{formatRuntime(gap)} 깁니다.</strong> 길어도 문제는 없습니다. 중간광고가 더
              붙습니다.
            </>
          ) : gap < 0 ? (
            <>
              <strong>{formatRuntime(-gap)} 짧습니다.</strong> 목표에 맞추려면 약{' '}
              {Math.round((-gap * TTS_SPEED[speed]) / 1000) * 1000}자를 더 써야 합니다.
            </>
          ) : (
            '목표와 일치합니다.'
          )}
        </p>
      )}

      {!est.midrollEligible && chars > 0 && (
        <p className="alert alert--warn">
          8분 미만이라 중간광고를 넣을 수 없습니다. 롱폼 수익의 대부분이 중간광고에서 나오므로,
          최소 8분을 넘기세요.
        </p>
      )}
    </section>
  );
}
