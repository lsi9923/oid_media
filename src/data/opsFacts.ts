/**
 * 운영 실무 — 세무 · 저작권 · 업로드 운영 · 비용 최적화.
 *
 * 앞선 조사에서 앱에 빠져 있던 영역으로 확인된 것들이다.
 * 강의는 제작 방법만 다루고, 실제로 수익이 발생한 뒤에 필요한 것은 다루지 않는다.
 *
 * 각 항목에 근거 수준을 붙였다.
 *   official  공식 문서·법령에 명시된 것
 *   reported  보도나 공개 발언
 *   inferred  추론
 */

export type FactLevel = 'official' | 'reported' | 'inferred';

export interface OpsFact {
  id: string;
  category: '세무' | '저작권' | '업로드 운영' | '비용 절감' | '중간광고';
  title: string;
  body: string;
  level: FactLevel;
  source?: string;
  /** 당장 할 수 있는 조치 */
  action?: string;
  /** 놓치면 생기는 손해 */
  risk?: string;
}

export const OPS_FACTS: OpsFact[] = [
  // ─────────────── 세무 ───────────────
  {
    id: 'tax-registration',
    category: '세무',
    title: '사업 개시 20일 안에 사업자등록을 해야 합니다',
    body:
      '유튜브 수익은 계속·반복적으로 발생하므로 원칙적으로 사업소득입니다. 부가가치세법은 사업 개시일부터 20일 이내에 사업자등록을 신청하도록 정하고 있습니다. 늦으면 가산세가 붙고, 등록 전 지출한 비용의 증빙 처리가 까다로워집니다.',
    level: 'official',
    source: '부가가치세법 제8조 (국가법령정보센터)',
    action:
      '수익 창출이 승인되면 홈택스에서 사업자등록을 신청하세요. 업종코드는 미디어콘텐츠 창작업 계열을 씁니다.',
    risk: '미등록 가산세. 그리고 등록 전 구독료를 경비로 인정받기 어려워집니다.',
  },
  {
    id: 'tax-vat-type',
    category: '세무',
    title: '물적 시설과 직원이 없으면 면세사업자로 등록될 수 있습니다',
    body:
      '독립된 사무실 같은 물적 시설이 없고 고용인도 없는 1인 창작자는 면세사업자로 분류되는 경우가 있습니다. 이 경우 부가가치세 신고 의무가 없는 대신 매입세액 공제도 받지 못합니다. 반대로 과세사업자로 등록하면 구글에서 받는 수익은 외화 획득에 해당해 영세율이 적용될 수 있고, AI 도구 구독료의 매입세액을 공제받을 여지가 생깁니다.',
    level: 'official',
    source: '국세청 1인 미디어 창작자 세금 안내',
    action:
      '어느 쪽이 유리한지는 지출 규모에 따라 갈립니다. 등록 전에 세무대리인과 한 번 상의하는 편이 낫습니다.',
  },
  {
    id: 'tax-expense',
    category: '세무',
    title: 'AI 도구 구독료는 필요경비가 될 수 있습니다',
    body:
      '사업과 관련성이 인정되면 Claude, Vrew, Grok 구독료는 필요경비로 처리할 수 있습니다. 관건은 증빙입니다. 개인 카드와 섞이면 사업 관련성을 입증하기 번거로워집니다.',
    level: 'official',
    source: '소득세법 제27조 (필요경비의 계산)',
    action:
      'AI 도구 결제를 카드 하나로 모으세요. 해외 결제 명세도 증빙이 되므로 명세서를 보관하십시오.',
    risk: '증빙이 없으면 월 8만원 × 12개월을 경비로 못 넣습니다.',
  },
  {
    id: 'tax-self-report',
    category: '세무',
    title: '구글에서 받는 수익은 스스로 신고해야 합니다',
    body:
      '국내 사업자가 지급하는 소득과 달리, 구글이 해외에서 지급하는 수익은 국내에 원천징수 자료가 남지 않는 경우가 있습니다. 그렇다고 신고 의무가 없어지는 것은 아닙니다. 종합소득세 신고 때 본인이 합산해 신고해야 합니다.',
    level: 'official',
    source: '소득세법 종합소득세 신고 규정',
    action:
      'AdSense 지급 명세를 매달 내려받아 보관하세요. 이듬해 5월 종합소득세 신고에 씁니다.',
    risk: '신고 누락은 가산세 대상입니다. 국세청은 해외 지급 정보를 별도로 수집합니다.',
  },

  // ─────────────── 저작권 ───────────────
  {
    id: 'copyright-motif',
    category: '저작권',
    title: '민담의 줄거리는 자유롭게 쓸 수 있지만 채록본은 다릅니다',
    body:
      '구전 민담의 이야기 골격 자체는 특정인의 창작물이 아니어서 저작권 보호 대상이 아닙니다. 그러나 그것을 채록하고 정리한 학자의 문장, 현대어 번안, 재화집은 별개의 저작물입니다. 그 표현을 그대로 옮기면 침해가 됩니다.',
    level: 'official',
    source: '저작권법 제2조 (저작물의 정의)',
    action:
      '모티프와 줄거리만 참고하고 문장은 직접 쓰세요. 이 앱의 모티프 뱅크가 줄거리 요약만 담은 이유입니다.',
    risk: '채록본 문장을 그대로 쓰면 저작권 침해이며, YouTube 재사용 콘텐츠 정책도 함께 걸립니다.',
  },
  {
    id: 'copyright-classify',
    category: '저작권',
    title: '원천 자료를 세 갈래로 분류해 두세요',
    body:
      '① 줄거리만 차용하고 문장은 직접 쓴 것 — 안전합니다. ② 채록본·번역본의 문장을 인용하거나 각색한 것 — 위험합니다. ③ 저작권 보호기간이 만료된 문헌 — 안전하지만 원문 낭독만으로는 YouTube 재사용 콘텐츠 정책에 걸립니다.',
    level: 'inferred',
    action: '어떤 자료를 어떻게 썼는지 영상별로 기록해 두세요. 나중에 문제가 생기면 근거가 됩니다.',
  },

  // ─────────────── 업로드 운영 ───────────────
  {
    id: 'upload-cadence',
    category: '업로드 운영',
    title: '많이 올리는 것 자체는 노출을 늘리지 않습니다',
    body:
      'YouTube 추천 시스템 책임자 Todd Beaupré는 수백만 채널을 분석한 결과 업로드 간격과 조회수 사이에 사실상 상관관계가 없다고 공개적으로 밝혔습니다. 반면 짧은 간격으로 비슷한 형식을 반복하면 "generic or repetitive content" 판정 위험은 커집니다.',
    level: 'official',
    source: 'Todd Beaupré 공개 발언 (YouTube 추천 시스템)',
    action:
      '하루 두 편보다 이틀에 한 편이 낫습니다. 편수를 줄이고 각 영상의 차별점에 시간을 쓰세요.',
    risk: '대량 업로드는 노출 이득 없이 정책 리스크만 키웁니다.',
  },
  {
    id: 'upload-metadata',
    category: '업로드 운영',
    title: '리뷰어는 채널 전체와 메타데이터를 봅니다',
    body:
      'YouTube 공식 문서는 리뷰어가 확인하는 항목을 밝히고 있습니다. 채널의 주요 주제, 최다 조회 영상, 최신 영상, 시청 시간 비중이 큰 영상, 제목·썸네일·설명 등 메타데이터, 채널 소개(About) 섹션입니다.',
    level: 'official',
    source: 'https://support.google.com/youtube/answer/1311392',
    action:
      '제목과 설명을 영상마다 다르게 쓰세요. 템플릿을 복사해 숫자만 바꾸면 리뷰어 눈에 바로 걸립니다. 채널 소개에 그 채널이 무엇을 다루는지 구체적으로 적으세요.',
  },
  {
    id: 'upload-podcast-playlist',
    category: '업로드 운영',
    title: '재생목록을 팟캐스트로 지정할 수 있습니다',
    body:
      'YouTube Studio에서 재생목록을 팟캐스트로 설정하면 YouTube Music에도 노출되고 배경 재생 흐름에 들어갑니다. 배경 청취 목적의 장편 오디오 콘텐츠와 성질이 맞습니다.',
    level: 'official',
    source: 'YouTube 팟캐스트 제작자 안내',
    action: 'Studio → 재생목록 → 해당 목록 편집 → 팟캐스트로 설정.',
  },
  {
    id: 'upload-ai-disclosure-desc',
    category: '업로드 운영',
    title: '설명란에도 AI 활용을 적어두는 편이 안전합니다',
    body:
      '업로드 설정의 합성 콘텐츠 체크와 영상 내 문구 외에, 설명란에 어떤 부분에 AI를 썼는지 적어두면 나중에 문제가 생겼을 때 고의성 없음을 보이는 근거가 됩니다.',
    level: 'inferred',
    action:
      '설명란에 한 줄 넣으세요. "대본 구성에 AI 보조를 사용했고 나레이션은 AI 음성입니다."',
  },

  // ─────────────── 중간광고 ───────────────
  {
    id: 'midroll-not-guaranteed',
    category: '중간광고',
    title: '슬롯을 넣어도 광고가 붙는다는 보장이 없습니다',
    body:
      'YouTube 공식 문서 원문입니다. "Ad slots are not guaranteed to serve ads." 광고 시스템이 시청자 경험, 제작자 수익, 광고주 가치를 종합해 어느 슬롯에 광고를 넣을지 결정합니다.',
    level: 'official',
    source: 'https://support.google.com/youtube/answer/6175006',
    action: '슬롯 개수로 수익을 추산하지 마세요. Studio의 실제 수익 데이터를 보십시오.',
    risk: '슬롯 수 × RPM으로 계산하면 수익을 크게 과대추정합니다.',
  },
  {
    id: 'midroll-breakpoints',
    category: '중간광고',
    title: 'TTS 낭독은 자연 중단점이 적어 불리합니다',
    body:
      '공식 문서는 오디오가 멈추거나 화면이 전환되는 자연 중단점의 슬롯이 광고를 받을 가능성이 높고, 문장 중간이나 동작 중간은 낮다고 밝힙니다. TTS 낭독은 끊김 없이 이어지므로 자연 중단점이 드뭅니다.',
    level: 'official',
    source: 'https://support.google.com/youtube/answer/6175006',
    action:
      '챕터가 바뀌는 지점, 장면이 전환되는 지점에 수동으로 슬롯을 놓으세요. Vrew에서 그 지점에 짧은 무음을 넣으면 중단점이 생깁니다.',
  },
  {
    id: 'midroll-red-feedback',
    category: '중간광고',
    title: 'Studio가 게재 가능성 낮은 슬롯을 빨간색으로 알려줍니다',
    body:
      '업로드 후 대체로 한 시간 안에 각 수동 슬롯의 품질 피드백이 나옵니다. 빨간색으로 표시된 슬롯은 광고가 붙을 가능성이 낮다는 뜻이며, 위치를 옮기면 개선됩니다.',
    level: 'official',
    source: 'https://support.google.com/youtube/answer/6175006',
    action: '업로드 한 시간 뒤 Studio → 수익 창출 → 광고 슬롯 관리에서 빨간 슬롯을 옮기세요.',
  },
  {
    id: 'midroll-calm-content',
    category: '중간광고',
    title: '차분한 콘텐츠는 중간광고가 역효과일 수 있습니다',
    body:
      'YouTube 공식 FAQ는 "명상 영상은 중간광고에 적합하지 않을 수 있다"고 예시를 들며, 적절하지 않다고 판단되면 끄는 것을 권합니다. 잠들기 전 듣는 용도의 콘텐츠라면 광고가 이탈을 부를 수 있습니다.',
    level: 'official',
    source: 'https://support.google.com/youtube/answer/6175006',
    action:
      '서사가 있는 야담은 중간광고를 켜되 챕터 경계에 놓으세요. 순수 배경 청취용이라면 슬롯을 줄여 시청 시간을 지키는 편이 유리할 수 있습니다. 두 방식을 나눠 올려 비교해 보세요.',
  },

  // ─────────────── 비용 절감 ───────────────
  {
    id: 'cost-prompt-caching',
    category: '비용 절감',
    title: 'Claude API로 옮기면 프롬프트 캐싱으로 비용을 줄일 수 있습니다',
    body:
      '이 방식은 같은 장문 지침을 매번 반복해서 보냅니다. Claude API의 프롬프트 캐싱은 반복되는 앞부분을 캐시에서 읽어 입력 토큰 비용을 표준 대비 약 10분의 1로 낮춥니다. 대신 캐시를 쓸 때 25% 정도의 쓰기 할증이 붙고, 캐시 유효 시간이 짧아 간격이 벌어지면 이득이 사라집니다.',
    level: 'official',
    source: 'Anthropic 공식 문서 (프롬프트 캐싱)',
    action:
      '한 영상 작업을 몰아서 하면 캐시 적중률이 올라갑니다. 다만 API 전환은 코드를 다뤄야 하므로, 그럴 뜻이 없으면 Pro 구독을 유지하는 편이 단순합니다.',
    risk: '작업 간격이 벌어지면 캐시가 만료돼 오히려 할증만 냅니다.',
  },
  {
    id: 'cost-measure-first',
    category: '비용 절감',
    title: '줄이기 전에 실제 지출을 재보세요',
    body:
      '월 8만원은 세 도구를 모두 구독한 경우입니다. 실제로는 Flow와 미리캔버스가 무료이므로, 편수가 적으면 구독을 다 유지할 필요가 없을 수 있습니다.',
    level: 'inferred',
    action:
      '첫 달은 최소 구성으로 시작하세요. Claude만 결제하고 인트로 영상을 생략하면 월 3만원 선에서 시작할 수 있습니다. 필요해지면 늘리십시오.',
  },
];

/** 분류별로 묶어 반환 */
export function factsByCategory(category: OpsFact['category']): OpsFact[] {
  return OPS_FACTS.filter((f) => f.category === category);
}

export const OPS_CATEGORIES: OpsFact['category'][] = [
  '세무',
  '저작권',
  '업로드 운영',
  '중간광고',
  '비용 절감',
];

export const TAX_DISCLAIMER =
  '이 내용은 공개된 법령과 국세청 안내를 정리한 참고 자료입니다. 세무 상담을 대체하지 않습니다. ' +
  '개별 상황에 따른 판단은 세무대리인과 상의하십시오.';
