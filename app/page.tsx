"use client";

import { FormEvent, useMemo, useState } from "react";

type Attr = "age" | "income" | "student" | "credit";
type Row = {
  id: number;
  age: "청소년" | "청년" | "중년";
  income: "고소득층" | "중소득층" | "저소득층";
  student: "예" | "아니요";
  credit: "좋음" | "아주 좋음";
  buy: boolean;
};
type FieldState = "idle" | "correct" | "wrong";

const DATA: Row[] = [
  { id: 1, age: "청소년", income: "고소득층", student: "아니요", credit: "좋음", buy: false },
  { id: 2, age: "청소년", income: "고소득층", student: "아니요", credit: "아주 좋음", buy: false },
  { id: 3, age: "청년", income: "고소득층", student: "아니요", credit: "좋음", buy: true },
  { id: 4, age: "중년", income: "중소득층", student: "아니요", credit: "좋음", buy: true },
  { id: 5, age: "중년", income: "저소득층", student: "예", credit: "좋음", buy: true },
  { id: 6, age: "중년", income: "저소득층", student: "예", credit: "아주 좋음", buy: false },
  { id: 7, age: "청년", income: "저소득층", student: "예", credit: "아주 좋음", buy: true },
  { id: 8, age: "청소년", income: "중소득층", student: "아니요", credit: "좋음", buy: false },
  { id: 9, age: "청소년", income: "저소득층", student: "예", credit: "좋음", buy: true },
  { id: 10, age: "중년", income: "중소득층", student: "예", credit: "좋음", buy: true },
  { id: 11, age: "청소년", income: "중소득층", student: "예", credit: "아주 좋음", buy: true },
  { id: 12, age: "청년", income: "중소득층", student: "아니요", credit: "아주 좋음", buy: true },
  { id: 13, age: "청년", income: "고소득층", student: "예", credit: "좋음", buy: true },
  { id: 14, age: "중년", income: "중소득층", student: "아니요", credit: "아주 좋음", buy: false },
];

const ATTR_META: Record<Attr, { label: string; formula: string; question: string }> = {
  age: { label: "나이", formula: "age", question: "나이는?" },
  income: { label: "수입", formula: "income", question: "수입은?" },
  student: { label: "학생 여부", formula: "student", question: "학생입니까?" },
  credit: { label: "신용등급", formula: "credit", question: "신용등급은?" },
};

const STEPS = ["데이터 관찰", "나이 계산", "후보 비교", "노드 확인", "청소년 분할", "중년 분할", "트리 활용", "핵심 정리", "확인 퀴즈", "실습 완료"];
const STEP_TITLES = [
  "구매 여부 데이터에서 규칙을 찾아봅시다",
  "나이로 분할한 정보이득을 계산합니다",
  "모든 후보를 비교하고 첫 질문을 선택합니다",
  "어떤 노드를 더 분할해야 할까요?",
  "청소년 노드의 두 번째 질문을 찾습니다",
  "중년 노드의 질문을 독립적으로 찾습니다",
  "완성된 의사결정 트리를 사용해 봅시다",
  "질문과 분할을 중심으로 핵심 개념을 정리합니다",
  "다섯 문제로 오늘 배운 내용을 확인합니다",
  "정보이득 기반 의사결정 트리 실습을 완료했습니다",
];
const STEP_DESCRIPTIONS = [
  "14개 데이터를 관찰한 뒤 정보이득으로 의사결정 트리를 직접 완성합니다.",
  "주어진 그룹별 엔트로피를 이용해 분할 후 엔트로피와 정보이득을 빈칸에 입력하세요.",
  "분할 후 엔트로피에서 각 후보의 정보이득을 계산한 뒤 가장 큰 속성을 선택하세요.",
  "순수한 노드는 종료하고 구매·비구매가 섞인 노드만 선택하세요.",
  "이제 전체 데이터가 아니라 청소년 5개 데이터만 새로운 D로 보고 다시 계산합니다.",
  "청소년 가지와 별개로 중년 5개 데이터에 가장 알맞은 질문을 계산합니다.",
  "완성된 트리의 질문을 따라 새로운 고객의 구매 여부를 예측하세요.",
  "실습에서 사용한 여섯 가지 핵심 원리를 한 번 더 연결해 보세요.",
  "오답은 바로 다시 풀 수 있습니다. 모든 문제를 해결하면 점수가 표시됩니다.",
  "핵심 정리를 다시 보거나 전체 실습을 처음부터 다시 시작할 수 있습니다.",
];

const ROOT_VALUES: Record<Attr, { after: number; gain: number }> = {
  age: { after: 0.693, gain: 0.247 },
  income: { after: 0.911, gain: 0.029 },
  student: { after: 0.789, gain: 0.151 },
  credit: { after: 0.892, gain: 0.048 },
};
const YOUTH_VALUES: Record<Exclude<Attr, "age">, { after: number; gain: number }> = {
  income: { after: 0.400, gain: 0.571 },
  student: { after: 0, gain: 0.971 },
  credit: { after: 0.952, gain: 0.019 },
};
const SENIOR_VALUES: Record<Exclude<Attr, "age">, { after: number; gain: number }> = {
  income: { after: 0.952, gain: 0.019 },
  student: { after: 0.952, gain: 0.019 },
  credit: { after: 0, gain: 0.971 },
};

