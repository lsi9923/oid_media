/**
 * YouTube 수익화 정책 — 공식 문서 기반 리스크 데이터.
 *
 * 출처: https://support.google.com/youtube/answer/1311392 (2026-08-01 확인)
 * 2025년 7월 15일 'repetitious content' → 'inauthentic content'로 개칭,
 * 2026년 7월 수익화 불가 3개 범주가 명시됐다.
 *
 * 중요: 강의는 "이야기니까 픽션이라서 안 걸린다"고 설명하지만,
 * 공식 정책은 픽션 여부를 면제 사유로 두지 않는다. 템플릿 반복 자체를 문제로 본다.
 * 이 모듈은 그 간극을 사용자에게 정확히 알리기 위한 것이다.
 */

/** 정책 위반 위험도 */
export type RiskLevel = 'high' | 'medium' | 'low';

/** 이 제작 방식이 정책과 부딪치는 지점 */
export interface RiskItem {
  id: string;
  /** 정책 범주 */
  category: string;
  /** 공식 문서의 금지 문구 (번역) */
  policyText: string;
  /** 원문 */
  policyOriginal: string;
  /** 이 제작 방식에서 어떻게 걸리는가 */
  howItApplies: string;
  level: RiskLevel;
  /** 회피 방법. 공식 문서가 허용한다고 밝힌 것에 근거해야 한다 */
  mitigation: string[];
  /** 회피 근거가 되는 공식 허용 문구 */
  allowedBasis?: string;
}

export const POLICY_SOURCE = {
  url: 'https://support.google.com/youtube/answer/1311392',
  title: 'YouTube channel monetization policies',
  checkedAt: '2026-08-01',
  renamedAt: '2025-07-15',
  note: '이 페이지의 "Inauthentic content" 항목이 이 제작 방식의 핵심 리스크다.',
} as const;

/** 공식 정책이 정의한 수익화 불가 3개 범주 */
export const INAUTHENTIC_CATEGORIES = [
  {
    id: 'generic',
    name: '일반적이거나 반복적인 콘텐츠',
    nameEn: 'Generic or Repetitive Content',
    summary:
      '템플릿으로 만든 것처럼 보이거나, 같은 채널 영상을 몇 개 연달아 보면 반복된다고 느껴지는 콘텐츠.',
  },
  {
    id: 'offputting',
    name: '만족스럽지 않거나 불쾌한 콘텐츠',
    nameEn: 'Unsatisfying or Off-putting Content',
    summary:
      '감정을 조작하는 공식에 크게 의존하거나, 기존 형식·이야기를 흉내내 영상이 서로 바꿔 써도 될 정도인 콘텐츠.',
  },
  {
    id: 'aipersona',
    name: '민감한 주제의 AI 페르소나',
    nameEn: 'AI Personas Related to Sensitive Topics',
    summary:
      'AI가 만든 인물이 건강·법률·금융·정치에 관해 사람 전문가처럼 조언하는 콘텐츠. 민담 제작에는 해당하지 않는다.',
  },
] as const;

/**
 * 민담 제작 방식이 실제로 부딪치는 지점.
 * 각 항목의 policyOriginal은 공식 문서에서 그대로 가져온 것이다.
 */
