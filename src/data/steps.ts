import type { Phase, Step } from '../types';
import { SETUP_GATE_COUNT } from '../lib/runway';

/**
 * 강의(돈버니 채널 · 행크 출연)의 제작 순서를 그대로 옮긴 워크플로우 정의.
 * timestamp는 원본 영상에서 해당 내용이 나오는 지점.
 */

export const PHASES: Phase[] = [
  {
    id: 'decide',
    badge: '?',
    title: '판단',
    goal: '시작할지, 어떤 니치로 갈지, 언제부터 남는지를 먼저 정한다.',
  },
  {
    id: 'policy',
    badge: '!',
    title: '정책 · 리스크',
    goal: '수익화 정책을 확인한다. 이 방식은 두 범주에 걸릴 소지가 있다.',
  },
  {
    id: 'launch',
    badge: '▶',
    title: '채널 개설',
    goal: `계정부터 수익화 승인까지 ${SETUP_GATE_COUNT}개 관문을 거친다. 여기가 가장 오래 걸린다.`,
  },
  {
    id: 'setup',
    badge: '0',
    title: '세팅',
    goal: '도구 결제와 Claude 프로젝트 4개를 만들어 "공장"을 세운다.',
  },
  {
    id: 'script',
    badge: '1',
    title: '대본',
    goal: '주제 선택부터 46,000자 대본과 썸네일 브리프까지 뽑는다.',
  },
  {
    id: 'image',
    badge: '2',
    title: '이미지 40장',
    goal: '인물 5명을 고정하고 본문 장면 이미지 40장을 생성한다.',
  },
  {
    id: 'intro',
    badge: '3',
    title: '인트로 영상',
    goal: '영상 도입 4컷을 Grok으로 만든다. 마케팅의 절반.',
  },
  {
    id: 'thumbnail',
    badge: '4',
    title: '썸네일',
    goal: '카피를 고르고 이미지에 글자를 입혀 JPG로 뽑는다. 마케팅의 나머지 절반.',
  },
  {
    id: 'assemble',
    badge: '5',
    title: 'Vrew 조합',
    goal: 'TTS 음성 + 이미지 40장 + 인트로를 하나의 영상으로 합친다.',
  },
  {
    id: 'publish',
    badge: '6',
    title: '업로드 · 운영',
    goal: 'AI 제작 표시를 하고 올린 뒤, 다채널로 확장한다.',
  },
];

