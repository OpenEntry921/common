import Link from "next/link";
import { ArrowRight, Heart, MessageCircleHeart } from "lucide-react";
import { PageHead } from "@/components/UI";

export default function Page(){return <><PageHead eyebrow="A PLACE FOR YOUR HEART" title="마음" desc="말하기 어려운 마음을 나누거나, 원할 때 조용히 기도를 부탁할 수 있습니다."/><section className="section"><div className="container" style={{maxWidth:900}}><div className="grid grid-2"><article className="card service-card"><div className="service-icon"><Heart/></div><h2>마음편지</h2><p>말하기 어려운 이야기를 편하게 남겨보세요.</p><Link className="button" href="/heart/letter">마음 이야기하기 <ArrowRight size={17}/></Link></article><article className="card service-card"><div className="service-icon"><MessageCircleHeart/></div><h2>기도를 부탁하고 싶어요</h2><p>마음에 품고 있는 일이 있다면 조용히 기도를 부탁할 수 있습니다.</p><Link className="button secondary" href="/prayer">기도 요청하기 <ArrowRight size={17}/></Link></article></div></div></section></>}