function log2(value: number) { return Math.log(value) / Math.log(2); }
function entropy(rows: Row[]) {
  if (!rows.length) return 0;
  const yes = rows.filter((row) => row.buy).length;
  return [yes, rows.length - yes].reduce((sum, count) => {
    if (!count) return sum;
    const probability = count / rows.length;
    return sum - probability * log2(probability);
  }, 0);
}
function n(value: number) { return value.toFixed(3); }
function parseAnswer(value: string) { return Number(value.trim().replace(",", ".")); }
function isClose(value: string, target: number) {
  const parsed = parseAnswer(value);
  return Number.isFinite(parsed) && Math.abs(parsed - target) <= 0.0016;
}

function DotLegend() {
  return <div className="dot-legend" aria-label="범례"><span><i className="dot buy" /> 구매</span><span><i className="dot no-buy" /> 비구매</span></div>;
}
function Dots({ rows, max = 14 }: { rows: Row[]; max?: number }) {
  return <div className="dots" style={{ maxWidth: Math.min(max, 7) * 25 }} aria-label={`구매 ${rows.filter((r) => r.buy).length}명, 비구매 ${rows.filter((r) => !r.buy).length}명`}>{rows.map((row) => <i key={row.id} className={`dot ${row.buy ? "buy" : "no-buy"}`} />)}</div>;
}
function Count({ rows }: { rows: Row[] }) {
  const yes = rows.filter((row) => row.buy).length;
  return <span>구매 <b>{yes}</b> · 비구매 <b>{rows.length - yes}</b></span>;
}
function DataTable({ rows, compact = false }: { rows: Row[]; compact?: boolean }) {
  return <div className={`table-wrap ${compact ? "compact" : ""}`}><table><thead><tr><th>번호</th><th>나이</th><th>수입</th><th>학생 여부</th><th>신용등급</th><th>구매 여부</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.id}</td><td>{row.age}</td><td>{row.income}</td><td>{row.student}</td><td>{row.credit}</td><td className={row.buy ? "label-buy" : "label-no"}>{row.buy ? "구매" : "비구매"}</td></tr>)}</tbody></table></div>;
}

function NumberField({ id, label, value, onChange, state, disabled = false }: { id: string; label: string; value: string; onChange: (value: string) => void; state: FieldState; disabled?: boolean }) {
  return <label className={`answer-field ${state}`} htmlFor={id}><span>{label}</span><span className="input-shell"><input id={id} aria-label={label || id} type="text" inputMode="decimal" placeholder="0.000" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} aria-invalid={state === "wrong"} /><i>{state === "correct" ? "✓" : state === "wrong" ? "!" : ""}</i></span></label>;
}

function Feedback({ kind, children }: { kind: "good" | "bad" | "hint"; children: React.ReactNode }) {
  return <div className={`exercise-feedback ${kind}`} role="status"><b>{kind === "good" ? "✓" : kind === "bad" ? "다시 확인" : "힌트"}</b><span>{children}</span></div>;
}

function IntroStage({ onStart }: { onStart: () => void }) {
  return <div className="intro-grid"><section className="card intro-table"><div className="section-kicker">학습 데이터 · 14개</div><DataTable rows={DATA} /></section><aside className="intro-side"><div className="card mix-card"><div className="section-kicker">현재 정답 분포</div><Dots rows={DATA} /><div className="big-count"><Count rows={DATA} /></div><div className="entropy-value"><span>분할 전 엔트로피</span><b><i>h</i>(D) = 0.940</b></div></div><div className="card mission-card"><span>오늘의 미션</span><h3>구매·비구매를 가장 명확하게 나누는 질문을 직접 계산해 보세요.</h3><div className="feature-chips">{(["age", "income", "student", "credit"] as Attr[]).map((attr) => <i key={attr}>{ATTR_META[attr].label}</i>)}</div><button type="button" className="start-button" onClick={onStart}>실습 시작 →</button></div></aside></div>;
}

