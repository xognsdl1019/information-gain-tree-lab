"use client";

import { useState, type FormEvent, type ReactNode } from "react";

type Phase = "summary"|"quiz"|"complete";
type Option = { label:string; correct?:boolean };
type Item = { id:number; kind:"fill"|"choice"; question:string; options?:Option[]; explanation:string };

const CONCEPTS: Array<{n:string;title:string;body:ReactNode}> = [
  {n:"01",title:"의사결정나무",body:<><b>질문</b>을 던지고, 답에 따라 데이터를 <strong>분할</strong>하는 모델입니다.</>},
  {n:"02",title:"엔트로피",body:<>데이터의 <b>불확실성</b>을 나타냅니다.</>},
  {n:"03",title:"분할 후 엔트로피",body:<>하위 집단의 <b>크기를 고려한 가중평균</b>입니다.</>},
  {n:"04",title:"정보이득",body:<>분할 전 엔트로피에서 <b>분할 후 엔트로피를 뺀 값</b>입니다.</>},
  {n:"05",title:"ID3의 선택",body:<>정보이득이 <b>가장 큰 속성</b>을 분할속성으로 선택합니다.</>},
  {n:"06",title:"분할 종료",body:<>하위 노드의 엔트로피가 <b>0</b>이면 분할을 종료합니다.</>},
];

const ITEMS: Item[] = [
  {id:1,kind:"fill",question:"의사결정나무는 각 노드에서 데이터에 대한 (     )을 던지고, 답에 따라 데이터를 여러 집단으로 (     )한다.",explanation:"각 노드는 질문을 하나 선택하고, 그 답을 기준으로 데이터를 분할합니다."},
  {id:2,kind:"choice",question:"엔트로피가 나타내는 것은 무엇인가요?",options:[{label:"데이터의 개수"},{label:"데이터의 불확실성",correct:true},{label:"트리의 깊이"},{label:"속성의 개수"}],explanation:"엔트로피는 데이터에 여러 클래스가 얼마나 섞여 있는지, 즉 불확실성을 나타냅니다."},
  {id:3,kind:"choice",question:"정보이득을 올바르게 설명한 것은 무엇인가요?",options:[{label:"분할 후 엔트로피 − 분할 전 엔트로피"},{label:"분할 전 엔트로피 + 분할 후 엔트로피"},{label:"분할 전 엔트로피 − 분할 후 엔트로피",correct:true},{label:"하위 노드 엔트로피의 단순합"}],explanation:"정보이득은 분할로 불확실성이 얼마나 감소했는지를 나타냅니다."},
  {id:4,kind:"choice",question:"ID3가 분할속성으로 선택하는 것은 무엇인가요?",options:[{label:"정보이득이 가장 큰 속성",correct:true},{label:"엔트로피가 가장 큰 속성"},{label:"값의 종류가 가장 많은 속성"},{label:"가장 먼저 기록된 속성"}],explanation:"ID3는 후보별 정보이득을 비교하고 가장 큰 속성을 선택합니다."},
  {id:5,kind:"choice",question:"하위 노드의 엔트로피가 0이면 왜 분할을 종료할까요?",options:[{label:"데이터가 너무 많기 때문에"},{label:"더 사용할 속성이 없기 때문에"},{label:"모든 데이터가 같은 클래스로 순수하기 때문에",correct:true},{label:"정보이득을 계산할 수 없기 때문에"}],explanation:"엔트로피 0은 한 클래스만 남아 불확실성이 없다는 뜻입니다."},
];

function Summary({start}:{start:()=>void}) {
  return <section className="summary-page">
    <div className="summary-hero">
      <div><span>오늘의 핵심 구조</span><h1>좋은 <em>질문</em>으로 데이터를<br/><strong>분할</strong>해 불확실성을 줄입니다</h1><div className="flow"><b>데이터</b><i>→</i><em>질문</em><i>→</i><strong>분할</strong><i>→</i><b>불확실성 감소</b></div></div>
      <div className="formula"><span>정보이득</span><strong>Gain(D, A)</strong><p>= H(D) − H<sub>A</sub>(D)</p><small>분할 전 불확실성 − 분할 후 불확실성</small></div>
    </div>
    <div className="content">
      <div className="concepts">{CONCEPTS.map(c=><article key={c.n}><span>{c.n}</span><div><h2>{c.title}</h2><p>{c.body}</p></div></article>)}</div>
      <aside><span>ID3 알고리즘 · 4단계</span><ol>
        <li><b>1</b><div><strong>후보 속성 설정</strong><p>사용할 수 있는 속성 확인</p></div></li>
        <li><b>2</b><div><strong>정보이득 계산</strong><p>각 후보의 불확실성 감소량 계산</p></div></li>
        <li><b>3</b><div><strong>분할속성 선택</strong><p>정보이득이 가장 큰 속성 선택</p></div></li>
        <li><b>4</b><div><strong>분할 및 반복</strong><p>하위 노드에서도 같은 과정 반복</p></div></li>
      </ol><div className="stop"><span>종료 조건</span><strong>H(D) = 0</strong><p>한 클래스만 남으면 해당 가지의 분할을 종료합니다.</p></div></aside>
    </div>
    <div className="callout"><span>수업 핵심어</span><b>질문</b><i>×</i><strong>분할</strong><p>어떤 질문을 선택하느냐에 따라 분할 결과와 트리의 구조가 달라집니다.</p><button onClick={start}>확인 퀴즈 풀기 →</button></div>
  </section>;
}

