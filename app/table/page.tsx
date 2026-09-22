import Link from "next/link";
import Image from "next/image";
import { PageHead } from "@/components/UI";
import { commonTableExperience, commonTables } from "@/lib/community-data";

export default function Page(){return <>
  <PageHead eyebrow="TABLE" title="COMMON TABLE" desc={"커피 한 잔, 책 한 페이지.\n잠시 마음을 쉬어가는 자리."}/>
  <section className="section table-choice"><div className="container table-container">
    <div className="table-intro"><p className="eyebrow">CHOOSE YOUR TABLE</p><h2 className="section-title">오늘의 마음에 맞는 자리</h2><p>무언가를 해야 하는 자리가 아닙니다. 원하는 방식으로 천천히 머물러 보세요.</p></div>
    <div className="grid grid-2">{commonTables.map(t=><article className="card table-card" key={t.name}><span className="table-icon" aria-hidden="true">{t.icon}</span><p className="eyebrow">{t.name}</p><p className="table-meaning">“{t.meaning}”</p><h3>{t.copy}</h3>{t.description.map(line=><p key={line}>{line}</p>)}</article>)}</div>
    <aside className="table-how"><p className="eyebrow">HOW TO USE</p><h2>카페에서 이용하는 방법</h2><p>별도의 예약이나 신청은 필요하지 않습니다.</p><div className="table-signs"><span>🌿 QUIET TABLE</span><i>또는</i><span>☕ COMMON TABLE</span></div><p>카페에서 표시가 있는 자리를 찾아주세요.<br/>현재 이용 가능 여부는 카페 현장에서 확인해주세요.</p><ul><li>예약 없음</li><li>신청 없음</li><li>회원가입 없음</li><li>현장에서 바로 이용</li></ul><small>{commonTableExperience.operatingHours ? commonTableExperience.operatingHours.join(" · ") : "운영 시간은 준비 후 안내합니다."}</small></aside>
  </div></section>

  <section className="section section-soft table-book"><div className="container table-reading"><p className="eyebrow">BOOK</p><h2 className="section-title">오늘의 COMMON BOOK</h2><div className="book-copy"><p>책 한 권을 다 읽지 않아도 괜찮습니다.</p><p>마음이 가는 책을 펼쳐<br/>몇 페이지만 천천히 읽어보세요.</p><p>커피 한 잔을 마시는 동안<br/>잠시 다른 생각을 만나는 것만으로도 충분합니다.</p></div><div className="book-themes" aria-label="COMMON BOOK 주제">{commonTableExperience.bookThemes.map(theme=><span key={theme}>{theme}</span>)}</div>
    <div className="reflection-grid"><article><p className="eyebrow">ONE PAGE</p><h3>오늘의 한 페이지</h3><p>오늘은 마음이 가는 책을 펼쳐 몇 페이지만 천천히 읽어보세요.<br/>다 읽지 않아도 괜찮습니다.</p></article><article><p className="eyebrow">TODAY&apos;S QUESTION</p><h3>오늘의 질문</h3><blockquote>“지금 내게 가장 필요한 쉼은<br/>어떤 모습일까요?”</blockquote><p>답을 적거나 남기지 않아도 괜찮습니다. 잠시 생각해보는 것만으로 충분합니다.</p></article></div>
    <div className="heart-link"><span>조금 더 마음을 정리하고 싶다면</span><Link href="/heart/letter">마음편지로 가기 <span aria-hidden="true">→</span></Link><small>원할 때만 선택할 수 있습니다.</small></div>
  </div></section>

  <section className="section table-story"><div className="container table-container"><div className="story-copy"><p className="eyebrow">OUR STORY</p><h2 className="section-title">이 공간에 담긴 이야기</h2><p>카페에서 잠시 고개를 들어 천장을 바라보면 작은 창 하나를 발견할 수 있습니다.</p><p>그 창 너머, 2층 천장에는 십자가가 있습니다.</p><p>쉽게 눈에 띄지는 않지만 이 공간을 만든 사람은 이곳을 찾는 누군가가 잠시라도 마음의 평안을 얻기를 바라는 마음을 그곳에 담았습니다.</p><p>꼭 어떤 믿음을 가지고 있지 않아도 괜찮습니다.</p><p>커피 한 잔을 마시고, 책 한 페이지를 읽고, 잠시 쉬어가는 것만으로 충분합니다.</p><p>COMMON TABLE은 그런 자리이고 싶습니다.</p></div>
    <div className="photo-story">{commonTableExperience.photos.map((photo,index)=><figure className={`photo-frame photo-${index+1}`} key={photo.id}>{photo.src ? <div className="photo-image"><Image src={photo.src} alt={photo.alt} fill sizes={index===0?"(max-width: 800px) 100vw, 63vw":"(max-width: 800px) 100vw, 37vw"}/></div> : <div className="photo-placeholder"><span>PHOTO {photo.id} · {photo.stage}</span><b>{photo.title}</b><small>PHOTO PLACEHOLDER<br/>실제 사진 교체 예정</small></div>}<figcaption>{photo.stage} · {photo.title}</figcaption></figure>)}</div>
    <aside className="look-up"><p className="eyebrow">LOOK UP</p><p>이곳에 오시면<br/>잠시 위를 바라보세요.</p><p>작은 창 너머에<br/>이 공간을 만든 사람의 마음이 숨어 있습니다.</p></aside>
    <blockquote className="table-closing">커피 한 잔,<br/>책 한 페이지,<br/>그리고 잠시 올려다본 하늘.<strong>마음이 조금 가벼워지는 자리,<br/>COMMON TABLE.</strong></blockquote>
  </div></section>
</>}
