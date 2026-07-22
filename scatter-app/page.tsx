"use client";

import { useState, type PointerEvent as ReactPointerEvent } from "react";

type FeatureKey = "sender" | "link" | "attachment" | "urgency";
type MailLabel = "정상 메일" | "해킹메일";

type Mail = {
  id: string;
  subject: string;
  sender: "내부" | "확인된 외부" | "미확인 외부";
  link: "예" | "아니오";
  attachment: "예" | "아니오";
  urgency: "긴급" | "보통";
  label: MailLabel;
};

type TreeNode = {
  id: string;
  mailIds: string[];
  used: FeatureKey[];
  edge?: string;
  split?: FeatureKey;
  label?: MailLabel;
  children?: TreeNode[];
};

const FEATURES: Array<{
  key: FeatureKey;
  name: string;
  question: string;
  values: string[];
  icon: string;
}> = [
  { key: "sender", name: "발신자 유형", question: "발신자 유형은?", values: ["내부", "확인된 외부", "미확인 외부"], icon: "◎" },
  { key: "link", name: "외부 링크 포함", question: "외부 링크가 포함되었는가?", values: ["예", "아니오"], icon: "↗" },
  { key: "attachment", name: "첨부파일 포함", question: "첨부파일이 포함되었는가?", values: ["예", "아니오"], icon: "▣" },
  { key: "urgency", name: "긴급 여부", question: "메일이 긴급한가?", values: ["긴급", "보통"], icon: "!" },
];

const internalNormal = ["주간회의 자료", "교육 일정 안내", "당직근무 변경", "체육행사 계획", "보안교육 참석", "정기점검 결과", "회의록 공유", "업무협조 요청", "교육명령 확인", "월간계획 보고"];
const verifiedHack = ["공문 열람 프로그램", "전자문서 확인 요청", "계정 동기화 안내", "자료 수신 확인"];
const verifiedNormal = ["협조문서 송부", "세미나 초청", "납품 일정 안내", "교육자료 공유", "행사 참석 요청"];
const unknownHack = ["보안 경고 확인", "메일함 용량 초과", "급여명세서 확인", "배송 주소 확인", "지원금 대상 안내", "계정 잠금 해제", "미확인 문서 열람"];

const mails: Mail[] = [
  { id: "M01", subject: "비밀번호 만료 안내", sender: "내부", link: "예", attachment: "예", urgency: "긴급", label: "해킹메일" },
  { id: "M02", subject: "내부 인증 재설정", sender: "내부", link: "아니오", attachment: "아니오", urgency: "긴급", label: "해킹메일" },
  ...internalNormal.map((subject, index) => ({ id: `M${String(index + 3).padStart(2, "0")}`, subject, sender: "내부" as const, link: index < 3 ? "예" as const : "아니오" as const, attachment: "예" as const, urgency: "보통" as const, label: "정상 메일" as const })),
  ...verifiedHack.map((subject, index) => ({ id: `M${String(index + 13).padStart(2, "0")}`, subject, sender: "확인된 외부" as const, link: index === 0 ? "예" as const : "아니오" as const, attachment: "예" as const, urgency: index < 3 ? "긴급" as const : "보통" as const, label: "해킹메일" as const })),
  ...verifiedNormal.map((subject, index) => ({ id: `M${String(index + 17).padStart(2, "0")}`, subject, sender: "확인된 외부" as const, link: index < 2 ? "예" as const : "아니오" as const, attachment: "아니오" as const, urgency: index < 2 ? "긴급" as const : "보통" as const, label: "정상 메일" as const })),
  ...unknownHack.map((subject, index) => ({ id: `M${String(index + 22).padStart(2, "0")}`, subject, sender: "미확인 외부" as const, link: "예" as const, attachment: index < 2 ? "예" as const : "아니오" as const, urgency: index < 2 ? "긴급" as const : "보통" as const, label: "해킹메일" as const })),
  { id: "M29", subject: "학술행사 안내", sender: "미확인 외부", link: "아니오", attachment: "예", urgency: "긴급", label: "정상 메일" },
  { id: "M30", subject: "설문조사 요청", sender: "미확인 외부", link: "아니오", attachment: "예", urgency: "보통", label: "정상 메일" },
];

type ScatterAxis = "x" | "y";
type ScatterPoint = Mail & { x: number; y: number };

const SCATTER_METRICS: Record<string, [number, number]> = {
  M01: [3, 5], M02: [0, 4], M03: [1, 0], M04: [1, 1], M05: [1, 2],
  M06: [0, 0], M07: [0, 1], M08: [0, 2], M09: [0, 0], M10: [0, 1],
  M11: [0, 2], M12: [0, 3], M13: [2, 4], M14: [0, 3], M15: [1, 4],
  M16: [1, 2], M17: [1, 1], M18: [1, 2], M19: [0, 1], M20: [0, 2],
  M21: [0, 3], M22: [3, 4], M23: [2, 5], M24: [2, 3], M25: [1, 5],
  M26: [2, 4], M27: [3, 2], M28: [1, 3], M29: [0, 2], M30: [0, 4],
};

const SCATTER_POINTS: ScatterPoint[] = mails.map((mail) => ({
  ...mail,
  x: SCATTER_METRICS[mail.id][0],
  y: SCATTER_METRICS[mail.id][1],
}));

const testMails: Mail[] = [
  { id: "T01", subject: "긴급 보안패치 안내", sender: "내부", link: "아니오", attachment: "예", urgency: "긴급", label: "해킹메일" },
  { id: "T02", subject: "외부기관 교육자료", sender: "확인된 외부", link: "예", attachment: "아니오", urgency: "보통", label: "정상 메일" },
  { id: "T03", subject: "계정 상태 확인 요청", sender: "미확인 외부", link: "예", attachment: "아니오", urgency: "보통", label: "해킹메일" },
];

const featureOf = (key: FeatureKey) => FEATURES.find((feature) => feature.key === key)!;
const valueOf = (mail: Mail, key: FeatureKey) => mail[key];

