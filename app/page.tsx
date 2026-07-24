"use client";

import { useLayoutEffect, useRef, useState } from "react";

type FeatureKey = "sender" | "link" | "urgency";
type MailLabel = "정상 메일" | "해킹메일";

type Mail = {
  id: string;
  subject: string;
  sender: "내부" | "확인된 외부" | "미확인 외부";
  link: "예" | "아니오";
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
  { key: "link", name: "외부 링크 포함", question: "외부 링크가 있는가?", values: ["예", "아니오"], icon: "↗" },
  { key: "urgency", name: "긴급 여부", question: "긴급 메일인가?", values: ["긴급", "보통"], icon: "!" },
];

const internalNormal = ["주간회의 자료", "교육 일정 안내", "당직근무 변경", "체육행사 계획", "보안교육 참석", "정기점검 결과", "회의록 공유", "업무협조 요청", "교육명령 확인", "월간계획 보고"];
const verifiedHack = ["공문 열람 프로그램", "전자문서 확인 요청", "계정 동기화 안내", "자료 수신 확인"];
const verifiedNormal = ["협조문서 송부", "세미나 초청", "납품 일정 안내", "교육자료 공유", "행사 참석 요청"];
const unknownHack = ["보안 경고 확인", "메일함 용량 초과", "급여명세서 확인", "배송 주소 확인", "지원금 대상 안내", "계정 잠금 해제", "미확인 문서 열람"];

const mails: Mail[] = [
  { id: "01", subject: "비밀번호 만료 안내", sender: "내부", link: "예", urgency: "긴급", label: "해킹메일" },
  { id: "02", subject: "내부 인증 재설정", sender: "내부", link: "아니오", urgency: "긴급", label: "해킹메일" },
  ...internalNormal.map((subject, index) => ({ id: String(index + 3).padStart(2, "0"), subject, sender: "내부" as const, link: index < 3 ? "예" as const : "아니오" as const, urgency: "보통" as const, label: "정상 메일" as const })),
  ...verifiedHack.map((subject, index) => ({ id: String(index + 13).padStart(2, "0"), subject, sender: "확인된 외부" as const, link: "예" as const, urgency: index < 3 ? "긴급" as const : "보통" as const, label: "해킹메일" as const })),
  ...verifiedNormal.map((subject, index) => ({ id: String(index + 17).padStart(2, "0"), subject, sender: "확인된 외부" as const, link: "아니오" as const, urgency: index < 2 ? "긴급" as const : "보통" as const, label: "정상 메일" as const })),
  ...unknownHack.map((subject, index) => ({ id: String(index + 22).padStart(2, "0"), subject, sender: "미확인 외부" as const, link: "예" as const, urgency: index < 2 ? "긴급" as const : "보통" as const, label: "해킹메일" as const })),
  { id: "29", subject: "학술행사 안내", sender: "미확인 외부", link: "아니오", urgency: "긴급", label: "정상 메일" },
  { id: "30", subject: "설문조사 요청", sender: "미확인 외부", link: "아니오", urgency: "보통", label: "정상 메일" },
];

const testMails: Mail[] = [
  { id: "신규 1", subject: "긴급 보안패치 안내", sender: "내부", link: "아니오", urgency: "긴급", label: "해킹메일" },
  { id: "신규 2", subject: "외부기관 교육자료", sender: "확인된 외부", link: "아니오", urgency: "보통", label: "정상 메일" },
  { id: "신규 3", subject: "계정 상태 확인 요청", sender: "미확인 외부", link: "예", urgency: "보통", label: "해킹메일" },
];

const featureOf = (key: FeatureKey) => FEATURES.find((feature) => feature.key === key)!;
const valueOf = (mail: Mail, key: FeatureKey) => mail[key];

function entropy(items: Array<{ label: MailLabel }>) {
  if (!items.length) return 0;
  const normal = items.filter((item) => item.label === "정상 메일").length;
  return [normal / items.length, (items.length - normal) / items.length]
    .filter(Boolean)
    .reduce((sum, probability) => sum - probability * Math.log2(probability), 0);
}