function Quiz({finish,back}:{finish:(score:number)=>void;back:()=>void}) {
  const [index,setIndex]=useState(0);
  const [a,setA]=useState(""); const [b,setB]=useState("");
  const [selected,setSelected]=useState<number|null>(null);
  const [feedback,setFeedback]=useState<"idle"|"correct"|"wrong">("idle");
  const [attempted,setAttempted]=useState(false); const [score,setScore]=useState(0);
  const item=ITEMS[index];
  const ready=item.kind==="fill"?Boolean(a.trim()&&b.trim()):selected!==null;
  const norm=(v:string)=>v.replace(/\s+/g,"").trim();
  function check(e:FormEvent){e.preventDefault();const ok=item.kind==="fill"?norm(a)==="질문"&&norm(b)==="분할":Boolean(item.options?.[selected??-1]?.correct);if(ok&&!attempted)setScore(v=>v+1);setAttempted(true);setFeedback(ok?"correct":"wrong");}
  function next(){if(index===ITEMS.length-1){finish(score);return;}setIndex(v=>v+1);setA("");setB("");setSelected(null);setFeedback("idle");setAttempted(false);}
  return <section className="quiz-page">
    <aside className="status"><span>확인 퀴즈</span><div><b>{index+1}</b><em>/ {ITEMS.length}</em></div><nav>{ITEMS.map((q,i)=><i className={i<index?"done":i===index?"current":""} key={q.id}>{i<index?"✓":q.id}</i>)}</nav><p>정답을 맞히면 다음 문제로 이동합니다.</p><small>점수는 첫 제출 기준입니다.</small><button onClick={back}>← 핵심 정리</button></aside>
    <form className="quiz-card" onSubmit={check}><span>문제 {item.id}</span><h1>{item.question}</h1>
      {item.kind==="fill"?<div className="blanks"><label><span>첫 번째 빈칸</span><input value={a} onChange={e=>{setA(e.target.value);if(feedback==="wrong")setFeedback("idle")}} placeholder="핵심 단어 입력" disabled={feedback==="correct"}/></label><label><span>두 번째 빈칸</span><input value={b} onChange={e=>{setB(e.target.value);if(feedback==="wrong")setFeedback("idle")}} placeholder="핵심 단어 입력" disabled={feedback==="correct"}/></label></div>
      :<div className="options">{item.options?.map((o,i)=><button type="button" className={`${selected===i?"selected":""} ${feedback==="correct"&&o.correct?"correct":""} ${feedback==="wrong"&&selected===i?"wrong":""}`} onClick={()=>{setSelected(i);if(feedback==="wrong")setFeedback("idle")}} disabled={feedback==="correct"} key={o.label}><i>{String.fromCharCode(65+i)}</i><span>{o.label}</span></button>)}</div>}
      {feedback==="correct"&&<div className="feedback good"><b>✓ 정답입니다.</b><span>{item.explanation}</span></div>}{feedback==="wrong"&&<div className="feedback bad"><b>다시 확인</b><span>답을 바꾼 뒤 다시 확인해 보세요.</span></div>}
      <div className="quiz-action">{feedback==="correct"?<button type="button" onClick={next}>{index===ITEMS.length-1?"결과 보기 →":"다음 문제 →"}</button>:<button disabled={!ready}>{feedback==="wrong"?"다시 확인":"정답 확인"}</button>}</div>
    </form>
  </section>;
}

function Complete({score,summary,retry}:{score:number;summary:()=>void;retry:()=>void}) {
  const message=score===ITEMS.length?"핵심 개념을 정확히 이해했습니다!":score>=3?"핵심 흐름을 잘 이해했습니다!":"핵심 정리를 한 번 더 보면 더 확실해집니다.";
  return <section className="complete-page"><div className="complete-card"><div className="mark">✓</div><span>학습 완료</span><h1>{message}</h1><p>엔트로피, 정보이득, ID3 그리고 질문과 분할의 관계를 확인했습니다.</p><div className="score"><span>확인 퀴즈 점수</span><b>{score}<small> / {ITEMS.length}</small></b><div><i style={{width:`${score/ITEMS.length*100}%`}}/></div></div><div className="keywords"><span>기억할 두 단어</span><b>질문</b><i>→</i><strong>분할</strong></div><div className="complete-actions"><button onClick={summary}>핵심 정리 다시 보기</button><button className="primary" onClick={retry}>퀴즈 다시 풀기</button></div></div></section>;
}

export default function SummaryQuiz(){
  const [phase,setPhase]=useState<Phase>("summary");const [score,setScore]=useState(0);
  return <main><header className="app-header"><div className="brand"><span>ID3</span><div><small>인공지능 개론</small><strong>8. 핵심 정리 및 확인 퀴즈</strong></div></div><nav><span className={phase==="summary"?"active":""}>핵심 정리</span><i>→</i><span className={phase==="quiz"?"active":""}>확인 퀴즈</span><i>→</i><span className={phase==="complete"?"active":""}>완료</span></nav></header>{phase==="summary"&&<Summary start={()=>setPhase("quiz")}/>} {phase==="quiz"&&<Quiz back={()=>setPhase("summary")} finish={s=>{setScore(s);setPhase("complete")}}/>}{phase==="complete"&&<Complete score={score} summary={()=>setPhase("summary")} retry={()=>setPhase("quiz")}/>}</main>;
}
