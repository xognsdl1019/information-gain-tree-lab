"use client";

import { useState, type FormEvent, type ReactNode } from "react";

type Phase = "summary" | "setup" | "quiz" | "complete";
type Option = { label: string; correct?: boolean };
type CadetAssignments = Partial<Record<number, number>>;
type Item = {
  id: number;
  kind: "fill" | "choice" | "order";
  question: string;
  options?: Option[];
  explanation: string;
};

const CONCEPTS: Array<{
  title: string;
  symbol: ReactNode;
  body: ReactNode;
  detail: ReactNode;
}> = [
  {
    title: "엔트로피",
    symbol: <i>H(D)</i>,
    body: (
      <>
        현재 노드의 <b>클래스 분포</b>에 대한 불확실성
      </>
    ),
    detail: "한 클래스만 남으면 H(D) = 0",
  },
  {
    title: "가중평균 엔트로피",
    symbol: (
      <i>
        H<sub>A</sub>(D)
      </i>
    ),
    body: (
      <>
        하위 노드의 엔트로피를 <b>데이터 비율</b>에 따라 가중평균한 값
      </>
    ),
    detail: "속성 A로 분할한 이후의 불확실성",
  },
  {
    title: "정보이득",
    symbol: <i>Gain(D, A)</i>,
    body: (
      <>
        속성 A로 분할했을 때 <b>감소한 엔트로피의 양</b>
      </>
    ),
    detail: (
      <>
        Gain(D, A) = H(D) − H<sub>A</sub>(D)
      </>
    ),
  },
];

const ID3_STEPS = [
  "후보 속성 설정",
  "후보 속성별 정보이득 계산",
  "정보이득이 가장 큰 속성을 분할 기준으로 선택",
  "선택한 속성값에 따라 데이터 분할",
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
    kind: "fill",
    question:
      "의사결정나무는 각 노드에서 하나의 (     )을 선택하고, 그 기준에 따라 데이터를 하위 노드로 (     )한다.",
    explanation:
      "질문은 현재 노드의 분할 기준이며, 속성값에 따라 데이터가 하위 노드로 분할됩니다.",
  },
  {
    id: 2,
    kind: "choice",
    question: "엔트로피가 나타내는 것은 무엇인가요?",
    options: [
      { label: "현재 노드의 데이터 개수" },
      { label: "현재 노드의 클래스 분포에 대한 불확실성", correct: true },
      { label: "의사결정나무의 깊이" },
      { label: "후보 속성의 개수" },
    ],
    explanation:
      "엔트로피는 현재 노드의 클래스 분포에 대한 불확실성을 나타냅니다.",
  },
  {
    id: 3,
    kind: "choice",
    question: "정보이득의 계산식으로 옳은 것은 무엇인가요?",
    options: [
      { label: "H_A(D) − H(D)" },
      { label: "H(D) + H_A(D)" },
      { label: "H(D) − H_A(D)", correct: true },
      { label: "하위 노드 엔트로피의 단순합" },
    ],
    explanation:
      "정보이득은 분할 전 엔트로피에서 분할 후 가중평균 엔트로피를 뺀 값입니다.",
  },
  {
    id: 4,
    kind: "choice",
    question: "ID3는 현재 노드의 분할 속성을 어떻게 결정하나요?",
    options: [
      { label: "후보 중 정보이득이 가장 큰 속성", correct: true },
      { label: "후보 중 엔트로피가 가장 큰 속성" },
      { label: "속성값의 종류가 가장 많은 속성" },
      { label: "데이터에 가장 먼저 기록된 속성" },
    ],
    explanation:
      "ID3는 후보 속성별 정보이득을 비교하여 가장 큰 속성을 분할 기준으로 선택합니다.",
  },
  {
    id: 5,
    kind: "choice",
    question: "현재 노드의 엔트로피가 0이면 왜 분할을 종료할까요?",
    options: [
      { label: "데이터가 너무 많기 때문에" },
      { label: "더 사용할 속성이 없기 때문에" },
      { label: "한 클래스만 남아 불확실성이 없기 때문에", correct: true },
      { label: "정보이득을 계산할 수 없기 때문에" },
    ],
    explanation:
      "H(D) = 0인 노드는 한 클래스만 포함하므로 리프 노드로 확정합니다.",
  },
  {
    id: 6,
    kind: "order",
    question: "ID3 알고리즘의 4단계를 올바른 순서로 배열하세요.",
    explanation:
      "클래스가 섞인 하위 노드에서는 같은 4단계를 반복하고, H(D) = 0이면 리프 노드로 확정합니다.",
  },
];