export const RISK_ITEMS: RiskItem[] = [
  {
    id: 'template-storyline',
    category: '일반적이거나 반복적인 콘텐츠',
    policyText:
      '여러 영상에 매우 비슷한 줄거리 템플릿을 쓰는 것. 등장인물이 같은 상황에 반복해서 놓이고 같은 결말을 맞는 영상.',
    policyOriginal:
      'Videos where characters are put in the same situation over and over again with the same outcome (i.e., using a highly similar storyline template across multiple videos)',
    howItApplies:
      '이 방식의 대본 프롬프트는 9단계 골격과 반전 여섯 개를 고정 틀로 씁니다. 주인공만 바꿔 이 틀을 반복하면 정책이 금지한 "매우 비슷한 줄거리 템플릿"에 정확히 해당합니다. 강의도 "그냥 주인공만 바뀌는 거지"라고 말합니다.',
    level: 'high',
    mitigation: [
      '골격 9단계를 매번 그대로 쓰지 말고, 영상마다 단계 순서나 개수를 바꾼다. 반전 개수도 넷에서 여덟 개 사이로 변주한다.',
      '결말 유형을 돌려 쓴다. 응보로 끝나는 것, 용서로 끝나는 것, 대가를 치르고 얻는 것, 진실만 밝혀지고 끝나는 것.',
      '갈래를 섞는다. 권선징악만 열 편 연달아 올리지 않는다. 귀신·추리·혼인·은혜를 번갈아 낸다.',
      '주인공의 신분과 처지를 바꾼다. 며느리만 연속으로 쓰지 않는다.',
      '한 채널에 같은 모티프를 두 번 이상 쓰지 않도록 기록해 둔다.',
    ],
    allowedBasis:
      '공식 문서가 허용한 예: "Similar content, like a series following a set of characters across episodes ... but in which each video has a distinct storyline, focus, or concept"',
  },
  {
    id: 'slideshow',
    category: '일반적이거나 반복적인 콘텐츠',
    policyText: '내레이션이나 해설, 교육적 가치가 거의 없는 이미지 슬라이드쇼.',
    policyOriginal:
      'Image slideshows, templated storylines, or scrolling text with minimal or no narrative, commentary, or educational value',
    howItApplies:
      '두 시간 영상에 정지 이미지 40장을 느린 확대로 넘기는 구성은 형식만 보면 이미지 슬라이드쇼입니다. 다만 이 방식에는 창작 내레이션이 있으므로 "minimal or no narrative" 조건에는 걸리지 않습니다. 형식보다 내레이션의 실질이 관건입니다.',
    level: 'medium',
    mitigation: [
      '내레이션이 실제 이야기를 전달하게 한다. 상황 설명만 늘어놓지 않는다.',
      '이미지를 대사·사건과 맞물리게 배치한다. 무관한 이미지를 채우기로 넣지 않는다.',
      '인트로 구간에 영상 클립을 넣어 완전 정지 화면으로만 구성되지 않게 한다. 이 방식은 이미 그렇게 하고 있다.',
    ],
    allowedBasis:
      '공식 문서가 허용한 예: "Content that utilizes creative tools to assist in delivering a unique, well-researched, or creative narrative"',
  },
  {
    id: 'mass-production',
    category: '일반적이거나 반복적인 콘텐츠',
    policyText:
      '제작자의 독창적이고 진정한 통찰이나 관점을 더하지 않고, 일반적이거나 독창성 없는 템플릿으로 만들어 대량 생산 인상을 주는 AI 생성 콘텐츠.',
    policyOriginal:
      'AI-generated content made with generic or unoriginal templates giving the impression of mass production without adding the creator’s original, authentic insights or perspective',
    howItApplies:
      '하루 두 편, 채널 수십 개 운영은 정의상 대량 생산입니다. 여기서 갈리는 것은 "제작자의 관점이 더해졌는가"입니다. 강의는 대본을 읽지 않아도 된다고 말하지만, 정책은 제작자의 관점을 요구합니다. 이 지점이 정면으로 부딪칩니다.',
    level: 'high',
    mitigation: [
      '채널마다 뚜렷한 성격을 준다. 다루는 갈래, 화자의 말투, 시대 배경을 채널별로 다르게 한다.',
      '주제 선택과 인트로 검수를 실제로 한다. 아무거나 고르지 않는다. 이 판단이 "제작자의 관점"의 근거가 된다.',
      '채널 소개(About)에 그 채널이 무엇을 다루는지 구체적으로 쓴다. 리뷰어가 확인하는 항목이다.',
      '업로드 속도를 낮추는 편이 안전하다. 하루 두 편보다 이틀에 한 편이 리스크가 작다.',
      '한 계정에 채널 수십 개를 두지 않는다. 한 채널이 제재를 받으면 다른 채널로 전파될 수 있다.',
    ],
    allowedBasis:
      '공식 문서가 허용한 예: "Content that expresses your unique creative voice, like using AI to visualize a unique character and narrative you invented"',
  },
  {
    id: 'emotional-formula',
    category: '만족스럽지 않거나 불쾌한 콘텐츠',
    policyText:
      '일관된 서사를 만들지 않고 폭력이나 상실 같은 불편한 주제를 반복해서 쓰는 콘텐츠. 일반적인 템플릿이나 감정을 조작하는 주제에 크게 의존하는 채널.',
    policyOriginal:
      'Content that repeatedly uses disturbing themes (such as violence or loss) without building a cohesive narrative / Channels that heavily rely on generic templates or emotionally manipulative themes',
    howItApplies:
      '민담은 학대, 굶김, 버려짐, 억울한 죽음을 다룹니다. 여기에 "감동 포인트"를 배치해 감정을 끌어내는 설계가 프롬프트에 들어 있습니다. 서사가 일관되지 않으면 "감정 조작 공식"으로 판정될 수 있습니다.',
    level: 'medium',
    mitigation: [
      '서사의 인과를 반드시 닫는다. 불편한 장면이 이야기 안에서 의미를 가져야 한다.',
      '자극을 조회수 목적으로만 쓰지 않는다. 학대 장면을 썸네일 낚시로 쓰면 위험이 커진다.',
      '제목·썸네일이 본문 내용과 일치하게 한다. 불일치는 낚시로 판정된다.',
      '감동 지점을 매 영상 같은 위치에 같은 방식으로 넣지 않는다.',
    ],
    allowedBasis:
      '공식 문서가 허용한 예: "Content with a cohesive storyline that doesn’t rely solely on shock value to generate views"',
  },
  {
    id: 'ai-disclosure',
    category: 'AI 제작 표시',
    policyText:
      '사실적으로 보이는 합성 콘텐츠는 공개 의무가 있습니다. 공개 자체는 수익화에 영향을 주지 않습니다.',
    policyOriginal:
      'Altered or synthetic content disclosure — required for realistic content that viewers could mistake for real',
    howItApplies:
      '민담은 명백한 창작 픽션이고 조선시대 배경이므로 실제 사건으로 오인될 소지가 낮습니다. 그래도 표시하는 편이 안전합니다. 표시했다고 불이익은 없습니다.',
    level: 'low',
    mitigation: [
      '업로드 설정에서 "변경된 콘텐츠 또는 합성 콘텐츠" 항목을 체크한다.',
      '영상 도입부 화면에도 문구를 넣는다. 시청자가 설정 표시를 못 볼 수 있다.',
      '표시를 누락하면 YPP 정지 사유가 될 수 있다. 애매하면 표시한다.',
    ],
  },
  {
    id: 'multi-channel-spread',
    category: '제재 전파',
    policyText:
      '위반 시 모든 계정 또는 일부 계정에서 수익화가 정지되거나 영구 비활성화될 수 있습니다. 제재를 회피할 목적으로 새 채널을 만들면 모든 채널이 해지될 수 있습니다.',
    policyOriginal:
      'Violation of our YouTube channel monetization policies may result in monetization being suspended or permanently disabled on all or any of your accounts. ... If any of your channels have been demonetized or terminated, you should not create new (or use existing) channels to get around these restrictions ... Doing so could lead to termination of all channels.',
    howItApplies:
      '강의는 채널 수십 개 운영을 권합니다. 정책은 제재가 계정 전체로 번질 수 있다고 명시합니다. 한 채널이 걸리면 나머지도 위험합니다.',
    level: 'high',
    mitigation: [
      '한 계정에 채널을 몰아넣지 않는다. 계정을 분리하면 전파 위험이 줄어든다.',
      '제재를 받은 뒤 회피용으로 새 채널을 만들지 않는다. 이것이 전체 해지로 이어지는 가장 빠른 길이다.',
      '수익화 정지는 항소로 풀릴 수 있다. 정지 예고를 받으면 7일 이내, 이미 정지됐으면 21일 이내에 항소한다.',
      '항소가 기각되면 추가 항소는 불가하고, 90일 후 재신청만 가능하다.',
    ],
  },
];

