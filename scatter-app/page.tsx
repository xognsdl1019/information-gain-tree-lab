"use client";

import { useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";

type Axis = "x" | "y";
type Point = { id: string; x: number; y: number; label: "normal" | "hack" };
type Locked = { axis: Axis; threshold: number; side: "low" | "high" };

const POINTS: Point[] = [
  { id:"01",x:1.2,y:1.4,label:"normal" },{ id:"02",x:1.8,y:2.6,label:"normal" },
  { id:"03",x:2.3,y:1.8,label:"normal" },{ id:"04",x:2.7,y:3.4,label:"normal" },
  { id:"05",x:3.2,y:2.2,label:"normal" },{ id:"06",x:3.7,y:4.0,label:"normal" },
  { id:"07",x:4.1,y:3.1,label:"normal" },{ id:"08",x:4.5,y:4.7,label:"normal" },
  { id:"09",x:2.1,y:5.4,label:"normal" },{ id:"10",x:3.4,y:5.9,label:"normal" },
  { id:"11",x:1.1,y:4.2,label:"normal" },{ id:"12",x:4.8,y:2.0,label:"normal" },
  { id:"13",x:5.2,y:3.6,label:"normal" },{ id:"14",x:2.8,y:6.3,label:"normal" },
  { id:"15",x:4.0,y:1.1,label:"normal" },{ id:"16",x:5.6,y:2.5,label:"normal" },
  { id:"17",x:3.1,y:4.8,label:"normal" },{ id:"18",x:4.7,y:6.8,label:"hack" },
  { id:"19",x:5.3,y:7.5,label:"hack" },{ id:"20",x:5.9,y:6.3,label:"hack" },
  { id:"21",x:6.2,y:4.5,label:"hack" },{ id:"22",x:6.8,y:7.1,label:"hack" },
  { id:"23",x:7.2,y:5.6,label:"hack" },{ id:"24",x:7.8,y:7.9,label:"hack" },
  { id:"25",x:8.4,y:6.6,label:"hack" },{ id:"26",x:6.5,y:2.8,label:"hack" },
  { id:"27",x:8.8,y:4.1,label:"hack" },{ id:"28",x:5.7,y:5.4,label:"hack" },
  { id:"29",x:3.8,y:7.4,label:"hack" },{ id:"30",x:7.5,y:3.3,label:"hack" },
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
  return `${META[axis].name}가 ${threshold.toFixed(1)} 이하인가?`;
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
  const [stage, setStage] = useState<1|2|3>(1);
  const [axis, setAxis] = useState<Axis>("x");
  const [threshold, setThreshold] = useState(5);
  const [locked, setLocked] = useState<Locked|null>(null);
  const [secondThreshold, setSecondThreshold] = useState(5);
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
    return Math.max(.5, Math.min(9.5, Math.round(raw * 10) / 10));
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
    setSecondThreshold(5);
    setStage(2);
  }

  function reset() {
    setStage(1); setAxis("x"); setThreshold(5); setLocked(null); setSecondThreshold(5); setDragging(false);
  }

  function inParent(point: Point) {
    if (!locked) return true;
    const low = point[locked.axis] <= locked.threshold;
    return locked.side === "low" ? low : !low;
  }

  const currentLine = activeAxis === "x" ? xAt(activeThreshold) : yAt(activeThreshold);

  return (
    <main>
      <header className="app-header">
        <div className="brand"><span>DT</span><div><small>인공지능 개론</small><strong>8. 산점도 분할 체험</strong></div></div>
        <button type="button" onClick={reset}>↻ 처음부터</button>
      </header>

      <nav className="progress">
        {["전체 데이터","1차 분할","2차 분할","트리 완성"].map((label,index) => {
          const reached = stage === 1 ? index <= 1 : stage === 2 ? index <= 2 : true;
          return <div className={reached ? "active" : ""} key={label}><b>{index+1}</b><span>{label}</span></div>;
        })}
      </nav>

      <section className="hero">
        <div><span>SPLIT EXPERIENCE · 해킹메일 30개</span><h1>{stage===1?"첫 번째 분할선을 직접 움직여 보세요":stage===2?"섞여 있는 영역만 다시 분할하세요":"두 번의 질문으로 분할을 완성했습니다"}</h1><p>그래프를 클릭하거나 선을 끌면 위치가 바뀝니다. 선 하나는 데이터에 던지는 질문 하나입니다.</p></div>
        <div className="legend"><span className="normal">● 정상 17</span><span className="hack">● 해킹 13</span></div>
      </section>

      <section className="workspace">
        <div className="lab-card">
          <div className="toolbar">
            <div>
              <small>{stage===1?"분할 방향 선택":stage===2?"두 번째 질문":"분할 확정"}</small>
              {stage===1 ? <div className="axis-buttons">{(["x","y"] as Axis[]).map((a)=><button type="button" className={axis===a?"active":""} onClick={()=>{setAxis(a);setThreshold(5);}} key={a}>{a==="x"?"│ 세로 분할":"─ 가로 분할"}</button>)}</div> : <strong>{META[secondAxis].direction}</strong>}
            </div>
            <div className="question"><small>현재 질문</small><strong>{question(activeAxis,activeThreshold)}</strong></div>
          </div>

          <div className="plot-wrap">
            <svg className={dragging?"dragging":""} viewBox="0 0 880 540" onPointerDown={start} onPointerMove={move} onPointerUp={(e)=>{setDragging(false);e.currentTarget.releasePointerCapture(e.pointerId);}} onPointerCancel={()=>setDragging(false)} role="img" aria-label="이동 가능한 분할선이 있는 해킹메일 산점도">
              <rect className="plot-paper" x={plot.left} y={plot.top} width={w} height={h} rx="15" />
              {[0,2,4,6,8,10].map(t=><g key={`x${t}`}><line className="grid" x1={xAt(t)} x2={xAt(t)} y1={plot.top} y2={plot.bottom}/><text className="tick" x={xAt(t)} y={plot.bottom+27}>{t}</text></g>)}
              {[0,2,4,6,8,10].map(t=><g key={`y${t}`}><line className="grid" x1={plot.left} x2={plot.right} y1={yAt(t)} y2={yAt(t)}/><text className="tick" x={plot.left-24} y={yAt(t)+4}>{t}</text></g>)}

              {locked && (locked.axis==="x"?<line className="locked" x1={xAt(locked.threshold)} x2={xAt(locked.threshold)} y1={plot.top} y2={plot.bottom}/>:<line className="locked" x1={plot.left} x2={plot.right} y1={yAt(locked.threshold)} y2={yAt(locked.threshold)}/>)}
              {stage>=2 && locked && (locked.axis==="x"
                ? <rect className="focus" x={locked.side==="low"?plot.left:xAt(locked.threshold)} y={plot.top} width={locked.side==="low"?xAt(locked.threshold)-plot.left:plot.right-xAt(locked.threshold)} height={h}/>
                : <rect className="focus" x={plot.left} y={locked.side==="low"?yAt(locked.threshold):plot.top} width={w} height={locked.side==="low"?plot.bottom-yAt(locked.threshold):yAt(locked.threshold)-plot.top}/>)}

              {POINTS.map(p=><g className={`point ${p.label} ${stage>=2&&!inParent(p)?"dim":""}`} transform={`translate(${xAt(p.x)} ${yAt(p.y)})`} key={p.id}><circle r="17"/><text y="4">{p.id}</text><title>{p.label==="normal"?"정상메일":"해킹메일"}</title></g>)}

              {activeAxis==="x"
                ? <g className={`split-line ${stage===3?"done":""}`}><line x1={currentLine} x2={currentLine} y1={stage>=2&&locked?.axis==="y"&&locked.side==="high"?plot.top:stage>=2&&locked?.axis==="y"?yAt(locked.threshold):plot.top} y2={stage>=2&&locked?.axis==="y"&&locked.side==="high"?yAt(locked.threshold):plot.bottom}/><circle cx={currentLine} cy={plot.top+28} r="17"/><text x={currentLine} y={plot.top+32}>{activeThreshold.toFixed(1)}</text></g>
                : <g className={`split-line ${stage===3?"done":""}`}><line x1={stage>=2&&locked?.axis==="x"&&locked.side==="high"?xAt(locked.threshold):plot.left} x2={stage>=2&&locked?.axis==="x"&&locked.side==="low"?xAt(locked.threshold):plot.right} y1={currentLine} y2={currentLine}/><circle cx={plot.left+31} cy={currentLine} r="17"/><text x={plot.left+31} y={currentLine+4}>{activeThreshold.toFixed(1)}</text></g>}
              <text className="axis-label" x={(plot.left+plot.right)/2} y="528">외부 연결 위험도 (X)</text>
              <text className="axis-label" transform={`translate(24 ${(plot.top+plot.bottom)/2}) rotate(-90)`}>의심 표현 점수 (Y)</text>
            </svg>
            {stage<3&&<div className="tip">↔ 그래프를 클릭하거나 분할선을 끌어보세요</div>}
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
    </main>
  );
}
