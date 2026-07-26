"use client";

import { useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";

type Axis = "x" | "y";
type Point = { id: string; x: number; y: number; label: "normal" | "hack" };
type Locked = { axis: Axis; threshold: number; side: "low" | "high" };

const POINTS: Point[] = [
  { id:"01",x:1,y:1,label:"normal" },{ id:"02",x:2,y:3,label:"normal" },
  { id:"03",x:2,y:2,label:"normal" },{ id:"04",x:3,y:3,label:"normal" },
  { id:"05",x:3,y:2,label:"normal" },{ id:"06",x:4,y:4,label:"normal" },
  { id:"07",x:4,y:3,label:"normal" },{ id:"08",x:5,y:5,label:"normal" },
  { id:"09",x:2,y:5,label:"normal" },{ id:"10",x:3,y:6,label:"normal" },
  { id:"11",x:1,y:4,label:"normal" },{ id:"12",x:5,y:2,label:"normal" },
  { id:"13",x:5,y:4,label:"normal" },{ id:"14",x:3,y:7,label:"normal" },
  { id:"15",x:4,y:1,label:"normal" },{ id:"16",x:6,y:3,label:"normal" },
  { id:"17",x:3,y:5,label:"normal" },{ id:"18",x:5,y:7,label:"hack" },
  { id:"19",x:5,y:8,label:"hack" },{ id:"20",x:6,y:6,label:"hack" },
  { id:"21",x:6,y:5,label:"hack" },{ id:"22",x:7,y:7,label:"hack" },
  { id:"23",x:7,y:6,label:"hack" },{ id:"24",x:8,y:8,label:"hack" },
  { id:"25",x:8,y:7,label:"hack" },{ id:"26",x:7,y:3,label:"hack" },
  { id:"27",x:9,y:4,label:"hack" },{ id:"28",x:6,y:7,label:"hack" },
  { id:"29",x:4,y:7,label:"hack" },{ id:"30",x:8,y:3,label:"hack" },
];

const META = {
  x: { name: "외부 연결 위험도", direction: "세로 분할" },
  y: { name: "의심 표현 점수", direction: "가로 분할" },
};

function count(items: Point[]) {
  const normal = items.filter((p) => p.label === "normal").length;
  return { normal, hack: items.length - normal };
}

function entropy(items: Point[]) {
  if (!items.length) return 0;
  const c = count(items);
  return [c.normal, c.hack].reduce((sum, n) => {
    if (!n) return sum;
    const p = n / items.length;
    return sum - p * Math.log2(p);
  }, 0);
}

function split(items: Point[], axis: Axis, threshold: number) {
  return {
    low: items.filter((p) => p[axis] <= threshold),
    high: items.filter((p) => p[axis] > threshold),
  };
}

function question(axis: Axis, threshold: number) {
  return `${META[axis].name}가 ${threshold} 이하인가?`;
}

function Purity({ items }: { items: Point[] }) {
  const c = count(items);
  const total = items.length || 1;
  return <div className="purity"><i className="normal" style={{width:`${c.normal/total*100}%`}} /><i className="hack" style={{width:`${c.hack/total*100}%`}} /></div>;
}

function Result({ title, items }: { title: string; items: Point[] }) {
  const c = count(items);
  return (
    <article className="result">
      <div><span>{title}</span><strong>{items.length}개</strong></div>
      <Purity items={items} />
      <p><b className="normal">정상 {c.normal}</b><b className="hack">해킹 {c.hack}</b><em>H = {entropy(items).toFixed(3)}</em></p>
    </article>
  );
}

export default function ScatterLab() {
  const [intro, setIntro] = useState(true);
  const [stage, setStage] = useState<1|2|3>(1);
  const [axis, setAxis] = useState<Axis>("x");
  const [threshold, setThreshold] = useState(4);
  const [locked, setLocked] = useState<Locked|null>(null);
  const [secondThreshold, setSecondThreshold] = useState(4);
  const [dragging, setDragging] = useState(false);

  const plot = { left:80, right:810, top:34, bottom:474 };
  const w = plot.right - plot.left;
  const h = plot.bottom - plot.top;
  const xAt = (v:number) => plot.left + v / 10 * w;
  const yAt = (v:number) => plot.bottom - v / 10 * h;
  const first = split(POINTS, axis, threshold);
  const secondAxis: Axis = locked?.axis === "x" ? "y" : "x";
  const parent = useMemo(() => {
    if (!locked) return [];
    const groups = split(POINTS, locked.axis, locked.threshold);
    return locked.side === "low" ? groups.low : groups.high;
  }, [locked]);
  const second = split(parent, secondAxis, secondThreshold);
  const activeAxis = stage === 1 ? axis : secondAxis;
  const activeThreshold = stage === 1 ? threshold : secondThreshold;

  function valueAt(event: ReactPointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const sx = (event.clientX - rect.left) / rect.width * 880;
    const sy = (event.clientY - rect.top) / rect.height * 540;
    const raw = activeAxis === "x" ? (sx - plot.left) / w * 10 : (plot.bottom - sy) / h * 10;
    return Math.max(1, Math.min(8, Math.floor(raw)));
  }

  function move(event: ReactPointerEvent<SVGSVGElement>) {
    if (!dragging || stage === 3) return;
    const value = valueAt(event);
    if (stage === 1) setThreshold(value); else setSecondThreshold(value);
  }

  function start(event: ReactPointerEvent<SVGSVGElement>) {
    if (stage === 3) return;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    const value = valueAt(event);
    if (stage === 1) setThreshold(value); else setSecondThreshold(value);
  }

  function confirmFirst() {
    const groups = split(POINTS, axis, threshold);
    setLocked({ axis, threshold, side: entropy(groups.low) >= entropy(groups.high) ? "low" : "high" });
    setSecondThreshold(4);
    setStage(2);
  }

  function reset() {
    setIntro(true); setStage(1); setAxis("x"); setThreshold(4); setLocked(null); setSecondThreshold(4); setDragging(false);
  }

  function inParent(point: Point) {
    if (!locked) return true;
    const low = point[locked.axis] <= locked.threshold;
    return locked.side === "low" ? low : !low;
  }

  const currentLine = activeAxis === "x" ? xAt(activeThreshold + .5) : yAt(activeThreshold + .5);

  return (
    <main>
      <header className="app-header">
        <div className="brand"><span>DT</span><div><small>인공지능 개론</small><strong>8. 산점도 분할 체험</strong></div></div>
        {!intro && <button type="button" onClick={reset}>← 데이터 설명</button>}
      </header>

      <nav className="progress">
        {["데이터 이해","전체 데이터","1차 분할","2차 분할","트리 완성"].map((label,index) => {
          const reached = intro ? index === 0 : stage === 1 ? index <= 2 : stage === 2 ? index <= 3 : true;
          return <div className={reached ? "active" : ""} key={label}><b>{index+1}</b><span>{label}</span></div>;
        })}
      </nav>

      {intro ? (
        <section className="intro-page">
          <div className="intro-hero">
            <div><span>STEP 1 · DATA</span><h1>먼저 산점도의 데이터를 이해해 봅시다</h1><p>점의 위치와 색이 무엇을 뜻하는지 확인한 뒤 분할을 시작합니다.</p></div>
            <div className="intro-counts"><div className="normal"><b>17</b><span>정상 메일</span></div><div className="hack"><b>13</b><span>해킹메일</span></div><div><b>30</b><span>전체 데이터</span></div></div>
          </div>

          <div className="intro-grid">
            <article className="dataset-card">
              <div className="intro-card-heading"><span>데이터 구성</span><h2>점 하나 = 메일 한 개</h2></div>
              <div className="dot-sample" aria-label="정상 메일과 해킹메일 데이터 30개">
                {POINTS.map((point)=><i className={point.label} key={point.id}>{point.id}</i>)}
              </div>
              <div className="intro-legend"><span className="normal">● 파랑 · 정상 메일</span><span className="hack">● 주황 · 해킹메일</span></div>
            </article>

            <article className="axis-card">
              <div className="intro-card-heading"><span>입력 속성 X</span><h2>외부 연결 위험도</h2></div>
              <strong className="axis-scale">1 <i>→</i> 9</strong>
              <p>외부 링크·연결 요소가 많을수록 큰 값</p>
              <small>가능한 값: 1, 2, 3, …, 9</small>
            </article>

            <article className="axis-card">
              <div className="intro-card-heading"><span>입력 속성 Y</span><h2>의심 표현 점수</h2></div>
              <strong className="axis-scale">1 <i>→</i> 9</strong>
              <p>긴급 요청·계정 확인 표현이 많을수록 큰 값</p>
              <small>가능한 값: 1, 2, 3, …, 9</small>
            </article>
          </div>

          <div className="discrete-guide">
            <div><span>이산값</span><strong>모든 점은 정수 격자 위에 위치</strong></div>
            <i>→</i>
            <div><span>분할 질문</span><strong>“속성값이 4 이하인가?”</strong></div>
            <i>→</i>
            <div><span>분할 결과</span><strong>예 / 아니오 두 영역</strong></div>
            <button type="button" onClick={()=>{setIntro(false);window.scrollTo({top:0});}}>산점도 분할 시작 →</button>
          </div>
          <p className="intro-note">※ 교육용 가상 데이터이며, 두 점수는 실제 해킹메일 판정 기준이 아닙니다.</p>
        </section>
      ) : (
      <>
      <section className="hero">
        <div><span>SPLIT EXPERIENCE · 정수 격자 데이터 30개</span><h1>{stage===1?"첫 번째 분할선을 직접 움직여 보세요":stage===2?"섞여 있는 영역만 다시 분할하세요":"두 번의 질문으로 분할을 완성했습니다"}</h1><p>모든 점은 정수 격자 위에 있고, 분할선은 정수와 정수 사이로만 이동합니다.</p></div>
        <div className="legend"><span className="normal">● 정상 17</span><span className="hack">● 해킹 13</span></div>
      </section>

      <section className="workspace">
        <div className="lab-card">
          <div className="toolbar">
            <div>
              <small>{stage===1?"분할 방향 선택":stage===2?"두 번째 질문":"분할 확정"}</small>
              {stage===1 ? <div className="axis-buttons">{(["x","y"] as Axis[]).map((a)=><button type="button" className={axis===a?"active":""} onClick={()=>{setAxis(a);setThreshold(4);}} key={a}>{a==="x"?"│ 세로 분할":"─ 가로 분할"}</button>)}</div> : <strong>{META[secondAxis].direction}</strong>}
            </div>
            <div className="question"><small>현재 질문</small><strong>{question(activeAxis,activeThreshold)}</strong></div>
          </div>

          <div className="plot-wrap">
            <svg className={dragging?"dragging":""} viewBox="0 0 880 540" onPointerDown={start} onPointerMove={move} onPointerUp={(e)=>{setDragging(false);e.currentTarget.releasePointerCapture(e.pointerId);}} onPointerCancel={()=>setDragging(false)} role="img" aria-label="이동 가능한 분할선이 있는 해킹메일 산점도">
              <rect className="plot-paper" x={plot.left} y={plot.top} width={w} height={h} rx="15" />
              {[1,2,3,4,5,6,7,8,9].map(t=><g key={`x${t}`}><line className="grid" x1={xAt(t)} x2={xAt(t)} y1={plot.top} y2={plot.bottom}/><text className="tick" x={xAt(t)} y={plot.bottom+27}>{t}</text></g>)}
              {[1,2,3,4,5,6,7,8,9].map(t=><g key={`y${t}`}><line className="grid" x1={plot.left} x2={plot.right} y1={yAt(t)} y2={yAt(t)}/><text className="tick" x={plot.left-24} y={yAt(t)+4}>{t}</text></g>)}

              {locked && (locked.axis==="x"?<line className="locked" x1={xAt(locked.threshold+.5)} x2={xAt(locked.threshold+.5)} y1={plot.top} y2={plot.bottom}/>:<line className="locked" x1={plot.left} x2={plot.right} y1={yAt(locked.threshold+.5)} y2={yAt(locked.threshold+.5)}/>)}
              {stage>=2 && locked && (locked.axis==="x"
                ? <rect className="focus" x={locked.side==="low"?plot.left:xAt(locked.threshold+.5)} y={plot.top} width={locked.side==="low"?xAt(locked.threshold+.5)-plot.left:plot.right-xAt(locked.threshold+.5)} height={h}/>
                : <rect className="focus" x={plot.left} y={locked.side==="low"?yAt(locked.threshold+.5):plot.top} width={w} height={locked.side==="low"?plot.bottom-yAt(locked.threshold+.5):yAt(locked.threshold+.5)-plot.top}/>)}

              {POINTS.map(p=><g className={`point ${p.label} ${stage>=2&&!inParent(p)?"dim":""}`} transform={`translate(${xAt(p.x)} ${yAt(p.y)})`} key={p.id}><circle r="19"/><text y="4">{p.id}</text><title>{p.label==="normal"?"정상메일":"해킹메일"}</title></g>)}

              {activeAxis==="x"
                ? <g className={`split-line ${stage===3?"done":""}`}><line x1={currentLine} x2={currentLine} y1={stage>=2&&locked?.axis==="y"&&locked.side==="high"?plot.top:stage>=2&&locked?.axis==="y"?yAt(locked.threshold+.5):plot.top} y2={stage>=2&&locked?.axis==="y"&&locked.side==="high"?yAt(locked.threshold+.5):plot.bottom}/><circle cx={currentLine} cy={plot.top+28} r="18"/><text x={currentLine} y={plot.top+33}>{activeThreshold}</text></g>
                : <g className={`split-line ${stage===3?"done":""}`}><line x1={stage>=2&&locked?.axis==="x"&&locked.side==="high"?xAt(locked.threshold+.5):plot.left} x2={stage>=2&&locked?.axis==="x"&&locked.side==="low"?xAt(locked.threshold+.5):plot.right} y1={currentLine} y2={currentLine}/><circle cx={plot.left+31} cy={currentLine} r="18"/><text x={plot.left+31} y={currentLine+5}>{activeThreshold}</text></g>}
              <text className="axis-label" x={(plot.left+plot.right)/2} y="528">외부 연결 위험도 (X)</text>
              <text className="axis-label" transform={`translate(24 ${(plot.top+plot.bottom)/2}) rotate(-90)`}>의심 표현 점수 (Y)</text>
            </svg>
            {stage<3&&<div className="tip">↔ 클릭하거나 선을 끌면 정수 단위로 이동합니다</div>}
          </div>

          <div className="results">{stage===1?<><Result title="예 · 이하 영역" items={first.low}/><Result title="아니오 · 초과 영역" items={first.high}/></>:<><Result title="예 · 현재 영역의 이하" items={second.low}/><Result title="아니오 · 현재 영역의 초과" items={second.high}/></>}</div>
          <div className="actions"><p>{stage===1?"두 영역의 색 혼합이 어떻게 달라지는지 설명해보세요.":stage===2?"같은 영역에 질문을 한 번 더 적용하면 데이터가 다시 나뉩니다.":"질문 하나가 분할선 하나가 되고, 분할을 반복하면 트리가 성장합니다."}</p>{stage===1&&<button onClick={confirmFirst}>이 위치로 1차 분할 →</button>}{stage===2&&<button onClick={()=>setStage(3)}>2차 분할 확정 →</button>}{stage===3&&<button className="secondary" onClick={reset}>다시 체험하기</button>}</div>
        </div>

        <aside className="tree-card">
          <span>질문이 쌓이는 모습</span><h2>현재 의사결정 나무</h2>
          <div className="tree">
            <div className={`node ${locked?"locked":"current"}`}><small>질문 1</small><strong>{locked?question(locked.axis,locked.threshold):"분할선을 어디에 놓을까?"}</strong></div>
            <div className="branches">
              <article><b>예</b>{locked?.side==="low"?<div className={`node child ${stage===3?"locked":"current"}`}><small>질문 2</small><strong>{question(secondAxis,secondThreshold)}</strong></div>:<em>분류 결과</em>}</article>
              <article><b>아니오</b>{locked?.side==="high"?<div className={`node child ${stage===3?"locked":"current"}`}><small>질문 2</small><strong>{question(secondAxis,secondThreshold)}</strong></div>:<em>분류 결과</em>}</article>
            </div>
            {!locked&&<p>왼쪽 그래프의 선이 첫 번째 질문이 됩니다.</p>}
            {stage===3&&<div className="complete">두 질문으로 공간이 세 영역으로 분할되었습니다.</div>}
          </div>
        </aside>
      </section>
      <footer>※ 교육용 가상 데이터입니다. 실제 해킹메일 판정 기준이 아닙니다.</footer>
      </>
      )}
    </main>
  );
}