function entropy(items: Array<{ label: MailLabel }>) {
  if (!items.length) return 0;
  const normal = items.filter((item) => item.label === "정상 메일").length;
  const probabilities = [normal / items.length, (items.length - normal) / items.length].filter(Boolean);
  return -probabilities.reduce((sum, p) => sum + p * Math.log2(p), 0);
}

function groupsFor(items: Mail[], key: FeatureKey) {
  return featureOf(key).values.map((value) => ({ value, items: items.filter((item) => valueOf(item, key) === value) }));
}

function informationGain(items: Mail[], key: FeatureKey) {
  const weighted = groupsFor(items, key).reduce((sum, group) => sum + group.items.length / items.length * entropy(group.items), 0);
  return entropy(items) - weighted;
}

function counts(items: Array<{ label: MailLabel }>) {
  const normal = items.filter((item) => item.label === "정상 메일").length;
  return { normal, hack: items.length - normal };
}

function scatterGroups(items: ScatterPoint[], axis: ScatterAxis, threshold: number) {
  return [
    items.filter((item) => item[axis] <= threshold),
    items.filter((item) => item[axis] > threshold),
  ];
}

function scatterGain(items: ScatterPoint[], axis: ScatterAxis, threshold: number) {
  const groups = scatterGroups(items, axis, threshold);
  const weighted = groups.reduce((sum, group) => sum + group.length / items.length * entropy(group), 0);
  return entropy(items) - weighted;
}

function findNode(node: TreeNode, id: string): TreeNode | undefined {
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
}

function replaceNode(node: TreeNode, id: string, replacement: TreeNode): TreeNode {
  if (node.id === id) return replacement;
  return { ...node, children: node.children?.map((child) => replaceNode(child, id, replacement)) };
}

function firstOpen(node: TreeNode): TreeNode | undefined {
  if (!node.label && !node.split) return node;
  for (const child of node.children ?? []) {
    const open = firstOpen(child);
    if (open) return open;
  }
}

function complete(node: TreeNode): boolean {
  if (node.label) return true;
  return !!node.children?.length && node.children.every(complete);
}

function pathTo(node: TreeNode, id: string, path: string[] = ["전체 메일"]): string[] | undefined {
  if (node.id === id) return path;
  for (const child of node.children ?? []) {
    const nextPath = node.split ? [...path, `${featureOf(node.split).name}: ${child.edge}`] : path;
    const found = pathTo(child, id, nextPath);
    if (found) return found;
  }
}

function predict(node: TreeNode, mail: Mail, path: string[] = []): { label: MailLabel; path: string[] } {
  if (node.label) return { label: node.label, path };
  const value = valueOf(mail, node.split!);
  const child = node.children!.find((item) => item.edge === value)!;
  return predict(child, mail, [...path, `${featureOf(node.split!).name} → ${value}`]);
}

function MailTile({ mail, delay = 0 }: { mail: Mail; delay?: number }) {
  return (
    <div className={`mail-tile ${mail.label === "정상 메일" ? "normal" : "hack"}`} style={{ animationDelay: `${delay}ms` }} title={`${mail.id} · ${mail.label}`}>
      <span>{mail.label === "정상 메일" ? "✓" : "!"}</span><b>{mail.id.replace("M", "")}</b>
    </div>
  );
}

function PurityBar({ items }: { items: Mail[] }) {
  const result = counts(items);
  const total = items.length || 1;
  return (
    <div className="purity-bar" aria-label={`정상 ${result.normal}, 해킹 ${result.hack}`}>
      <i className="normal" style={{ width: `${result.normal / total * 100}%` }} />
      <i className="hack" style={{ width: `${result.hack / total * 100}%` }} />
    </div>
  );
}

function Fraction({ numerator, denominator }: { numerator: number; denominator: number }) {
  return (
    <span className="fraction" aria-label={`${numerator}/${denominator}`}>
      <span>{numerator}</span>
      <span>{denominator}</span>
    </span>
  );
}

function EntropyFormula({ items, label }: { items: Mail[]; label: string }) {
  const result = counts(items);
  const total = items.length;

  if (!total) {
    return <div className="entropy-formula"><span>H({label})</span><strong>= 0</strong><small>해당 데이터 없음</small></div>;
  }

  return (
    <div className="entropy-formula">
      <span>H({label})</span>
      <div>
        <b>− <Fraction numerator={result.normal} denominator={total} /> log₂(<Fraction numerator={result.normal} denominator={total} />)</b>
        <b>− <Fraction numerator={result.hack} denominator={total} /> log₂(<Fraction numerator={result.hack} denominator={total} />)</b>
      </div>
      <strong>= {entropy(items).toFixed(3)}</strong>
    </div>
  );
}

function TreeView({ node, selectedId, justSplitId }: { node: TreeNode; selectedId: string; justSplitId: string | null }) {
  const items = mails.filter((mail) => node.mailIds.includes(mail.id));
  const result = counts(items);
  return (
    <div className="tree-branch">
      {node.edge && <span className="edge-label">{node.edge}</span>}
      <div className={`tree-node ${node.id === selectedId ? "current" : ""} ${node.id === justSplitId ? "just-split" : ""} ${node.label === "정상 메일" ? "normal-leaf" : node.label === "해킹메일" ? "hack-leaf" : ""}`}>
        {node.label ? (
          <><span className="leaf-icon">{node.label === "정상 메일" ? "✓" : "!"}</span><strong>{node.label}</strong><p>{items.length}개 · H=0</p></>
        ) : node.split ? (
          <><span className="tree-kicker">질문</span><strong>{featureOf(node.split).question}</strong><p>{items.length}개 메일</p></>
        ) : (
          <><span className="tree-kicker">{node.id === "root" ? "시작 노드" : "현재 노드"}</span><strong>어떤 질문을 할까?</strong><p>정상 {result.normal} · 해킹 {result.hack}</p></>
        )}
      </div>
      {!!node.children?.length && (
        <div className="tree-children">
          {node.children.map((child) => <TreeView key={child.id} node={child} selectedId={selectedId} justSplitId={justSplitId} />)}
        </div>
      )}
    </div>
  );
}

const initialTree: TreeNode = { id: "root", mailIds: mails.map((mail) => mail.id), used: [] };

