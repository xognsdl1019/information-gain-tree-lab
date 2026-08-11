"use client";

import { useState, type FormEvent, type ReactNode } from "react";

type Phase = "setup" | "quiz" | "complete";
type ClassName = "A2" | "B1" | "C1";
type CadetName = "이준 생도" | "맹주본 생도";
type Option = { label: ReactNode; correct?: boolean; formula?: boolean };
type CadetAssignments = Partial<Record<number, CadetName>>;
type Item = {
  id: number;
  question: ReactNode;
  options: Option[];
  explanation: ReactNode;
};

const CLASS_OPTIONS: ClassName[] = ["A2", "B1", "C1"];
const CADET_NAMES: CadetName[] = ["이준 생도", "맹주본 생도"];

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

function EntropyFormula({
  variant,
}: {
  variant: "entropy" | "positive" | "gini" | "probability";
}) {
  const label = {
    entropy: "h of D equals negative sum from k equals 1 to K of p k log base 2 p k",
    positive: "h of D equals sum from k equals 1 to K of p k log base 2 p k",
    gini: "h of D equals 1 minus sum from k equals 1 to K of p k squared",
    probability: "h of D equals sum from k equals 1 to K of p k",
  }[variant];

  return (
    <span className="formula-row" aria-label={label}>
      <span>h(𝒟)</span>
      <span>=</span>
      {variant === "entropy" && <span>−</span>}
      {variant === "gini" && (
        <>
          <span>1</span>
          <span>−</span>
        </>
      )}
      <span className="math-sum" aria-hidden="true">
        <span className="math-sum-upper">K</span>
        <span className="math-sum-symbol">∑</span>
        <span className="math-sum-lower">k = 1</span>
      </span>
      {variant === "gini" ? (
        <span>
          p<sub>k</sub><sup>2</sup>
        </span>
      ) : (
        <span>
          p<sub>k</sub>
        </span>
      )}
      {(variant === "entropy" || variant === "positive") && (
        <>
          <span>
            log<sub>2</sub>
          </span>
          <span>
            p<sub>k</sub>
          </span>
        </>
      )}
    </span>
  );
}

const ITEMS: Item[] = [
  {
    id: 1,
    question: "엔트로피 h(𝒟)의 계산식으로 옳은 것은 무엇인가요?",
    options: [
      {
        label: <EntropyFormula variant="entropy" />,
        correct: true,
        formula: true,
      },
      {
        label: <EntropyFormula variant="positive" />,
        formula: true,
      },
      {
        label: <EntropyFormula variant="gini" />,
        formula: true,
      },
      {
        label: <EntropyFormula variant="probability" />,
        formula: true,
      },
    ],
    explanation:
      "K는 클래스의 개수이고, pₖ는 데이터 집합 𝒟에서 클래스 k가 차지하는 비율입니다. 로그의 밑은 2를 사용합니다.",
  },
  {
    id: 2,
    question:
      "엔트로피 h(𝒟)가 큰 데이터 집합의 특징으로 옳은 것은 무엇인가요?",
    options: [
      { label: "현재 노드에 포함된 데이터의 수가 많음" },
      {
        label: "여러 클래스가 비슷한 비율로 섞여 있어 분류의 불확실성이 큼",
        correct: true,
      },
      { label: "현재 노드에서 사용할 수 있는 후보 속성의 수가 많음" },
      { label: "현재 노드에 포함된 모든 데이터의 클래스가 동일함" },
    ],
    explanation:
      "여러 클래스가 비슷한 비율로 섞여 있을수록 어느 클래스로 분류될지 불확실하므로 엔트로피가 커집니다.",
  },
  {
    id: 3,
    question: (
      <>
        정보이득 Gain(𝒟, <span className="math-variable">A</span>)의 계산식으로
        옳은 것은 무엇인가요?
      </>
    ),
    options: [
      {
        label: (
          <span className="formula">
            h<sub className="math-variable">A</sub>(𝒟) − h(𝒟)
          </span>
        ),
        formula: true,
      },
      {
        label: (
          <span className="formula">
            h(𝒟) + h<sub className="math-variable">A</sub>(𝒟)
          </span>
        ),
        formula: true,
      },
      {
        label: (
          <span className="formula">
            h(𝒟) − h<sub className="math-variable">A</sub>(𝒟)
          </span>
        ),
        correct: true,
        formula: true,
      },
      {
        label: (
          <span className="formula">
            h(𝒟) × h<sub className="math-variable">A</sub>(𝒟)
          </span>
        ),
        formula: true,
      },
    ],
    explanation: (
      <>
        정보이득 Gain(𝒟, <span className="math-variable">A</span>)는 분할 전
        엔트로피 h(𝒟)에서 속성 <span className="math-variable">A</span>로 분할한
        후 엔트로피 h<sub className="math-variable">A</sub>(𝒟)를 뺀 값입니다.
      </>
    ),
  },
  {
    id: 4,
    question:
      "후보 속성별 정보이득을 다음과 같이 계산했습니다.\nID3가 현재 노드의 분할 속성으로 선택하는 것은 무엇인가요?",
    options: [
      {
        label: "나이 · Gain(𝒟, 나이) = 0.247",
        correct: true,
      },
      { label: "수입 · Gain(𝒟, 수입) = 0.029" },
      { label: "학생 여부 · Gain(𝒟, 학생 여부) = 0.152" },
      { label: "신용 등급 · Gain(𝒟, 신용 등급) = 0.048" },
    ],
    explanation:
      "ID3는 후보 속성 중 정보이득이 가장 큰 속성을 선택합니다. 따라서 0.247로 가장 큰 ‘나이’를 분할 속성으로 선택합니다.",
  },
];