function Summary({ start }: { start: () => void }) {
  return (
    <section className="summary-page">
      <div className="summary-title">
        <span>의사결정나무 핵심 정리</span>
      </div>

      <div className="summary-body">
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

        <aside className="id3-card">
          <div className="id3-heading">
            <div>
              <span>ID3 알고리즘</span>
              <h2>분할 속성 결정과 반복</h2>
            </div>
          </div>

          <ol>
            {ID3_STEPS.map((step, index) => (
              <li key={step}>
                <b>{index + 1}</b>
                <strong>{step}</strong>
              </li>
            ))}
          </ol>

          <div className="id3-notes">
            <div className="repeat">
              <span>반복</span>
              <p>클래스가 섞인 하위 노드에서 1~4단계 반복</p>
            </div>
            <div className="stop">
              <span>종료</span>
              <strong>H(D) = 0</strong>
              <p>리프 노드로 확정</p>
            </div>
          </div>
        </aside>
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
          <h1>생도 배정</h1>
        </div>

        <form className="cadet-count-form" onSubmit={submit}>
          <label htmlFor="summary-cadet-count">참여 생도 수</label>
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
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [order, setOrder] = useState([...INITIAL_ORDER]);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">(
    "idle",
  );
  const [score, setScore] = useState(0);
  const item = ITEMS[index];
  const assignedCadet = assignments[item.id];
  const ready =
    item.kind === "fill"
      ? Boolean(a.trim() && b.trim())
      : item.kind === "choice"
        ? selected !== null
        : true;
  const norm = (value: string) => value.replace(/\s+/g, "").trim();

  function check(event: FormEvent) {
    event.preventDefault();
    const ok =
      item.kind === "fill"
        ? norm(a) === "질문" && norm(b) === "분할"
        : item.kind === "choice"
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
    setA("");
    setB("");
    setSelected(null);
    setFeedback("idle");
  }

  return (
    <section className="quiz-page">
      <aside className="status">
        <span>확인 퀴즈</span>
        <div>
          <b>{index + 1}</b>
          <em>/ {ITEMS.length}</em>
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
        <button onClick={back}>← 핵심 정리</button>
      </aside>

      <form className="quiz-card" onSubmit={check}>
        <span>문제 {item.id}</span>
        {assignedCadet && (
          <div className="quiz-cadet">
            <span>담당 생도</span>
            <strong>{assignedCadet}번</strong>
          </div>
        )}
        <h1>{item.question}</h1>

        {item.kind === "fill" ? (
          <div className="blanks">
            <label>
              <span>첫 번째 빈칸</span>
              <input
                value={a}
                onChange={(event) => {
                  setA(event.target.value);
                  if (feedback === "wrong") setFeedback("idle");
                }}
                placeholder="핵심 단어 입력"
                disabled={feedback === "correct"}
              />
            </label>
            <label>
              <span>두 번째 빈칸</span>
              <input
                value={b}
                onChange={(event) => {
                  setB(event.target.value);
                  if (feedback === "wrong") setFeedback("idle");
                }}
                placeholder="핵심 단어 입력"
                disabled={feedback === "correct"}
              />
            </label>
          </div>
        ) : item.kind === "choice" ? (
          <div className="options">
            {item.options?.map((option, optionIndex) => (
              <button
                type="button"
                className={`${selected === optionIndex ? "selected" : ""} ${
                  feedback === "correct" && option.correct ? "correct" : ""
                } ${
                  feedback === "wrong" && selected === optionIndex ? "wrong" : ""
                }`}
                onClick={() => {
                  setSelected(optionIndex);
                  if (feedback === "wrong") setFeedback("idle");
                }}
                disabled={feedback === "correct"}
                key={option.label}
              >
                <i>{String.fromCharCode(65 + optionIndex)}</i>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="order-list">
            {order.map((step, stepIndex) => (
              <div className="order-step" key={step}>
                <b>{stepIndex + 1}</b>
                <span>{step}</span>
                <div className="order-controls">
                  <button
                    type="button"
                    onClick={() => moveStep(stepIndex, -1)}
                    disabled={stepIndex === 0 || feedback === "correct"}
                    aria-label={`${step} 위로 이동`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(stepIndex, 1)}
                    disabled={
                      stepIndex === order.length - 1 || feedback === "correct"
                    }
                    aria-label={`${step} 아래로 이동`}
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
          <span>ID3</span>
          <div>
            <small>인공지능 개론</small>
            <strong>8. 핵심 정리 및 확인 퀴즈</strong>
          </div>
        </div>
        <nav>
          <span className={phase === "summary" ? "active" : ""}>핵심 정리</span>
          <i>→</i>
          <span className={phase === "setup" ? "active" : ""}>생도 배정</span>
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
