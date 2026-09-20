"use client";

import Link from "next/link";
import { CheckCircle2, MessageCircleHeart } from "lucide-react";
import { FormEvent, useState } from "react";
import { PageHead } from "@/components/UI";
import { SITE_CONFIG } from "@/lib/config";

type Identity = "anonymous" | "named" | "contact";
type RequestType = "prayer_only" | "conversation" | "pastoral_care";
const privacyOptions: { value: Identity; title: string; desc: string }[] = [
  { value: "anonymous", title: "완전 익명으로 남길게요", desc: "이름이나 연락처 없이 기도 요청만 전달됩니다." },
  { value: "named", title: "이름 일부를 알려도 괜찮아요", desc: "원하는 이름이나 별명을 함께 남길 수 있습니다." },
  { value: "contact", title: "연락을 받아도 괜찮아요", desc: "원하는 경우 교회 담당자가 연락할 수 있습니다." },
];
const connectionOptions: { value: RequestType; title: string }[] = [
  { value: "prayer_only", title: "답변이나 연락은 필요하지 않아요. 기도만 부탁드립니다." },
  { value: "conversation", title: "누군가와 이야기를 나누고 싶어요." },
  { value: "pastoral_care", title: "목회 상담을 받아보고 싶어요." },
];

export default function Page() {
  const [done, setDone] = useState(false);
  const [identity, setIdentity] = useState<Identity>("anonymous");
  const [requestType, setRequestType] = useState<RequestType>("prayer_only");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const needsContact = requestType !== "prayer_only";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/prayer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ story: form.get("story"), identity, type: requestType, name: form.get("name"), contactMethod: form.get("contactMethod"), contactDetail: form.get("contactDetail"), website: form.get("website") }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error);
      setDone(true); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught instanceof Error && caught.message ? caught.message : "기도 요청을 전달하는 중 문제가 발생했습니다. 작성하신 내용을 유지한 상태에서 잠시 후 다시 시도해주세요.");
    } finally { setSubmitting(false); }
  }

  if (done) return <section className="section prayer-success"><div className="container card success-card"><CheckCircle2/><h1>소중한 이야기를 남겨주셔서 감사합니다.</h1><p>당신의 이야기를 가볍게 여기지 않겠습니다.<br/>마음을 담아 함께 기도하겠습니다.</p><small>연락을 요청하지 않으셨다면 별도의 연락은 드리지 않습니다.</small><Link className="button" href="/">COMMON으로 돌아가기</Link><a className="success-church-link" href={SITE_CONFIG.churchUrl} target="_blank" rel="noreferrer">{SITE_CONFIG.churchName} 알아보기 →</a></div></section>;

  return <><PageHead eyebrow="PRAYER REQUEST" title="기도를 부탁하고 싶어요" desc={"혼자 마음에 품고 있는 일이 있나요?\n누군가가 당신을 위해 함께 기도해 주었으면 하는 이야기가 있다면 편하게 남겨주세요."}/><section className="section"><div className="container prayer-container"><p className="prayer-reassurance"><MessageCircleHeart size={18}/> 이름을 밝히지 않아도 괜찮습니다.</p><form className="form prayer-form" onSubmit={submit}><div className="field"><label htmlFor="prayer-story">기도 제목을 남겨주세요</label><textarea id="prayer-story" name="story" required maxLength={3000} placeholder="마음에 품고 있는 이야기를 편하게 적어주세요."/></div><fieldset className="choice-section"><legend>어떻게 남기시겠어요?</legend><div className="privacy-options">{privacyOptions.map(option=><label className="choice detail-choice" key={option.value}><input type="radio" name="identity" value={option.value} checked={identity===option.value} onChange={()=>setIdentity(option.value)}/><span><strong>{option.title}</strong><small>{option.desc}</small></span></label>)}</div></fieldset>{identity==="named"&&<div className="field"><label htmlFor="prayer-name">이름 또는 별명</label><input id="prayer-name" name="name" maxLength={60} placeholder="원하는 이름이나 별명을 적어주세요."/></div>}<fieldset className="choice-section"><legend>추가로 원하는 연결이 있나요?</legend><div className="connection-options">{connectionOptions.map(option=><label className="choice" key={option.value}><input type="radio" name="requestType" value={option.value} checked={requestType===option.value} onChange={()=>setRequestType(option.value)}/><span>{option.title}</span></label>)}</div></fieldset>{needsContact&&<div className="contact-fields"><div className="field"><label htmlFor="contact-method">원하는 연락 방법</label><select id="contact-method" name="contactMethod" required value={contactMethod} onChange={event=>setContactMethod(event.target.value)}><option value="" disabled>연락 방법을 선택해주세요</option><option>문자</option><option>전화</option><option>카카오톡</option><option>직접 만나서 이야기</option></select></div>{contactMethod!=="직접 만나서 이야기"&&<div className="field"><label htmlFor="contact-detail">{contactMethod==="문자"||contactMethod==="전화"?"연락처":"연락 정보"}</label><input id="contact-detail" name="contactDetail" required maxLength={200} placeholder="선택한 방법으로 연락 가능한 정보를 적어주세요."/></div>}</div>}<div className="prayer-honeypot" aria-hidden="true"><label htmlFor="website">웹사이트</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div><p className="privacy-note">COMMON은 기도 요청을 위해 불필요한 개인정보를 요구하지 않습니다. 연락을 원하는 경우에만 필요한 정보를 입력해주세요. 요청은 이메일로 전달되며 별도 데이터베이스에 저장하지 않습니다.</p>{error&&<p className="notice prayer-error" role="alert">{error}</p>}<button className="button" type="submit" disabled={submitting}>{submitting?"전달 중...":error?"다시 시도":"기도 부탁드리기"}</button></form></div></section></>;
}
