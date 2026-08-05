"use client";

import { useState, type FormEvent, type ReactNode } from "react";

type Phase = "summary" | "setup" | "quiz" | "complete";
type ClassName = "A2" | "B1" | "C1";
type CadetName = "이준 생도" | "맹주본 생도";
type Option = { label: ReactNode; correct?: boolean; formula?: boolean };
type CadetAssignments = Partial<Record<number, CadetName>>;
type Item = {
  id: number;
  kind: "choice" | "order";
  instruction?: string;
  question: string;
  options?: Option[];
  explanation: string;
  scored?: boolean;
};

const CLASS_OPTIONS: ClassName[] = ["A2", "B1", "C1"];
const CADET_NAMES: CadetName[] = ["이준 생도", "맹주본 생도"];

const ID3_STEPS = [
  { key: "attribute", icon: "속성", label: "후보 속성" },
  { key: "gain", icon: "Gain", label: "정보이득 계산" },
  { key: "max", icon: "MAX", label: "최댓값 선택" },
  { key: "split", icon: "분할", label: "데이터 분할" },
];

const CONCEPTS: Array<{
  title: string;
  symbol: ReactNode;
  body: ReactNode;
  detail: ReactNode;
}> = [
  {
    title: "엔트로피",
    symbol: <i className="math">h(D)</i>,
    body: <b>실제값의 섞임</b>,
    detail: "불확실성 · 순수 노드",
  },
  {
    title: "분할 후 엔트로피",
    symbol: (
      <i className="math">h<sub className="math-variable">A</sub>(D)</i>
    ),
    body: <b>하위 집합 · 가중평균</b>,
    detail: "데이터 비율 반영",
  },
  {
    title: "정보이득",
    symbol: <i className="math">Gain(D, A)</i>,
    body: <b>분할 전 − 분할 후</b>,
    detail: "정보이득이 큰 속성 선택",
  },
];

const INITIAL_ORDER = [
  ID3_STEPS[1],
  ID3_STEPS[3],
  ID3_STEPS[0],
  ID3_STEPS[2],
];

const ASSIGNED_ITEM_IDS = [1, 3];

function shuffledCadets() {
  const cadets = [...CADET_NAMES];
  for (let index = cadets.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cadets[index], cadets[swapIndex]] = [cadets[swapIndex], cadets[index]];
  }
  return cadets;
}

function assignCadets(): CadetAssignments {
  const assignments: CadetAssignments = {};
  const pool = shuffledCadets();
  for (const itemId of ASSIGNED_ITEM_IDS) {
    assignments[itemId] = pool.shift();
  }
  return assignments;
}

const ITEMS: Item[] = [
  {
    id: 1,
    kind: "choice",
    instruction: "다음 설명이 옳으면 O, 옳지 않으면 X를 선택하세요.",
    question:
      "의사결정 트리는 루트 노드에서 선택한 하나의 속성만 모든 하위 노드에서 반복해서 사용한다.",
    options: [
      { label: "O" },
      { label: "X", correct: true },
    ],
    explanation:
      "혼합된 하위 노드에서는 남은 후보 속성의 정보이득을 다시 비교하여 새로운 질문을 선택합니다.",
  },
  {
    id: 2,
    kind: "choice",
    question: "엔트로피 h(D)가 의미하는 것은 무엇인가요?",
    options: [
      { label: "현재 데이터에 포함된 행의 수" },
      {
        label: "데이터 집합 D에서 실제값이 섞여 있는 정도",
        correct: true,
      },
      { label: "의사결정 트리의 전체 깊이" },
      { label: "현재 사용할 수 있는 후보 속성의 수" },
    ],
    explanation:
      "엔트로피 h(D)는 데이터 집합 D에서 실제값이 섞여 있는 정도, 즉 분류 결과의 불확실성을 나타냅니다.",
  },
  {
    id: 3,
    kind: "choice",
    question: "정보이득 Gain(D, A)의 계산식으로 옳은 것은 무엇인가요?",
    options: [
      {
        label: (
          <span className="formula">
            h<sub className="math-variable">A</sub>(D) − h(D)
          </span>
        ),
        formula: true,
      },
      {
        label: (
          <span className="formula">
            h(D) + h<sub className="math-variable">A</sub>(D)
          </span>
        ),
        formula: true,
      },
      {
        label: (
          <span className="formula">
            h(D) − h<sub className="math-variable">A</sub>(D)
          </span>
        ),
        correct: true,
        formula: true,
      },
      {
        label: <span className="formula">∑ h(D<sub>하위 집합</sub>)</span>,
        formula: true,
      },
    ],
    explanation:
      "정보이득은 분할 전 엔트로피에서 분할 후 가중평균 엔트로피를 뺀 값입니다.",
  },
  {
    id: 4,
    kind: "choice",
    question:
      "ID3 알고리즘이 현재 노드에서 사용할 분할 속성을 선택하는 기준으로 옳은 것은 무엇인가요?",
    options: [
      {
        label: "후보 속성 중 정보이득이 가장 큰 속성",
        correct: true,
      },
      { label: "분할 후 엔트로피가 가장 큰 속성" },
      { label: "속성값의 종류가 가장 많은 속성" },
      { label: "데이터 표에서 가장 왼쪽에 있는 속성" },
    ],
    explanation:
      "ID3는 후보 속성의 정보이득을 비교하고, 가장 큰 속성을 현재 노드의 질문으로 선택합니다.",
  },
  {
    id: 5,
    kind: "choice",
    question: "현재 노드의 h(D) = 0일 때 리프 노드로 확정하는 이유는 무엇인가요?",
    options: [
      { label: "현재 노드의 데이터가 너무 많기 때문에" },
      { label: "후보 속성을 모두 사용했기 때문에" },
      {
        label: "모든 실제값이 같아 분류 결과가 하나로 결정되기 때문에",
        correct: true,
      },
      { label: "정보이득이 항상 음수가 되기 때문에" },
    ],
    explanation:
      "h(D) = 0이면 노드 안의 모든 실제값이 같아 분류 결과가 하나로 결정됩니다. 따라서 더 나눌 필요가 없어 리프 노드로 확정합니다.",
  },
];

