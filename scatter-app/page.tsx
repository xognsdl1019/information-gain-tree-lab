import { useMemo, useState } from "react";

type Axis = "x" | "y";
type Label = "normal" | "hack";

type Point = {
  id: string;
  x: number;
  y: number;
  label: Label;
};

type Question = {
  axis: Axis;
  limit: number;
};

type SplitResult = {
  question: Question;
  yes: Point[];
  no: Point[];
  yesCounts: Counts;
  noCounts: Counts;
  yesEntropy: number;
  noEntropy: number;
  weightedEntropy: number;
  gain: number;
};

type Counts = {
  normal: number;
  hack: number;
};

const AXES = {
  x: {
    name: "외부 연결 요소 수",
    short: "X축 질문",
    max: 3,
    limits: [0, 1, 2],
  },
  y: {
    name: "의심 표현 수",
    short: "Y축 질문",
    max: 5,
    limits: [0, 1, 2, 3, 4],
  },
} satisfies Record<Axis, { name: string; short: string; max: number; limits: number[] }>;

const RAW_POINTS: Array<[number, number, number]> = [
  [3, 5, 1], [0, 4, 1], [1, 0, 0], [1, 1, 0], [1, 2, 0],
  [0, 0, 0], [0, 1, 0], [0, 2, 0], [0, 0, 0], [0, 1, 0],
  [0, 2, 0], [0, 3, 0], [2, 4, 1], [0, 3, 1], [1, 4, 1],
  [1, 2, 1], [1, 1, 0], [1, 2, 0], [0, 1, 0], [0, 2, 0],
  [0, 3, 0], [3, 4, 1], [2, 5, 1], [2, 3, 1], [1, 5, 1],
  [2, 4, 1], [3, 2, 1], [1, 3, 1], [0, 2, 0], [0, 4, 0],
];

const POINTS: Point[] = RAW_POINTS.map(([x, y, hack], index) => ({
  id: String(index + 1).padStart(2, "0"),
  x,
  y,
  label: hack ? "hack" : "normal",
}));

const STAGES = ["데이터 관찰", "분할 체험", "트리 완성", "신규 분류"];
const ROOT_BEST_KEY = "x-1";
const CHILD_BEST_KEY = "y-2";

const TEST_POINTS: Array<Point & { title: string }> = [
  { id: "A", title: "신규 메일 A", x: 0, y: 1, label: "normal" },
  { id: "B", title: "신규 메일 B", x: 3, y: 2, label: "hack" },
  { id: "C", title: "신규 메일 C", x: 1, y: 4, label: "hack" },
];

function count(items: Point[]): Counts {
  const normal = items.filter((point) => point.label === "normal").length;
  return { normal, hack: items.length - normal };
}

function entropy(items: Point[]) {
  if (!items.length) return 0;
  const result = count(items);
  return (["normal", "hack"] as Label[]).reduce((sum, label) => {
    const probability = result[label] / items.length;
    return probability ? sum - probability * Math.log2(probability) : sum;
  }, 0);
}

function split(items: Point[], question: Question): SplitResult {
  const yes = items.filter((point) => point[question.axis] <= question.limit);
  const no = items.filter((point) => point[question.axis] > question.limit);
  const yesEntropy = entropy(yes);
  const noEntropy = entropy(no);
  const weightedEntropy =
    (yes.length / items.length) * yesEntropy +
    (no.length / items.length) * noEntropy;

  return {
    question,
    yes,
    no,
    yesCounts: count(yes),
    noCounts: count(no),
    yesEntropy,
    noEntropy,
    weightedEntropy,
    gain: entropy(items) - weightedEntropy,
  };
}

function questionKey(question: Question) {
  return `${question.axis}-${question.limit}`;
}

function questionText(question: Question) {
  return `${AXES[question.axis].name}가 ${question.limit}개 이하인가?`;
}

function shortQuestion(question: Question) {
  return `${question.axis.toUpperCase()} ≤ ${question.limit}`;
}

