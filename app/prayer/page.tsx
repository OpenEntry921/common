"use client";

import Link from "next/link";
import { CheckCircle2, MessageCircleHeart } from "lucide-react";
import { useState } from "react";
import { PageHead } from "@/components/UI";

type Privacy = "anonymous" | "named" | "contact";
type Connection = "prayer" | "conversation" | "pastoral";

const privacyOptions: {value: Privacy; title: string; desc: string}[] = [
  {value:"anonymous", title:"완전 익명으로 남길게요", desc:"이름이나 연락처 없이 기도 요청만 전달됩니다."},
  {value:"named", title:"이름 일부를 알려도 괜찮아요", desc:"원하는 이름이나 별명을 함께 남길 수 있습니다."},
  {value:"contact", title:"연락을 받아도 괜찮아요", desc:"원하는 경우 교회 담당자가 연락할 수 있습니다."},
];

const connectionOptions: {value: Connection; title: string}[] = [
  {value:"prayer", title:"답변이나 연락은 필요하지 않아요. 기도만 부탁드립니다."},
  {value:"conversation", title:"누군가와 이야기를 나누고 싶어요."},
  {value:"pastoral", title:"목회 상담을 받아보고 싶어요."},
];

export default function Page(){
  const [done,setDone]=useState(false);
  const [privacy,setPrivacy]=useState<Privacy>("anonymous");
  const [connection,setConnection]=useState<Connection>("prayer");
  const needsContact=privacy==="contact"||connection!=="prayer";

  if(done)return <section className="section prayer-success"><div className="container card success-card"><CheckCircle2/><h1>소중한 이야기를 남겨주셔서 감사합니다.</h1><p>당신의 이야기를 가볍게 여기지 않겠습니다.<br/>마음을 담아 함께 기도하겠습니다.</p><small>연락을 요청하지 않으셨다면 별도의 연락은 드리지 않습니다.</small><Link className="button" href="/">COMMON으로 돌아가기</Link></div></section>;

  return <><PageHead eyebrow="PRAYER REQUEST" title="기도를 부탁하고 싶어요" desc={"혼자 마음에 품고 있는 일이 있나요?\n누군가가 당신을 위해 함께 기도해 주었으면 하는 이야기가 있다면 편하게 남겨주세요."}/><section className="section"><div className="container prayer-container"><p className="prayer-reassurance"><MessageCircleHeart size={18}/> 이름을 밝히지 않아도 괜찮습니다.</p><form className="form prayer-form" onSubmit={e=>{e.preventDefault();setDone(true);window.scrollTo({top:0,behavior:"smooth"})}}><div className="field"><label htmlFor="prayer-story">기도 제목을 남겨주세요</label><textarea id="prayer-story" required placeholder="마음에 품고 있는 이야기를 편하게 적어주세요."/></div><fieldset className="choice-section"><legend>어떻게 남기시겠어요?</legend><div className="privacy-options">{privacyOptions.map(option=><label className="choice detail-choice" key={option.value}><input type="radio" name="privacy" value={option.value} checked={privacy===option.value} onChange={()=>setPrivacy(option.value)}/><span><strong>{option.title}</strong><small>{option.desc}</small></span></label>)}</div></fieldset>{privacy==="named"&&<div className="field"><label htmlFor="prayer-name">이름 또는 별명</label><input id="prayer-name" required placeholder="원하는 이름이나 별명을 적어주세요."/></div>}<fieldset className="choice-section"><legend>추가로 원하는 연결이 있나요?</legend><div className="connection-options">{connectionOptions.map(option=><label className="choice" key={option.value}><input type="radio" name="connection" value={option.value} checked={connection===option.value} onChange={()=>setConnection(option.value)}/><span>{option.title}</span></label>)}</div></fieldset>{needsContact&&<div className="contact-fields"><div className="field"><label htmlFor="contact-method">원하는 연락 방법</label><select id="contact-method" required defaultValue=""><option value="" disabled>연락 방법을 선택해주세요</option><option>문자</option><option>전화</option><option>카카오톡</option><option>직접 만나기</option></select></div><div className="field"><label htmlFor="contact-detail">연락 정보</label><input id="contact-detail" required placeholder="선택한 방법으로 연락 가능한 정보를 적어주세요."/></div></div>}<p className="privacy-note">COMMON은 기도 요청을 위해 불필요한 개인정보를 요구하지 않습니다. 연락을 원하는 경우에만 필요한 정보를 입력해주세요.</p><p className="prototype-note">Prototype에서는 실제 개인정보를 서버 또는 외부 서비스로 전송하지 않습니다.</p><button className="button" type="submit">기도 부탁드리기</button></form></div></section></>;
}