function ScatterNode({ kicker, title, items, tone = "mixed" }: { kicker: string; title: string; items: ScatterPoint[]; tone?: "normal" | "hack" | "mixed" | "current" }) {
  const result = counts(items);
  return (
    <div className={`scatter-node ${tone}`}>
      <span>{kicker}</span>
      <strong>{title}</strong>
      <p>정상 {result.normal} · 해킹 {result.hack}</p>
      <small>H = {entropy(items).toFixed(3)}</small>
    </div>
  );
}

function ScatterLab({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const [round, setRound] = useState<1 | 2 | 3>(1);
  const [axis, setAxis] = useState<ScatterAxis | null>(null);
  const [threshold, setThreshold] = useState(0.5);
  const [secondReady, setSecondReady] = useState(false);
  const [secondThreshold, setSecondThreshold] = useState(1.5);
  const [dragging, setDragging] = useState(false);

  const plot = { left: 72, right: 690, top: 28, bottom: 368 };
  const plotWidth = plot.right - plot.left;
  const plotHeight = plot.bottom - plot.top;
  const xAt = (value: number) => plot.left + value / 3 * plotWidth;
  const yAt = (value: number) => plot.bottom - value / 5 * plotHeight;
  const lockedFirst = scatterGroups(SCATTER_POINTS, "x", 1.5);
  const secondParent = lockedFirst[0];
  const activeAxis: ScatterAxis | null = round === 1 ? axis : secondReady || round === 3 ? "y" : null;
  const activeThreshold = round === 1 ? threshold : secondThreshold;
  const activeItems = round === 1 ? SCATTER_POINTS : secondParent;
  const activeGroups = activeAxis ? scatterGroups(activeItems, activeAxis, activeThreshold) : [];
  const currentGain = activeAxis ? scatterGain(activeItems, activeAxis, activeThreshold) : 0;
  const isBest = round === 1 ? axis === "x" && threshold === 1.5 : round === 2 ? secondReady && secondThreshold === 2.5 : true;
  const firstRule = "외부 연결 요소 수 ≤ 1개인가?";
  const activeRule = activeAxis === "x" ? `외부 연결 요소 수 ≤ ${Math.floor(activeThreshold)}개인가?` : `의심 표현 수 ≤ ${Math.floor(activeThreshold)}개인가?`;

  function chooseAxis(nextAxis: ScatterAxis) {
    if (round === 1) {
      setAxis(nextAxis);
      setThreshold(nextAxis === "x" ? 0.5 : 1.5);
    } else if (round === 2 && nextAxis === "y") {
      setSecondReady(true);
      setSecondThreshold(1.5);
    }
  }

  function nearest(value: number, candidates: number[]) {
    return candidates.reduce((winner, candidate) => Math.abs(candidate - value) < Math.abs(winner - value) ? candidate : winner);
  }

  function moveLine(event: ReactPointerEvent<SVGSVGElement>) {
    if (!dragging || !activeAxis || round === 3) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = (event.clientX - rect.left) / rect.width * 720;
    const svgY = (event.clientY - rect.top) / rect.height * 430;
    if (activeAxis === "x") {
      const raw = (svgX - plot.left) / plotWidth * 3;
      setThreshold(nearest(raw, [0.5, 1.5, 2.5]));
    } else {
      const raw = (plot.bottom - svgY) / plotHeight * 5;
      const value = nearest(raw, [0.5, 1.5, 2.5, 3.5, 4.5]);
      if (round === 1) setThreshold(value);
      else setSecondThreshold(value);
    }
  }

  function lockSplit() {
    if (!isBest) return;
    if (round === 1) {
      setRound(2);
      setAxis(null);
      setSecondReady(false);
      setDragging(false);
    } else if (round === 2) {
      setRound(3);
      setDragging(false);
    }
  }

  function resetScatter() {
    setRound(1);
    setAxis(null);
    setThreshold(0.5);
    setSecondReady(false);
    setSecondThreshold(1.5);
    setDragging(false);
  }

  const firstX = xAt(1.5);
  const lineX = activeAxis === "x" ? xAt(activeThreshold) : 0;
  const lineY = activeAxis === "y" ? yAt(activeThreshold) : 0;
  const currentLabels = activeAxis === "x" ? ["왼쪽 영역 · 이하", "오른쪽 영역 · 초과"] : ["아래 영역 · 이하", "위 영역 · 초과"];

  return (
    <section className="scatter-page">
      <div className="scatter-hero">
        <div><span className="eyebrow">STEP 2 · CLASSIFICATION</span><h1>분할선을 직접 움직여 점을 분류하세요</h1><p>선을 놓는 위치가 하나의 질문이 되고, 그 질문이 오른쪽 의사결정나무의 노드가 됩니다.</p></div>
        <div className="scatter-round"><span>{round < 3 ? `${round}차 분할` : "규칙 완성"}</span><strong>{round < 3 ? `${round}/2` : "2/2"}</strong></div>
      </div>

      <div className="scatter-workspace">
        <section className="scatter-controls">
          <div className="scatter-instruction">
            <b>{round === 1 ? "① 전체 메일을 가장 잘 나눌 선을 찾으세요" : round === 2 ? "② 혼합된 왼쪽 영역을 한 번 더 나누세요" : "두 개의 분류 규칙을 완성했습니다"}</b>
            <p>{round === 1 ? "분할 도구를 그래프에 끌어 놓고, 선의 손잡이를 좌우 또는 위아래로 움직이세요." : round === 2 ? "Y축 분할 도구를 강조 영역에 놓고 정보이득이 가장 커지는 높이를 찾으세요." : "산점도의 두 경계선이 오른쪽 나무의 질문 두 개로 바뀌었습니다."}</p>
          </div>

          {round < 3 && (
            <div className="split-tool-row">
              {(round === 1 ? [{ axis: "x" as const, icon: "↔", name: "X축 분할선", desc: "세로선을 좌우로 이동" }, { axis: "y" as const, icon: "↕", name: "Y축 분할선", desc: "가로선을 위아래로 이동" }] : [{ axis: "y" as const, icon: "↕", name: "Y축 분할선", desc: "왼쪽 영역만 다시 분할" }]).map((tool) => (
                <button type="button" draggable key={tool.axis} className={`split-tool ${activeAxis === tool.axis ? "active" : ""}`} onClick={() => chooseAxis(tool.axis)} onDragStart={(event) => { event.dataTransfer.setData("split-axis", tool.axis); event.dataTransfer.effectAllowed = "copy"; }}>
                  <span>{tool.icon}</span><div><strong>{tool.name}</strong><small>{tool.desc}</small></div><i>⠿</i>
                </button>
              ))}
            </div>
          )}

          <div className={`scatter-plot-wrap ${activeAxis ? "has-line" : ""} ${round === 2 ? "focus-left" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const dropped = event.dataTransfer.getData("split-axis") as ScatterAxis; if (dropped) chooseAxis(dropped); }}>
            {!activeAxis && round < 3 && <div className="plot-drop-message"><span>↓</span><strong>분할 도구를 이곳에 드롭하세요</strong></div>}
            <svg className="scatter-plot" viewBox="0 0 720 430" role="img" aria-label="외부 연결 요소 수와 의심 표현 수에 따른 정상메일 및 해킹메일 산점도" onPointerMove={moveLine} onPointerUp={() => setDragging(false)} onPointerCancel={() => setDragging(false)}>
              <rect className="plot-background" x={plot.left} y={plot.top} width={plotWidth} height={plotHeight} rx="10" />

              {round === 1 && activeAxis === "x" && <><rect className="region-normal" x={plot.left} y={plot.top} width={lineX - plot.left} height={plotHeight} /><rect className="region-hack" x={lineX} y={plot.top} width={plot.right - lineX} height={plotHeight} /></>}
              {round === 1 && activeAxis === "y" && <><rect className="region-normal" x={plot.left} y={lineY} width={plotWidth} height={plot.bottom - lineY} /><rect className="region-hack" x={plot.left} y={plot.top} width={plotWidth} height={lineY - plot.top} /></>}
              {round >= 2 && <><rect className="region-hack" x={firstX} y={plot.top} width={plot.right - firstX} height={plotHeight} /><rect className="region-focus" x={plot.left} y={plot.top} width={firstX - plot.left} height={plotHeight} /></>}
              {round >= 2 && (secondReady || round === 3) && <><rect className="region-normal" x={plot.left} y={lineY} width={firstX - plot.left} height={plot.bottom - lineY} /><rect className="region-hack soft" x={plot.left} y={plot.top} width={firstX - plot.left} height={lineY - plot.top} /></>}

              {[0, 1, 2, 3].map((tick) => <g key={`x-${tick}`}><line className="grid-line" x1={xAt(tick)} y1={plot.top} x2={xAt(tick)} y2={plot.bottom} /><text className="tick-label" x={xAt(tick)} y={397} textAnchor="middle">{tick}</text></g>)}
              {[0, 1, 2, 3, 4, 5].map((tick) => <g key={`y-${tick}`}><line className="grid-line" x1={plot.left} y1={yAt(tick)} x2={plot.right} y2={yAt(tick)} /><text className="tick-label" x={53} y={yAt(tick) + 5} textAnchor="end">{tick}</text></g>)}
              <text className="axis-title" x={(plot.left + plot.right) / 2} y={423} textAnchor="middle">외부 연결 요소 수 (X축)</text>
              <text className="axis-title" x={16} y={(plot.top + plot.bottom) / 2} textAnchor="middle" transform={`rotate(-90 16 ${(plot.top + plot.bottom) / 2})`}>의심 표현 수 (Y축)</text>

              {SCATTER_POINTS.map((point) => {
                const number = Number(point.id.slice(1));
                const px = xAt(point.x) + (number % 3 - 1) * 12;
                const py = yAt(point.y) + (Math.floor(number / 3) % 3 - 1) * 9;
                const dimmed = round >= 2 && point.x > 1.5;
                return <g className={`scatter-point ${point.label === "정상 메일" ? "normal" : "hack"} ${dimmed ? "dimmed" : ""}`} key={point.id}><title>{point.id} · {point.subject} · {point.label}</title><circle cx={px} cy={py} r="12" /><text x={px} y={py + 4} textAnchor="middle">{point.id.slice(1)}</text></g>;
              })}

              {round >= 2 && <g className="split-line locked"><line x1={firstX} y1={plot.top} x2={firstX} y2={plot.bottom} /><rect x={firstX - 28} y={plot.top + 8} width="56" height="25" rx="12" /><text x={firstX} y={plot.top + 26} textAnchor="middle">X ≤ 1</text></g>}
              {round === 1 && activeAxis === "x" && <g className={`split-line draggable ${dragging ? "dragging" : ""}`} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); }}><line className="hit-line" x1={lineX} y1={plot.top} x2={lineX} y2={plot.bottom} /><line x1={lineX} y1={plot.top} x2={lineX} y2={plot.bottom} /><circle cx={lineX} cy={plot.top + 18} r="15" /><text x={lineX} y={plot.top + 23} textAnchor="middle">↔</text></g>}
              {round === 1 && activeAxis === "y" && <g className={`split-line draggable ${dragging ? "dragging" : ""}`} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); }}><line className="hit-line" x1={plot.left} y1={lineY} x2={plot.right} y2={lineY} /><line x1={plot.left} y1={lineY} x2={plot.right} y2={lineY} /><circle cx={plot.left + 20} cy={lineY} r="15" /><text x={plot.left + 20} y={lineY + 5} textAnchor="middle">↕</text></g>}
              {round >= 2 && (secondReady || round === 3) && <g className={`split-line ${round === 2 ? "draggable" : "locked"} ${dragging ? "dragging" : ""}`} onPointerDown={(event) => { if (round === 2) { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); } }}><line className="hit-line" x1={plot.left} y1={lineY} x2={firstX} y2={lineY} /><line x1={plot.left} y1={lineY} x2={firstX} y2={lineY} /><circle cx={plot.left + 20} cy={lineY} r="15" /><text x={plot.left + 20} y={lineY + 5} textAnchor="middle">{round === 2 ? "↕" : "✓"}</text></g>}
            </svg>
          </div>

          {activeAxis && activeGroups.length === 2 && (
            <div className="scatter-result-row">
              {activeGroups.map((group, index) => { const result = counts(group); return <div className="scatter-region-card" key={currentLabels[index]}><span>{currentLabels[index]}</span><strong>{group.length}개</strong><p><i className="normal">정상 {result.normal}</i><i className="hack">해킹 {result.hack}</i></p><small>엔트로피 {entropy(group).toFixed(3)}</small></div>; })}
              <div className={`live-gain ${isBest ? "best" : ""}`}><span>현재 정보이득</span><strong>{currentGain.toFixed(3)}</strong><small>{isBest ? "가장 좋은 위치를 찾았습니다" : "선을 움직여 더 크게 만드세요"}</small></div>
            </div>
          )}

          {round < 3 ? <div className="scatter-action"><p>{activeAxis ? (isBest ? "같은 색 점들이 가장 잘 모이는 위치입니다. 이 질문을 나무에 추가하세요." : "손잡이를 직접 움직이며 두 영역의 색상 혼합도와 정보이득을 비교하세요.") : "먼저 분할 도구를 그래프에 드롭하세요."}</p><button className="primary large" type="button" disabled={!isBest} onClick={lockSplit}>{round}차 분할 확정 →</button></div> : <div className="scatter-complete"><div><span>✓</span><p><strong>선으로 만든 규칙이 나무가 되었습니다</strong><small>이제 범주형 속성을 사용하는 ID3 실습에서 같은 과정을 정보이득 수식으로 수행합니다.</small></p></div><button className="primary large" type="button" onClick={onContinue}>ID3 해킹메일 실습 계속 →</button></div>}
        </section>

        <aside className="scatter-tree-panel">
          <div className="scatter-tree-heading"><span>LIVE TREE</span><h2>내가 만든 분할 규칙</h2><p>왼쪽의 선과 오른쪽의 질문이 동시에 바뀝니다.</p></div>
          <div className="scatter-tree-diagram">
            {round === 1 ? (
              <>
                <ScatterNode kicker={axis ? "미리보기 질문" : "시작 노드"} title={axis ? activeRule : "어디에서 나눌까?"} items={SCATTER_POINTS} tone="current" />
                {axis && <div className="scatter-tree-level"><div className="scatter-subtree"><b>예</b><ScatterNode kicker={currentLabels[0]} title="첫 번째 영역" items={activeGroups[0]} tone={counts(activeGroups[0]).normal >= counts(activeGroups[0]).hack ? "normal" : "hack"} /></div><div className="scatter-subtree"><b>아니오</b><ScatterNode kicker={currentLabels[1]} title="두 번째 영역" items={activeGroups[1]} tone={counts(activeGroups[1]).normal >= counts(activeGroups[1]).hack ? "normal" : "hack"} /></div></div>}
              </>
            ) : (
              <>
                <ScatterNode kicker="확정된 질문 1" title={firstRule} items={SCATTER_POINTS} />
                <div className="scatter-tree-level">
                  <div className="scatter-subtree"><b>예</b>{secondReady || round === 3 ? <><ScatterNode kicker={round === 3 ? "확정된 질문 2" : "미리보기 질문"} title={`의심 표현 수 ≤ ${Math.floor(secondThreshold)}개인가?`} items={secondParent} tone={round === 2 ? "current" : "mixed"} /><div className="scatter-tree-level compact"><div className="scatter-subtree"><b>예</b><ScatterNode kicker="아래 영역" title="정상 중심" items={scatterGroups(secondParent, "y", secondThreshold)[0]} tone="normal" /></div><div className="scatter-subtree"><b>아니오</b><ScatterNode kicker="위 영역" title="해킹 중심" items={scatterGroups(secondParent, "y", secondThreshold)[1]} tone="hack" /></div></div></> : <ScatterNode kicker="현재 노드" title="이 영역을 다시 나누세요" items={secondParent} tone="current" />}</div>
                  <div className="scatter-subtree"><b>아니오</b><ScatterNode kicker="순수 노드" title="해킹메일" items={lockedFirst[1]} tone="hack" /></div>
                </div>
              </>
            )}
          </div>
          <div className="scatter-tree-legend"><span className="normal">● 정상메일</span><span className="hack">● 해킹메일</span></div>
        </aside>
      </div>

      <div className="scatter-footer"><button type="button" onClick={onBack}>← 데이터 표로 돌아가기</button><button type="button" onClick={resetScatter}>↻ 분할 체험 다시 시작</button></div>
      <p className="disclaimer">※ 산점도의 두 수치와 메일 사례는 학습용 가상 데이터이며 실제 보안 판정 기준이 아닙니다.</p>
    </section>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<"observe" | "scatter" | "build">("observe");
  const [dataPage, setDataPage] = useState(0);
  const [tree, setTree] = useState<TreeNode>(initialTree);
  const [selectedId, setSelectedId] = useState("root");
  const [previewKey, setPreviewKey] = useState<FeatureKey | null>(null);
  const [calcStep, setCalcStep] = useState<0 | 1 | 2 | 3>(0);
  const [evaluations, setEvaluations] = useState<Record<string, Partial<Record<FeatureKey, number>>>>({});
  const [reviewMode, setReviewMode] = useState(false);
  const [justSplitId, setJustSplitId] = useState<string | null>(null);
  const [message, setMessage] = useState("속성 카드를 질문 영역에 끌어 놓으세요.");
  const [history, setHistory] = useState<TreeNode[]>([]);

  const selectedNode = findNode(tree, selectedId) ?? tree;
  const currentItems = mails.filter((mail) => selectedNode.mailIds.includes(mail.id));
  const available = FEATURES.filter((feature) => !selectedNode.used.includes(feature.key));
  const currentEvaluations = evaluations[selectedId] ?? {};
  const previewGroups = previewKey ? groupsFor(currentItems, previewKey) : [];
  const parentEntropy = entropy(currentItems);
  const previewGain = previewKey ? informationGain(currentItems, previewKey) : 0;
  const weightedEntropy = previewKey ? parentEntropy - previewGain : 0;
  const tried = available.filter((feature) => currentEvaluations[feature.key] !== undefined).length;
  const best = available.length ? available.reduce((winner, feature) => informationGain(currentItems, feature.key) > informationGain(currentItems, winner.key) ? feature : winner) : null;
  const isComplete = complete(tree);
  const currentPath = pathTo(tree, selectedId) ?? ["전체 메일"];

  function tryFeature(key: FeatureKey) {
    if (selectedNode.used.includes(key) || selectedNode.split || selectedNode.label) return;
    setPreviewKey(key);
    setCalcStep(currentEvaluations[key] !== undefined ? 3 : 0);
    setMessage("숫자를 보기 전에, 색상이 이전보다 잘 분리되었는지 먼저 관찰하세요.");
  }

  function advanceCalculation() {
    if (!previewKey) return;
    const nextStep = Math.min(calcStep + 1, 3) as 0 | 1 | 2 | 3;
    setCalcStep(nextStep);
    if (nextStep === 1) setMessage("정상·해킹메일의 개수를 확률로 바꾸어 각 그룹의 엔트로피 식에 대입했습니다.");
    if (nextStep === 2) setMessage("각 그룹의 엔트로피에 그 그룹이 차지하는 데이터 비율을 곱합니다.");
    if (nextStep === 3) {
      setEvaluations((previous) => ({ ...previous, [selectedId]: { ...(previous[selectedId] ?? {}), [previewKey]: previewGain } }));
      setMessage("분할 전 엔트로피에서 분할 후 가중평균 엔트로피를 빼 정보이득을 구했습니다.");
    }
  }

  function confirmSplit() {
    if (!previewKey || !best) return;
    if (tried < available.length) {
      setMessage(`아직 ${available.length - tried}개 후보가 남았습니다. 모든 분할 모습을 비교하세요.`);
      return;
    }
    if (previewKey !== best.key) {
      setMessage("색상이 가장 깨끗하게 분리되고 정보이득이 가장 큰 속성을 다시 선택하세요.");
      return;
    }
    const children: TreeNode[] = groupsFor(currentItems, previewKey).map((group, index) => {
      const result = counts(group.items);
      return {
        id: `${selectedNode.id}-${previewKey}-${index}`,
        mailIds: group.items.map((item) => item.id),
        used: [...selectedNode.used, previewKey],
        edge: group.value,
        label: result.hack === 0 ? "정상 메일" : result.normal === 0 ? "해킹메일" : undefined,
      };
    });
    const nextTree = replaceNode(tree, selectedNode.id, { ...selectedNode, split: previewKey, children });
    const next = firstOpen(nextTree);
    setHistory((previous) => [...previous, tree]);
    setTree(nextTree);
    setJustSplitId(selectedNode.id);
    setSelectedId(next?.id ?? "done");
    setPreviewKey(null);
    setCalcStep(0);
    setReviewMode(true);
    setMessage(next ? "트리에 질문이 추가되었습니다. 다음으로 분할할 노드를 확인하세요." : "모든 노드의 분류가 끝났습니다.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function continueBuilding() {
    setReviewMode(false);
    setJustSplitId(null);
    setMessage("새로운 현재 노드에서 후보 속성을 다시 비교하세요.");
  }

  function reset() {
    setTree(initialTree); setSelectedId("root"); setPreviewKey(null); setCalcStep(0); setEvaluations({}); setReviewMode(false); setJustSplitId(null); setHistory([]); setMessage("속성 카드를 질문 영역에 끌어 놓으세요.");
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setTree(previous); setHistory((items) => items.slice(0, -1)); setSelectedId(firstOpen(previous)?.id ?? "root"); setPreviewKey(null); setCalcStep(0); setReviewMode(false); setJustSplitId(null); setMessage("이전 분할 상태로 돌아왔습니다.");
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand"><span>DT</span><div><small>인공지능 개론</small><strong>8. 의사결정 나무 실습</strong></div></div>
        <div className="header-actions">
          {phase === "build" && <button onClick={undo} disabled={!history.length} type="button">↶ 이전 분할</button>}
          {phase === "build" && <button onClick={reset} type="button">↻ 처음부터</button>}
        </div>
      </header>

      <nav className="progress-nav" aria-label="실습 진행 단계">
        {["데이터 관찰", "경계선 분할", "정보이득 비교", "트리 생성", "신규메일 분류"].map((label, index) => {
          const active = phase === "observe" ? index === 0 : phase === "scatter" ? index === 1 : isComplete ? index === 4 : reviewMode ? index === 3 : index === 2;
          return <div className={active ? "active" : ""} key={label}><b>{index + 1}</b><span>{label}</span></div>;
        })}
      </nav>

      {phase === "observe" ? (
        <section className="observe-page">
          <div className="observe-hero">
            <div><span className="eyebrow">STEP 1 · DATA</span><h1>먼저, 분류할 데이터를 살펴보세요</h1><p>의사결정나무는 이미 정답을 알고 있는 학습 데이터에서 분류 규칙을 찾습니다.</p></div>
            <div className="class-summary"><div className="normal"><span>✓</span><p>정상 메일<strong>17개</strong></p></div><div className="hack"><span>!</span><p>해킹메일<strong>13개</strong></p></div><div className="entropy-summary"><p>현재 엔트로피</p><strong>0.987</strong><small>두 클래스가 섞여 있음</small></div></div>
          </div>

          <div className="data-table-card">
            <div className="table-title"><div><h2>가상 메일 데이터 30개</h2><p>파란색 두 열은 다음 단계 산점도의 X축과 Y축으로 사용됩니다.</p></div><div className="legend"><span className="normal">✓ 정상</span><span className="hack">! 해킹</span></div></div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>메일</th><th>메일 제목</th><th>발신자 유형</th><th>외부 링크</th><th>첨부파일</th><th>긴급 여부</th><th className="metric-head">외부 연결 요소</th><th className="metric-head">의심 표현</th><th>실제 클래스</th></tr></thead>
                <tbody>{mails.slice(dataPage * 10, dataPage * 10 + 10).map((mail) => <tr key={mail.id}><td><b>{mail.id}</b></td><td>{mail.subject}</td><td>{mail.sender}</td><td>{mail.link}</td><td>{mail.attachment}</td><td>{mail.urgency}</td><td className="metric-cell"><span>{SCATTER_METRICS[mail.id][0]}개</span></td><td className="metric-cell"><span>{SCATTER_METRICS[mail.id][1]}개</span></td><td><span className={`class-pill ${mail.label === "정상 메일" ? "normal" : "hack"}`}>{mail.label === "정상 메일" ? "✓" : "!"} {mail.label}</span></td></tr>)}</tbody>
              </table>
            </div>
            <div className="table-footer">
              <div className="pagination">{[0,1,2].map((page) => <button type="button" className={dataPage === page ? "active" : ""} onClick={() => setDataPage(page)} key={page}>{page * 10 + 1}–{page * 10 + 10}</button>)}</div>
              <p>먼저 숫자형 특성으로 경계선을 직접 움직여 분류 규칙을 만들어봅니다.</p>
              <button className="primary large" type="button" onClick={() => { setPhase("scatter"); window.scrollTo({ top: 0 }); }}>산점도 분할 체험 →</button>
            </div>
          </div>
          <div className="starting-formula">
            <div><span>분할 전 엔트로피</span><strong>전체 데이터의 혼합 정도를 먼저 계산합니다.</strong></div>
            <EntropyFormula items={mails} label="D" />
            <p><b><Fraction numerator={17} denominator={30} /></b>은 정상메일의 비율, <b><Fraction numerator={13} denominator={30} /></b>은 해킹메일의 비율입니다.</p>
          </div>
          <p className="disclaimer">※ 본 데이터는 의사결정나무 학습을 위해 구성한 가상의 사례이며 실제 군 보안 판정 기준이 아닙니다.</p>
        </section>
      ) : phase === "scatter" ? (
        <ScatterLab onBack={() => { setPhase("observe"); window.scrollTo({ top: 0 }); }} onContinue={() => { setPhase("build"); window.scrollTo({ top: 0 }); }} />
      ) : (
        <section className="build-page">
          <div className="path-banner"><span>현재 위치</span>{currentPath.map((item, index) => <div key={`${item}-${index}`}><b>{item}</b>{index < currentPath.length - 1 && <i>›</i>}</div>)}</div>

          <section className={`tree-stage ${reviewMode ? "review" : ""}`}>
            <div className="stage-heading"><div><span className="eyebrow">DECISION TREE</span><h2>{reviewMode ? (isComplete ? "의사결정나무 완성" : "트리에 새로운 질문이 추가되었습니다") : "전체 트리에서 현재 노드를 확인하세요"}</h2></div><div className="current-badge">{isComplete ? "파란색 = 정상 · 주황색 = 해킹" : "주황색 = 현재 노드"}</div></div>
            <div className="tree-canvas"><TreeView node={tree} selectedId={selectedId} justSplitId={justSplitId} /></div>
            {reviewMode && <div className="review-action"><p>{message}</p>{!isComplete && <button className="primary large" type="button" onClick={continueBuilding}>현재 노드 분할 계속하기 ↓</button>}</div>}
          </section>

          {!reviewMode && (
            <>
              <section className="question-builder">
                <div className="section-heading"><span>1</span><div><h2>후보 속성을 적용해보세요</h2><p>카드를 아래 질문 영역에 끌어 놓으면 같은 메일들이 속성값에 따라 이동합니다.</p></div></div>
                <div className="feature-row">
                  {FEATURES.map((feature) => {
                    const disabled = selectedNode.used.includes(feature.key);
                    const value = currentEvaluations[feature.key];
                    return <button key={feature.key} type="button" draggable={!disabled} disabled={disabled} className={`feature-card ${previewKey === feature.key ? "active" : ""}`} onClick={() => tryFeature(feature.key)} onDragStart={(event) => { event.dataTransfer.setData("feature", feature.key); event.dataTransfer.effectAllowed = "copy"; }}><span>{feature.icon}</span><div><strong>{feature.name}</strong><small>{feature.values.join(" · ")}</small></div><i>⠿</i>{value !== undefined && <em>IG {value.toFixed(3)}</em>}</button>;
                  })}
                </div>
                <div className={`question-drop ${previewKey ? "filled" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const key = event.dataTransfer.getData("feature") as FeatureKey; if (key) tryFeature(key); }}>
                  {previewKey ? <><span>선택한 질문</span><strong>{featureOf(previewKey).question}</strong></> : <><span className="drop-icon">↓</span><strong>속성 카드를 여기에 드롭하세요</strong></>}
                </div>
              </section>

              <section className="visual-split">
                <div className="section-heading"><span>2</span><div><h2>데이터가 어떻게 나뉘는지 눈으로 확인하세요</h2><p>{message}</p></div></div>
                {!previewKey ? (
                  <div className="unsplit-pool"><div className="pool-title"><h3>분할 전 · 전체 메일</h3><strong>정상 {counts(currentItems).normal} · 해킹 {counts(currentItems).hack}</strong></div><div className="tile-grid">{currentItems.map((mail, index) => <MailTile key={mail.id} mail={mail} delay={index * 18} />)}</div><PurityBar items={currentItems} /><div className="pool-entropy"><span>현재 엔트로피</span><strong>{parentEntropy.toFixed(3)}</strong><p>두 색상이 섞여 있을수록 불확실성이 큽니다.</p></div></div>
                ) : (
                  <div className={`split-groups columns-${previewGroups.length}`}>
                    {previewGroups.map((group, groupIndex) => {
                      const result = counts(group.items);
                      return <article className="split-group" key={group.value}><div className="group-header"><span>가지 {groupIndex + 1}</span><h3>{group.value}</h3><b>{group.items.length}개</b></div><div className="tile-grid">{group.items.map((mail, index) => <MailTile key={mail.id} mail={mail} delay={index * 28} />)}</div><div className="count-row"><span className="normal">✓ 정상 <b>{result.normal}</b></span><span className="hack">! 해킹 <b>{result.hack}</b></span></div><PurityBar items={group.items} />{calcStep >= 1 ? <EntropyFormula items={group.items} label={group.value} /> : <div className="look-first">색상 혼합도를 관찰하세요</div>}</article>;
                    })}
                  </div>
                )}
                {previewKey && calcStep === 0 && <div className="reveal-row"><p>이전보다 같은 색상끼리 잘 모였나요?</p><button className="primary large" type="button" onClick={advanceCalculation}>① 그룹별 엔트로피 식 세우기 →</button></div>}
              </section>

              {previewKey && calcStep >= 1 && (
                <section className="calculation-section">
                  <div className="section-heading"><span>3</span><div><h2>수식으로 정보이득을 완성하세요</h2><p>그룹별 엔트로피 → 가중평균 → 정보이득 순서로 한 단계씩 계산합니다.</p></div></div>
                  <div className="calc-roadmap" aria-label="계산 진행 단계">
                    {["그룹별 H", "가중평균 H", "정보이득"].map((label, index) => <div key={label} className={calcStep > index + 1 ? "done" : calcStep === index + 1 ? "current" : ""}><b>{index + 1}</b><span>{label}</span></div>)}
                  </div>
                  <div className="parent-formula"><span>분할 전 데이터</span><EntropyFormula items={currentItems} label="D" /></div>

                  {calcStep === 1 && <div className="calculation-action"><p>각 가지의 <b>정상/전체</b>, <b>해킹/전체</b> 비율이 위 수식에 들어간 것을 확인하세요.</p><button className="primary large" type="button" onClick={advanceCalculation}>② 데이터 비율을 곱해 가중평균 계산 →</button></div>}

                  {calcStep >= 2 && (
                    <div className="weighted-formula">
                      <span>분할 후 가중평균 엔트로피</span>
                      <div className="formula-expression">{previewGroups.map((group, index) => <span key={group.value}>{index > 0 && <i>＋</i>}<b>(<Fraction numerator={group.items.length} denominator={currentItems.length} />)</b> × {entropy(group.items).toFixed(3)}</span>)}</div>
                      <strong>= {weightedEntropy.toFixed(3)}</strong>
                      <small>그룹이 전체 데이터에서 차지하는 비율 × 그 그룹의 엔트로피</small>
                    </div>
                  )}

                  {calcStep === 2 && <div className="calculation-action"><p>이제 분할 전의 불확실성에서 분할 후 남은 불확실성을 뺍니다.</p><button className="primary large" type="button" onClick={advanceCalculation}>③ 정보이득 계산하기 →</button></div>}

                  {calcStep >= 3 && <div className={`gain-formula ${selectedId === "root" ? "first-split" : ""}`}><span>{selectedId === "root" ? "첫 번째 분할의 정보이득" : "정보이득"} IG(D, {featureOf(previewKey).name})</span><div><b>{parentEntropy.toFixed(3)}</b><i>−</i><b>{weightedEntropy.toFixed(3)}</b><i>=</i><strong>{previewGain.toFixed(3)}</strong></div><p>이 값만큼 분류의 불확실성이 줄었습니다.</p></div>}
                </section>
              )}

              <section className="comparison-section">
                <div className="section-heading"><span>4</span><div><h2>후보별 분할 모습을 비교하세요</h2><p>색상이 깨끗하게 나뉠수록 분할 후 엔트로피는 작고 정보이득은 큽니다.</p></div><b>{tried}/{available.length} 확인</b></div>
                <div className="comparison-grid">
                  {available.map((feature) => {
                    const value = currentEvaluations[feature.key];
                    const groups = groupsFor(currentItems, feature.key);
                    const isBestTried = value !== undefined && Object.values(currentEvaluations).every((other) => other === undefined || value >= other);
                    return <button key={feature.key} className={`${previewKey === feature.key ? "active" : ""} ${isBestTried && tried > 1 ? "best" : ""} ${selectedId === "root" && value !== undefined ? "root-gain" : ""}`} type="button" onClick={() => tryFeature(feature.key)}><div className="comparison-name"><strong>{feature.name}</strong>{isBestTried && tried > 1 && <span>현재 최대</span>}</div>{value === undefined ? <div className="not-tried">아직 분할하지 않음</div> : <div className="mini-groups">{groups.map((group) => <div key={group.value}><small>{group.value}</small><PurityBar items={group.items} /></div>)}</div>}<div className="comparison-value"><span>정보이득</span><strong>{value === undefined ? "—" : value.toFixed(3)}</strong></div></button>;
                  })}
                </div>
                <div className="confirm-row"><p>{tried < available.length ? `남은 후보 ${available.length - tried}개를 더 확인하세요.` : "가장 깨끗하게 분리된 속성을 선택하세요."}</p><button className="primary large" type="button" disabled={calcStep < 3 || tried < available.length} onClick={confirmSplit}>최댓값 속성으로 분할 확정 →</button></div>
              </section>
            </>
          )}

          {reviewMode && isComplete && (
            <section className="prediction-section"><div className="section-heading"><span>4</span><div><h2>완성한 트리로 신규메일을 분류하세요</h2><p>각 메일이 어떤 질문과 가지를 통과하는지 확인하세요.</p></div></div><div className="prediction-grid">{testMails.map((mail) => { const result = predict(tree, mail); return <article key={mail.id}><div className="prediction-title"><span>✉</span><div><small>{mail.id}</small><h3>{mail.subject}</h3></div></div><div className="prediction-path">{result.path.map((step, index) => <div key={step}><b>{index + 1}</b><span>{step}</span></div>)}</div><div className={`prediction-result ${result.label === "정상 메일" ? "normal" : "hack"}`}><span>최종 분류</span><strong>{result.label === "정상 메일" ? "✓" : "!"} {result.label}</strong></div></article>; })}</div></section>
          )}
          <p className="disclaimer">※ 본 데이터는 의사결정나무 학습을 위해 구성한 가상의 사례이며 실제 군 보안 판정 기준이 아닙니다.</p>
        </section>
      )}
    </main>
  );
}