function format(value: number) {
  return value.toFixed(3);
}

function allQuestions(items: Point[], axes: Axis[] = ["x", "y"]) {
  return axes.flatMap((axis) =>
    AXES[axis].limits.map((limit) => split(items, { axis, limit })),
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="section-hero">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}

function TeacherPrompt({
  children,
  label = "함께 말해보기",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <aside className="teacher-prompt">
      <span>{label}</span>
      <div>{children}</div>
    </aside>
  );
}

function ClassLegend() {
  return (
    <div className="class-legend" aria-label="클래스 범례">
      <span className="normal">✓ 정상 메일</span>
      <span className="hack">! 해킹메일</span>
    </div>
  );
}

function PurityBar({ items }: { items: Point[] }) {
  const result = count(items);
  const total = items.length || 1;
  return (
    <div className="purity-bar" aria-label={`정상 ${result.normal}, 해킹 ${result.hack}`}>
      <i className="normal" style={{ width: `${(result.normal / total) * 100}%` }} />
      <i className="hack" style={{ width: `${(result.hack / total) * 100}%` }} />
    </div>
  );
}

function DataToken({ point, order = 0 }: { point: Point; order?: number }) {
  return (
    <span
      className={`data-token ${point.label}`}
      style={{ animationDelay: `${Math.min(order * 18, 360)}ms` }}
      title={`${point.id} · X ${point.x} · Y ${point.y}`}
    >
      <b>{point.id}</b>
      <small>{point.label === "normal" ? "✓" : "!"}</small>
    </span>
  );
}

function TokenPool({
  title,
  badge,
  items,
  tone = "mixed",
  emptyText,
}: {
  title: string;
  badge?: string;
  items: Point[];
  tone?: "yes" | "no" | "mixed";
  emptyText?: string;
}) {
  const result = count(items);
  return (
    <article className={`token-pool ${tone}`}>
      <div className="pool-heading">
        <div>
          {badge && <span>{badge}</span>}
          <h3>{title}</h3>
        </div>
        <strong>{items.length}개</strong>
      </div>
      {items.length ? (
        <div className="token-grid">
          {items.map((point, index) => <DataToken key={point.id} point={point} order={index} />)}
        </div>
      ) : (
        <div className="empty-pool">{emptyText ?? "해당 데이터 없음"}</div>
      )}
      <PurityBar items={items} />
      <div className="pool-stats">
        <span className="normal">정상 <b>{result.normal}</b></span>
        <span className="hack">해킹 <b>{result.hack}</b></span>
        <em>H = {format(entropy(items))}</em>
      </div>
    </article>
  );
}

function DataOverview() {
  const totals = count(POINTS);
  return (
    <section className="page-content">
      <SectionHeader
        eyebrow="STEP 1 · OBSERVE"
        title="분할하기 전 30개 데이터를 관찰하세요"
        description="각 데이터의 두 수치와 실제 클래스를 확인하고, 어떤 질문이 두 색을 잘 나눌지 먼저 예상합니다."
      />

      <div className="overview-strip">
        <div className="summary-card normal"><span>✓</span><p>정상 메일<strong>{totals.normal}개</strong></p></div>
        <div className="summary-card hack"><span>!</span><p>해킹메일<strong>{totals.hack}개</strong></p></div>
        <div className="summary-card entropy"><span>H</span><p>현재 엔트로피<strong>{format(entropy(POINTS))}</strong></p></div>
        <div className="metric-guide"><b>X</b><span>외부 연결 요소 수</span><b>Y</b><span>의심 표현 수</span></div>
      </div>

      <div className="beam-data-card">
        <div className="card-heading">
          <div><h2>전체 학습 데이터</h2><p>번호 · X값 · Y값 · 실제 클래스</p></div>
          <ClassLegend />
        </div>
        <div className="data-grid">
          {POINTS.map((point) => (
            <article className={`data-chip ${point.label}`} key={point.id}>
              <strong>{point.id}</strong>
              <div><span>X</span><b>{point.x}</b></div>
              <div><span>Y</span><b>{point.y}</b></div>
              <em>{point.label === "normal" ? "정상" : "해킹"}</em>
            </article>
          ))}
        </div>
      </div>

      <div className="before-split">
        <span>분할 전</span>
        <strong>정상 17개와 해킹 13개가 하나의 집단에 섞여 있습니다.</strong>
        <PurityBar items={POINTS} />
        <b>H(D) = 0.987</b>
      </div>

      <TeacherPrompt>
        <p><b>X값과 Y값 중 무엇을 질문</b>하면 파란색과 주황색이 더 잘 나뉠까요?</p>
        <p>정답을 계산하기 전에 눈으로 예상하고, 그 이유를 옆 사람에게 설명해보세요.</p>
      </TeacherPrompt>
    </section>
  );
}

function aggregateCells(items: Point[]) {
  const cells: Array<{ x: number; y: number; normal: number; hack: number }> = [];
  for (let x = 0; x <= 3; x += 1) {
    for (let y = 0; y <= 5; y += 1) {
      const here = items.filter((point) => point.x === x && point.y === y);
      if (here.length) cells.push({ x, y, ...count(here) });
    }
  }
  return cells;
}

function GridMap({
  items,
  question,
  focusRootYes = false,
}: {
  items: Point[];
  question: Question;
  focusRootYes?: boolean;
}) {
  const width = 800;
  const height = 500;
  const plot = { left: 96, right: 742, top: 40, bottom: 426 };
  const xAt = (value: number) => plot.left + (value / 3) * (plot.right - plot.left);
  const yAt = (value: number) => plot.bottom - (value / 5) * (plot.bottom - plot.top);
  const boundary =
    question.axis === "x"
      ? xAt(question.limit + 0.5)
      : yAt(question.limit + 0.5);
  const rootBoundary = xAt(1.5);
  const cells = aggregateCells(items);

  return (
    <svg className="grid-map" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="질문에 따라 나뉘는 데이터 격자">
      <rect className="plot-paper" x={plot.left} y={plot.top} width={plot.right - plot.left} height={plot.bottom - plot.top} rx="16" />

      {question.axis === "x" ? (
        <>
          <rect className="yes-region" x={plot.left} y={plot.top} width={boundary - plot.left} height={plot.bottom - plot.top} />
          <rect className="no-region" x={boundary} y={plot.top} width={plot.right - boundary} height={plot.bottom - plot.top} />
        </>
      ) : (
        <>
          <rect className="yes-region" x={plot.left} y={boundary} width={focusRootYes ? rootBoundary - plot.left : plot.right - plot.left} height={plot.bottom - boundary} />
          <rect className="no-region" x={plot.left} y={plot.top} width={focusRootYes ? rootBoundary - plot.left : plot.right - plot.left} height={boundary - plot.top} />
        </>
      )}

      {Array.from({ length: 4 }, (_, value) => (
        <g key={`x-${value}`}>
          <line className="grid-line" x1={xAt(value)} x2={xAt(value)} y1={plot.top} y2={plot.bottom} />
          <text className="tick" x={xAt(value)} y={plot.bottom + 30}>{value}</text>
        </g>
      ))}
      {Array.from({ length: 6 }, (_, value) => (
        <g key={`y-${value}`}>
          <line className="grid-line" x1={plot.left} x2={plot.right} y1={yAt(value)} y2={yAt(value)} />
          <text className="tick" x={plot.left - 25} y={yAt(value) + 6}>{value}</text>
        </g>
      ))}

      {focusRootYes && (
        <>
          <rect className="excluded-zone" x={rootBoundary} y={plot.top} width={plot.right - rootBoundary} height={plot.bottom - plot.top} />
          <line className="fixed-line" x1={rootBoundary} x2={rootBoundary} y1={plot.top} y2={plot.bottom} />
          <text className="excluded-label" x={(rootBoundary + plot.right) / 2} y={plot.top + 34}>1차 분할 완료 영역</text>
        </>
      )}

      {cells.map((cell) => (
        <g className="grid-cell" transform={`translate(${xAt(cell.x)} ${yAt(cell.y)})`} key={`${cell.x}-${cell.y}`}>
          {cell.normal > 0 && (
            <g transform={`translate(${cell.hack ? -21 : 0} 0)`}>
              <circle className="normal-dot" r="21" />
              <text>✓{cell.normal}</text>
            </g>
          )}
          {cell.hack > 0 && (
            <g transform={`translate(${cell.normal ? 21 : 0} 0)`}>
              <circle className="hack-dot" r="21" />
              <text>!{cell.hack}</text>
            </g>
          )}
        </g>
      ))}

      {question.axis === "x" ? (
        <line className="question-line" x1={boundary} x2={boundary} y1={plot.top} y2={plot.bottom} />
      ) : (
        <line className="question-line" x1={plot.left} x2={focusRootYes ? rootBoundary : plot.right} y1={boundary} y2={boundary} />
      )}

      <g className="region-label yes" transform={`translate(${question.axis === "x" ? (plot.left + boundary) / 2 : plot.left + 63} ${question.axis === "x" ? plot.top + 28 : (boundary + plot.bottom) / 2})`}>
        <rect x="-41" y="-18" width="82" height="36" rx="18" />
        <text y="6">예</text>
      </g>
      <g className="region-label no" transform={`translate(${question.axis === "x" ? (boundary + plot.right) / 2 : plot.left + 63} ${question.axis === "x" ? plot.top + 28 : (plot.top + boundary) / 2})`}>
        <rect x="-41" y="-18" width="82" height="36" rx="18" />
        <text y="6">아니오</text>
      </g>

      <text className="axis-label x" x={(plot.left + plot.right) / 2} y={height - 15}>외부 연결 요소 수 (X)</text>
      <text className="axis-label y" transform={`translate(27 ${(plot.top + plot.bottom) / 2}) rotate(-90)`}>의심 표현 수 (Y)</text>
    </svg>
  );
}

function QuestionPicker({
  question,
  axes = ["x", "y"],
  onSelect,
}: {
  question: Question;
  axes?: Axis[];
  onSelect: (question: Question) => void;
}) {
  return (
    <div className="question-picker">
      {axes.map((axis) => (
        <div className="question-family" key={axis}>
          <span><b>{axis.toUpperCase()}</b>{AXES[axis].short}</span>
          <div>
            {AXES[axis].limits.map((limit) => (
              <button
                className={question.axis === axis && question.limit === limit ? "active" : ""}
                type="button"
                onClick={() => onSelect({ axis, limit })}
                key={limit}
              >
                {limit}개 이하?
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SplitAnimation({
  items,
  result,
  executed,
  onExecute,
}: {
  items: Point[];
  result: SplitResult;
  executed: boolean;
  onExecute: () => void;
}) {
  return (
    <div className="split-animation">
      <div className="split-question">
        <span>선택한 질문</span>
        <strong>{questionText(result.question)}</strong>
        <button className="primary" type="button" onClick={onExecute}>
          {executed ? "이 질문으로 다시 분할" : "분할 실행 →"}
        </button>
      </div>

      {!executed ? (
        <div className="unsplit-state">
          <TokenPool title="분할 전 · 하나의 집단" badge="전체" items={items} tone="mixed" />
          <div className="split-hint"><span>↓</span><strong>질문을 실행하면 각 번호가 예·아니오 집단으로 이동합니다.</strong></div>
        </div>
      ) : (
        <div className="split-groups">
          <TokenPool title={questionText(result.question)} badge="예" items={result.yes} tone="yes" />
          <div className="split-arrow">분할</div>
          <TokenPool title={questionText(result.question)} badge="아니오" items={result.no} tone="no" />
        </div>
      )}
    </div>
  );
}

function ComparisonBoard({
  items,
  attempts,
  showAll,
  selectedBest,
  required,
  axes = ["x", "y"],
  correctKey,
  onRevealAll,
  onChoose,
}: {
  items: Point[];
  attempts: Record<string, SplitResult>;
  showAll: boolean;
  selectedBest: string | null;
  required: number;
  axes?: Axis[];
  correctKey: string;
  onRevealAll: () => void;
  onChoose: (key: string) => void;
}) {
  const results = allQuestions(items, axes);
  const tried = Object.values(attempts);
  const triedAxes = new Set(tried.map((result) => result.question.axis));
  const axisRequirement = axes.length === 1 || triedAxes.size === axes.length;
  const canReveal = tried.length >= required && axisRequirement;

  return (
    <section className="comparison-board">
      <div className="comparison-heading">
        <div><span>분할 결과 비교</span><h2>여러 질문으로 나뉜 두 집단을 비교하세요</h2></div>
        <strong>{tried.length}/{required} 체험</strong>
      </div>

      <div className="comparison-cards">
        {results.map((result) => {
          const key = questionKey(result.question);
          const visible = Boolean(attempts[key]) || showAll;
          return (
            <button
              className={`${selectedBest === key ? "selected" : ""} ${selectedBest === key && key === correctKey ? "correct" : ""}`}
              type="button"
              disabled={!showAll}
              onClick={() => onChoose(key)}
              key={key}
            >
              <div className="comparison-title"><strong>{shortQuestion(result.question)}</strong><span>{visible ? `IG ${format(result.gain)}` : "미체험"}</span></div>
              <div className="mini-split">
                <div><small>예</small><PurityBar items={visible ? result.yes : []} /></div>
                <div><small>아니오</small><PurityBar items={visible ? result.no : []} /></div>
              </div>
              {visible && <p>정상·해킹이 덜 섞일수록 좋은 분할</p>}
            </button>
          );
        })}
      </div>

      {!showAll ? (
        <div className="comparison-action">
          <p>
            {canReveal
              ? "대표 질문 체험을 마쳤습니다. 나머지도 같은 방식으로 분할한 결과를 펼쳐보세요."
              : axes.length > 1
                ? `X축과 Y축 질문을 모두 포함해 ${Math.max(0, required - tried.length)}개를 더 체험하세요.`
                : `${Math.max(0, required - tried.length)}개 질문을 더 체험하세요.`}
          </p>
          <button className="primary" type="button" disabled={!canReveal} onClick={onRevealAll}>전체 결과 펼치기</button>
        </div>
      ) : (
        <div className={`best-feedback ${selectedBest === correctKey ? "success" : selectedBest ? "error" : ""}`}>
          <p>
            {selectedBest === correctKey
              ? "정답입니다. 두 집단의 색이 가장 잘 구분되고 정보이득도 가장 큽니다."
              : selectedBest
                ? "예·아니오 집단의 색 혼합과 정보이득을 다시 비교하세요."
                : "가장 좋은 분할을 만든 질문 카드를 선택하세요."}
          </p>
          {selectedBest === correctKey && <strong>{questionText(results.find((result) => questionKey(result.question) === correctKey)!.question)}</strong>}
        </div>
      )}
    </section>
  );
}

function FirstSplitExperience({
  attempts,
  showAll,
  best,
  onAttempts,
  onShowAll,
  onBest,
}: {
  attempts: Record<string, SplitResult>;
  showAll: boolean;
  best: string | null;
  onAttempts: (attempts: Record<string, SplitResult>) => void;
  onShowAll: () => void;
  onBest: (key: string) => void;
}) {
  const [question, setQuestion] = useState<Question>({ axis: "x", limit: 0 });
  const [executed, setExecuted] = useState(false);
  const result = split(POINTS, question);

  function choose(next: Question) {
    setQuestion(next);
    setExecuted(false);
  }

  function execute() {
    setExecuted(false);
    requestAnimationFrame(() => setExecuted(true));
    onAttempts({ ...attempts, [questionKey(question)]: result });
  }

  return (
    <section className="page-content wide-page">
      <SectionHeader
        eyebrow="STEP 2 · SPLIT"
        title="질문을 바꾸며 데이터가 나뉘는 모습을 확인하세요"
        description="질문을 선택하고 분할을 실행하면 하나로 섞여 있던 30개 데이터가 예·아니오 두 집단으로 이동합니다."
      />

      <QuestionPicker question={question} onSelect={choose} />

      <div className="visual-workspace">
        <div className="map-panel">
          <div className="panel-heading"><div><span>격자에서 먼저 보기</span><strong>{questionText(question)}</strong></div><ClassLegend /></div>
          <GridMap items={POINTS} question={question} />
        </div>
        <SplitAnimation items={POINTS} result={result} executed={executed} onExecute={execute} />
      </div>

      <ComparisonBoard
        items={POINTS}
        attempts={attempts}
        showAll={showAll}
        selectedBest={best}
        required={4}
        correctKey={ROOT_BEST_KEY}
        onRevealAll={onShowAll}
        onChoose={onBest}
      />

      <TeacherPrompt>
        <p>질문을 바꾸면 <b>어떤 번호들이 예 집단과 아니오 집단 사이를 이동</b>합니까?</p>
        <p>좋은 분할에서는 두 집단의 파란색·주황색 혼합이 어떻게 달라지는지 설명해보세요.</p>
      </TeacherPrompt>
    </section>
  );
}

function TreePreview() {
  return (
    <div className="tree-preview">
      <div className="tree-root"><span>질문 1</span><strong>외부 연결 요소가 1개 이하인가?</strong></div>
      <div className="tree-preview-branches">
        <article><b>예 · 23개</b><div className="open-node">다음 질문은?</div></article>
        <article><b>아니오 · 7개</b><em className="hack">해킹 예측</em></article>
      </div>
    </div>
  );
}

function SecondSplitExperience({
  attempts,
  showAll,
  best,
  onAttempts,
  onShowAll,
  onBest,
}: {
  attempts: Record<string, SplitResult>;
  showAll: boolean;
  best: string | null;
  onAttempts: (attempts: Record<string, SplitResult>) => void;
  onShowAll: () => void;
  onBest: (key: string) => void;
}) {
  const parent = useMemo(() => split(POINTS, { axis: "x", limit: 1 }).yes, []);
  const [question, setQuestion] = useState<Question>({ axis: "y", limit: 0 });
  const [executed, setExecuted] = useState(false);
  const result = split(parent, question);

  function choose(next: Question) {
    setQuestion(next);
    setExecuted(false);
  }

  function execute() {
    setExecuted(false);
    requestAnimationFrame(() => setExecuted(true));
    onAttempts({ ...attempts, [questionKey(question)]: result });
  }

  return (
    <section className="page-content wide-page">
      <SectionHeader
        eyebrow="STEP 3 · REPEAT"
        title="혼합된 예 집단을 다시 분할하세요"
        description="첫 질문에서 예라고 답한 23개 데이터만 새로운 현재 노드가 됩니다. 이 집단에 다시 질문을 적용합니다."
      />

      <TreePreview />
      <QuestionPicker question={question} axes={["y"]} onSelect={choose} />

      <div className="visual-workspace">
        <div className="map-panel">
          <div className="panel-heading"><div><span>현재 노드의 데이터</span><strong>{questionText(question)}</strong></div><ClassLegend /></div>
          <GridMap items={parent} question={question} focusRootYes />
        </div>
        <SplitAnimation items={parent} result={result} executed={executed} onExecute={execute} />
      </div>

      <ComparisonBoard
        items={parent}
        attempts={attempts}
        showAll={showAll}
        selectedBest={best}
        required={3}
        axes={["y"]}
        correctKey={CHILD_BEST_KEY}
        onRevealAll={onShowAll}
        onChoose={onBest}
      />

      {best === CHILD_BEST_KEY && (
        <div className="completed-tree">
          <div className="tree-root"><span>질문 1</span><strong>외부 연결 요소가 1개 이하인가?</strong></div>
          <div className="completed-branches">
            <article>
              <b>예</b>
              <div className="tree-child"><span>질문 2</span><strong>의심 표현 수가 2개 이하인가?</strong></div>
              <p><em className="normal">예 → 정상 예측</em><em className="hack">아니오 → 해킹 예측</em></p>
            </article>
            <article><b>아니오</b><em className="hack">해킹 예측</em></article>
          </div>
        </div>
      )}

      <TeacherPrompt>
        <p>왜 두 번째 질문은 전체 30개가 아니라 <b>현재 노드의 23개 데이터만</b> 다시 나눕니까?</p>
        <p>질문 → 예·아니오 분할 → 다음 질문이라는 트리의 반복 구조를 말로 설명해보세요.</p>
      </TeacherPrompt>
    </section>
  );
}

function ApplyAndReview({
  answers,
  onAnswer,
}: {
  answers: Record<string, Label>;
  onAnswer: (id: string, label: Label) => void;
}) {
  const score = TEST_POINTS.filter((point) => answers[point.id] === point.label).length;
  const completed = Object.keys(answers).length === TEST_POINTS.length;

  return (
    <section className="page-content">
      <SectionHeader
        eyebrow="STEP 4 · APPLY"
        title="완성한 질문을 따라 신규 메일을 분류하세요"
        description="첫 질문에서 출발해 예·아니오 가지를 따라가며 각 데이터의 최종 클래스를 선택합니다."
      />

      <div className="completed-tree final">
        <div className="tree-root"><span>질문 1</span><strong>외부 연결 요소가 1개 이하인가?</strong></div>
        <div className="completed-branches">
          <article>
            <b>예</b>
            <div className="tree-child"><span>질문 2</span><strong>의심 표현 수가 2개 이하인가?</strong></div>
            <p><em className="normal">예 → 정상</em><em className="hack">아니오 → 해킹</em></p>
          </article>
          <article><b>아니오</b><em className="hack">해킹</em></article>
        </div>
      </div>

      <div className="test-grid">
        {TEST_POINTS.map((point) => {
          const answer = answers[point.id];
          const path = point.x <= 1
            ? `질문 1: 예 → 질문 2: ${point.y <= 2 ? "예" : "아니오"}`
            : "질문 1: 아니오";
          return (
            <article className={answer ? (answer === point.label ? "correct" : "wrong") : ""} key={point.id}>
              <div className="test-title"><span>{point.id}</span><div><h2>{point.title}</h2><p>X = {point.x} · Y = {point.y}</p></div></div>
              <div className="test-path">{answer ? path : "트리의 질문을 순서대로 따라가 보세요."}</div>
              <div className="test-actions">
                <button type="button" onClick={() => onAnswer(point.id, "normal")}>✓ 정상 메일</button>
                <button type="button" onClick={() => onAnswer(point.id, "hack")}>! 해킹메일</button>
              </div>
              {answer && <strong>{answer === point.label ? "정답" : "다시 확인"}</strong>}
            </article>
          );
        })}
      </div>

      {completed && (
        <div className={`score-banner ${score === TEST_POINTS.length ? "perfect" : ""}`}>
          <span>신규 메일 분류 결과</span><strong>{score} / {TEST_POINTS.length}</strong>
          <p>{score === TEST_POINTS.length ? "모든 데이터의 질문 경로를 정확히 따라갔습니다." : "오답 카드의 질문 경로를 다시 확인하세요."}</p>
        </div>
      )}

      <div className="key-review">
        <article><span>① 질문</span><strong>데이터의 특성을 기준으로 묻기</strong><p>예: 외부 연결 요소가 1개 이하인가?</p></article>
        <article><span>② 분할</span><strong>답에 따라 예·아니오 집단으로 나누기</strong><p>각 번호가 어느 집단으로 이동하는지 관찰</p></article>
        <article><span>③ 반복</span><strong>혼합된 집단에 다시 질문하기</strong><p>현재 노드의 데이터만 대상으로 다음 분할</p></article>
      </div>

      <TeacherPrompt label="마무리 설명">
        <p>오늘 실습에서 30개 데이터가 어떤 질문을 통해 두 집단으로 나뉘었는지 설명해보세요.</p>
        <p><b>질문, 분할, 현재 노드, 정보이득</b>이라는 단어를 모두 사용해 트리가 만들어지는 과정을 정리해보세요.</p>
      </TeacherPrompt>
    </section>
  );
}

export default function ScatterLab() {
  const [stage, setStage] = useState(0);
  const [maxStage, setMaxStage] = useState(0);
  const [rootAttempts, setRootAttempts] = useState<Record<string, SplitResult>>({});
  const [rootShowAll, setRootShowAll] = useState(false);
  const [rootBest, setRootBest] = useState<string | null>(null);
  const [childAttempts, setChildAttempts] = useState<Record<string, SplitResult>>({});
  const [childShowAll, setChildShowAll] = useState(false);
  const [childBest, setChildBest] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, Label>>({});

  function go(next: number) {
    setStage(next);
    setMaxStage((previous) => Math.max(previous, next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function restart() {
    setStage(0);
    setMaxStage(0);
    setRootAttempts({});
    setRootShowAll(false);
    setRootBest(null);
    setChildAttempts({});
    setChildShowAll(false);
    setChildBest(null);
    setAnswers({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const canNext =
    stage === 0 ||
    (stage === 1 && rootBest === ROOT_BEST_KEY) ||
    (stage === 2 && childBest === CHILD_BEST_KEY);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand"><span>DT</span><div><small>인공지능 개론</small><strong>8. 의사결정 나무 실습</strong></div></div>
        <button className="restart-button" type="button" onClick={restart}>↻ 처음부터</button>
      </header>

      <nav className="progress-nav" aria-label="실습 진행 단계">
        {STAGES.map((label, index) => (
          <button
            className={`${stage === index ? "active" : ""} ${index < stage ? "done" : ""}`}
            type="button"
            disabled={index > maxStage}
            onClick={() => index <= maxStage && go(index)}
            key={label}
          >
            <b>{index < stage ? "✓" : index + 1}</b><span>{label}</span>
          </button>
        ))}
      </nav>

      {stage === 0 && <DataOverview />}
      {stage === 1 && (
        <FirstSplitExperience
          attempts={rootAttempts}
          showAll={rootShowAll}
          best={rootBest}
          onAttempts={setRootAttempts}
          onShowAll={() => setRootShowAll(true)}
          onBest={setRootBest}
        />
      )}
      {stage === 2 && (
        <SecondSplitExperience
          attempts={childAttempts}
          showAll={childShowAll}
          best={childBest}
          onAttempts={setChildAttempts}
          onShowAll={() => setChildShowAll(true)}
          onBest={setChildBest}
        />
      )}
      {stage === 3 && <ApplyAndReview answers={answers} onAnswer={(id, label) => setAnswers((previous) => ({ ...previous, [id]: label }))} />}

      <footer className="page-footer">
        <button type="button" disabled={stage === 0} onClick={() => go(stage - 1)}>← 이전 단계</button>
        <p>※ 가상의 학습 데이터이며 실제 보안 판정 기준이 아닙니다.</p>
        {stage < STAGES.length - 1 ? (
          <button className="primary" type="button" disabled={!canNext} onClick={() => go(stage + 1)}>
            {stage === 0 ? "분할 체험 시작 →" : stage === 1 ? "다음 노드 분할 →" : "신규메일 분류 →"}
          </button>
        ) : (
          <button className="primary" type="button" onClick={restart}>실습 다시 시작</button>
        )}
      </footer>
    </main>
  );
}