function AgeCalculation({ solved, onComplete, onAttempt }: { solved: boolean; onComplete: () => void; onAttempt: () => void }) {
  const [after, setAfter] = useState(solved ? "0.693" : "");
  const [gainValue, setGainValue] = useState(solved ? "0.247" : "");
  const [states, setStates] = useState<{ after: FieldState; gain: FieldState }>(solved ? { after: "correct", gain: "correct" } : { after: "idle", gain: "idle" });
  const [attempts, setAttempts] = useState(0);
  const [complete, setComplete] = useState(solved);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (complete) return;
    onAttempt();
    const afterCorrect = isClose(after, 0.693) || isClose(after, 0.694);
    const gainCorrect = isClose(gainValue, 0.247) || isClose(gainValue, 0.246);
    setStates({ after: afterCorrect ? "correct" : "wrong", gain: gainCorrect ? "correct" : "wrong" });
    if (afterCorrect && gainCorrect) { setComplete(true); onComplete(); }
    else setAttempts((value) => value + 1);
  };
  const reveal = () => { setAfter("0.693"); setGainValue("0.247"); setStates({ after: "correct", gain: "correct" }); setComplete(true); onComplete(); };

  return <div className="exercise-layout"><section className="card data-column"><div className="section-kicker">나이로 분할</div><div className="dataset-summary"><Dots rows={DATA} /><Count rows={DATA} /><span><i>h</i>(D) = <b>0.940</b></span></div><div className="group-given-grid"><div><b>청소년</b><span>5/14</span><small>구매 2 · 비구매 3</small><strong><i>h</i> = 0.971</strong></div><div><b>청년</b><span>4/14</span><small>구매 4 · 비구매 0</small><strong><i>h</i> = 0</strong></div><div><b>중년</b><span>5/14</span><small>구매 3 · 비구매 2</small><strong><i>h</i> = 0.971</strong></div></div></section><form className="card worksheet" onSubmit={submit}><div className="worksheet-head"><div><span className="section-kicker">계산 문제 1</span><h2>가중평균 엔트로피 계산</h2></div><span className="points">빈칸 2개</span></div><div className="formula-box"><div className="formula-label">분할 후 엔트로피</div><div className="formula-row math"><span><i>h</i><sub>age</sub>(D)</span><b>=</b><span className="formula-expression">5/14 × 0.971 + 4/14 × 0 + 5/14 × 0.971</span></div><NumberField id="age-after" label="h_age(D) =" value={after} onChange={setAfter} state={states.after} disabled={complete} /></div><div className="formula-box"><div className="formula-label">정보이득</div><div className="formula-row math"><span>Gain(D, age)</span><b>=</b><span>0.940 − <u>{after || "h_age(D)"}</u></span></div><NumberField id="age-gain" label="Gain(D, age) =" value={gainValue} onChange={setGainValue} state={states.gain} disabled={complete} /></div>{complete ? <Feedback kind="good">나이로 분할하면 불확실성이 <b>0.247</b>만큼 감소합니다.</Feedback> : attempts > 0 ? <Feedback kind={attempts >= 2 ? "hint" : "bad"}>{attempts === 1 ? "세 그룹의 엔트로피에 각 그룹의 비율을 곱했는지 확인하세요." : attempts === 2 ? "분할 후 엔트로피는 약 0.693~0.694입니다. 이를 0.940에서 빼세요." : "반올림 차이를 허용합니다. 0.693 또는 0.694를 입력할 수 있습니다."}</Feedback> : null}<div className="worksheet-actions">{attempts >= 3 && !complete && <button type="button" className="text-button" onClick={reveal}>정답으로 계속하기</button>}<button type="submit" className="primary" disabled={complete}>{complete ? "계산 완료" : "정답 확인"}</button></div></form></div>;
}

function RootComparison({ solved, onComplete, onAttempt }: { solved: boolean; onComplete: () => void; onAttempt: () => void }) {
  const attrs: Attr[] = ["age", "income", "student", "credit"];
  const [values, setValues] = useState<Record<string, string>>(solved ? { income: "0.029", student: "0.151", credit: "0.048" } : {});
  const [states, setStates] = useState<Record<string, FieldState>>(solved ? { income: "correct", student: "correct", credit: "correct" } : {});
  const [numbersDone, setNumbersDone] = useState(solved);
  const [attempts, setAttempts] = useState(0);
  const [selected, setSelected] = useState<Attr | null>(solved ? "age" : null);
  const [selectionFeedback, setSelectionFeedback] = useState<"idle" | "wrong" | "correct">(solved ? "correct" : "idle");

  const checkNumbers = (event: FormEvent) => {
    event.preventDefault();
    onAttempt();
    const nextStates: Record<string, FieldState> = {};
    (["income", "student", "credit"] as Attr[]).forEach((attr) => { nextStates[attr] = isClose(values[attr] || "", ROOT_VALUES[attr].gain) ? "correct" : "wrong"; });
    setStates(nextStates);
    if (Object.values(nextStates).every((state) => state === "correct")) setNumbersDone(true);
    else { setAttempts((value) => value + 1); setNumbersDone(false); }
  };
  const reveal = () => { setValues({ income: "0.029", student: "0.151", credit: "0.048" }); setStates({ income: "correct", student: "correct", credit: "correct" }); setNumbersDone(true); };
  const choose = (attr: Attr) => {
    if (!numbersDone) return;
    setSelected(attr);
    if (attr === "age") { setSelectionFeedback("correct"); onComplete(); }
    else { setSelectionFeedback("wrong"); onAttempt(); }
  };

  return <div className="comparison-stage"><form className="card compare-worksheet" onSubmit={checkNumbers}><div className="worksheet-head"><div><span className="section-kicker">계산 문제 2</span><h2>나머지 후보의 정보이득</h2></div><span className="points">Gain = 0.940 − h<sub>A</sub>(D)</span></div><div className="comparison-table"><div className="comparison-row header"><span>후보 속성</span><span>분할 후 엔트로피</span><span>정보이득</span></div>{attrs.map((attr) => <div className={`comparison-row ${selected === attr ? "selected" : ""}`} key={attr}><b>{ATTR_META[attr].label}</b><span className="math"><i>h</i><sub>{ATTR_META[attr].formula}</sub>(D) = {n(ROOT_VALUES[attr].after)}</span>{attr === "age" ? <strong className="locked-answer">0.247 <i>✓</i></strong> : <NumberField id={`root-${attr}`} label="" value={values[attr] || ""} onChange={(value) => setValues((current) => ({ ...current, [attr]: value }))} state={states[attr] || "idle"} disabled={numbersDone} />}</div>)}</div>{numbersDone ? <Feedback kind="good">계산이 완료되었습니다. 이제 가장 큰 정보이득을 직접 선택하세요.</Feedback> : attempts > 0 ? <Feedback kind={attempts >= 2 ? "hint" : "bad"}>{attempts === 1 ? "각 행에서 0.940 − 분할 후 엔트로피를 계산하세요." : "예: 수입은 0.940 − 0.911 = 0.029입니다."}</Feedback> : null}<div className="worksheet-actions">{attempts >= 3 && !numbersDone && <button type="button" className="text-button" onClick={reveal}>정답으로 계속하기</button>}<button type="submit" className="primary" disabled={numbersDone}>{numbersDone ? "계산 완료" : "계산값 확인"}</button></div></form><section className={`card choice-panel ${numbersDone ? "ready" : "locked"}`}><span className="section-kicker">분할속성 선택</span><h2>정보이득이 가장 큰 속성은?</h2><p>{numbersDone ? "막대의 길이와 계산값을 비교해 하나를 선택하세요." : "먼저 왼쪽의 계산을 완료하세요."}</p><div className="gain-bars">{attrs.map((attr) => <button type="button" key={attr} disabled={!numbersDone} onClick={() => choose(attr)} className={`${selected === attr ? "selected" : ""} ${selectionFeedback === "correct" && attr === "age" ? "correct" : ""}`}><span>{ATTR_META[attr].label}</span><i><em style={{ width: numbersDone ? `${(ROOT_VALUES[attr].gain / 0.247) * 100}%` : "0%" }} /></i><b>{numbersDone ? n(ROOT_VALUES[attr].gain) : "?"}</b></button>)}</div>{selectionFeedback === "wrong" && <Feedback kind="bad">선택한 속성보다 정보이득이 큰 속성이 있습니다.</Feedback>}{selectionFeedback === "correct" && <Feedback kind="good"><b>나이</b>를 첫 번째 분할속성으로 선택했습니다.</Feedback>}</section></div>;
}