export const STEPS: Step[] = [
  // ─────────────────── Phase ?: 판단 ───────────────────
  {
    id: 'decide-economics',
    phaseId: 'decide',
    title: '손익부터 계산 ★',
    summary:
      '월 8만원 쓰고 언제부터 남는지, 목표 수입에 얼마나 필요한지 먼저 계산합니다. 이걸 모르고 시작하면 안 됩니다.',
    timestamp: '03:01',
    tools: [],
    duration: '15분',
    judgment: true,
    keyPoint:
      '강의 사례(조회수 6만에 80만원)는 RPM(조회 1,000회당 수익) 약 13,000원입니다. 한국 시청자 기반 엔터테인먼트에서 일반적인 수준이 아닙니다. 일반 RPM 2,200원으로 같은 조회수를 넣으면 약 13만원입니다. 여섯 배 차이입니다.',
    actions: [
      '아래 시뮬레이터에서 RPM 시나리오를 "일반적"으로 두고 손익분기를 확인한다.',
      '목표 월수입을 넣어 필요한 조회수를 역산한다.',
      '시간당 수익을 계산해 본다. 편당 작업 시간을 정직하게 넣는다.',
      '"강의 사례" 버튼을 눌러 두 경우를 비교한다. 그 차이가 기대치의 폭이다.',
      '러닝타임 계산기로 46,000자가 실제 몇 시간인지 확인한다.',
    ],
    checklist: [
      { id: 'breakeven', label: '손익분기 조회수를 확인했다' },
      {
        id: 'target',
        label: '목표 월수입에 필요한 조회수를 역산했다',
        warning: '월 300만원은 일반 RPM 기준 월 140만 조회 이상이 필요하다.',
      },
      {
        id: 'hourly',
        label: '시간당 수익을 계산했다',
        warning: '편당 원가는 1~2천원이지만 사람 시간은 공짜가 아니다.',
      },
      { id: 'runtime', label: '러닝타임과 중간광고 슬롯을 확인했다' },
      {
        id: 'slot-caveat',
        label: '슬롯 개수가 수익을 보장하지 않는다는 점을 확인했다',
        warning:
          'YouTube 공식: "Ad slots are not guaranteed to serve ads."(광고 슬롯이 있어도 실제 광고가 재생된다는 보장은 없다.) 슬롯 수 × RPM으로 계산하면 크게 과대추정한다.',
      },
      {
        id: 'cost',
        label: '최소 구성으로 시작할지 검토했다',
        warning: '첫 달은 Claude만으로 시작할 수 있다. 필요해지면 늘리는 편이 낫다.',
      },
    ],
    widgets: ['revenueSimulator', 'runtimeCalculator', 'opsMidroll'],
  },
  {
    id: 'decide-niche',
    phaseId: 'decide',
    title: '니치 선택 ★',
    summary:
      '민담이 최선인지 따져봅니다. 강의 진행자 본인이 "만 명 넘게 배웠다"고 밝혔습니다.',
    timestamp: '09:19',
    tools: [],
    duration: '20분',
    judgment: true,
    keyPoint:
      '같은 프롬프트로 같은 구조의 민담을 만 명이 만들고 있다면, 그것 자체가 정책이 말하는 반복 콘텐츠에 가까워지는 조건입니다. 방법론은 다른 니치에도 쓸 수 있고, 니치마다 정책 위험과 광고 단가가 다릅니다.',
    actions: [
      '아래 비교표에서 정책 안전성·포화도·광고 단가를 함께 본다.',
      '수익화가 막히는 니치 두 개(건강 정보, 고전 낭독)를 먼저 제외한다.',
      '민담을 고르더라도 포화된 니치라는 사실을 알고 시작한다.',
      '조사 부담을 감당할 수 있다면 포화도가 낮은 쪽이 유리하다.',
      '고른 니치에 맞춰 대본 프롬프트의 배경·소재 규칙을 조정한다.',
    ],
    checklist: [
      { id: 'compare', label: '니치 비교표를 읽었다' },
      {
        id: 'blocked',
        label: '수익화 불가 니치를 확인했다',
        warning: 'AI 음성으로 건강·법률·금융·정치 조언은 정책상 수익화가 명시적으로 불가하다.',
      },
      {
        id: 'chosen',
        label: '니치를 정했고 포화도를 알고 있다',
        warning: '포화된 니치에 차별점 없이 들어가면 묻힌다.',
      },
    ],
    widgets: ['nicheAdvisor'],
  },

  // ─────────────────── Phase !: 정책 · 리스크 ───────────────────
  {
    id: 'policy-check',
    phaseId: 'policy',
    title: '수익화 정책 확인 ★',
    summary:
      'YouTube가 2026년 7월 명시한 수익화 불가 3개 범주 중 두 개가 이 방식과 부딪칩니다. 시작 전에 읽으세요.',
    timestamp: '12:47',
    tools: ['youtube'],
    duration: '15분',
    judgment: true,
    keyPoint:
      '강의는 "이야기니까 픽션이라서 안 걸린다"고 설명하지만, 수익화를 막는 것은 허위정보 정책이 아니라 Inauthentic content 정책이고 여기에는 픽션 면제 조항이 없습니다. 금지 예시에 "여러 영상에 매우 비슷한 줄거리 템플릿"이 그대로 적혀 있습니다.',
    actions: [
      '아래 공식 문서 원문과 대응책을 읽는다.',
      '위험도 높음 3개 항목의 대응책을 어떻게 지킬지 정한다.',
      '특히 줄거리 템플릿 변주 계획을 세운다. 이것이 가장 큰 위험이다.',
      '한 계정에 채널을 몇 개까지 둘지 정한다. 제재는 계정 전체로 번질 수 있다.',
    ],
    checklist: [
      { id: 'read', label: '공식 정책 원문 3개 범주를 읽었다' },
      {
        id: 'template',
        label: '줄거리 템플릿을 매번 그대로 쓰지 않기로 계획했다',
        warning: '이것이 가장 큰 위험이다. 주인공만 바꿔 같은 틀을 반복하면 정책 위반 예시에 정확히 해당한다.',
      },
      {
        id: 'accounts',
        label: '계정당 채널 수를 정했다',
        warning: '"all or any of your accounts"에 수익화 정지가 적용될 수 있다.',
      },
      { id: 'reality', label: '한국 CPM 수준을 확인하고 기대 수익을 조정했다' },
      {
        id: 'history',
        label: '영상마다 구조를 기록해 반복을 피하기로 했다',
        warning: '계획만 세우면 지켜지지 않는다. 아래 이력 도구로 관리하는 편이 낫다.',
      },
    ],
    widgets: ['policyRisk', 'lectureDiscrepancies', 'realityCheck', 'episodeHistory'],
  },

  // ─────────────────── Phase ▶: 채널 개설 ───────────────────
  {
    id: 'launch-runway',
    phaseId: 'launch',
    title: '수익화까지 얼마나 걸리나 ★',
    summary:
      '신규 채널은 구독자 1,000명과 시청시간 4,000시간을 먼저 채워야 합니다. 그 기간엔 수익이 0원입니다.',
    timestamp: '03:01',
    tools: ['youtube'],
    duration: '20분',
    judgment: true,
    keyPoint:
      '이 앱의 손익 계산에 원래 빠져 있던 부분입니다. 수익화 승인 전까지는 도구 비용만 나가고 수입은 없습니다. 조회수가 적으면 이 기간이 1년을 넘고, 시청시간은 최근 12개월만 집계되므로 너무 느리면 앞서 쌓은 것이 만료됩니다.',
    actions: [
      '아래 계산기에 자기 조건을 넣어 수익화까지 걸리는 개월을 확인한다.',
      '그 기간의 누적 지출을 확인한다. 이 돈을 감당할 수 있는지 판단한다.',
      '무엇이 병목인지 본다. 롱폼은 대체로 구독자가 병목이다.',
      '투자 회수 기간을 확인한다. 수익화 후에도 회수에 시간이 걸린다.',
      '최소 구성으로 시작할지 정한다.',
    ],
    checklist: [
      {
        id: 'months',
        label: '수익화까지 걸리는 개월을 확인했다',
        warning: '구독자 1,000명 + 시청시간 4,000시간. 심사에 다시 약 1개월이 걸린다.',
      },
      {
        id: 'sunk',
        label: '수익화 전 누적 지출을 확인하고 감당 가능한지 판단했다',
        warning: '이 기간 수익은 0원이다. 조회수가 적으면 수백만원이 될 수 있다.',
      },
      {
        id: 'bottleneck',
        label: '병목이 무엇인지 확인했다',
        warning: '배경 청취 콘텐츠는 구독 전환율이 낮아 구독자가 병목이 되기 쉽다.',
      },
      {
        id: 'window',
        label: '시청시간 12개월 만료 규정을 확인했다',
        warning: '시청시간은 최근 12개월만 집계된다. 속도가 느리면 앞서 쌓은 것이 사라진다.',
      },
      { id: 'recoup', label: '투자 회수 기간을 확인했다' },
    ],
    widgets: ['runwayCalculator', 'startupCosts'],
  },
  {
    id: 'launch-gates',
    phaseId: 'launch',
    title: `관문 ${SETUP_GATE_COUNT}개 통과`,
    summary:
      '구글 계정부터 첫 입금까지 거쳐야 하는 것들입니다. 대부분 무료지만 순서와 누락 주의가 필요합니다.',
    timestamp: '13:20',
    tools: ['youtube'],
    duration: '1시간 + 대기',
    keyPoint:
      '2단계 인증과 고급 기능 인증은 YPP 가입 요건에 명시돼 있는데 놓치기 쉽습니다. 특히 중급 기능이 없으면 15분 넘는 영상을 올릴 수 없어 두 시간짜리 민담을 업로드할 수 없습니다.',
    actions: [
      '구글 계정에 2단계 인증을 켠다.',
      '채널을 만든다. 다채널 계획이 있으면 브랜드 채널(하나의 구글 계정으로 여러 채널을 운영할 수 있는 형태)로 만든다.',
      '전화번호 인증으로 중급(Intermediate) 기능을 받는다. 이것으로 15분 초과 업로드가 가능해진다.',
      '채널 활동이 쌓이면 고급(Advanced) 기능이 자동 부여된다. 급하면 신분증·영상 인증으로 즉시 받을 수 있다.',
      'AdSense(구글 광고 수익 지급 시스템) 세금 정보를 미리 준비한다.',
    ],
    checklist: [
      { id: 'g1', label: '구글 계정 준비 (만 14세 이상, AdSense는 만 19세 이상)' },
      {
        id: 'g2',
        label: '2단계 인증 활성화',
        warning: 'YPP 가입 요건이다. 켜지 않으면 신청 자체가 안 된다.',
      },
      { id: 'g3', label: '채널 개설 (다채널 계획이면 브랜드 채널)' },
      {
        id: 'g4',
        label: '중급·고급 기능 인증 완료',
        warning:
          '15분 초과 업로드는 중급(전화번호), 수익화 신청은 고급(채널 기록 또는 신분증). 두 시간짜리 민담이 불가능하다.',
      },
      {
        id: 'g5',
        label: '15분 초과 업로드가 되는지 실제로 확인',
      },
      {
        id: 'g6',
        label: '세금 정보 제출 절차를 확인했다',
        warning:
          '미제출 시 개인 계정은 전 세계 수익의 최대 24%, 사업자 계정은 미국 수익의 30% 원천징수. 한미 조세조약 적용 시 10%로 낮출 수 있다.',
      },
      {
        id: 'g7',
        label: '커뮤니티 가이드라인 경고가 없는지 확인',
        warning: '활성 경고가 있으면 YPP 신청이 차단된다.',
      },
    ],
    widgets: ['setupGates'],
  },

  // ─────────────────────────── Phase 0: 세팅 ───────────────────────────
  {
    id: 'setup-tools',
    phaseId: 'setup',
    title: '도구 3개 결제 · 2개 가입',
    summary: '유료는 Claude·Grok·Vrew 세 개뿐. Flow와 미리캔버스는 무료다.',
    timestamp: '33:24',
    tools: ['claude', 'grok', 'vrew', 'flow', 'miricanvas'],
    duration: '20분',
    keyPoint:
      '최소 구성은 월 약 6만원(Claude + Vrew). Grok을 추가하면 약 10만원. 영상 1개 제작 원가는 1,000~2,000원. 무료 도구는 언제 유료로 바뀔지 모르니 시작을 미루지 말 것.',
    actions: [
      'Claude(claude.ai) 가입 후 Pro($20/월) 결제. 모델은 Sonnet을 쓴다.',
      'Grok(grok.com) 결제(SuperGrok $30/월, 약 42,000원) — 인트로 영상용. 정지 이미지로 대체하면 생략 가능.',
      'Vrew(vrew.ai) Standard(29,000원/월) 결제 — TTS와 편집용. 월 4편 기준 Standard 이상 필요(Light는 글자 수 부족).',
      'Google Flow(labs.google/flow)는 구글 계정으로 로그인만 하면 무료.',
      '미리캔버스도 무료 가입.',
    ],
    checklist: [
      { id: 'claude', label: 'Claude Pro 결제 완료 (모델: Sonnet)' },
      {
        id: 'grok',
        label: 'Grok 결제 완료 (SuperGrok $30/월)',
        warning: 'SuperGrok $30/월(약 42,000원). X Premium+($40)는 X 앱용이고 영상 제작에는 SuperGrok이면 된다. 인트로를 정지 이미지로 대체하면 생략 가능.',
      },
      { id: 'vrew', label: 'Vrew Standard 결제 완료' },
      { id: 'flow', label: 'Google Flow 로그인 확인 (무료)' },
      { id: 'canvas', label: '미리캔버스 가입 (무료)' },
      {
        id: 'license-check',
        label: '각 도구의 상업적 이용 약관을 확인했다',
        warning:
          'Vrew Standard가 수익화 영상에 사용 가능한지, Google Flow 생성물의 상업적 이용이 허용되는지 각각 약관 페이지에서 확인한다. 약관은 변경될 수 있으므로 결제 시점에 확인.',
      },
      {
        id: 'bgm-rights',
        label: '배경음악 저작권을 확인할 계획을 세웠다',
        warning:
          'Vrew 내장 음원이나 외부 BGM은 Content ID에 등록돼 있을 수 있다. 매칭되면 해당 영상 수익이 음원 권리자에게 간다.',
      },
    ],
    widgets: ['costCalculator'],
  },
  {
    id: 'setup-download',
    phaseId: 'setup',
    title: '프롬프트 9개 확보',
    summary:
      '이 앱에 프롬프트 9개가 들어 있습니다. 복사하거나 .txt로 받아 쓰세요. 원본 자료를 받으셨다면 그것을 쓰십시오.',
    timestamp: '15:14',
    tools: [],
    duration: '5분',
    keyPoint:
      '프롬프트가 있느냐 없느냐로 결과가 갈립니다. 같은 Claude에 그냥 "민담 만들어 줘"라고 하면 이렇게 나오지 않습니다. 공장에 설비를 넣는 단계입니다.',
    actions: [
      '아래 라이브러리에서 "9개 전부 .txt로 받기"를 누른다.',
      '파일 9개가 순서대로 내려받아진다. 파일명의 번호가 설치 순서다.',
      '지침 칸에 넣을 것(4개)과 파일로 업로드할 것(3개)을 구분해 둔다.',
      '강의 고정 댓글에서 원본 자료를 받았다면, 검증된 실적이 있으므로 그쪽을 쓰는 편이 낫다.',
    ],
    checklist: [
      { id: 'dl', label: '프롬프트 9개 확보 (이 앱 또는 원본 자료)' },
      {
        id: 'sort',
        label: '지침용 4개 / 파일용 3개 구분 확인',
        warning: '이 둘을 섞으면 작동하지 않는다. 다음 단계에서 위치가 갈린다.',
      },
    ],
    widgets: ['promptLibrary'],
  },
  {
    id: 'setup-projects',
    phaseId: 'setup',
    title: 'Claude 프로젝트 4개 만들기',
    summary:
      '민담 대본 / 민담 이미지 / 민담 인트로 / 민담 썸네일. 지침 칸 4개, 파일 업로드는 대본에만 3개.',
    timestamp: '16:10',
    tools: ['claude'],
    duration: '15분',
    keyPoint:
      '프롬프트는 반드시 "지침(Instructions)"에 넣습니다. 프로젝트 설명란에 넣는 실수가 가장 흔합니다. 설명란은 프로젝트를 설명하는 칸일 뿐 지침으로 작동하지 않습니다.',
    actions: [
      'Claude에서 새 프로젝트를 만들고 이름을 "민담 대본"으로 한다.',
      '01_민담대본_MAIN.txt 내용을 지침(Instructions) 칸에 붙여넣고 저장한다.',
      '같은 프로젝트의 파일 영역에 02, 03, 04 세 파일을 업로드한다. 지침 칸이 아니다.',
      '새 프로젝트 "민담 이미지"를 만들고 05번을 지침 칸에 붙여넣는다. 파일 업로드는 하지 않는다.',
      '새 프로젝트 "민담 인트로"를 만들고 06번을 지침 칸에 붙여넣는다.',
      '새 프로젝트 "민담 썸네일"을 만들고 07번을 지침 칸에 붙여넣는다.',
      '네 프로젝트 모두 모델을 Sonnet으로 맞춘다.',
    ],
    checklist: [
      { id: 'p1', label: '민담 대본 — 01번 지침 + 02·03·04번 파일 업로드' },
      {
        id: 'p2',
        label: '민담 이미지 — 05번 지침만',
        warning: '이미지·인트로·썸네일 프로젝트에는 파일을 넣지 않는다.',
      },
      { id: 'p3', label: '민담 인트로 — 06번 지침만' },
      { id: 'p4', label: '민담 썸네일 — 07번 지침만' },
      {
        id: 'model',
        label: '4개 프로젝트 모두 모델을 Sonnet으로 설정',
        warning: 'Opus를 쓰면 사용량 한도 때문에 긴 대본을 끝까지 못 만든다.',
      },
    ],
    widgets: ['projectSetup', 'promptLibrary'],
  },

  // ─────────────────────────── Phase 1: 대본 ───────────────────────────
  {
    id: 'script-topic',
    phaseId: 'script',
    title: '주제 추천 받기 → 카테고리 고르기',
    summary: '"민담 대본" 프로젝트에 한 줄만 입력하면 카테고리를 제시한다.',
    timestamp: '19:03',
    tools: ['claude'],
    duration: '2분',
    keyPoint:
      '여기서 나오는 주제가 잘 먹히는 이유는, 프롬프트에 실제로 잘 된 민담들만 수집해서 넣어놨기 때문이다(모티프 뱅크).',
    actions: [
      '"민담 대본" 프로젝트에서 새 대화를 시작한다.',
      '아래 명령을 붙여넣는다.',
      '권선징악 / 귀신·도깨비 / 미스터리·추리 / 사랑 등 카테고리가 나오면 하나를 고른다.',
      '민담은 대부분 권선징악 계열이 안정적이다.',
    ],
    prompts: [
      {
        label: '첫 명령 (민담 대본 프로젝트에서)',
        text: '이야기 만들 거야. 주제 추천해 줘.',
      },
      {
        label: '카테고리 선택 (예: 며느리/시집 갈래)',
        text: 'C',
      },
    ],
    checklist: [
      { id: 'sent', label: '주제 추천 명령 입력' },
      { id: 'category', label: '카테고리 A~D 중 선택 완료' },
    ],
    widgets: ['scriptVault'],
  },
  {
    id: 'script-pick',
    phaseId: 'script',
    title: '주제 선택',
    summary: '추천된 주제 목록에서 마음에 드는 것 하나를 알파벳으로 선택한다.',
    timestamp: '21:03',
    tools: ['claude'],
    duration: '1분',
    keyPoint:
      '주제를 사람이 고르는 이 판단이 있어야 YouTube의 AI 정책에 걸리지 않는다. 클릭 한 번으로 영상까지 나오는 완전 자동화가 채널 삭제 사유다.',
    actions: [
      '제시된 주제 중 제목만 봐도 궁금해지는 것을 고른다.',
      '해당 알파벳(예: B)만 입력하고 보낸다.',
      '"이유를 모르겠는" 제목이 좋다. 궁금증이 클릭을 만든다.',
    ],
    checklist: [
      { id: 'picked', label: '주제 확정' },
      {
        id: 'curious',
        label: '제목만 보고 궁금해지는지 스스로 점검했다',
        warning: '"나무꾼 이야기"처럼 평범한 제목은 소개팅에서 탈락하는 사진과 같다.',
      },
    ],
    widgets: ['scriptVault'],
  },
  {
    id: 'script-intro',
    phaseId: 'script',
    title: '인트로 대사 검수 ★',
    summary: '주제를 고르면 인트로 대사가 자동으로 나온다. 이건 반드시 읽고 판단한다.',
    timestamp: '21:34',
    tools: ['claude'],
    duration: '10분',
    judgment: true,
    keyPoint:
      '만드는 법과 돈 버는 법은 다르다. 썸네일은 소개팅 사진, 인트로는 첫 만남이다. 이 둘에서 떨어지면 대본이 아무리 좋아도 아무도 보지 않는다.',
    actions: [
      '나온 인트로 대사를 소리 내어 읽어본다.',
      '나레이션이 아니라 등장인물의 대사로 시작하는지 확인한다.',
      '"왜 그랬지?"라는 의문이 즉시 생기는지 본다.',
      '맹맹하면 다시 뽑거나, 톤을 지정해 수정을 요청한다. (예: "노부인이 화내는 말투로 바꿔 줘")',
      '마음에 드는 인트로가 나올 때까지 여기서 시간을 쓴다.',
    ],
    prompts: [
      {
        label: '톤 수정 예시',
        text: '3안으로 가되, 노부인의 말투를 더 차갑고 내리누르는 쪽으로 바꿔 줘. 화를 겉으로 드러내지 않는 방향으로.',
      },
      {
        label: '다시 뽑기',
        text: '세 안 모두 약해. 다시 뽑아 줘. 첫 문장이 등장인물 대사여야 하고, 그 대사가 상식에 어긋나서 이유가 궁금해지는 방향으로. 이유는 절대 설명하지 마.',
      },
      {
        label: '선택 확정',
        text: '2안으로 확정. 다음으로 넘어가 줘.',
      },
    ],
    checklist: [
      { id: 'dialogue', label: '등장인물 대사로 시작한다' },
      { id: 'hook', label: '이유를 모르겠어서 궁금해진다' },
      {
        id: 'scored',
        label: '인트로 채점에서 실패 항목이 없다',
        warning: '이유를 설명하는 표현이 들어가면 궁금증이 죽는다. 채점기가 잡아준다.',
      },
      { id: 'aloud', label: '소리 내어 읽어 보고 판단했다' },
      { id: 'saved', label: '확정한 인트로 대사를 보관함에 저장했다' },
    ],
    widgets: ['introScorer', 'scriptVault'],
  },
  {
    id: 'script-names',
    phaseId: 'script',
    title: '인물 · 이름 확정 (NamePicker)',
    summary: 'TTS가 발음하기 어려운 이름은 프롬프트가 알아서 교체한다. 그대로 진행한다.',
    timestamp: '25:51',
    tools: ['claude'],
    duration: '2분',
    keyPoint:
      '사람 눈으로는 읽히는 이름도 TTS는 못 읽는 경우가 있다. 우리는 AI가 읽는 영상을 만들기 때문에 이 필터가 중요하다.',
    actions: [
      '계속 진행하면 캐릭터와 이름이 자동 생성된다.',
      '"TTS에 걸릴 것 같다"며 이름을 교체한다는 안내가 나오면 그대로 수락한다.',
      '채널에서 쓰지 말라고 등록된 금지 이름도 자동으로 걸러진다.',
      '이름을 외울 필요는 없다. 이후 단계에서 그대로 참조한다.',
    ],
    checklist: [
      { id: 'names', label: '등장인물 이름 목록 확보' },
      { id: 'tts', label: 'TTS 발음 경고가 있던 이름은 교체본을 사용' },
    ],
    widgets: ['characterVault'],
  },
  {
    id: 'script-outline',
    phaseId: 'script',
    title: '줄거리 · 반전 · 골격 변주',
    summary:
      '내용은 읽지 않아도 되지만, 구조가 앞 영상과 겹치는지는 확인해야 합니다. 정책 리스크가 여기서 갈립니다.',
    timestamp: '26:39',
    tools: ['claude'],
    duration: '10분',
    keyPoint:
      '줄거리 내용은 검수 대상이 아닙니다. 그러나 구조는 다릅니다. 같은 골격·같은 결말을 반복하면 정책이 금지한 "매우 비슷한 줄거리 템플릿"이 됩니다. 아래 이력 도구로 겹침을 확인하세요.',
    actions: [
      '프롬프트가 앞 영상 구조를 물어보면, 아래 이력에서 확인해 알려준다.',
      '적용한 변주(시작점·결말·조력자)가 출력되면 아래 이력에 기록한다.',
      '줄거리와 반전 내용 자체는 읽지 않고 넘긴다.',
      '스토리 팩트가 나오면 그것도 넘긴다. AI가 챕터마다 참조하는 설계도다.',
    ],
    prompts: [
      {
        label: '앞 영상 구조 알려주기',
        text: '앞 영상은 순차 시작 + 응보 결말 + 초자연 조력자였어. 이번엔 다르게 짜 줘.',
      },
      { label: '첫 영상인 경우', text: '첫 영상이야.' },
    ],
    checklist: [
      { id: 'outline', label: '줄거리 생성 완료' },
      {
        id: 'variant',
        label: '적용한 변주가 앞 영상과 다른지 확인',
        warning: '이 확인이 정책 리스크를 줄이는 핵심이다. 내용보다 구조가 중요하다.',
      },
      {
        id: 'record',
        label: '구조를 아래 이력에 기록',
      },
      {
        id: 'skip',
        label: '줄거리 내용 자체는 읽지 않고 넘어갔다',
        warning: '"이야기가 좀 이상한데?"를 붙잡는 사람이 수익화가 가장 늦다.',
      },
    ],
    widgets: ['episodeHistory'],
  },
  {
    id: 'script-generate',
    phaseId: 'script',
    title: '영상 길이 선택 → 대본 생성',
    summary: '2시간을 고르면 약 46,000자 대본이 15~20분에 걸쳐 생성된다.',
    timestamp: '27:00',
    tools: ['claude'],
    duration: '15~20분 (대기)',
    keyPoint:
      '롱폼이 길수록 중간광고가 많이 붙는다. 조회수 6만짜리 1시간 40분 영상에서 약 80만원이 나온 사례가 강의에 등장한다.',
    actions: [
      '길이를 물어보면 2시간을 선택한다.',
      '챕터 하나씩 생성된다. "이어서 쓸까요?"가 나오면 계속하라고 답한다. 아홉 챕터를 반복한다.',
      '챕터마다 스토리 팩트 점검 결과가 함께 나온다. 읽지 않아도 되지만, 설정이 어긋났다는 표시가 있으면 그 챕터만 다시 받는다.',
      '완성된 대본 전문을 복사해 아래 보관함에 저장한다.',
      '마지막에 나오는 썸네일 브리프를 따로 저장한다. 3·4단계에서 쓴다.',
    ],
    prompts: [
      { label: '길이 선택', text: '두 시간으로 해 줘.' },
      { label: '챕터 이어쓰기', text: '이어서 써 줘.' },
      { label: '썸네일 브리프 요청', text: '대본 끝났으면 썸네일 브리프 만들어 줘.' },
    ],
    checklist: [
      { id: 'len', label: '길이 2시간 선택' },
      { id: 'chapters', label: '아홉 챕터 모두 생성' },
      { id: 'script', label: '대본 전문 저장 (목표 46,000자 내외)' },
      {
        id: 'runtime',
        label: '러닝타임과 중간광고 슬롯 확인',
        warning: '46,000자는 보통 두 시간을 넘긴다. 목표 길이와 다를 수 있다.',
      },
      {
        id: 'check',
        label: 'TTS 검사에서 오류 0건 확인',
        warning: '한자·영문·괄호가 남아 있으면 TTS가 그대로 읽거나 깨진다.',
      },
      {
        id: 'backup',
        label: '대본을 파일로 내보내 백업',
        warning: '브라우저에만 저장되므로 데이터를 지우면 15~20분 들인 대본이 사라진다.',
      },
      {
        id: 'brief',
        label: '썸네일 브리프 별도 저장',
        warning: '인트로·썸네일 단계에서 반드시 다시 필요하다. 지금 챙겨두지 않으면 되돌아와야 한다.',
      },
    ],
    widgets: ['scriptVault', 'scriptChecker', 'runtimeCalculator', 'dataBackup'],
  },

  // ─────────────────────────── Phase 2: 이미지 ───────────────────────────
  {
    id: 'image-style',
    phaseId: 'image',
    title: '대본 투입 + 그림체 지정',
    summary: '"민담 이미지" 프로젝트에 대본을 넣고 그림체를 한 줄로 지정한다.',
    timestamp: '30:33',
    tools: ['claude'],
    duration: '3분',
    keyPoint:
      '"조선시대 사파"처럼 학습이 덜 된 표현을 쓰면 그림이 뻑뻑하게 나온다. "한국 조선시대 웹툰"처럼 AI가 많이 학습한 표현이 안정적이다.',
    actions: [
      '"민담 이미지" 프로젝트에서 새 대화를 시작한다.',
      '앞에서 저장한 대본 전문을 붙여넣는다.',
      '그림체를 물어보면 "한국 조선시대 웹툰"이라고 입력한다.',
    ],
    prompts: [
      { label: '그림체 지정', text: '1번. 한국 조선시대 웹툰으로 해 줘.' },
    ],
    checklist: [
      { id: 'paste', label: '대본 붙여넣기 완료' },
      { id: 'style', label: '그림체 지정 완료' },
      { id: 'anchor', label: 'STYLE ANCHOR 영어 문구 출력 확인' },
    ],
  },
  {
    id: 'image-chapters',
    phaseId: 'image',
    title: '챕터 수 40 지정',
    summary: '영상이 2시간이든 3시간이든 이미지는 40장이면 충분하다.',
    timestamp: '31:00',
    tools: ['claude'],
    duration: '1분',
    keyPoint:
      '시청자는 대부분 화면을 보지 않고 듣는다. 60장, 100장으로 늘려봐도 차이가 없다는 결론. 중요한 데(썸네일·인트로)에 힘을 쓴다.',
    actions: [
      '챕터 수를 물어보면 40이라고 입력한다.',
      '화풍 추출이 진행되며, 지정한 그림체가 AI가 읽는 영어 표현으로 변환된다.',
    ],
    prompts: [{ label: '개수 지정', text: '마흔 장으로 해 줘.' }],
    checklist: [
      { id: 'ch', label: '장면 40개 지정' },
      { id: 'chars', label: '인물 고정 프롬프트(Step 1) 출력 확인' },
    ],
  },
  {
    id: 'image-characters',
    phaseId: 'image',
    title: 'Flow에서 인물 5명 고정',
    summary: 'Step1에서 나온 인물 프롬프트로 캐릭터 이미지를 만들고 이름을 붙여 저장한다.',
    timestamp: '33:33',
    tools: ['claude', 'flow'],
    duration: '10분',
    keyPoint:
      'AI에 그냥 그려달라고 하면 매번 다르게 그린다. 시청자가 화면을 안 본다 해도 주인공 얼굴이 계속 바뀌면 안 되므로 메인 캐릭터를 고정한다.',
    actions: [
      'Claude가 만든 Step1(인물 모양) 프롬프트를 확인한다. 영어로 길게 나오지만 읽을 필요는 없다.',
      'Flow에 구글 계정으로 로그인하고 새 프로젝트를 만든다.',
      '캐릭터 탭으로 들어가 프롬프트를 붙여넣는다. 프롬프트는 더블 클릭하면 전체 선택된다.',
      '모델은 Nano Banana 2를 선택한다. (Lite/Pro보다 2가 가장 좋다)',
      '이미지가 나오면 인물 이름을 붙여 저장한다. 5명 모두 반복한다.',
    ],
    checklist: [
      { id: 'flow-login', label: 'Flow 새 프로젝트 생성' },
      {
        id: 'model',
        label: '모델 Nano Banana 2 선택',
        warning: 'Lite/Pro도 있지만 2가 가장 결과가 좋다.',
      },
      { id: 'chars', label: '인물 5명 이미지 생성 + 이름 붙여 저장' },
    ],
    widgets: ['characterVault'],
  },
  {
    id: 'image-scenes',
    phaseId: 'image',
    title: '40장면 프롬프트 받기',
    summary: '대본을 40토막으로 자르고 각 장면의 이미지 프롬프트를 생성한다.',
    timestamp: '32:25',
    tools: ['claude'],
    duration: '5분',
    keyPoint:
      'H(강도 높음) 8개 · M 16개 · L 16개로 나뉜다. 균등하게 자르면 이미지가 평범해지므로 중요한 장면에 편차를 준 것이다. 원리는 몰라도 된다.',
    actions: [
      '계속 진행하면 40개 장면 프롬프트가 나온다.',
      '각 줄은 `번호. [등급] @인물` 형식이고, 장면 사이는 --- 로 구분된다.',
      'H 8개 / M 16개 / L 16개로 강도가 배분된다. 중요한 장면일수록 짧은 구간을 덮는다.',
      '프롬프트 전체를 복사해 아래 장면 관리함에 붙여넣는다. 자동으로 40개로 분리된다.',
    ],
    prompts: [{ label: '장면 요청', text: '인물 다섯 명 다 저장했어. 장면 뽑아 줘.' }],
    checklist: [
      { id: 'scenes', label: '40장면 프롬프트 생성 완료' },
      { id: 'imported', label: '장면 관리함에 불러오기 완료' },
      { id: 'ratio', label: 'H 8 / M 16 / L 16 배분 확인' },
    ],
    widgets: ['sceneQueue'],
  },
  {
    id: 'image-batch',
    phaseId: 'image',
    title: '이미지 40장 배치 생성',
    summary: '이미지당 2분 간격으로 40장. 약 80분 걸리니 돌려놓고 다른 일을 한다.',
    timestamp: '38:38',
    tools: ['flow'],
    duration: '약 80분 (대기)',
    keyPoint:
      '생성 자체는 1장에 1분이지만 2분 간격을 권장한다. Flow가 무료로 풀어준 자원이라 과하게 쓰면 제한이 걸린다. 하루 2개 영상 분량은 충분히 만들 수 있다.',
    actions: [
      'Flow Helper를 쓰거나, 아래 큐를 이용해 프롬프트를 하나씩 Flow에 붙여넣는다.',
      'Flow Helper를 쓸 경우 URL의 프로젝트 ID가 현재 프로젝트와 맞는지 확인한다.',
      '@인물 태그가 실제로 반영됐는지 중간중간 확인한다. 간혹 태그가 빠진다.',
      '태그가 빠졌으면 그 장면만 다시 생성한다.',
      '생성된 이미지를 번호 순서대로 저장한다.',
    ],
    checklist: [
      {
        id: 'tags',
        label: '@인물 태그 누락 여부를 확인했다',
        warning: '강의에서 실제로 태그가 빠진 사례가 나온다. 인물이 안 들어가면 얼굴이 바뀐다.',
      },
      { id: 'all40', label: '이미지 40장 생성 및 번호 순 저장 완료' },
    ],
    widgets: ['sceneQueue'],
  },

  // ─────────────────────────── Phase 3: 인트로 ───────────────────────────
  {
    id: 'intro-prompt',
    phaseId: 'intro',
    title: 'Claude로 인트로 씬 4개 설계',
    summary: '"민담 인트로" 프로젝트에 재료 3개를 넣으면 Scene 1~4가 나온다.',
    timestamp: '39:22',
    tools: ['claude'],
    duration: '5분',
    keyPoint:
      'Grok과 직접 대화해서 고치지 않는다. 사람 말을 더 잘 알아듣는 Claude에서 프롬프트를 고치고, 그 결과물을 Grok에 다시 넣는다.',
    actions: [
      '"민담 인트로" 프로젝트에서 새 대화를 시작한다.',
      '재료 1: 이미지 단계에서 나온 인물 프롬프트',
      '재료 2: 대본 단계에서 나온 썸네일 브리프',
      '재료 3: 확정한 인트로 대본 부분',
      '이 3개를 넣으면 Scene 1~4가 나온다. 각 씬마다 대사 · 등장인물 · 이미지 프롬프트가 붙는다.',
    ],
    prompts: [
      {
        label: '재료 3개 투입 (한 번에)',
        text: `아래 세 가지를 줄게. 인트로 네 컷 설계해 줘.

[1. 인물 고정 프롬프트]
(이미지 프로젝트 관문 3 산출물을 여기에 붙여넣기)

[2. 썸네일 브리프]
(대본 프로젝트 관문 8 산출물을 여기에 붙여넣기)

[3. 인트로 대본]
(확정한 인트로 대사와 나레이션을 여기에 붙여넣기)`,
      },
    ],
    checklist: [
      { id: 'mat1', label: '인물 프롬프트 투입' },
      { id: 'mat2', label: '썸네일 브리프 투입' },
      { id: 'mat3', label: '인트로 대본 투입' },
      { id: 'scenes', label: 'Scene 1~4 생성 확인 (대사·감정지시·이미지프롬프트·영상변환지시)' },
    ],
  },
  {
    id: 'intro-grok',
    phaseId: 'intro',
    title: 'Grok에서 이미지 → 6초 영상',
    summary: '16:9 이미지를 만들고 그대로 6초 비디오로 변환한다. 립싱크가 붙는다.',
    timestamp: '40:25',
    tools: ['grok'],
    duration: '15분',
    keyPoint: 'Grok을 쓰는 이유는 한국어 대사와 입 모양(립싱크)을 가장 잘 맞추고, 저렴하기 때문이다.',
    actions: [
      'Grok에서 이미지 모드로 들어가 비율을 16:9로 설정한다. 개수는 auto.',
      'Scene의 이미지 프롬프트를 붙여넣는다.',
      'Flow에서 저장한 인물 레퍼런스 이미지를 해당 인물에 맞춰 첨부한다.',
      '이미지가 나오면 전체 선택 후 비디오로 변환한다. 길이는 6초.',
      'Scene 1~4를 모두 같은 방식으로 만든다.',
    ],
    checklist: [
      { id: 'ratio', label: '비율 16:9 설정' },
      { id: 'refs', label: '인물 레퍼런스 이미지 첨부' },
      { id: 'videos', label: '인트로 영상 4개 생성 완료 (각 6초)' },
    ],
  },
  {
    id: 'intro-revise',
    phaseId: 'intro',
    title: '인트로 다듬기 ★',
    summary: '마음에 안 들면 Claude로 돌아가 프롬프트를 고친 뒤 Grok에 다시 넣는다.',
    timestamp: '41:09',
    tools: ['claude', 'grok'],
    duration: '가변',
    judgment: true,
    keyPoint:
      '인트로는 소개팅 첫 만남이다. 썸네일에서 본 이미지와 첫인상이 일치해야 계속 본다. 여기 쓰는 시간은 아끼지 않는다.',
    actions: [
      '영상을 재생해 대사 톤이 의도와 맞는지 확인한다.',
      '어긋나면 Claude에서 말투를 지정해 프롬프트를 수정한다.',
      '수정된 프롬프트를 Grok에 다시 넣는다. Grok과 직접 협상하지 않는다.',
      '썸네일 카피와 인트로 첫인상이 같은 방향인지 교차 확인한다.',
    ],
    prompts: [
      {
        label: '말투 수정',
        text: 'Scene 1의 대사 톤이 약해. 차갑게 내리누르는 쪽으로, 화를 겉으로 드러내지 않는 방향으로 감정 지시와 표정 서술을 고쳐 줘. 프롬프트 전체를 다시 줘.',
      },
      {
        label: '움직임 과다',
        text: 'Grok 결과에서 손이 깨져 나와. 허용 움직임을 줄이고 손동작 지시를 빼 줘.',
      },
      {
        label: '대사 길이 조정',
        text: '대사가 6초에 안 맞아. 스물다섯 자 안쪽으로 줄여 줘. 뜻은 유지해.',
      },
    ],
    checklist: [
      { id: 'tone', label: '대사 톤이 의도와 맞다' },
      { id: 'match', label: '썸네일과 인트로의 첫인상이 일치한다' },
    ],
  },

  // ─────────────────────────── Phase 4: 썸네일 ───────────────────────────
  {
    id: 'thumb-copy',
    phaseId: 'thumbnail',
    title: '카피 후보 받고 고르기 ★',
    summary: '"민담 썸네일" 프로젝트에 재료를 넣고 카피를 추천받아 하나를 고른다.',
    timestamp: '42:04',
    tools: ['claude'],
    duration: '15분',
    judgment: true,
    keyPoint:
      '카피는 썸네일에 들어가는 글자다. 여기서 선택을 못 받으면 영상을 보지도 않는다. 내 영상이 얼마나 좋은지는 전혀 중요하지 않다.',
    actions: [
      '"민담 썸네일" 프로젝트에서 새 대화를 시작한다.',
      '썸네일 브리프 + 인물 프롬프트를 넣는다.',
      '"카피 추천해 줘"라고 입력한다.',
      '나온 옵션들 중 궁금증이 가장 큰 것을 고른다. 사장이 직원 시안을 고르는 감각.',
      '고르면 그에 맞는 영어 이미지 프롬프트가 나온다.',
    ],
    prompts: [
      {
        label: '재료 2개 투입 + 카피 요청',
        text: `아래 두 가지를 줄게. 카피 추천해 줘.

[1. 썸네일 브리프]
(대본 프로젝트 관문 8 산출물을 여기에 붙여넣기)

[2. 인물 고정 프롬프트]
(이미지 프로젝트 관문 3 산출물을 여기에 붙여넣기)`,
      },
      { label: '카피 선택', text: '3번으로 확정. 배경 이미지 프롬프트 만들어 줘.' },
      {
        label: '다시 뽑기',
        text: '여덟 개 다 약해. 다시 뽑아 줘. 읽고 나서 "왜?"가 즉시 떠오르는 쪽으로, 열두 자 안쪽으로.',
      },
    ],
    checklist: [
      { id: 'mats', label: '썸네일 브리프 + 인물 프롬프트 투입' },
      { id: 'copies', label: '카피 후보 8개를 아래에 기록했다' },
      { id: 'chosen', label: '최종 카피 1개 선택' },
      {
        id: 'len',
        label: '선택한 카피가 18자 이내인지 확인',
        warning: '길면 휴대전화 엄지손톱 크기에서 읽히지 않는다.',
      },
      {
        id: 'preview',
        label: '168px 크기에서 읽히는지 확인',
        warning: '가장 작게 노출되는 자리에서 안 읽히면 클릭이 일어나지 않는다.',
      },
    ],
    widgets: ['thumbnailCopy', 'thumbnailPreview'],
  },
  {
    id: 'thumb-image',
    phaseId: 'thumbnail',
    title: 'Flow에서 썸네일 이미지 생성',
    summary: 'Claude가 만든 영어 프롬프트를 Flow에 붙여넣는다.',
    timestamp: '42:52',
    tools: ['flow'],
    duration: '5분',
    keyPoint: '이미지 생성에 시간이 걸리므로, 이미지 40장을 돌리는 동안 함께 진행하면 효율적이다.',
    actions: [
      '선택한 카피에 맞춰 나온 영어 이미지 프롬프트를 복사한다.',
      'Flow에 붙여넣어 썸네일 이미지를 생성한다.',
      '이미지를 다운로드한다. 글자는 아직 없는 상태다.',
    ],
    checklist: [
      { id: 'gen', label: '썸네일 이미지 생성' },
      { id: 'dl', label: '이미지 다운로드' },
    ],
  },
  {
    id: 'thumb-text',
    phaseId: 'thumbnail',
    title: '미리캔버스에서 카피 입히기',
    summary: '흰 글자 + 외곽선 50 + 옛 서체 + 채도 최대. JPG로 저장.',
    timestamp: '43:11',
    tools: ['miricanvas'],
    duration: '10분',
    keyPoint:
      '핸드폰 작은 화면에서 눈에 튀어야 한다. 채도 슬라이더는 끝까지 밀고, 밝은색을 쓴다.',
    actions: [
      '미리캔버스 → 워크스페이스 → 디자인 만들기 → 유튜브 썸네일 크기 선택.',
      'Flow에서 받은 이미지를 업로드해 캔버스를 꽉 채운다.',
      '텍스트를 추가하고 선택한 카피를 입력한다.',
      '글자 전체를 흰색으로 바꾼다.',
      '외곽선을 약 50으로 준다.',
      '서체를 옛날 느낌으로 바꾼다. (예: 수정해정체)',
      '강조 색은 채도를 끝까지 밀고 밝은색으로 맞춘다. 민담에서 흔히 쓰는 형광 계열.',
      'JPG로 다운로드한다.',
    ],
    checklist: [
      { id: 'size', label: '썸네일 크기로 캔버스 생성' },
      { id: 'white', label: '글자 흰색 + 외곽선 약 50' },
      { id: 'font', label: '옛 느낌 서체 적용' },
      {
        id: 'sat',
        label: '강조색 채도를 최대로 밀었다',
        warning: '채도가 낮으면 작은 화면에서 묻힌다.',
      },
      { id: 'jpg', label: 'JPG로 저장', warning: 'PNG가 아니라 JPG로 받는다.' },
      {
        id: 'shrink',
        label: '휴대전화 엄지손톱 크기로 축소해 읽히는지 확인',
        warning: '읽히지 않으면 글자를 키우거나 카피를 줄인다.',
      },
    ],
    widgets: ['thumbnailPreview'],
  },

  // ─────────────────────────── Phase 5: Vrew ───────────────────────────
  {
    id: 'vrew-tts',
    phaseId: 'assemble',
    title: 'Vrew — 대본을 1만자씩 넣어 음성 만들기',
    summary: 'AI 목소리로 시작하기 → 1만자씩 붙여넣고 클립 추가를 반복한다.',
    timestamp: '44:57',
    tools: ['vrew'],
    duration: '20분',
    keyPoint:
      'Vrew는 한 번에 1만자만 받는다. 46,000자면 5번 나눠 넣어야 한다. 아래 분할기가 경계를 문장 단위로 잘라준다.',
    actions: [
      'Vrew에서 새로 만들기 → "AI 목소리로 시작하기"를 선택한다.',
      '아래 분할기로 대본을 1만자 단위로 나눈다.',
      '1번 조각을 붙여넣는다.',
      '아래로 스크롤해 마우스를 올리면 "클립 추가"가 나온다. 다시 AI 목소리를 선택하고 2번 조각을 넣는다.',
      '조각이 끝날 때까지 반복한다.',
    ],
    checklist: [
      { id: 'start', label: 'AI 목소리로 시작하기 선택' },
      {
        id: 'checked',
        label: 'TTS 검사에서 오류 0건 확인',
        warning: '금지 표기가 남아 있으면 음성을 다시 만들어야 한다. 넣기 전에 확인한다.',
      },
      { id: 'chunks', label: '모든 조각 투입 완료' },
      { id: 'audio', label: '음성 생성 확인' },
      {
        id: 'voice',
        label: '목소리를 끝까지 같은 것으로 유지',
        warning: '중간에 목소리가 바뀌면 듣는 사람이 즉시 알아챈다.',
      },
    ],
    widgets: ['scriptChecker', 'scriptChunker', 'promptLibraryVrew'],
  },
  {
    id: 'vrew-intro',
    phaseId: 'assemble',
    title: '인트로 영상 4개 배치 + 소리 제거',
    summary: 'Grok 영상을 대본 위치에 맞춰 넣고, 원본 오디오를 끈다.',
    timestamp: '46:05',
    tools: ['vrew'],
    duration: '10분',
    keyPoint:
      'Grok 영상에는 이미 목소리가 들어있다. Vrew TTS와 겹치므로 인트로 구간은 Grok 소리를 쓰고 나머지는 끄는 식으로 정리한다.',
    actions: [
      '대본의 인트로 구간을 찾아 해당 위치에 Grok 영상 1~4를 순서대로 넣는다.',
      '넣은 클립을 전체 선택하고 소리 아이콘을 눌러 원본 오디오를 제거한다.',
      '대사 타이밍과 영상 위치를 맞춘다.',
      '재생해서 인트로가 자연스럽게 이어지는지 확인한다.',
    ],
    checklist: [
      { id: 'placed', label: '인트로 영상 4개 배치' },
      { id: 'muted', label: '중복되는 원본 오디오 제거' },
      { id: 'sync', label: '대사와 화면 타이밍 확인' },
    ],
  },
  {
    id: 'vrew-agent',
    phaseId: 'assemble',
    title: 'Vrew 에이전트로 이미지 40장 자동 배치',
    summary: '명령어 + 40장면 대본 + 이미지 40장을 주면 위치를 맞춰 알아서 넣는다.',
    timestamp: '47:28',
    tools: ['vrew'],
    duration: '10분',
    keyPoint:
      '40장을 손으로 넣지 않는다. 이미지 단계에서 쓴 40장면 분할 대본이 여기서 위치 기준으로 쓰인다.',
    actions: [
      'Vrew 에이전트를 연다.',
      '아래 배치 명령어를 붙여넣는다.',
      '이미지 단계에서 쓴 40장면 분할 대본을 함께 넣는다.',
      '생성한 이미지 40장을 전부 첨부한다. 파일명은 01부터 40까지 두 자리로 통일해 둔다.',
      '실행하면 각 대본 위치부터 다음 대본 전까지 이미지가 배치되고 화면 효과까지 들어간다.',
      'Ctrl+A로 전체 선택해 빈 구간이 없는지 확인한다.',
    ],
    checklist: [
      { id: 'cmd', label: '배치 명령어 입력' },
      { id: 'scenes', label: '40장면 분할 대본 투입' },
      {
        id: 'imgs',
        label: '이미지 40장 첨부 (파일명 01~40 두 자리)',
        warning: '파일명 번호가 장면 번호와 어긋나면 엉뚱한 위치에 배치된다.',
      },
      { id: 'verify', label: '빈 구간 없는지 확인' },
    ],
    widgets: ['promptLibraryVrew'],
  },
  {
    id: 'vrew-export',
    phaseId: 'assemble',
    title: '내보내기',
    summary: '영상 파일로 내보낸다.',
    timestamp: '48:23',
    tools: ['vrew'],
    duration: '가변',
    actions: [
      '전체를 한 번 훑어 재생하며 빈 구간이 없는지 확인한다.',
      '내보내기를 실행한다.',
    ],
    checklist: [
      { id: 'review', label: '전체 검토 완료' },
      { id: 'export', label: '영상 파일 내보내기 완료' },
    ],
  },

  // ─────────────────────────── Phase 6: 업로드 ───────────────────────────
  {
    id: 'publish-disclosure',
    phaseId: 'publish',
    title: 'AI 제작 표시 (필수)',
    summary: '영상 화면에 문구를 넣고, YouTube 업로드 설정에서도 AI 제작을 체크한다.',
    timestamp: '11:37',
    tools: ['vrew', 'youtube'],
    duration: '5분',
    keyPoint:
      '두 곳 모두 표기하는 게 안전하다. YouTube 설정에만 하면 시청자가 모를 수 있어 화면에도 한 번 더 알린다.',
    actions: [
      '영상 도입부 화면에 "AI를 활용해 제작한 창작물입니다" 문구를 넣는다.',
      'YouTube 업로드 시 "변경된 콘텐츠 또는 합성 콘텐츠" 항목을 체크한다.',
    ],
    checklist: [
      { id: 'onscreen', label: '영상 화면에 고지 문구 삽입' },
      {
        id: 'setting',
        label: 'YouTube 업로드 설정에서 AI 제작 표시 체크',
        warning: '누락하면 정책 위반 소지가 생긴다.',
      },
    ],
    widgets: ['disclosure'],
  },
  {
    id: 'publish-upload',
    phaseId: 'publish',
    title: '업로드',
    summary: '영상 + 썸네일 JPG를 올린다.',
    timestamp: '48:23',
    tools: ['youtube'],
    duration: '10분',
    keyPoint:
      '롱폼이므로 중간광고를 켠다. 수익은 조회수가 쌓이는 대로 계속 올라간다. 한 달간 업로드가 없어도 기존 영상에서 수익이 발생한다.',
    actions: [
      '영상 파일을 업로드한다.',
      '썸네일에 미리캔버스에서 받은 JPG를 지정한다.',
      '제목은 선택한 카피 방향과 일치시킨다.',
      '중간광고를 활성화한다.',
    ],
    checklist: [
      { id: 'video', label: '영상 업로드' },
      { id: 'thumb', label: '썸네일 JPG 지정' },
      { id: 'ads', label: '중간광고 활성화' },
      {
        id: 'not-for-kids',
        label: '아동용 콘텐츠 여부를 "아동용이 아님"으로 설정했다',
        warning:
          '아동용으로 설정되면 개인 맞춤 광고가 꺼져 RPM(조회 1,000회당 수익)이 50~80% 감소한다. ' +
          '민담은 옛이야기지만 시청 대상이 성인이면 "아동용이 아님"이 맞다. ' +
          '잘못 설정하면 댓글·엔드스크린·알림도 전부 꺼진다. (근거: TechTimes 2026-07-13, Gyre.pro 2026-06-02)',
      },
      {
        id: 'channel-level-kids',
        label: '채널 수준 아동용 설정이 "아동용이 아님"인지 확인했다',
        warning:
          '채널 설정(Studio → 설정 → 채널 → 고급 설정)에서 전체 채널을 아동용으로 설정하면 모든 영상이 영향받는다.',
      },
      {
        id: 'schedule',
        label: '공개 예약 시각을 정했다',
        warning:
          '타겟 시청자(한국 성인)가 활동하는 시간대에 공개한다. ' +
          '비공개로 올려두고 나중에 공개 전환하면 첫 24시간 부스트를 놓친다. (추정)',
      },
      {
        id: 'playlist',
        label: '영상을 재생목록에 추가했다',
        warning:
          '재생목록은 다음 영상 자동재생을 유도해 시청시간을 늘린다. 수익화 요건(4,000시간) 달성의 핵심 레버.',
      },
      {
        id: 'slots',
        label: '업로드 한 시간 뒤 빨간 슬롯을 확인해 옮겼다',
        warning: 'Studio가 게재 가능성 낮은 슬롯을 빨간색으로 표시한다. TTS 낭독은 자연 중단점(시청자가 멈춰도 어색하지 않은 장면 전환 지점)이 적어 잘 걸린다.',
      },
      {
        id: 'meta',
        label: '제목·설명을 이전 영상과 다르게 썼다',
        warning: '리뷰어가 메타데이터를 확인한다. 템플릿을 복사해 숫자만 바꾸면 바로 걸린다.',
      },
      {
        id: 'desc-ai',
        label: '설명란에 AI 활용 사실을 적었다',
      },
    ],
    widgets: ['opsUpload'],
  },
  {
    id: 'publish-scale',
    phaseId: 'publish',
    title: '다채널로 확장',
    summary: '이 방식은 필연적으로 여러 채널을 운영하게 된다. 브랜드 채널로 늘린다.',
    timestamp: '13:20',
    tools: ['youtube'],
    duration: '지속',
    keyPoint:
      '하나의 구글 계정에서 브랜드 채널로 여러 개를 운영할 수 있고, 이 자체로 제재받지 않는다. 강의 진행자는 계정 기준 여러 개, 채널 기준 수십 개를 운영한다.',
    actions: [
      '브랜드 채널을 추가해 채널 수를 늘린다.',
      '채널별 업로드 수와 수익 창출 승인 여부를 기록해 관리한다.',
      '수익 창출 정지가 오면 항소로 풀 수 있다. 채널 삭제와는 다른 문제다.',
    ],
    checklist: [
      { id: 'second', label: '두 번째 채널 개설' },
      {
        id: 'log',
        label: '채널별 상태를 아래 표에 기록',
        warning: '완전 자동화(클릭 한 번으로 영상까지)는 삭제 사유다. 사람의 선택 단계를 유지한다.',
      },
      {
        id: 'episode',
        label: '이 영상의 구조를 이력에 기록',
        warning: '기록해두지 않으면 다음 영상에서 같은 템플릿을 쓰게 된다.',
      },
      { id: 'backup', label: '작업 내용 백업' },
    ],
    widgets: ['channelTracker', 'episodeHistory', 'dataBackup'],
  },
  {
    id: 'publish-ops',
    phaseId: 'publish',
    title: '세무 · 저작권 정리',
    summary:
      '수익이 나기 시작하면 필요한 것들입니다. 강의가 다루지 않는 영역이고, 놓치면 가산세나 저작권 문제가 생깁니다.',
    timestamp: '48:23',
    tools: [],
    duration: '30분',
    keyPoint:
      '유튜브 수익은 사업소득입니다. 부가가치세법은 사업 개시일부터 20일 이내에 사업자등록을 신청하도록 정하고 있습니다. 그리고 민담 줄거리는 자유롭게 쓸 수 있지만 학자가 채록한 문장은 별개의 저작물입니다.',
    actions: [
      '수익 창출이 승인되면 사업자등록 시점을 확인한다.',
      'AI 도구 결제를 카드 하나로 모아 경비 증빙을 확보한다.',
      'AdSense 지급 명세를 매달 내려받아 보관한다.',
      '영상별로 어떤 원천 자료를 어떻게 썼는지 기록해 둔다.',
      '설명란에 AI 활용 사실을 한 줄 적는다.',
    ],
    checklist: [
      {
        id: 'reg',
        label: '사업자등록 시점을 확인했다',
        warning: '사업 개시일부터 20일 이내. 늦으면 가산세가 붙는다.',
      },
      {
        id: 'card',
        label: 'AI 도구 결제를 한 카드로 모았다',
        warning: '개인 카드와 섞이면 월 8만원을 경비로 넣기 어려워진다.',
      },
      {
        id: 'adsense',
        label: 'AdSense 지급 명세를 보관하기로 했다',
        warning: '구글 수익은 국내 원천징수 자료가 없어도 스스로 신고해야 한다.',
      },
      {
        id: 'source',
        label: '원천 자료 사용 방식을 기록하기로 했다',
        warning: '채록본 문장을 그대로 쓰면 저작권 침해이며 재사용 콘텐츠 정책에도 걸린다.',
      },
    ],
    widgets: ['opsTax', 'opsCopyright'],
  },
];

/** 페이즈별 단계 묶기 */
export function stepsByPhase(phaseId: string): Step[] {
  return STEPS.filter((s) => s.phaseId === phaseId);
}

export function findStep(id: string): Step | undefined {
  return STEPS.find((s) => s.id === id);
}