function counts(items: Array<{ label: MailLabel }>) {
  const normal = items.filter((item) => item.label === "정상 메일").length;
  return { normal, hack: items.length - normal };
}

function groupsFor(items: Mail[], key: FeatureKey) {
  return featureOf(key).values.map((value) => ({ value, items: items.filter((mail) => valueOf(mail, key) === value) }));
}

function informationGain(items: Mail[], key: FeatureKey) {
  const weighted = groupsFor(items, key).reduce((sum, group) => sum + group.items.length / items.length * entropy(group.items), 0);
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
    const next = node.split ? [...path, `${featureOf(node.split).name}: ${child.edge}`] : path;
    const found = pathTo(child, id, next);
    if (found) return found;
  }
}

function predict(node: TreeNode, mail: Mail, path: string[] = []): { label: MailLabel; path: string[] } {
  if (node.label) return { label: node.label, path };
  const value = valueOf(mail, node.split!);
  const child = node.children!.find((item) => item.edge === value)!;
  return predict(child, mail, [...path, `${featureOf(node.split!).name} → ${value}`]);
}

function Fraction({ numerator, denominator }: { numerator: number; denominator: number }) {
  return <span className="fraction" aria-label={`${numerator}/${denominator}`}><span>{numerator}</span><span>{denominator}</span></span>;
}

function EntropyFormula({ items, label }: { items: Mail[]; label: string }) {
  const result = counts(items);
  const total = items.length;
  if (!total) return <div className="entropy-formula"><span>H({label})</span><strong>= 0</strong><small>데이터 없음</small></div>;
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

function MailTile({ mail, delay = 0 }: { mail: Mail; delay?: number }) {
  return (
    <div className={`mail-tile ${mail.label === "정상 메일" ? "normal" : "hack"}`} style={{ animationDelay: `${delay}ms` }} title={`${mail.id} · ${mail.subject} · ${mail.label}`}>
      <span>{mail.label === "정상 메일" ? "✓" : "!"}</span><b>{mail.id}</b>
    </div>
  );
}

function PurityBar({ items }: { items: Mail[] }) {
  const result = counts(items);
  const total = items.length || 1;
  return <div className="purity-bar" aria-label={`정상 ${result.normal}, 해킹 ${result.hack}`}><i className="normal" style={{ width: `${result.normal / total * 100}%` }} /><i className="hack" style={{ width: `${result.hack / total * 100}%` }} /></div>;
}

function TreeView({ node, selectedId, justSplitId }: { node: TreeNode; selectedId: string; justSplitId: string | null }) {
  const items = mails.filter((mail) => node.mailIds.includes(mail.id));
  const result = counts(items);
  return (
    <div className="tree-branch">
      <div className={`tree-node ${node.id === selectedId ? "current" : ""} ${node.id === justSplitId ? "just-split" : ""} ${node.label === "정상 메일" ? "normal-leaf" : node.label === "해킹메일" ? "hack-leaf" : ""}`}>
        {node.label ? <><span className="leaf-icon">{node.label === "정상 메일" ? "✓" : "!"}</span><strong>{node.label}</strong><p>{items.length}개 · H=0</p></> : node.split ? <><span className="tree-kicker">질문</span><strong>{featureOf(node.split).question}</strong><p>{items.length}개</p></> : <><span className="tree-kicker">현재 노드</span><strong>어떤 속성?</strong><p>정상 {result.normal} · 해킹 {result.hack}</p></>}
      </div>
      {!!node.children?.length && <div className="tree-children">{node.children.map((child) => <div className="tree-branch" key={child.id}><span className="edge-label">{child.edge}</span><TreeView node={child} selectedId={selectedId} justSplitId={justSplitId} /></div>)}</div>}
    </div>
  );
}

function TreeViewport({ node, selectedId, justSplitId, fit }: { node: TreeNode; selectedId: string; justSplitId: string | null; fit: boolean }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number>();

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    let frame = 0;
    const measure = () => {
      const naturalWidth = Math.max(content.scrollWidth, 1);
      const availableWidth = Math.max(viewport.clientWidth - 32, 1);
      const nextScale = fit ? Math.min(1, availableWidth / naturalWidth) : 1;
      setScale(nextScale);
      setHeight(fit ? Math.ceil(content.scrollHeight * nextScale) + 48 : undefined);
    };

    measure();
    frame = window.requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(content);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [node, fit]);

  return (
    <div ref={viewportRef} className={`tree-canvas ${fit ? "fit-complete" : ""}`} style={fit && height ? { height } : undefined}>
      <div ref={contentRef} className="tree-fit-content" style={{ transform: `scale(${scale})` }}>
        <TreeView node={node} selectedId={selectedId} justSplitId={justSplitId} />
      </div>
    </div>
  );
}