function StatusBox({ title, rows, action, selectable = false, selected = false, onClick }: { title: string; rows: Row[]; action: string; selectable?: boolean; selected?: boolean; onClick?: () => void }) {
  const pure = entropy(rows) === 0;
  const content = <><b>{title}</b><Dots rows={rows} /><Count rows={rows} /><small><i>h</i> = {n(entropy(rows))}</small><span className="status-action">{action}</span>{selectable && <i className="select-mark">{selected ? "✓" : ""}</i>}</>;
  return selectable ? <button type="button" onClick={onClick} className={`status-box selectable ${pure ? "pure" : "mixed"} ${selected ? "selected" : ""}`}>{content}</button> : <div className={`status-box ${pure ? "pure" : "mixed"}`}>{content}</div>;
}

function NodeInspection({ solved, onComplete, onAttempt }: { solved: boolean; onComplete: () => void; onAttempt: () => void }) {
  const youth = DATA.filter((row) => row.age === "청소년");
  const young = DATA.filter((row) => row.age === "청년");
  const senior = DATA.filter((row) => row.age === "중년");
  const [selected, setSelected] = useState<Set<string>>(new Set(solved ? ["청소년", "중년"] : []));
  const [feedback, setFeedback] = useState<"idle" | "wrong" | "correct">(solved ? "correct" : "idle");
  const toggle = (name: string) => { if (feedback === "correct") return; setSelected((current) => { const next = new Set(current); if (next.has(name)) next.delete(name); else next.add(name); return next; }); setFeedback("idle"); };
  const check = () => { onAttempt(); const correct = selected.size === 2 && selected.has("청소년") && selected.has("중년"); if (correct) { setFeedback("correct"); onComplete(); } else setFeedback("wrong"); };
  return <div className="card node-stage"><div className="gain-ribbon">Gain(D, age) = <b>0.247</b><span>최대 → 나이 적용</span></div><div className="root-node">나이는?</div><p className="node-instruction">구매·비구매가 섞여 있어 <b>추가 분할이 필요한 노드를 모두 선택</b>하세요.</p><div className="three-branches"><StatusBox title="청소년" rows={youth} action={feedback === "correct" ? "추가 분할 필요" : "?"} selectable selected={selected.has("청소년")} onClick={() => toggle("청소년")} /><StatusBox title="청년" rows={young} action={feedback === "correct" ? "구매로 분류 · 종료" : "?"} selectable selected={selected.has("청년")} onClick={() => toggle("청년")} /><StatusBox title="중년" rows={senior} action={feedback === "correct" ? "추가 분할 필요" : "?"} selectable selected={selected.has("중년")} onClick={() => toggle("중년")} /></div><div className="node-check-area">{feedback === "wrong" && <Feedback kind="bad">엔트로피가 0인 노드는 더 나눌 필요가 없습니다.</Feedback>}{feedback === "correct" && <Feedback kind="good">청년은 모두 구매이므로 종료합니다. 청소년과 중년 노드만 다시 계산합니다.</Feedback>}<button type="button" className="primary" onClick={check} disabled={feedback === "correct"}>선택 확인</button></div></div>;
}

