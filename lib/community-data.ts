export type Program = { title:string; description:string; date:string; time:string; place:string; capacity:string; fee:string; application:string; host:string; openSeats?:string; demo:true };
export const commonPrograms: Program[] = [
  {title:"작은 독서모임",description:"한 권의 책을 천천히 읽고 이야기를 나누는 예시 모임입니다.",date:"일정 준비 중",time:"시간 협의 중",place:"COMMON SPACE · 공간 미정",capacity:"정원 미정",fee:"참가비 미정",application:"사전 신청",host:"예시 HOST · 지역 주민",openSeats:"COMMON OPEN 자리 미정",demo:true},
  {title:"스마트폰 같이 배우기",description:"스마트폰의 기본 기능을 이웃과 함께 익히는 예시 프로그램입니다.",date:"일정 준비 중",time:"시간 협의 중",place:"COMMON SPACE · 공간 미정",capacity:"정원 미정",fee:"참가비 미정",application:"사전 신청",host:"예시 HOST · 지역 자원봉사자",demo:true},
];

export type Space = { slug:string; name:string; description:string; recommended:string; maximum:string; uses:string[]; availability:string; fee:string; equipment:string[]; notice:string; available:boolean; demo:true };
export const commonSpaces: Space[] = [
  {slug:"room-a",name:"예시 공간 A",description:"회의와 공부, 작은 모임을 위한 공간의 예시입니다.",recommended:"권장 인원 확인 중",maximum:"최대 인원 확인 중",uses:["회의","공부","작은 클래스"],availability:"이용 가능 시간 확인 중",fee:"기본 사용료 확인 중",equipment:["시설·장비 확인 중"],notice:"실제 2층 공간 정보 확정 후 업데이트됩니다.",available:false,demo:true},
  {slug:"room-b",name:"예시 공간 B",description:"동아리와 이웃 활동을 위한 공간의 예시입니다.",recommended:"권장 인원 확인 중",maximum:"최대 인원 확인 중",uses:["동아리","이웃 모임","워크숍"],availability:"이용 가능 시간 확인 중",fee:"기본 사용료 확인 중",equipment:["시설·장비 확인 중"],notice:"현재는 신청 흐름을 확인하는 DEMO입니다.",available:true,demo:true},
];

export const commonTables = [
  {icon:"🌿",name:"QUIET TABLE",copy:"오늘은 그냥 조용히 쉬어가도 괜찮아요.",description:"말하지 않고 혼자 편안히 머물고 싶은 사람을 위한 자리입니다."},
  {icon:"☕",name:"COMMON TABLE",copy:"혼자 오셨다면 함께 앉아도 괜찮아요.",description:"가볍게 공간을 공유하며 자연스러운 인사를 시작할 수 있는 자리입니다."},
];

export const connectCategories = [
  ["신앙 이야기","사용자가 원할 때에만 목회적 돌봄 또는 신앙 대화로 연결합니다."],["법률","무료 공공서비스를 먼저 찾고, 필요한 경우 검증된 전문 자원을 안내합니다."],["세무 · 재무","공공 무료상담 또는 검증된 전문 자원을 우선 확인합니다."],["취업 · 진로","고용 관련 공공기관과 지역의 검증된 경험 자원을 찾습니다."],["아이 · 가족","확인된 지역 전문기관이나 공공서비스를 찾습니다."],["청소년","관련 공공기관 또는 검증된 전문기관을 우선 확인합니다."],["디지털 생활","스마트폰·키오스크 이용을 도울 수 있는 지역 자원을 찾습니다."],["생활정보","상황에 맞는 공공기관 또는 지역기관 정보를 찾습니다."],
];

export const circleDemo = { period:"예시 집계 기간", uses:"예시 18회", income:"예시 480,000원", cost:"예시 96,000원", contribution:"예시 384,000원", cumulative:"예시 2,840,000원" };
export const contributionDemo = [{date:"예시 2026.09.28",category:"지역 아동 지원",amount:"예시 150,000원",organization:"예시 기관 (실제 파트너 아님)",purpose:"환원 내역 표시 방식 예시",status:"DEMO · 집행 내역 아님",evidence:"증빙 공개 방식 준비 중"}];