const QUIZ_ITEM_COUNT = ITEMS.length;

function CadetSetup({
  initialClass,
  start,
}: {
  initialClass: ClassName;
  start: (className: ClassName) => void;
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
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">(
    "idle",
  );
  const [score, setScore] = useState(0);
  const item = ITEMS[index];
  const assignedCadet = assignments[item.id];
  const ready = selected !== null;

  function check(event: FormEvent) {
    event.preventDefault();
    const ok = Boolean(item.options[selected ?? -1]?.correct);

    if (ok) setScore((value) => value + 1);
    setFeedback(ok ? "correct" : "wrong");
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
          <span>{className} 교반 · 확인 퀴즈</span>
          <strong>
            {index + 1}<small> / {QUIZ_ITEM_COUNT}</small>
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
              title={`문제 ${question.id}`}
            >
              {questionIndex < index ? "✓" : question.id}
            </i>
          ))}
        </nav>
        <button type="button" onClick={back}>← 교반 선택</button>
      </div>

      <form className="quiz-card" onSubmit={check}>
        <span>문제 {item.id}</span>
        {assignedCadet && (
          <div className="quiz-cadet">
            <span>담당 생도</span>
            <strong>{assignedCadet}</strong>
          </div>
        )}
        <h1>{item.question}</h1>

        <div className="options">
          {item.options.map((option, optionIndex) => (
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

        {feedback === "correct" && (
          <div className="feedback good" role="status" aria-live="polite">
            <b>✓ 정답입니다.</b>
            <span>{item.explanation}</span>
          </div>
        )}
        {feedback === "wrong" && (
          <div className="feedback bad" role="status" aria-live="polite">
            <b>다시 확인</b>
            <span>답을 바꾼 뒤 다시 확인해 보세요.</span>
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
  setup,
  retry,
}: {
  score: number;
  setup: () => void;
  retry: () => void;
}) {
  const message =
    score === QUIZ_ITEM_COUNT
      ? "핵심 개념을 정확히 이해했습니다"
      : score >= 3
        ? "핵심 흐름을 이해했습니다"
        : "공식과 분할 기준을 다시 확인해 보세요";

  return (
    <section className="complete-page">
      <div className="complete-card">
        <div className="mark">✓</div>
        <span>학습 완료</span>
        <h1>{message}</h1>
        <p>{QUIZ_ITEM_COUNT}개 확인 퀴즈를 통해 엔트로피와 정보이득의 핵심 개념을 확인했습니다.</p>
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
          <button onClick={setup}>교반 다시 선택</button>
          <button className="primary" onClick={retry}>
            퀴즈 다시 풀기
          </button>
        </div>
      </div>
    </section>
  );
}

export default function SummaryQuiz() {
  const [phase, setPhase] = useState<Phase>("setup");
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
          <span className={phase === "setup" ? "active" : ""}>교반 선택</span>
          <i>→</i>
          <span className={phase === "quiz" ? "active" : ""}>확인 퀴즈</span>
          <i>→</i>
          <span className={phase === "complete" ? "active" : ""}>완료</span>
        </nav>
      </header>
      {phase === "setup" && (
        <CadetSetup
          initialClass={selectedClass}
          start={beginQuiz}
        />
      )}
      {phase === "quiz" && (
        <Quiz
          assignments={assignments}
          className={selectedClass}
          back={() => setPhase("setup")}
          finish={(finalScore) => {
            setScore(finalScore);
            setPhase("complete");
          }}
        />
      )}
      {phase === "complete" && (
        <Complete
          score={score}
          setup={() => setPhase("setup")}
          retry={retryQuiz}
        />
      )}
    </main>
  );
}