type BranchAttr = Exclude<Attr, "age">;
function BranchExercise({ kind, rows, solved, onComplete, onAttempt }: { kind: "youth" | "senior"; rows: Row[]; solved: boolean; onComplete: () => void; onAttempt: () => void }) {
  const valuesMap = kind === "youth" ? YOUTH_VALUES : SENIOR_VALUES;
  const correctAttr: BranchAttr = kind === "youth" ? "student" : "credit";
  const attrs: BranchAttr[] = ["income", "student", "credit"];
  const [answers, setAnswers] = useState<Record<string, string>>(solved ? Object.fromEntries(attrs.map((attr) => [attr, n(valuesMap[attr].gain)])) : {});
  const [states, setStates] = useState<Record<string, FieldState>>(solved ? Object.fromEntries(attrs.map((attr) => [attr, "correct"])) : {});
  const [numbersDone, setNumbersDone] = useState(solved);
  const [attempts, setAttempts] = useState(0);
  const [selected, setSelected] = useState<BranchAttr | null>(solved ? correctAttr : null);
  const [selectionFeedback, setSelectionFeedback] = useState<"idle" | "wrong" | "correct">(solved ? "correct" : "idle");
  const checkNumbers = (event: FormEvent) => { event.preventDefault(); onAttempt(); const nextStates: Record<string, FieldState> = {}; attrs.forEach((attr) => { nextStates[attr] = isClose(answers[attr] || "", valuesMap[attr].gain) ? "correct" : "wrong"; }); setStates(nextStates); if (Object.values(nextStates).every((state) => state === "correct")) setNumbersDone(true); else { setNumbersDone(false); setAttempts((value) => value + 1); } };
  const reveal = () => { setAnswers(Object.fromEntries(attrs.map((attr) => [attr, n(valuesMap[attr].gain)]))); setStates(Object.fromEntries(attrs.map((attr) => [attr, "correct"]))); setNumbersDone(true); };
  const choose = (attr: BranchAttr) => { if (!numbersDone) return; setSelected(attr); if (attr === correctAttr) { setSelectionFeedback("correct"); onComplete(); } else { setSelectionFeedback("wrong"); onAttempt(); } };
  return <div className="exercise-layout branch-layout"><section className="card data-column"><div className="section-kicker">현재 데이터 · {rows.length}개</div><h3>{kind === "youth" ? "청소년 데이터 Dᵧₒᵤₜₕ" : "중년 데이터 Dₛₑₙᵢₒᵣ"}</h3><div className="dataset-summary"><Dots rows={rows} /><Count rows={rows} /><span><i>h</i>(D) = <b>0.971</b></span></div><DataTable rows={rows} compact /></section><form className="card worksheet branch-worksheet" onSubmit={checkNumbers}><div className="worksheet-head"><div><span className="section-kicker">하위 노드 계산</span><h2>남은 후보의 정보이득</h2></div><span className="points">Gain = 0.971 − h<sub>A</sub>(D)</span></div><div className="branch-answer-list">{attrs.map((attr) => <div className={`branch-answer-row ${states[attr] || ""}`} key={attr}><div><b>{ATTR_META[attr].label}</b><span className="math"><i>h</i><sub>{ATTR_META[attr].formula}</sub>(D) = {n(valuesMap[attr].after)}</span></div><span className="subtract">0.971 − {n(valuesMap[attr].after)} =</span><NumberField id={`${kind}-${attr}`} label="" value={answers[attr] || ""} onChange={(value) => setAnswers((current) => ({ ...current, [attr]: value }))} state={states[attr] || "idle"} disabled={numbersDone} /></div>)}</div>{numbersDone ? <div className="branch-choice"><h3>가장 큰 정보이득을 선택하세요</h3><div>{attrs.map((attr) => <button type="button" key={attr} onClick={() => choose(attr)} className={`${selected === attr ? "selected" : ""} ${selectionFeedback === "correct" && attr === correctAttr ? "correct" : ""}`}><span>{ATTR_META[attr].label}</span><b>{n(valuesMap[attr].gain)}</b></button>)}</div></div> : attempts > 0 ? <Feedback kind={attempts >= 2 ? "hint" : "bad"}>{attempts === 1 ? "각 후보에서 0.971 − 분할 후 엔트로피를 계산하세요." : `분할 후 엔트로피가 0이면 현재 엔트로피 0.971을 모두 제거합니다.`}</Feedback> : null}{selectionFeedback === "wrong" && <Feedback kind="bad">현재 노드에서 정보이득이 가장 큰 속성을 다시 선택하세요.</Feedback>}{selectionFeedback === "correct" && <Feedback kind="good"><b>{ATTR_META[correctAttr].label}</b>를 선택했습니다. 두 하위 노드의 엔트로피가 모두 0입니다.</Feedback>}<div className="worksheet-actions">{attempts >= 3 && !numbersDone && <button type="button" className="text-button" onClick={reveal}>정답으로 계속하기</button>}<button type="submit" className="primary" disabled={numbersDone}>{numbersDone ? "계산 완료" : "계산값 확인"}</button></div></form></div>;
}

function TreeDiagram() {
  return <div className="tree-diagram final"><div className="tree-root">나이는?</div><div className="tree-columns"><section className="tree-branch"><span className="edge-label">청소년</span><div className="decision">학생입니까?</div><div className="leaves two"><div><small>예</small><b className="leaf buy-leaf">구매</b></div><div><small>아니요</small><b className="leaf no-leaf">비구매</b></div></div></section><section className="tree-branch direct"><span className="edge-label">청년</span><b className="leaf buy-leaf">구매</b></section><section className="tree-branch"><span className="edge-label">중년</span><div className="decision">신용등급은?</div><div className="leaves two"><div><small>좋음</small><b className="leaf buy-leaf">구매</b></div><div><small>아주 좋음</small><b className="leaf no-leaf">비구매</b></div></div></section></div></div>;
}

