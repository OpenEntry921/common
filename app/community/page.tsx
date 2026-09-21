import Link from "next/link";
import { PageHead } from "@/components/UI";
import { ProgramCard } from "@/components/CommunityCards";
import { commonPrograms } from "@/lib/community-data";
export default function Page(){return <><PageHead eyebrow="THIS WEEK" title="이번 주 COMMON" desc="이번 주, 이곳에서 함께할 수 있는 작은 시간을 만나보세요."/><section className="section"><div className="container"><div className="honesty-note"><b>현재 공개된 실제 일정은 없습니다.</b><p>아래 카드는 향후 주민·지역 전문가·공익기관 등 다양한 HOST가 COMMON SPACE에서 열 활동의 표시 예시입니다.</p></div><div className="grid grid-2">{commonPrograms.map(p=><ProgramCard key={p.title} program={p}/>)}</div><div className="open-process"><p className="eyebrow">COMMON OPEN</p><h2>이웃이 HOST가 되는 작은 시작</h2><p>공간 신청에서 COMMON OPEN을 선택해도 바로 공개되지 않습니다.</p><div className="process-row"><span>신청</span><i>→</i><span>관리자 검토</span><i>→</i><span>승인</span><i>→</i><span>이번 주 COMMON</span></div><Link className="button" href="/space">공간과 신청 방법 보기</Link></div></div></section></>}
