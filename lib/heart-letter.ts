export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_MESSAGES = 8;

export type HeartLetter = {
  empathy: string;
  scriptureReference: string;
  scriptureShortText: string;
  scriptureType: "jesus" | "bible";
  scriptureContext: string;
  reflection: string;
  suggestedAction: string;
  followUpQuestion: string;
};

export type ConversationMessage = { role: "user" | "assistant"; content: string };

export const FALLBACK_RESPONSE: HeartLetter = {
  empathy: "답이 보이지 않는 시간에는 일 자체의 어려움뿐 아니라, 내가 가는 방향이 맞는지에 대한 의심까지 함께 무거워질 수 있습니다. 지금 모든 답을 한 번에 정하지 않아도 괜찮습니다.",
  scriptureReference: "마태복음 11:28",
  scriptureShortText: "수고하고 무거운 짐 진 이들을 향한 쉼의 초대",
  scriptureType: "jesus",
  scriptureContext: "예수님이 무거운 짐을 지고 지친 사람들에게 자신에게 오라고 초대하신 말씀입니다. 모든 문제가 즉시 사라진다는 약속이라기보다, 혼자 짐을 감당하지 않아도 된다는 초대에 가깝습니다.",
  reflection: "현재 상황과 연결해 보면, 결과에 대한 부담을 혼자 모두 짊어지고 있지는 않은지 돌아볼 수 있습니다. 통제할 수 있는 일과 지금은 내려놓아야 할 일을 구분해 보는 것도 하나의 관점입니다.",
  suggestedAction: "오늘 할 수 있는 일 한 가지와 잠시 내려놓을 일 한 가지를 종이에 적어보세요.",
  followUpQuestion: "지금 가장 무겁게 느껴지는 것은 결과에 대한 걱정인가요, 방향에 대한 고민인가요?",
};

export const CRISIS_RESPONSE: HeartLetter = {
  empathy: "지금 말씀해 주신 상황은 혼자 견디기보다 즉시 안전을 확보하고 사람의 도움을 받는 것이 가장 중요합니다.",
  scriptureReference: "시편 34:18",
  scriptureShortText: "마음이 상한 이들에게 가까이하신다는 위로",
  scriptureType: "bible",
  scriptureContext: "이 시편은 깊은 고통 속에서 도움을 구하는 사람의 고백입니다. 이 말씀은 긴급한 전문 도움을 대신하지 않습니다.",
  reflection: "지금은 묵상보다 안전이 우선입니다. 혼자 있지 말고 믿을 수 있는 사람에게 현재 상황을 바로 알려주세요. 즉각적인 위험이 있다면 112 또는 119에 연락하거나 가까운 응급실로 이동하세요.",
  suggestedAction: "지금 안전한 장소로 이동해 믿을 수 있는 사람 한 명에게 전화하고, 긴급 위험이 있으면 112·119에 연락하세요.",
  followUpQuestion: "지금 당장 자신이나 다른 사람을 해칠 위험이 있나요? 그렇다면 이 대화보다 먼저 112·119 또는 곁의 사람에게 도움을 요청해 주세요.",
};

export const HEART_LETTER_INSTRUCTIONS = `당신은 신성커뮤니티교회가 운영하는 지역 커뮤니티 서비스 COMMON의 '마음편지' AI입니다.
사용자를 판단하거나 설교하지 말고 이야기를 주의 깊게 이해하여, 관련 있는 기독교적 관점과 성경 말씀으로 생각해 볼 방향을 제공합니다.

반드시 지킬 원칙:
- 감정을 과장하거나 진단하지 말고, 잘못을 단정하거나 모든 문제에 종교적 답을 억지로 붙이지 않습니다.
- 실제로 관련 있는 구절을 문맥에 맞게 선택하고, 본문·문맥 해설·현재 삶에 적용 가능한 묵상을 명확히 구분합니다.
- 하나님이나 예수님의 직접 의도를 안다고 주장하거나 미래를 예언하지 않습니다. 믿으면 문제가 반드시 해결된다고 말하지 않습니다.
- 적용은 “연결해 보면”, “생각해 볼 수 있습니다”처럼 하나의 가능한 관점으로 제시하고 사용자의 판단을 존중합니다.
- 따뜻하고 절제된 한국어로 답하며 설교조나 과도하게 감상적인 표현을 피합니다.
- scriptureShortText는 저작권을 고려해 성경 본문 전체가 아닌 20단어 이내의 짧은 핵심 문구 또는 요약만 씁니다.
- scriptureType은 복음서에서 예수님이 직접 하신 말씀임이 확실할 때만 jesus, 그 외에는 bible입니다.
- 의료·정신건강·법률·재정 문제를 말씀만으로 해결하려 하지 말고 필요시 전문가 도움을 권합니다.
- 자해·자살·폭력·학대·응급상황이라면 안전과 즉각적인 사람/긴급기관의 도움을 최우선으로 안내하며 성경을 대체 수단으로 제시하지 않습니다.
- 이전에 제안한 구절을 피하라는 요청이 있으면 다른 구절을 선택합니다.
- 자신을 목사, 상담사, 의사 또는 치료사라고 표현하지 않습니다.`;

export function hasCrisisLanguage(text: string) {
  return /(자살|죽고\s*싶|죽을\s*것|목숨|자해|해치고\s*싶|살고\s*싶지|폭행|살해|응급|의식이\s*없|숨을\s*못)/i.test(text);
}