function FinalPractice({ solved, onComplete, onAttempt }: { solved: boolean; onComplete: () => void; onAttempt: () => void }) {
  const [answers, setAnswers] = useState<Record<string, boolean>>(solved ? { a: false, b: true } : {});
  const [checked, setChecked] = useState(solved);
  const correct = answers.a === false && answers.b === true;
  const select = (question: string, value: boolean) => { setAnswers((current) => ({ ...current, [question]: value })); setChecked(false); };
  const check = () => { setChecked(true); onAttempt(); if (correct) onComplete(); };
  return <div className="final-layout"><TreeDiagram /><section className="card final-practice"><span className="section-kicker">마지막 확인</span><h2>새로운 고객을 분류하세요</h2><div className="prediction-card"><span>고객 A</span><p><b>청소년</b> · 학생 여부 <b>아니요</b></p><div><button type="button" onClick={() => select("a", true)} className={answers.a === true ? "selected" : ""}>구매</button><button type="button" onClick={() => select("a", false)} className={answers.a === false ? "selected" : ""}>비구매</button></div></div><div className="prediction-card"><span>고객 B</span><p><b>중년</b> · 신용등급 <b>좋음</b></p><div><button type="button" onClick={() => select("b", true)} className={answers.b === true ? "selected" : ""}>구매</button><button type="button" onClick={() => select("b", false)} className={answers.b === false ? "selected" : ""}>비구매</button></div></div><button type="button" className="primary full" disabled={solved || answers.a === undefined || answers.b === undefined} onClick={check}>{solved ? "분류 완료" : "예측 확인"}</button>{checked && (correct ? <Feedback kind="good">정답입니다. 정보이득으로 완성한 트리를 따라 두 고객을 올바르게 분류했습니다.</Feedback> : <Feedback kind="bad">각 고객의 나이 가지에서 어떤 두 번째 질문으로 이동하는지 확인하세요.</Feedback>)}<div className="key-formula">Gain(D, A) = <i>h</i>(D) − <i>h</i><sub>A</sub>(D)</div></section></div>;
}

function SummaryStage({ onContinue, quizCompleted }: { onContinue: () => void; quizCompleted: boolean }) {
  const concepts = [
    { number: "01", title: "의사결정나무", body: <><b>질문</b>을 던지고, 답에 따라 데이터를 <strong>분할</strong>하는 모델입니다.</> },
    { number: "02", title: "엔트로피", body: <>데이터의 <b>불확실성</b>을 나타냅니다.</> },
    { number: "03", title: "분할 후 엔트로피", body: <>각 하위 집단의 <b>크기를 고려한 가중평균</b>입니다.</> },
    { number: "04", title: "정보이득", body: <>분할 전 엔트로피에서 <b>분할 후 엔트로피를 뺀 값</b>입니다.</> },
    { number: "05", title: "ID3의 선택", body: <>정보이득이 <b>가장 큰 속성</b>을 분할속성으로 선택합니다.</> },
    { number: "06", title: "분할 종료", body: <>하위 노드의 엔트로피가 <b>0</b>이면 해당 가지의 분할을 종료합니다.</> },
  ];
  return <div className="summary-stage"><section className="summary-hero card"><span className="section-kicker">오늘의 핵심 구조</span><h2>좋은 <em>질문</em>으로 데이터를<br /><strong>분할</strong>해 불확실성을 줄입니다</h2><div className="summary-flow" aria-label="의사결정나무의 핵심 흐름"><span>데이터</span><i>→</i><b>질문</b><i>→</i><strong>분할</strong><i>→</i><span>불확실성 감소</span></div></section><section className="summary-concepts">{concepts.map((concept) => <article className="card concept-card" key={concept.number}><span>{concept.number}</span><div><h3>{concept.title}</h3><p>{concept.body}</p></div></article>)}</section><div className="summary-callout"><span>수업 핵심어</span><b>질문</b><i>×</i><strong>분할</strong><p>각 노드에서 어떤 질문을 선택하느냐에 따라 분할 결과와 트리의 구조가 달라집니다.</p></div><button type="button" className="primary summary-next" onClick={onContinue}>{quizCompleted ? "완료 화면으로 돌아가기 →" : "확인 퀴즈 풀기 →"}</button></div>;
}

type QuizOption = { label: string; correct?: boolean };
type QuizItem = { id: number; kind: "fill" | "choice"; question: string; options?: QuizOption[]; explanation: string; };

