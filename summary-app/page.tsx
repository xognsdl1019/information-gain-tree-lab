"use client";

import { useState, type FormEvent, type ReactNode } from "react";

type Phase = "summary" | "quiz" | "complete";
type Option = { label: string; correct?: boolean };
type Item = {
  id: number;
  kind: "fill" | "choice" | "order";
  question: string;
  options?: Option[];
  explanation: string;
};

const CONCEPTS: Array<{ label: string; title: string; body: ReactNode }> = [
  {
    label: "핵심 1",
    title: "질문과 분할",
    body: (
      <>
        하나의 <b>질문</b>을 선택하고, 답에 따라 데이터를 <strong>분할</strong>
      </>
    ),
  },
  {
    label: "핵심 2",
    title: "엔트로피",
    body: (
      <>
        데이터가 가진 <b>불확실성</b>
      </>
    ),
  },
  {
    label: "핵심 3",
    title: "분할 후 엔트로피",
    body: (
      <>
        하위 집단의 크기를 반영한 <b>가중평균</b>
      </>
    ),
  },
  {
    label: "핵심 4",
    title: "정보이득",
    body: (
      <>
        <strong>분할 전 엔트로피 − 분할 후 엔트로피</strong>
      </>
    ),
  },
];

const ID3_STEPS = [
  "후보 속성 설정",
  "각 후보의 정보이득 계산",
  "정보이득이 가장 큰 분할속성 선택",
  "선택한 속성으로 분할하고 하위 노드에서 반복",
];

const INITIAL_ORDER = [
  ID3_STEPS[1],
  ID3_STEPS[3],
  ID3_STEPS[0],
  ID3_STEPS[2],
];

const ITEMS: Item[] = [
  {
    id: 1,
    kind: "fill",
    question:
      "의사결정나무는 각 노드에서 데이터에 대한 (     )을 던지고, 답에 따라 데이터를 여러 집단으로 (     )한다.",
    explanation:
      "각 노드는 질문을 하나 선택하고, 그 답을 기준으로 데이터를 분할합니다.",
  },
  {
    id: 2,
    kind: "choice",
    question: "엔트로피가 나타내는 것은 무엇인가요?",
    options: [
      { label: "데이터의 개수" },
      { label: "데이터의 불확실성", correct: true },
      { label: "트리의 깊이" },
      { label: "속성의 개수" },
    ],
    explanation:
      "엔트로피는 데이터에 여러 클래스가 얼마나 섞여 있는지, 즉 불확실성을 나타냅니다.",
  },
  {
    id: 3,
    kind: "choice",
    question: "정보이득을 올바르게 설명한 것은 무엇인가요?",
    options: [
      { label: "분할 후 엔트로피 − 분할 전 엔트로피" },
      { label: "분할 전 엔트로피 + 분할 후 엔트로피" },
      { label: "분할 전 엔트로피 − 분할 후 엔트로피", correct: true },
      { label: "하위 노드 엔트로피의 단순합" },
    ],
    explanation:
      "정보이득은 분할로 불확실성이 얼마나 감소했는지를 나타냅니다.",
  },
  {
    id: 4,
    kind: "choice",
    question: "ID3가 분할속성으로 선택하는 것은 무엇인가요?",
    options: [
      { label: "정보이득이 가장 큰 속성", correct: true },
      { label: "엔트로피가 가장 큰 속성" },
      { label: "값의 종류가 가장 많은 속성" },
      { label: "가장 먼저 기록된 속성" },
    ],
    explanation:
      "ID3는 후보별 정보이득을 비교하고 가장 큰 속성을 선택합니다.",
  },
  {
    id: 5,
    kind: "choice",
    question: "하위 노드의 엔트로피가 0이면 왜 분할을 종료할까요?",
    options: [
      { label: "데이터가 너무 많기 때문에" },
      { label: "더 사용할 속성이 없기 때문에" },
      { label: "모든 데이터가 같은 클래스로 순수하기 때문에", correct: true },
      { label: "정보이득을 계산할 수 없기 때문에" },
    ],
    explanation:
      "엔트로피 0은 한 클래스만 남아 불확실성이 없다는 뜻입니다.",
  },
  {
    id: 6,
    kind: "order",
    question: "ID3 알고리즘의 4단계를 올바른 순서로 배열하세요.",
    explanation:
      "분할한 뒤에는 각 하위 노드에서 같은 4단계를 반복하며, 엔트로피가 0인 노드에서는 분할을 종료합니다.",
  },
];