const initialTree: TreeNode = { id: "root", mailIds: mails.map((mail) => mail.id), used: [] };

export default function Home() {
  const [phase, setPhase] = useState<"observe" | "build">("observe");
  const [dataPage, setDataPage] = useState(0);
  const [tree, setTree] = useState<TreeNode>(initialTree);
  const [selectedId, setSelectedId] = useState("root");
  const [previewKey, setPreviewKey] = useState<FeatureKey | null>(null);
  const [calcStep, setCalcStep] = useState<0 | 1 | 2 | 3>(0);
  const [evaluations, setEvaluations] = useState<Record<string, Partial<Record<FeatureKey, number>>>>({});
  const [reviewMode, setReviewMode] = useState(false);
  const [justSplitId, setJustSplitId] = useState<string | null>(null);
  const [message, setMessage] = useState("● 속성 카드 클릭");
  const [history, setHistory] = useState<TreeNode[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Partial<Record<string, MailLabel>>>({});

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
  const quizAnswered = Object.keys(quizAnswers).length;
  const quizScore = isComplete ? testMails.filter((mail) => quizAnswers[mail.id] === predict(tree, mail).label).length : 0;

  function tryFeature(key: FeatureKey) {
    if (selectedNode.used.includes(key) || selectedNode.split || selectedNode.label) return;
    setPreviewKey(key);
    setCalcStep(currentEvaluations[key] !== undefined ? 3 : 0);
    setMessage("● 점 이동 · 색상 혼합 비교");
  }

  function advanceCalculation() {
    if (!previewKey) return;
    const next = Math.min(calcStep + 1, 3) as 0 | 1 | 2 | 3;
    setCalcStep(next);
    if (next === 1) setMessage("● 개수 → 비율 → H");
    if (next === 2) setMessage("● 데이터 비율 × 그룹 H");
    if (next === 3) {
      setEvaluations((previous) => ({ ...previous, [selectedId]: { ...(previous[selectedId] ?? {}), [previewKey]: previewGain } }));
      setMessage("● H(D) − 가중평균 H = IG");
    }
  }

  function confirmSplit() {
    if (!previewKey || !best) return;
    if (tried < available.length) { setMessage(`● 후보 ${available.length - tried}개 남음`); return; }
    if (previewKey !== best.key) { setMessage("● 정보이득 최댓값 선택"); return; }
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
    setMessage(next ? "● 질문 추가 · 다음 노드" : "● 트리 완성");
    setQuizAnswers({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function continueBuilding() {
    setReviewMode(false);
    setJustSplitId(null);
    setMessage("● 현재 노드 · 후보 비교");
  }

  function reset() {
    setTree(initialTree); setSelectedId("root"); setPreviewKey(null); setCalcStep(0); setEvaluations({}); setReviewMode(false); setJustSplitId(null); setHistory([]); setQuizAnswers({}); setMessage("● 속성 카드 클릭");
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setTree(previous); setHistory((items) => items.slice(0, -1)); setSelectedId(firstOpen(previous)?.id ?? "root"); setPreviewKey(null); setCalcStep(0); setReviewMode(false); setJustSplitId(null); setQuizAnswers({}); setMessage("● 이전 분할");
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand"><span>IG</span><div><small>인공지능 개론</small><strong>8. 정보이득 계산 실습</strong></div></div>
        <div className="header-actions">{phase === "build" && <button onClick={undo} disabled={!history.length} type="button">↶ 이전 분할</button>}{phase === "build" && <button onClick={reset} type="button">↻ 처음부터</button>}</div>
      </header>

      <nav className="progress-nav" aria-label="실습 진행 단계">
        {["데이터 확인", "엔트로피 계산", "정보이득 비교", "트리·적용"].map((label, index) => {
          const active = phase === "observe" ? index === 0 : isComplete ? index === 3 : reviewMode ? index === 2 : index === 1;
          return <div className={active ? "active" : ""} key={label}><b>{index + 1}</b><span>{label}</span></div>;
        })}
      </nav>

      {phase === "observe" ? (
        <section className="observe-page">
          <div className="observe-hero">
            <div><span className="eyebrow">STEP 1 · DATA</span><h1>학습 데이터 확인</h1></div>
            <div className="class-summary"><div className="normal"><span>✓</span><p>정상 메일<strong>17개</strong></p></div><div className="hack"><span>!</span><p>해킹메일<strong>13개</strong></p></div><div className="entropy-summary"><p>엔트로피</p><strong>0.987</strong></div></div>
          </div>

          <div className="data-table-card">
            <div className="table-title"><div><h2>가상 메일 30개</h2><p>속성 3개 · 클래스 2개</p></div><div className="legend"><span className="normal">✓ 정상</span><span className="hack">! 해킹</span></div></div>
            <div className="table-scroll">
              <table><thead><tr><th>번호</th><th>메일 제목</th><th>발신자 유형</th><th>외부 링크</th><th>긴급 여부</th><th>실제 클래스</th></tr></thead><tbody>{mails.slice(dataPage * 10, dataPage * 10 + 10).map((mail) => <tr key={mail.id}><td><b>{mail.id}</b></td><td>{mail.subject}</td><td>{mail.sender}</td><td>{mail.link}</td><td>{mail.urgency}</td><td><span className={`class-pill ${mail.label === "정상 메일" ? "normal" : "hack"}`}>{mail.label === "정상 메일" ? "✓" : "!"} {mail.label}</span></td></tr>)}</tbody></table>
            </div>
            <div className="table-footer"><div className="pagination">{[0, 1, 2].map((page) => <button type="button" className={dataPage === page ? "active" : ""} onClick={() => setDataPage(page)} key={page}>{page * 10 + 1}–{page * 10 + 10}</button>)}</div><p>● 카드 클릭 · 점 분할 · 정보이득 비교</p><button className="primary large" type="button" onClick={() => { setPhase("build"); window.scrollTo({ top: 0 }); }}>ID3 분할 실습 →</button></div>
          </div>

          <div className="starting-formula"><div><span>분할 전 엔트로피</span><strong>정상 17 · 해킹 13</strong></div><EntropyFormula items={mails} label="D" /><p><b><Fraction numerator={17} denominator={30} /></b> 정상 · <b><Fraction numerator={13} denominator={30} /></b> 해킹</p></div>
          <p className="disclaimer">※ 교육용 가상 데이터 · 실제 보안 판정 기준 아님</p>
        </section>
      ) : (
        <section className="build-page">
          <div className="path-banner"><span>현재 위치</span>{currentPath.map((item, index) => <div key={`${item}-${index}`}><b>{item}</b>{index < currentPath.length - 1 && <i>›</i>}</div>)}</div>

          <section className={`tree-stage ${reviewMode ? "review" : ""}`}>
            <div className="stage-heading"><div><span className="eyebrow">DECISION TREE</span><h2>{reviewMode ? (isComplete ? "트리 완성" : "질문 추가") : "현재 트리"}</h2></div><div className="current-badge">{isComplete ? "파랑 정상 · 주황 해킹" : "주황 = 현재 노드"}</div></div>
            <TreeViewport node={tree} selectedId={selectedId} justSplitId={justSplitId} fit={isComplete} />
            {reviewMode && <div className="review-action"><p>{message}</p>{!isComplete && <button className="primary large" type="button" onClick={continueBuilding}>다음 노드 분할 ↓</button>}</div>}
          </section>

          {!reviewMode && <>
            <section className="question-builder">
              <div className="section-heading"><span>1</span><div><h2>후보 속성 선택</h2><p>속성 카드 클릭</p></div></div>
              <div className="feature-row">{FEATURES.map((feature) => {
                const disabled = selectedNode.used.includes(feature.key);
                const value = currentEvaluations[feature.key];
                return <button key={feature.key} type="button" disabled={disabled} className={`feature-card ${previewKey === feature.key ? "active" : ""}`} onClick={() => tryFeature(feature.key)}><span>{feature.icon}</span><div><strong>{feature.name}</strong><small>{feature.values.join(" · ")}</small></div>{value !== undefined && <em>IG {value.toFixed(3)}</em>}</button>;
              })}</div>
            </section>

            <section className="visual-split">
              <div className="section-heading"><span>2</span><div><h2>점 분할 보드</h2><p>{message}</p></div></div>
              {!previewKey ? <div className="unsplit-pool"><div className="pool-title"><h3>분할 전</h3><strong>정상 {counts(currentItems).normal} · 해킹 {counts(currentItems).hack}</strong></div><div className="tile-grid">{currentItems.map((mail, index) => <MailTile key={mail.id} mail={mail} delay={index * 18} />)}</div><PurityBar items={currentItems} /><div className="pool-entropy"><span>엔트로피</span><strong>{parentEntropy.toFixed(3)}</strong></div></div> : <div className={`split-groups columns-${previewGroups.length}`}>{previewGroups.map((group, groupIndex) => {
                const result = counts(group.items);
                return <article className="split-group" key={group.value}><div className="group-header"><span>영역 {groupIndex + 1}</span><h3>{group.value}</h3><b>{group.items.length}개</b></div><div className="tile-grid">{group.items.map((mail, index) => <MailTile key={mail.id} mail={mail} delay={index * 28} />)}</div><div className="count-row"><span className="normal">✓ 정상 <b>{result.normal}</b></span><span className="hack">! 해킹 <b>{result.hack}</b></span></div><PurityBar items={group.items} />{calcStep >= 1 ? <EntropyFormula items={group.items} label={group.value} /> : <div className="look-first">● 색상 혼합 비교</div>}</article>;
              })}</div>}
              {previewKey && calcStep === 0 && <div className="reveal-row"><p>● 분리 상태 확인</p><button className="primary large" type="button" onClick={advanceCalculation}>① 그룹별 엔트로피 →</button></div>}
            </section>

            {previewKey && calcStep >= 1 && <section className="calculation-section">
              <div className="section-heading"><span>3</span><div><h2>정보이득 계산</h2></div></div>
              <div className="calc-roadmap" aria-label="계산 진행 단계">{["그룹별 H", "가중평균 H", "정보이득"].map((label, index) => <div key={label} className={calcStep > index + 1 ? "done" : calcStep === index + 1 ? "current" : ""}><b>{index + 1}</b><span>{label}</span></div>)}</div>
              <div className="parent-formula"><span>분할 전</span><EntropyFormula items={currentItems} label="D" /></div>
              {calcStep === 1 && <div className="calculation-action"><p>● 정상/전체 · 해킹/전체</p><button className="primary large" type="button" onClick={advanceCalculation}>② 가중평균 →</button></div>}
              {calcStep >= 2 && <div className="weighted-formula"><span>분할 후 가중평균 H</span><div className="formula-expression">{previewGroups.map((group, index) => <span key={group.value}>{index > 0 && <i>＋</i>}<b>(<Fraction numerator={group.items.length} denominator={currentItems.length} />)</b> × {entropy(group.items).toFixed(3)}</span>)}</div><strong>= {weightedEntropy.toFixed(3)}</strong><small>데이터 비율 × 그룹 H</small></div>}
              {calcStep === 2 && <div className="calculation-action"><p>● H(D) − 가중평균 H</p><button className="primary large" type="button" onClick={advanceCalculation}>③ 정보이득 →</button></div>}
              {calcStep >= 3 && <div className={`gain-formula ${selectedId === "root" ? "first-split" : ""}`}><span>{selectedId === "root" ? "첫 분할 정보이득" : "정보이득"} IG(D, {featureOf(previewKey).name})</span><div><b>{parentEntropy.toFixed(3)}</b><i>−</i><b>{weightedEntropy.toFixed(3)}</b><i>=</i><strong>{previewGain.toFixed(3)}</strong></div><p>불확실성 감소량</p></div>}
            </section>}

            <section className="comparison-section">
              <div className="section-heading"><span>4</span><div><h2>후보별 정보이득</h2></div><b>{tried}/{available.length}</b></div>
              <div className="comparison-grid">{available.map((feature) => {
                const value = currentEvaluations[feature.key];
                const groups = groupsFor(currentItems, feature.key);
                const isBestTried = value !== undefined && Object.values(currentEvaluations).every((other) => other === undefined || value >= other);
                return <button key={feature.key} className={`${previewKey === feature.key ? "active" : ""} ${isBestTried && tried > 1 ? "best" : ""} ${selectedId === "root" && value !== undefined ? "root-gain" : ""}`} type="button" onClick={() => tryFeature(feature.key)}><div className="comparison-name"><strong>{feature.name}</strong>{isBestTried && tried > 1 && <span>최댓값</span>}</div>{value === undefined ? <div className="not-tried">미확인</div> : <div className="mini-groups">{groups.map((group) => <div key={group.value}><small>{group.value}</small><PurityBar items={group.items} /></div>)}</div>}<div className="comparison-value"><span>IG</span><strong>{value === undefined ? "—" : value.toFixed(3)}</strong></div></button>;
              })}</div>
              <div className="confirm-row"><p>{tried < available.length ? `● 후보 ${available.length - tried}개 남음` : "● IG 최댓값 선택"}</p><button className="primary large" type="button" disabled={calcStep < 3 || tried < available.length} onClick={confirmSplit}>최댓값으로 분할 →</button></div>
            </section>
          </>}

          {reviewMode && isComplete && <section className="prediction-section">
            <div className="quiz-heading"><div className="section-heading"><span>4</span><div><h2>신규메일 분류 퀴즈</h2><p>예측 선택 → 정답·경로</p></div></div><div className="quiz-score"><span>SCORE</span><strong>{quizScore}/{testMails.length}</strong></div></div>
            <div className="prediction-grid">{testMails.map((mail) => {
              const result = predict(tree, mail);
              const answer = quizAnswers[mail.id];
              const isCorrect = answer === result.label;
              return <article className={answer ? (isCorrect ? "answered correct" : "answered wrong") : ""} key={mail.id}><div className="prediction-title"><span>✉</span><div><b>{mail.id}</b><h3>{mail.subject}</h3></div></div><div className="mail-facts"><div><span>발신자</span><strong>{mail.sender}</strong></div><div><span>외부 링크</span><strong>{mail.link}</strong></div><div><span>긴급 여부</span><strong>{mail.urgency}</strong></div></div>{!answer ? <div className="prediction-choice"><b>나의 예측</b><div><button type="button" className="normal" onClick={() => setQuizAnswers((items) => ({ ...items, [mail.id]: "정상 메일" }))}>✓ 정상 메일</button><button type="button" className="hack" onClick={() => setQuizAnswers((items) => ({ ...items, [mail.id]: "해킹메일" }))}>! 해킹메일</button></div></div> : <div className="prediction-feedback"><div className={`feedback-title ${isCorrect ? "correct" : "wrong"}`}><span>{isCorrect ? "✓" : "×"}</span><strong>{isCorrect ? "정답!" : "오답"}</strong><b>정답: {result.label}</b></div><div className="prediction-path">{result.path.map((step, index) => <div key={step}><b>{index + 1}</b><span>{step}</span></div>)}</div></div>}</article>;
            })}</div>
            {quizAnswered === testMails.length && <div className="quiz-complete"><div><span>완료</span><strong>{quizScore === testMails.length ? "3문제 모두 정답!" : `${quizScore}개 정답 · 경로 다시 확인`}</strong></div><button type="button" onClick={() => setQuizAnswers({})}>↻ 다시 풀기</button></div>}
          </section>}
          <p className="disclaimer">※ 교육용 가상 데이터 · 실제 보안 판정 기준 아님</p>
        </section>
      )}
    </main>
  );
}