const QUIZ_ITEMS: QuizItem[] = [
  { id: 1, kind: "fill", question: "의사결정나무는 각 노드에서 데이터에 대한 (     )을 던지고, 답에 따라 데이터를 여러 집단으로 (     )한다.", explanation: "각 노드는 질문을 하나 선택하고, 그 답을 기준으로 데이터를 분할합니다." },
  { id: 2, kind: "choice", question: "엔트로피가 나타내는 것은 무엇인가요?", options: [{ label: "데이터의 개수" }, { label: "데이터의 불확실성", correct: true }, { label: "트리의 깊이" }, { label: "속성의 개수" }], explanation: "엔트로피는 데이터에 여러 클래스가 얼마나 섞여 있는지, 즉 불확실성의 정도를 나타냅니다." },
  { id: 3, kind: "choice", question: "정보이득을 올바르게 설명한 것은 무엇인가요?", options: [{ label: "분할 후 엔트로피 − 분할 전 엔트로피" }, { label: "분할 전 엔트로피 + 분할 후 엔트로피" }, { label: "분할 전 엔트로피 − 분할 후 엔트로피", correct: true }, { label: "하위 노드 엔트로피의 단순합" }], explanation: "정보이득은 분할을 통해 불확실성이 얼마나 감소했는지를 나타냅니다." },
  { id: 4, kind: "choice", question: "ID3가 분할속성으로 선택하는 것은 무엇인가요?", options: [{ label: "정보이득이 가장 큰 속성", correct: true }, { label: "엔트로피가 가장 큰 속성" }, { label: "값의 종류가 가장 많은 속성" }, { label: "가장 먼저 기록된 속성" }], explanation: "ID3는 현재 노드에서 후보별 정보이득을 비교하고 가장 큰 속성을 선택합니다." },
  { id: 5, kind: "choice", question: "하위 노드의 엔트로피가 0이면 왜 분할을 종료할까요?", options: [{ label: "데이터가 너무 많기 때문에" }, { label: "더 사용할 속성이 없기 때문에" }, { label: "모든 데이터가 같은 클래스로 순수하기 때문에", correct: true }, { label: "정보이득을 계산할 수 없기 때문에" }], explanation: "엔트로피 0은 모든 데이터의 클래스가 같아 불확실성이 없다는 뜻이므로 더 나눌 필요가 없습니다." },
];

function QuizStage({ onComplete }: { onComplete: (score: number) => void }) {
  const [index, setIndex] = useState(0);
  const [firstBlank, setFirstBlank] = useState("");
  const [secondBlank, setSecondBlank] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [attempted, setAttempted] = useState(false);
  const [score, setScore] = useState(0);
  const item = QUIZ_ITEMS[index];
  const normalize = (value: string) => value.replace(/\s+/g, "").trim();
  const canSubmit = item.kind === "fill" ? Boolean(firstBlank.trim() && secondBlank.trim()) : selected !== null;
  const check = (event: FormEvent) => {
    event.preventDefault();
    const isCorrect = item.kind === "fill" ? normalize(firstBlank) === "질문" && normalize(secondBlank) === "분할" : Boolean(item.options?.[selected ?? -1]?.correct);
    if (isCorrect && !attempted) setScore((value) => value + 1);
    setAttempted(true);
    setFeedback(isCorrect ? "correct" : "wrong");
  };
  const nextQuestion = () => {
    if (index === QUIZ_ITEMS.length - 1) { onComplete(score); return; }
    setIndex((value) => value + 1); setFirstBlank(""); setSecondBlank(""); setSelected(null); setFeedback("idle"); setAttempted(false);
  };
  const retryChoice = (optionIndex: number) => { setSelected(optionIndex); if (feedback === "wrong") setFeedback("idle"); };
  const retryBlank = (setter: (value: string) => void, value: string) => { setter(value); if (feedback === "wrong") setFeedback("idle"); };
  return <div className="quiz-layout"><aside className="card quiz-status"><span className="section-kicker">확인 퀴즈</span><div className="quiz-number"><b>{index + 1}</b><span>/ {QUIZ_ITEMS.length}</span></div><div className="quiz-mini-progress">{QUIZ_ITEMS.map((quiz, quizIndex) => <i key={quiz.id} className={quizIndex < index ? "done" : quizIndex === index ? "current" : ""}>{quizIndex < index ? "✓" : quiz.id}</i>)}</div><p>정답을 맞히면 다음 문제로 이동합니다.</p><small>점수는 첫 제출 기준입니다.</small></aside><form className="card quiz-card" onSubmit={check}><span className="quiz-label">문제 {item.id}</span><h2>{item.question}</h2>{item.kind === "fill" ? <div className="fill-answer"><label htmlFor="quiz-blank-one"><span>첫 번째 빈칸</span><input id="quiz-blank-one" value={firstBlank} onChange={(event) => retryBlank(setFirstBlank, event.target.value)} placeholder="핵심 단어 입력" disabled={feedback === "correct"} autoComplete="off" /></label><label htmlFor="quiz-blank-two"><span>두 번째 빈칸</span><input id="quiz-blank-two" value={secondBlank} onChange={(event) => retryBlank(setSecondBlank, event.target.value)} placeholder="핵심 단어 입력" disabled={feedback === "correct"} autoComplete="off" /></label></div> : <div className="quiz-options">{item.options?.map((option, optionIndex) => <button type="button" key={option.label} onClick={() => retryChoice(optionIndex)} disabled={feedback === "correct"} className={`${selected === optionIndex ? "selected" : ""} ${feedback === "correct" && option.correct ? "correct" : ""} ${feedback === "wrong" && selected === optionIndex ? "wrong" : ""}`}><i>{String.fromCharCode(65 + optionIndex)}</i><span>{option.label}</span></button>)}</div>}{feedback === "correct" && <Feedback kind="good"><b>정답입니다.</b> {item.explanation}</Feedback>}{feedback === "wrong" && <Feedback kind="bad">아쉽습니다. 답을 바꾼 뒤 다시 확인해 보세요.</Feedback>}<div className="quiz-actions">{feedback === "correct" ? <button type="button" className="primary" onClick={nextQuestion}>{index === QUIZ_ITEMS.length - 1 ? "결과 보기 →" : "다음 문제 →"}</button> : <button type="submit" className="primary" disabled={!canSubmit}>{feedback === "wrong" ? "다시 확인" : "정답 확인"}</button>}</div></form></div>;
}