const QUIZ_ITEM_COUNT = ITEMS.filter((item) => item.scored !== false).length;

function Summary({ start }: { start: () => void }) {
  return (
    <section className="summary-page formula-summary-page">
      <div className="summary-title">
        <span>의사결정 트리 핵심 공식</span>
      </div>

      <div className="summary-body formula-summary">
        <div className="formula-concepts">
          <article className="formula-card entropy-card">
            <div className="formula-card-title">
              <span>01</span>
              <h2>엔트로피</h2>
            </div>
            <div className="summary-formula" aria-label="엔트로피 공식">
              <span className="formula equation">
                h(D) = −
                <span className="sigma">
                  <b>∑</b>
                  <sup>c</sup>
                  <sub>i = 1</sub>
                </span>
                p<sub>i</sub> log<sub>2</sub> p<sub>i</sub>
              </span>
            </div>
          </article>

          <article className="formula-card weighted-card">
            <div className="formula-card-title">
              <span>02</span>
              <h2>가중평균 엔트로피</h2>
            </div>
            <div className="summary-formula" aria-label="가중평균 엔트로피 공식">
              <span className="formula equation weighted-equation">
                h<sub className="math-variable">A</sub>(D) =
                <span className="sigma sigma-wide">
                  <b>∑</b>
                  <sub>v ∈ Values(A)</sub>
                </span>
                <span className="fraction">
                  <span>|D<sub>v</sub>|</span>
                  <span>|D|</span>
                </span>
                h(D<sub>v</sub>)
              </span>
            </div>
          </article>

          <article className="formula-card gain-card">
            <div className="formula-card-title">
              <span>03</span>
              <h2>정보이득</h2>
            </div>
            <div className="summary-formula" aria-label="정보이득 공식">
              <span className="formula equation">
                Gain(D, A) = h(D) − h<sub className="math-variable">A</sub>(D)
              </span>
            </div>
          </article>
        </div>
      </div>

      <div className="summary-action">
        <button onClick={start}>확인 퀴즈 풀기 →</button>
      </div>
    </section>
  );
}

