"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, HeartHandshake, RotateCcw, Send } from "lucide-react";
import { PageHead } from "@/components/UI";
import { MAX_MESSAGE_LENGTH, type ConversationMessage, type HeartLetter } from "@/lib/heart-letter";
import type { HeartLetterMode } from "@/lib/openai-config";

const loadingMessages = ["마음에 담아 답변을 준비하고 있어요...", "함께 생각해볼 말씀을 찾고 있어요...", "조금만 기다려주세요..."];
const showResponseMode = process.env.NEXT_PUBLIC_SHOW_AI_MODE !== "false";

export default function Page() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [answer, setAnswer] = useState<HeartLetter | null>(null);
  const [references, setReferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [notice, setNotice] = useState("");
  const [continuing, setContinuing] = useState(false);
  const [prayerConfirm, setPrayerConfirm] = useState(false);
  const [responseMode, setResponseMode] = useState<HeartLetterMode | null>(null);
  const requestInFlight = useRef(false);

  useEffect(() => {
    if (!loading) return;
    setLoadingStep(0);
    const timer = window.setInterval(() => setLoadingStep(step => Math.min(step + 1, loadingMessages.length - 1)), 1400);
    return () => window.clearInterval(timer);
  }, [loading]);

  async function ask(nextMessages: ConversationMessage[], alternative = false) {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setLoading(true); setNotice(""); setContinuing(false);
    try {
      const response = await fetch("/api/heart-letter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: nextMessages, excludeReferences: alternative ? references : [] }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "요청을 처리하지 못했습니다.");
      setAnswer(result.data);
      setResponseMode(result.mode);
      setReferences(current => current.includes(result.data.scriptureReference) ? current : [...current, result.data.scriptureReference]);
      setMessages([...nextMessages, { role: "assistant", content: JSON.stringify(result.data) }]);
      if (result.notice) setNotice(result.notice);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요.");
    } finally { requestInFlight.current = false; setLoading(false); }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || loading || requestInFlight.current) return;
    const next = [...messages, { role: "user" as const, content }];
    setInput(""); ask(next);
  }

  function anotherVerse() {
    if (!answer || loading) return;
    const next = [...messages, { role: "user" as const, content: "같은 이야기를 바탕으로, 앞서 제안한 구절과 겹치지 않는 다른 성경 말씀을 하나 소개해 주세요." }];
    ask(next, true);
  }

  function reset() { setMessages([]); setAnswer(null); setReferences([]); setNotice(""); setInput(""); setPrayerConfirm(false); setResponseMode(null); }

  return <>
    <PageHead eyebrow="A LETTER FOR YOUR HEART" title="마음편지" desc={"누군가에게 말하기 어려운 이야기가 있나요?\n이름을 말하지 않아도 괜찮습니다. 지금 마음에 있는 이야기를 잠시 남겨보세요."}/>
    <section className="section heart-letter-section"><div className="container heart-letter-container">
      {!answer && !loading && <form className="form heart-input-card" onSubmit={submit}>
        <div className="field"><label htmlFor="heart-story">지금 마음에 있는 이야기</label><textarea id="heart-story" required maxLength={MAX_MESSAGE_LENGTH} value={input} onChange={e => setInput(e.target.value)} placeholder="요즘 마음에 걸리는 일이 있다면 편하게 적어보세요."/><small className="character-count">{input.length} / {MAX_MESSAGE_LENGTH}</small></div>
        <button className="button" disabled={!input.trim() || loading}>마음 이야기하기 <Send size={17}/></button>
      </form>}

      {loading && <div className="thinking" role="status" aria-live="polite"><div><span/><span/><span/></div><p>{loadingMessages[loadingStep]}</p></div>}

      {answer && !loading && <div className="heart-answer" aria-live="polite">
        {notice && <div className="fallback-notice">{notice}</div>}
        <section className="response-section"><p className="response-kicker">당신의 이야기에 대해</p><p>{answer.empathy}</p></section>
        <article className="scripture-card"><div className="scripture-top"><div><p className="response-kicker">오늘 함께 읽어볼 말씀</p><h2>{answer.scriptureReference}</h2></div><span className={`scripture-badge ${answer.scriptureType}`}>{answer.scriptureType === "jesus" ? "예수님의 말씀" : "성경 말씀"}</span></div><blockquote>{answer.scriptureShortText}</blockquote><small>저작권을 고려해 본문 전체가 아닌 짧은 핵심 문구 또는 요지를 표시합니다.</small></article>
        <section className="response-section"><p className="response-kicker">이 말씀은 어떤 의미인가요?</p><p>{answer.scriptureContext}</p></section>
        <section className="response-section reflection"><p className="response-kicker">지금 나에게는 어떻게 생각해볼 수 있을까요?</p><p>{answer.reflection}</p></section>
        <section className="action-card"><HeartHandshake/><div><p className="response-kicker">오늘 해볼 수 있는 작은 한 가지</p><p>{answer.suggestedAction}</p></div></section>
        <div className="follow-up"><strong>{answer.followUpQuestion}</strong></div>

        {continuing && <form className="form continue-form" onSubmit={submit}><div className="field"><label htmlFor="heart-followup">조금 더 들려주세요</label><textarea id="heart-followup" autoFocus required maxLength={MAX_MESSAGE_LENGTH} value={input} onChange={e => setInput(e.target.value)} placeholder="이어지는 마음을 편하게 적어보세요."/><small className="character-count">{input.length} / {MAX_MESSAGE_LENGTH}</small></div><div className="inline-actions"><button type="button" className="button ghost" onClick={() => setContinuing(false)}>취소</button><button className="button">보내기 <Send size={16}/></button></div></form>}

        {prayerConfirm && <div className="consent-card"><p><strong>방금 나눈 이야기는 자동으로 전달되지 않습니다.</strong><br/>기도 요청 페이지에서 전달할 내용을 직접 작성하고 수정할 수 있어요.</p><div className="inline-actions"><button className="button ghost" onClick={() => setPrayerConfirm(false)}>취소</button><Link className="button" href="/prayer">기도 요청 작성하기</Link></div></div>}

        {!continuing && !prayerConfirm && <div className="heart-options">
          <button className="button" onClick={() => setContinuing(true)}>조금 더 이야기하기</button>
          <button className="button secondary" onClick={anotherVerse}><BookOpen size={17}/> 다른 말씀도 보고 싶어요</button>
          <button className="button ghost" onClick={() => setPrayerConfirm(true)}>기도를 부탁하고 싶어요</button>
          <Link className="button ghost" href="/talk">사람과 이야기하고 싶어요</Link>
          <Link className="button ghost" href="/">여기까지만 할게요</Link>
        </div>}
        <button className="restart-button" onClick={reset}><RotateCcw size={15}/> 새로운 마음편지 시작하기</button>
        {showResponseMode && responseMode && <div className={`ai-response-mode ${responseMode}`} role="status">● {responseMode === "live" ? "LIVE AI" : responseMode === "fallback" ? "FALLBACK" : "DEMO RESPONSE"}</div>}
      </div>}

      {!answer && notice && <div className="notice error-notice">{notice}</div>}
      <div className="privacy-panel"><ArrowLeft size={16}/><p>마음편지에 남긴 이야기는 현재 데모에서는 저장되지 않습니다. 개인정보나 민감한 정보는 입력하지 않는 것을 권합니다.<br/><small>마음편지는 의료·심리·목회 상담을 대신하지 않습니다. 자신이나 타인을 해칠 위험이 있거나 위급한 상황이라면 112·119 또는 가까운 전문기관에 즉시 도움을 요청해 주세요.</small></p></div>
    </div></section>
  </>;
}