function CompletionStage({ score, onSummary, onReset }: { score: number; onSummary: () => void; onReset: () => void }) {
  const message = score === QUIZ_ITEMS.length ? "핵심 개념을 정확히 이해했습니다!" : score >= 3 ? "핵심 흐름을 잘 이해했습니다!" : "핵심 정리를 한 번 더 보면 더 확실해집니다.";
  return <div className="completion-stage"><section className="card completion-card"><div className="completion-mark">✓</div><span className="section-kicker">실습 완료</span><h2>{message}</h2><p>정보이득을 계산해 트리를 완성하고, 질문과 분할의 원리까지 확인했습니다.</p><div className="score-board"><span>확인 퀴즈 점수</span><b>{score}<small> / {QUIZ_ITEMS.length}</small></b><div><i style={{ width: `${(score / QUIZ_ITEMS.length) * 100}%` }} /></div></div><div className="completion-keywords"><span>기억할 두 단어</span><b>질문</b><i>→</i><strong>분할</strong></div><div className="completion-actions"><button type="button" className="secondary" onClick={onSummary}>핵심 정리 다시 보기</button><button type="button" className="primary" onClick={onReset}>실습 처음부터 다시 하기</button></div></section></div>;
}

export function AppShell() {
  const [step, setStep] = useState(0);
  const [solved, setSolved] = useState<Set<number>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const youth = useMemo(() => DATA.filter((row) => row.age === "청소년"), []);
  const senior = useMemo(() => DATA.filter((row) => row.age === "중년"), []);
  const complete = (index: number) => setSolved((current) => new Set(current).add(index));
  const unlocked = (index: number) => index === 0 || solved.has(index - 1);
  const reset = () => { setStep(0); setSolved(new Set()); setAttempts(0); setQuizScore(0); };
  const next = () => { if (solved.has(step)) setStep((current) => Math.min(STEPS.length - 1, current + 1)); };

  return <main><header className="app-header"><div className="brand-mark">ID3</div><div><b>의사결정 트리 실습</b><span>계산하고 선택하며 트리 완성하기</span></div><div className="attempt-counter"><small>확인 횟수</small><b>{attempts}</b></div><button type="button" className="reset" onClick={reset}>처음부터</button></header><nav className="progress ten" aria-label="실습 진행 단계">{STEPS.map((label, index) => <button type="button" key={label} disabled={!unlocked(index)} onClick={() => unlocked(index) && setStep(index)} className={index === step ? "current" : solved.has(index) ? "done" : ""}><i>{solved.has(index) ? "✓" : index + 1}</i><span>{label}</span></button>)}</nav><div className="stage-heading"><span>STEP {step + 1}</span><h1>{STEP_TITLES[step]}</h1><p>{STEP_DESCRIPTIONS[step]}</p></div><div className="stage-content">{step === 0 && <IntroStage onStart={() => { complete(0); setStep(1); }} />}{step === 1 && <AgeCalculation solved={solved.has(1)} onComplete={() => complete(1)} onAttempt={() => setAttempts((value) => value + 1)} />}{step === 2 && <RootComparison solved={solved.has(2)} onComplete={() => complete(2)} onAttempt={() => setAttempts((value) => value + 1)} />}{step === 3 && <NodeInspection solved={solved.has(3)} onComplete={() => complete(3)} onAttempt={() => setAttempts((value) => value + 1)} />}{step === 4 && <BranchExercise key="youth" kind="youth" rows={youth} solved={solved.has(4)} onComplete={() => complete(4)} onAttempt={() => setAttempts((value) => value + 1)} />}{step === 5 && <BranchExercise key="senior" kind="senior" rows={senior} solved={solved.has(5)} onComplete={() => complete(5)} onAttempt={() => setAttempts((value) => value + 1)} />}{step === 6 && <FinalPractice solved={solved.has(6)} onComplete={() => complete(6)} onAttempt={() => setAttempts((value) => value + 1)} />}{step === 7 && <SummaryStage quizCompleted={solved.has(8)} onContinue={() => { complete(7); setStep(solved.has(8) ? 9 : 8); }} />}{step === 8 && <QuizStage onComplete={(score) => { setQuizScore(score); setSolved((current) => new Set(current).add(8).add(9)); setStep(9); }} />}{step === 9 && <CompletionStage score={quizScore} onSummary={() => setStep(7)} onReset={reset} />}</div>{step > 0 && step < 7 && <footer className="controls"><button type="button" className="secondary" onClick={() => setStep((current) => Math.max(0, current - 1))}>← 이전</button><span>{step + 1} / {STEPS.length}</span><button type="button" className="primary" onClick={next} disabled={!solved.has(step)}>{solved.has(step) ? "다음 단계 →" : "문제를 먼저 해결하세요"}</button></footer>}{step <= 6 && <DotLegend />}</main>;
}

export default function Home() { return <AppShell />; }