function Summary({ start }: { start: () => void }) {
  return (
    <section className="summary-page">
      <div className="summary-title">
        <span>의사결정나무 핵심 정리</span>
        <h1>
          <em>질문</em>으로 데이터를 <strong>분할</strong>해
          <br />
          불확실성을 줄입니다
        </h1>
        <div className="core-flow" aria-label="의사결정나무 핵심 흐름">
          <b>질문</b>
          <i>→</i>
          <strong>분할</strong>
          <i>→</i>
          <span>불확실성 감소</span>
        </div>
      </div>

      <div className="summary-body">
        <div className="concepts">
          {CONCEPTS.map((concept) => (
            <article key={concept.label}>
              <span>{concept.label}</span>
              <h2>{concept.title}</h2>
              <p>{concept.body}</p>
            </article>
          ))}
        </div>

        <aside className="id3-card">
          <div className="id3-heading">
            <div>
              <span>ID3 알고리즘</span>
              <h2>4단계와 반복</h2>
            </div>
            <b>정보이득이 가장 큰 속성 선택</b>
          </div>
          <ol>
            <li>
              <b>1</b>
              <strong>후보 속성 설정</strong>
            </li>
            <li>
              <b>2</b>
              <strong>정보이득 계산</strong>
            </li>
            <li>
              <b>3</b>
              <strong>분할속성 선택</strong>
            </li>
            <li>
              <b>4</b>
              <strong>분할 및 반복</strong>
            </li>
          </ol>
          <div className="stop">
            <span>종료 조건</span>
            <strong>H(D) = 0</strong>
            <p>한 클래스만 남으면 해당 가지의 분할 종료</p>
          </div>
        </aside>
      </div>

      <div className="summary-action">
        <div>
          <span>정보이득</span>
          <strong>
            Gain(D, A) = H(D) − H<sub>A</sub>(D)
          </strong>
        </div>
        <button onClick={start}>확인 퀴즈 풀기 →</button>
      </div>
    </section>
  );
}

function Quiz({
  finish,
  back,
}: {
  finish: (score: number) => void;
  back: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [order, setOrder] = useState([...INITIAL_ORDER]);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">(
    "idle",
  );
  const [attempted, setAttempted] = useState(false);
  const [score, setScore] = useState(0);
  const item = ITEMS[index];
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

    if (ok && !attempted) setScore((value) => value + 1);
    setAttempted(true);
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
    setAttempted(false);
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
        <p>정답을 맞히면 다음 문제로 이동합니다.</p>
        <small>점수는 첫 제출 기준입니다.</small>
        <button onClick={back}>← 핵심 정리</button>
      </aside>

      <form className="quiz-card" onSubmit={check}>
        <span>문제 {item.id}</span>
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
      ? "핵심 개념을 정확히 이해했습니다!"
      : score >= 4
        ? "핵심 흐름을 잘 이해했습니다!"
        : "핵심 정리를 한 번 더 보면 더 확실해집니다.";

  return (
    <section className="complete-page">
      <div className="complete-card">
        <div className="mark">✓</div>
        <span>학습 완료</span>
        <h1>{message}</h1>
        <p>엔트로피, 정보이득, ID3 그리고 질문과 분할의 관계를 확인했습니다.</p>
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
        <div className="keywords">
          <span>기억할 두 단어</span>
          <b>질문</b>
          <i>→</i>
          <strong>분할</strong>
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
          <span className={phase === "quiz" ? "active" : ""}>확인 퀴즈</span>
          <i>→</i>
          <span className={phase === "complete" ? "active" : ""}>완료</span>
        </nav>
      </header>
      {phase === "summary" && <Summary start={() => setPhase("quiz")} />}
      {phase === "quiz" && (
        <Quiz
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
          retry={() => setPhase("quiz")}
        />
      )}
    </main>
  );
}
