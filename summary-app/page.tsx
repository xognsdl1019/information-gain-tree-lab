"use client";

import { useState, type FormEvent, type ReactNode } from "react";

type Phase = "summary" | "setup" | "quiz" | "complete";
type Option = { label: ReactNode; correct?: boolean; formula?: boolean };
type CadetAssignments = Partial<Record<number, number>>;
type Item = {
  id: number;
  kind: "choice" | "order";
  question: string;
  options?: Option[];
  explanation: string;
};

const ID3_STEPS = [
  { key: "attribute", icon: "속성", label: "현재 노드의 후보 속성 확인" },
  { key: "gain", icon: "Gain", label: "후보 속성별 정보이득 계산" },
  { key: "max", icon: "MAX", label: "정보이득이 가장 큰 속성 선택" },
  { key: "split", icon: "분할", label: "선택한 속성값에 따라 데이터 분할" },
];

const CONCEPTS: Array<{
  title: string;
  symbol: ReactNode;
  body: ReactNode;
  detail: ReactNode;
}> = [
  {
    title: "엔트로피",
    symbol: <i className="math">ℎ(𝒟)</i>,
    body: (
      <>
        데이터 집합 <i className="math">𝒟</i>에서 실제값이{" "}
        <b>섞여 있는 정도</b>
      </>
    ),
    detail: (
      <>
        분류 결과의 불확실성 · 모든 실제값이 같으면{" "}
        <i className="math">ℎ(𝒟) = 0</i>
      </>
    ),
  },
  {
    title: "분할 후 엔트로피",
    symbol: (
      <i className="math">ℎₐ(𝒟)</i>
    ),
    body: (
      <>
        분할된 하위 집합의 엔트로피를 <b>데이터 비율</b>로 가중평균
      </>
    ),
    detail: "값이 작을수록 실제값이 더 명확하게 나뉨",
  },
  {
    title: "정보이득",
    symbol: <i className="math">𝐺𝑎𝑖𝑛(𝒟, 𝒜)</i>,
    body: (
      <>
        분할 전보다 <b>불확실성이 감소한 양</b>
      </>
    ),
    detail: (
      <i className="math">𝐺𝑎𝑖𝑛(𝒟, 𝒜) = ℎ(𝒟) − ℎₐ(𝒟)</i>
    ),
  },
];

const INITIAL_ORDER = [
  ID3_STEPS[1],
  ID3_STEPS[3],
  ID3_STEPS[0],
  ID3_STEPS[2],
];

const ASSIGNED_ITEM_IDS = [1, 3, 6];

function shuffledCadets(count: number) {
  const cadets = Array.from({ length: count }, (_, index) => index + 1);
  for (let index = cadets.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cadets[index], cadets[swapIndex]] = [cadets[swapIndex], cadets[index]];
  }
  return cadets;
}

function assignCadets(count: number): CadetAssignments {
  const assignments: CadetAssignments = {};
  let pool = shuffledCadets(count);
  for (const itemId of ASSIGNED_ITEM_IDS) {
    if (!pool.length) pool = shuffledCadets(count);
    assignments[itemId] = pool.shift();
  }
  return assignments;
}