function CadetSetup({
  initialClass,
  start,
  back,
}: {
  initialClass: ClassName;
  start: (className: ClassName) => void;
  back: () => void;
}) {
  const [selectedClass, setSelectedClass] = useState<ClassName>(initialClass);

  function submit(event: FormEvent) {
    event.preventDefault();
    start(selectedClass);
  }

  return (
    <section className="cadet-setup-page">
      <div className="cadet-setup-card">
        <div className="setup-heading">
          <h1>교반 선택</h1>
        </div>

        <form className="cadet-count-form" onSubmit={submit}>
          <label>수업 교반</label>
          <div
            role="group"
            aria-label="수업 교반 선택"
            style={{
              height: "auto",
              padding: 10,
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
              overflow: "visible",
            }}
          >
            {CLASS_OPTIONS.map((className) => {
              const selected = selectedClass === className;
              return (
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedClass(className)}
                  key={className}
                  style={{
                    minHeight: 64,
                    border: selected ? "2px solid #183d69" : "2px solid #c7d7e5",
                    color: selected ? "#ffffff" : "#183d69",
                    background: selected ? "#183d69" : "#ffffff",
                    borderRadius: 10,
                    fontSize: 25,
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                >
                  {className}
                </button>
              );
            })}
          </div>
          <button type="submit">퀴즈 시작 →</button>
        </form>

        <div className="cadet-preview">
          <div>
            <span>선택한 교반</span>
            <strong>{selectedClass}</strong>
          </div>
        </div>

        <button className="setup-back" type="button" onClick={back}>
          ← 핵심 정리로 돌아가기
        </button>
      </div>
    </section>
  );
}

function Quiz({
  finish,
  back,
  assignments,
  className,
}: {
  finish: (score: number) => void;
  back: () => void;
  assignments: CadetAssignments;
  className: ClassName;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [order, setOrder] = useState([...INITIAL_ORDER]);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">(
    "idle",
  );
  const [score, setScore] = useState(0);
  const item = ITEMS[index];
  const assignedCadet = assignments[item.id];
  const ready = item.kind === "choice" ? selected !== null : true;
  const isGroupItem = item.scored === false;

  function check(event: FormEvent) {
    event.preventDefault();
    const ok =
      item.kind === "choice"
        ? Boolean(item.options?.[selected ?? -1]?.correct)
        : order.every((step, stepIndex) => step === ID3_STEPS[stepIndex]);

    if (ok && !isGroupItem) setScore((value) => value + 1);
    setFeedback(ok ? "correct" : "wrong");
  }

  function moveStep(from: number, direction: -1 | 1) {
    const to = from + direction;
    if (to < 0 || to >= order.length || feedback === "correct") return;
    setOrder((current) => {
      const nextOrder = [...current];
      [nextOrder[from], nextOrder[to]] = [nextOrder[to], nextOrder[from]];
      return nextOrder;
    });
    if (feedback === "wrong") setFeedback("idle");
  }

  function next() {
    if (index === ITEMS.length - 1) {
      finish(score);
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
    setFeedback("idle");
  }

  return (
    <section className="quiz-page">
      <div className="quiz-toolbar">
        <div className="quiz-progress-label">
          <span>{isGroupItem ? "다 같이 풀기" : `${className} 교반 · 확인 퀴즈`}</span>
          <strong>
            {isGroupItem ? (
              "공동"
            ) : (
              <>
                {index + 1}<small> / {QUIZ_ITEM_COUNT}</small>
              </>
            )}
          </strong>
        </div>
        <nav>
          {ITEMS.map((question, questionIndex) => (
            <i
              className={
                questionIndex < index
                  ? "done"
                  : questionIndex === index
                    ? "current"
                    : ""
              }
              key={question.id}
              title={question.scored === false ? "다 같이 풀기" : `문제 ${question.id}`}
            >
              {questionIndex < index ? "✓" : question.id}
            </i>
          ))}
        </nav>
        <button type="button" onClick={back}>← 핵심 정리</button>
      </div>

      <form className="quiz-card" onSubmit={check}>
        <span>{isGroupItem ? "다 같이 풀기" : `문제 ${item.id}`}</span>
        {assignedCadet && !isGroupItem && (
          <div className="quiz-cadet">
            <span>담당 생도</span>
            <strong>{assignedCadet}</strong>
          </div>
        )}
        {item.instruction && (
          <p className="quiz-instruction">{item.instruction}</p>
        )}
        <h1 className={item.instruction ? "question-statement" : ""}>
          {item.question}
        </h1>

        {item.kind === "choice" ? (
          <div
            className={`options ${item.id === 1 ? "ox-options" : ""} ${
              item.id === 4 ? "item-four-options" : ""
            } ${item.id === 5 ? "item-five-options" : ""}`}
          >
            {item.options?.map((option, optionIndex) => (
              <button
                type="button"
                className={`${selected === optionIndex ? "selected" : ""} ${
                  feedback === "correct" && option.correct ? "correct" : ""
                } ${
                  feedback === "wrong" && selected === optionIndex ? "wrong" : ""
                } ${option.formula ? "formula-option" : ""}`}
                onClick={() => {
                  setSelected(optionIndex);
                  if (feedback === "wrong") setFeedback("idle");
                }}
                disabled={feedback === "correct"}
                key={`${item.id}-${optionIndex}`}
              >
                <i>{String.fromCharCode(65 + optionIndex)}</i>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="order-list">
            {order.map((step, stepIndex) => (
              <div className={`order-step tone-${step.key}`} key={step.key}>
                <b>{step.icon}</b>
                <div className="order-copy">
                  <small>현재 {stepIndex + 1}번째</small>
                  <span>{step.label}</span>
                </div>
                <div className="order-controls">
                  <button
                    type="button"
                    onClick={() => moveStep(stepIndex, -1)}
                    disabled={stepIndex === 0 || feedback === "correct"}
                    aria-label={`${step.label} 위로 이동`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(stepIndex, 1)}
                    disabled={
                      stepIndex === order.length - 1 || feedback === "correct"
                    }
                    aria-label={`${step.label} 아래로 이동`}
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {feedback === "correct" && (
          <div className="feedback good" role="status" aria-live="polite">
            <b>{isGroupItem ? "✓ 올바른 순서입니다." : "✓ 정답입니다."}</b>
            <span>{item.explanation}</span>
          </div>
        )}
        {feedback === "wrong" && (
          <div className="feedback bad" role="status" aria-live="polite">
            <b>다시 확인</b>
            <span>
              {item.kind === "order"
                ? "화살표로 순서를 바꾼 뒤 다시 확인해 보세요."
                : "답을 바꾼 뒤 다시 확인해 보세요."}
            </span>
          </div>
        )}

        <div className="quiz-action">
          {feedback === "correct" ? (
            <button type="button" onClick={next}>
              {index === ITEMS.length - 1 ? "결과 보기 →" : "다음 문제 →"}
            </button>
          ) : (
            <button disabled={!ready}>
              {feedback === "wrong" ? "다시 확인" : "정답 확인"}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function Complete({
  score,
  summary,
  retry,
}: {
  score: number;
  summary: () => void;
  retry: () => void;
}) {
  const message =
    score === QUIZ_ITEM_COUNT
      ? "핵심 개념을 정확히 이해했습니다"
      : score >= 4
        ? "핵심 흐름을 이해했습니다"
        : "핵심 정리를 다시 확인해 보세요";

  return (
    <section className="complete-page">
      <div className="complete-card">
        <div className="mark">✓</div>
        <span>학습 완료</span>
        <h1>{message}</h1>
        <p>5개 확인 퀴즈를 통해 엔트로피와 정보이득의 핵심 개념을 확인했습니다.</p>
        <div className="score">
          <span>확인 퀴즈 점수</span>
          <b>
            {score}
            <small> / {QUIZ_ITEM_COUNT}</small>
          </b>
          <div>
            <i style={{ width: `${(score / QUIZ_ITEM_COUNT) * 100}%` }} />
          </div>
        </div>
        <div className="complete-actions">
          <button onClick={summary}>핵심 정리 다시 보기</button>
          <button className="primary" onClick={retry}>
            퀴즈 다시 풀기
          </button>
        </div>
      </div>
    </section>
  );
}

export default function SummaryQuiz() {
  const [phase, setPhase] = useState<Phase>("summary");
  const [score, setScore] = useState(0);
  const [selectedClass, setSelectedClass] = useState<ClassName>("A2");
  const [assignments, setAssignments] = useState<CadetAssignments>({});

  function beginQuiz(className: ClassName) {
    setSelectedClass(className);
    setAssignments(assignCadets());
    setPhase("quiz");
  }

  function retryQuiz() {
    setAssignments(assignCadets());
    setPhase("quiz");
  }

  return (
    <main>
      <header className="app-header">
        <div className="brand">
          <span>DT</span>
          <div>
            <small>인공지능 입문</small>
            <strong>8. 의사결정 트리</strong>
          </div>
        </div>
        <nav>
          <span className={phase === "summary" ? "active" : ""}>핵심 정리</span>
          <i>→</i>
          <span className={phase === "setup" ? "active" : ""}>교반 선택</span>
          <i>→</i>
          <span className={phase === "quiz" ? "active" : ""}>확인 퀴즈</span>
          <i>→</i>
          <span className={phase === "complete" ? "active" : ""}>완료</span>
        </nav>
      </header>
      {phase === "summary" && <Summary start={() => setPhase("setup")} />}
      {phase === "setup" && (
        <CadetSetup
          initialClass={selectedClass}
          start={beginQuiz}
          back={() => setPhase("summary")}
        />
      )}
      {phase === "quiz" && (
        <Quiz
          assignments={assignments}
          className={selectedClass}
          back={() => setPhase("summary")}
          finish={(finalScore) => {
            setScore(finalScore);
            setPhase("complete");
          }}
        />
      )}
      {phase === "complete" && (
        <Complete
          score={score}
          summary={() => setPhase("summary")}
          retry={retryQuiz}
        />
      )}
    </main>
  );
}