/** 강의의 설명과 공식 정책이 어긋나는 지점 */
export interface Discrepancy {
  id: string;
  lectureClaim: string;
  lectureTimestamp: string;
  policyReality: string;
  soWhat: string;
}

export const DISCREPANCIES: Discrepancy[] = [
  {
    id: 'fiction-exempt',
    lectureClaim:
      '"이야기는 허위 콘텐츠로 걸리지 않아요. 애초에 픽션이라서 안 걸립니다."',
    lectureTimestamp: '07:36',
    policyReality:
      '허위정보 정책에는 안 걸리는 것이 맞습니다. 그러나 수익화를 막는 것은 허위정보 정책이 아니라 "Inauthentic content" 정책이고, 여기에는 픽션 면제 조항이 없습니다. 금지 예시에 "templated storylines"와 "highly similar storyline template across multiple videos"가 명시돼 있습니다.',
    soWhat:
      '픽션이라는 사실은 방어가 되지 않습니다. 방어가 되는 것은 영상마다 줄거리가 실제로 다르다는 점입니다.',
  },
  {
    id: 'no-need-to-read',
    lectureClaim:
      '"저는 제가 만든 이야기가 무슨 이야기인지 몰라요. 알 필요가 없죠."',
    lectureTimestamp: '26:21',
    policyReality:
      '정책은 "제작자의 독창적이고 진정한 통찰이나 관점"을 요구하고, 그것이 없는 AI 대량 생산을 수익화 불가로 규정합니다. 리뷰어는 채널의 주요 주제, 최다 조회 영상, 최신 영상, 메타데이터, 채널 소개를 확인합니다.',
    soWhat:
      '대본 전문을 다 읽을 필요는 없지만, 채널의 성격과 각 영상의 차별점은 스스로 알고 있어야 합니다. 최소한 주제 선택과 인트로 검수는 실제로 판단해야 합니다.',
  },
  {
    id: 'april-purge',
    lectureClaim: '"4월 숙청 이후로는 안 날아갑니다. 삭제하지 않아요."',
    lectureTimestamp: '13:07',
    policyReality:
      '정책은 2025년 7월에 개칭되고 2026년 7월에 3개 범주가 명시되며 오히려 강화됐습니다. 과거 특정 시점에 제재가 없었다는 것이 앞으로의 안전을 보장하지 않습니다.',
    soWhat:
      '정책은 계속 조여지는 방향입니다. 업로드 전 최신 기준을 직접 확인하고, 한 계정에 모든 채널을 몰아넣지 마세요.',
  },
];