const ITEMS: Item[] = [
  {
    id: 1,
    kind: "choice",
    question:
      "다음 설명에서 옳은 것을 고르세요.\nㄱ. 의사결정 트리는 현재 노드에서 하나의 후보 속성을 질문으로 선택한다.\nㄴ. 선택한 속성의 값에 따라 데이터를 하위 노드로 나눈다.",
    options: [
      { label: "ㄱ만 옳다" },
      { label: "ㄴ만 옳다" },
      { label: "ㄱ과 ㄴ이 모두 옳다", correct: true },
      { label: "ㄱ과 ㄴ이 모두 옳지 않다" },
    ],
    explanation:
      "후보 속성 하나가 현재 노드의 질문이 되고, 그 속성값에 따라 데이터가 하위 노드로 나뉩니다.",
  },
  {
    id: 2,
    kind: "choice",
    question: "엔트로피 ℎ(𝒟)가 의미하는 것은 무엇인가요?",
    options: [
      { label: "현재 데이터에 포함된 행의 수" },
      {
        label: "데이터 집합 𝒟에서 실제값이 섞여 있는 정도",
        correct: true,
      },
      { label: "의사결정 트리의 전체 깊이" },
      { label: "현재 사용할 수 있는 후보 속성의 수" },
    ],
    explanation:
      "엔트로피 ℎ(𝒟)는 데이터 집합 𝒟에서 실제값이 섞여 있는 정도, 즉 분류 결과의 불확실성을 나타냅니다.",
  },
  {
    id: 3,
    kind: "choice",
    question: "정보이득 𝐺𝑎𝑖𝑛(𝒟, 𝒜)의 계산식으로 옳은 것은 무엇인가요?",
    options: [
      {
        label: <i className="math">ℎₐ(𝒟) − ℎ(𝒟)</i>,
        formula: true,
      },
      {
        label: <i className="math">ℎ(𝒟) + ℎₐ(𝒟)</i>,
        formula: true,
      },
      {
        label: <i className="math">ℎ(𝒟) − ℎₐ(𝒟)</i>,
        correct: true,
        formula: true,
      },
      {
        label: <i className="math">∑ ℎ(𝒟ᵥ)</i>,
        formula: true,
      },
    ],
    explanation:
      "정보이득은 분할 전 엔트로피에서 분할 후 가중평균 엔트로피를 뺀 값입니다.",
  },
  {
    id: 4,
    kind: "choice",
    question: "ID3는 어떤 속성을 현재 노드의 질문으로 선택하나요?",
    options: [
      { label: "정보이득이 가장 큰 속성", correct: true },
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
    question: "현재 노드의 ℎ(𝒟) = 0일 때 리프 노드로 확정하는 이유는 무엇인가요?",
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
      "ℎ(𝒟) = 0이면 노드 안의 모든 실제값이 같아 분류 결과가 하나로 결정됩니다. 따라서 더 나눌 필요가 없어 리프 노드로 확정합니다.",
  },
  {
    id: 6,
    kind: "order",
    question: "ID3 알고리즘에서 분할 속성을 선택하고 데이터를 나누는 과정을 순서대로 배열하세요.",
    explanation:
      "실제값이 섞인 하위 노드에서는 이 네 단계를 반복하고, ℎ(𝒟) = 0이면 리프 노드로 확정합니다.",
  },
];

function Summary({ start }: { start: () => void }) {
  return (
    <section className="summary-page">
      <div className="summary-title">
        <span>의사결정 트리 핵심 정리</span>
      </div>

      <div className="summary-body">
        <aside className="id3-card">
          <div className="id3-heading">
            <div>
              <span>ID3 알고리즘</span>
              <h2>분할 속성 선택과 데이터 분할</h2>
            </div>
          </div>

          <ol>
            {ID3_STEPS.map((step, index) => (
              <li className={`tone-${step.key}`} key={step.key}>
                <b>{step.icon}</b>
                <div>
                  <small>{index + 1}단계</small>
                  <strong>{step.label}</strong>
                </div>
              </li>
            ))}
          </ol>

          <div className="id3-notes">
            <div className="repeat">
              <span>반복</span>
              <p>실제값이 섞인 하위 노드 · 1~4단계</p>
            </div>
            <div className="stop">
              <span>종료</span>
              <strong className="math">ℎ(𝒟) = 0</strong>
              <p>리프 노드 확정</p>
            </div>
          </div>
        </aside>

        <div className="concepts">
          {CONCEPTS.map((concept) => (
            <article key={concept.title}>
              <div className="concept-heading">
                <h2>{concept.title}</h2>
                <strong>{concept.symbol}</strong>
              </div>
              <p>{concept.body}</p>
              <small>{concept.detail}</small>
            </article>
          ))}
        </div>
      </div>

      <div className="summary-action">
        <button onClick={start}>확인 퀴즈 풀기 →</button>
      </div>
    </section>
  );
}

function CadetSetup({
  initialCount,
  start,
  back,
}: {
  initialCount: number;
  start: (count: number) => void;
  back: () => void;
}) {
  const [input, setInput] = useState(String(initialCount));
  const count = Math.max(1, Math.min(200, Number.parseInt(input, 10) || 1));

  function submit(event: FormEvent) {
    event.preventDefault();
    start(count);
  }

  return (
    <section className="cadet-setup-page">
      <div className="cadet-setup-card">
        <div className="setup-heading">
          <h1>참여 인원 설정</h1>
        </div>

        <form className="cadet-count-form" onSubmit={submit}>
          <label htmlFor="summary-cadet-count">참여 인원</label>
          <div>
            <input
              id="summary-cadet-count"
              type="number"
              min="1"
              max="200"
              inputMode="numeric"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <span>명</span>
          </div>
          <button type="submit">퀴즈 시작 →</button>
        </form>

        <div className="cadet-preview">
          <div>
            <span>번호 범위</span>
            <strong>
              1번–{count}번
            </strong>
          </div>
          <div className="cadet-number-list">
            {Array.from({ length: Math.min(count, 18) }, (_, index) => (
              <b key={index + 1}>{index + 1}</b>
            ))}
            {count > 18 && (
              <>
                <i>…</i>
                <b>{count}</b>
              </>
            )}
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
}: {
  finish: (score: number) => void;
  back: () => void;
  assignments: CadetAssignments;
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
  const ready =
    item.kind === "choice" ? selected !== null : true;

  function check(event: FormEvent) {
    event.preventDefault();
    const ok =
      item.kind === "choice"
        ? Boolean(item.options?.[selected ?? -1]?.correct)
        : order.every((step, stepIndex) => step === ID3_STEPS[stepIndex]);

    if (ok) setScore((value) => value + 1);
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
          <span>확인 퀴즈</span>
          <strong>
            {index + 1}<small> / {ITEMS.length}</small>
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
            >
              {questionIndex < index ? "✓" : question.id}
            </i>
          ))}
        </nav>
        <button type="button" onClick={back}>← 핵심 정리</button>
      </div>

      <form className="quiz-card" onSubmit={check}>
        <span>문제 {item.id}</span>
        {assignedCadet && (
          <div className="quiz-cadet">
            <span>담당 생도</span>
            <strong>{assignedCadet}번</strong>
          </div>
        )}
        <h1>{item.question}</h1>

        {item.kind === "choice" ? (
          <div className="options">
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
          <div className="feedback good">
            <b>✓ 정답입니다.</b>
            <span>{item.explanation}</span>
          </div>
        )}
        {feedback === "wrong" && (
          <div className="feedback bad">
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
    score === ITEMS.length
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
        <p>엔트로피, 가중평균 엔트로피, 정보이득과 ID3의 흐름을 확인했습니다.</p>
        <div className="score">
          <span>확인 퀴즈 점수</span>
          <b>
            {score}
            <small> / {ITEMS.length}</small>
          </b>
          <div>
            <i style={{ width: `${(score / ITEMS.length) * 100}%` }} />
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
  const [cadetCount, setCadetCount] = useState(10);
  const [assignments, setAssignments] = useState<CadetAssignments>({});

  function beginQuiz(count: number) {
    setCadetCount(count);
    setAssignments(assignCadets(count));
    setPhase("quiz");
  }

  function retryQuiz() {
    setAssignments(assignCadets(cadetCount));
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
          <span className={phase === "setup" ? "active" : ""}>인원 설정</span>
          <i>→</i>
          <span className={phase === "quiz" ? "active" : ""}>확인 퀴즈</span>
          <i>→</i>
          <span className={phase === "complete" ? "active" : ""}>완료</span>
        </nav>
      </header>
      {phase === "summary" && <Summary start={() => setPhase("setup")} />}
      {phase === "setup" && (
        <CadetSetup
          initialCount={cadetCount}
          start={beginQuiz}
          back={() => setPhase("summary")}
        />
      )}
      {phase === "quiz" && (
        <Quiz
          assignments={assignments}
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