/** 수익 구조 실제 수치. 출처와 신뢰도를 함께 둔다. */
export interface RevenueFact {
  label: string;
  value: string;
  source: string;
  /** official = 공식 문서, analysis = 상업 분석, estimate = 추정 */
  confidence: 'official' | 'analysis' | 'estimate';
  note?: string;
}

export const REVENUE_FACTS: RevenueFact[] = [
  {
    label: '전 니치 RPM 중위값',
    value: '약 $2.30 / 1,000회',
    source: 'AIR Media-Tech, 300개 채널 실데이터 (2026)',
    confidence: 'analysis',
  },
  {
    label: 'Entertainment 니치 RPM',
    value: '약 $2.43 / 1,000회',
    source: 'AIR Media-Tech (2026)',
    confidence: 'analysis',
    note: '민담·야담은 Entertainment 또는 People & Blogs로 분류될 가능성이 높다.',
  },
  {
    label: '한국 대 미국 CPM 비율',
    value: '약 1 대 4 (한국 $2.7 / 미국 $11.1)',
    source: 'isthischannelmonetized.com 국가별 CPM',
    confidence: 'analysis',
    note: '한국 시청자 기반 채널은 미국 기반 대비 RPM이 크게 낮다. 강의의 수익 사례를 그대로 기대하기 어렵다.',
  },
  {
    label: '중간광고 활성 조건',
    value: '영상 길이 8분 이상',
    source: 'Google 공식 지원 문서',
    confidence: 'official',
    note: '길이가 길수록 슬롯을 많이 넣을 수 있으나, 실제 광고 서빙은 YouTube가 결정한다.',
  },
  {
    label: '2026년 롱폼 영상당 광고 수익 추이',
    value: '전년 대비 약 55% 하락',
    source: 'Metricool 벤치마크 보고서 (2026)',
    confidence: 'analysis',
    note: '조회수는 늘었으나 평균 시청 시간이 줄어 영상당 수익이 감소했다.',
  },
  {
    label: 'YouTube 수익 배분율',
    value: '광고 수익의 55%가 제작자, 45%가 YouTube',
    source: 'YouTube 공식',
    confidence: 'official',
  },
];

/** 노출·지속시간 실무. YouTube가 직접 밝힌 것만 담는다. */
export const ALGORITHM_FACTS: RevenueFact[] = [
  {
    label: '추천에 쓰이는 주요 신호',
    value: '시청 기록, 클릭률, 평균 시청 시간, 평균 시청 비율, 만족도 설문, 좋아요·싫어요·공유',
    source: 'YouTube 공식 Help Center 및 검색·추천 작동 방식 문서',
    confidence: 'official',
  },
  {
    label: '업로드 주기와 조회수의 관계',
    value: '수백만 채널 분석 결과 업로드 간격과 조회수 사이에 사실상 상관관계가 없음',
    source: 'Todd Beaupré(YouTube 추천 시스템 책임자) 공개 발언',
    confidence: 'official',
    note: '많이 올리는 것 자체가 노출을 늘리지는 않는다. 정책 리스크만 커진다.',
  },
  {
    label: '썸네일·제목 A/B 테스트',
    value: 'Test & Compare 기능으로 썸네일 3개까지 비교. 승자는 시청 시간 점유율로 결정',
    source: 'YouTube 공식 지원 문서 (answer/16391400)',
    confidence: 'official',
    note: '이 방식은 썸네일이 성패를 가르므로 이 기능을 쓰는 것이 합리적이다.',
  },
  {
    label: '낚시성 제목·썸네일',
    value: '내용과 불일치하는 제목·썸네일은 스팸 정책상 악성 클릭베이트로 제재 대상',
    source: 'YouTube 스팸 정책. 2024년 12월 단속 강화',
    confidence: 'official',
    note: '궁금증을 만드는 것과 거짓을 말하는 것은 다르다. 제목이 약속한 내용이 본문에 실제로 있어야 한다.',
  },
];
