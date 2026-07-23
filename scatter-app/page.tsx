import { useMemo, useState } from "react";

type Axis = "x" | "y";
type Label = "normal" | "hack";

type Point = {
  id: string;
  x: number;
  y: number;
  label: Label;
};

type CandidateResult = {
  axis: Axis;
  threshold: number;
  left: Point[];
  right: Point[];
  leftCounts: Counts;
  rightCounts: Counts;
  leftEntropy: number;
  rightEntropy: number;
  weightedEntropy: number;
  gain: number;
};

type Counts = {
  normal: number;
  hack: number;
};

const LABELS: Record<Label, string> = {
  normal: "정상 메일",
  hack: "해킹메일",
};

const AXIS_INFO = {
  x: {
    name: "외부 연결 요소 수",
    short: "X축",
    max: 3,
    candidates: [0.5, 1.5, 2.5],
  },
  y: {
    name: "의심 표현 수",
    short: "Y축",
    max: 5,
    candidates: [0.5, 1.5, 2.5, 3.5, 4.5],
  },
} satisfies Record<Axis, { name: string; short: string; max: number; candidates: number[] }>;

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

const STAGES = [
  { label: "데이터 한눈에", time: "3분" },
  { label: "후보점 이해", time: "3분" },
  { label: "1차 분할", time: "7분" },
  { label: "2차 분할", time: "4분" },
  { label: "적용·정리", time: "3분" },
];

const FIRST_BEST_KEY = "x-1.5";
const SECOND_BEST_THRESHOLD = 2.5;

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
  return (["normal", "hack"] as Label[]).reduce((sum, key) => {
    const probability = result[key] / items.length;
    return probability ? sum - probability * Math.log2(probability) : sum;
  }, 0);
}

function candidate(items: Point[], axis: Axis, threshold: number): CandidateResult {
  const left = items.filter((point) => point[axis] <= threshold);
  const right = items.filter((point) => point[axis] > threshold);
  const leftEntropy = entropy(left);
  const rightEntropy = entropy(right);
  const weightedEntropy =
    (left.length / items.length) * leftEntropy +
    (right.length / items.length) * rightEntropy;

  return {
    axis,
    threshold,
    left,
    right,
    leftCounts: count(left),
    rightCounts: count(right),
    leftEntropy,
    rightEntropy,
    weightedEntropy,
    gain: entropy(items) - weightedEntropy,
  };
}

function candidateKey(axis: Axis, threshold: number) {
  return `${axis}-${threshold}`;
}

function integerRule(axis: Axis, threshold: number) {
  return `${AXIS_INFO[axis].name}가 ${Math.floor(threshold)}개 이하인가?`;
}

function splitNotation(axis: Axis, threshold: number) {
  return `${axis.toUpperCase()} ≤ ${threshold.toFixed(1)}`;
}

function format(value: number) {
  return value.toFixed(3);
}

function allCandidates(items: Point[]) {
  return (Object.keys(AXIS_INFO) as Axis[]).flatMap((axis) =>
    AXIS_INFO[axis].candidates.map((threshold) => candidate(items, axis, threshold)),
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  time,
}: {
  eyebrow: string;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="section-hero">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="time-card">
        <span>권장 시간</span>
        <strong>{time}</strong>
      </div>
    </div>
  );
}

function TeacherPrompt({ children, label = "함께 말해보기" }: { children: React.ReactNode; label?: string }) {
  return (
    <aside className="teacher-prompt">
      <span>{label}</span>
      <div>{children}</div>
    </aside>
  );
}

function Fraction({ top, bottom }: { top: number; bottom: number }) {
  return (
    <span className="fraction" aria-label={`${top}/${bottom}`}>
      <span>{top}</span>
      <span>{bottom}</span>
    </span>
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

function DataOverview() {
  const totals = count(POINTS);

  return (
    <section className="page-content">
      <SectionHeader
        eyebrow="STEP 1 · OBSERVE"
        title="30개 데이터를 한 화면에서 관찰하세요"
        description="표의 부가 정보는 줄이고, 이번 분할에 사용하는 두 수치와 실제 클래스만 크게 표시했습니다."
        time="3분"
      />

      <div className="overview-strip">
        <div className="summary-card normal">
          <span>✓</span>
          <p>정상 메일<strong>{totals.normal}개</strong></p>
        </div>
        <div className="summary-card hack">
          <span>!</span>
          <p>해킹메일<strong>{totals.hack}개</strong></p>
        </div>
        <div className="summary-card entropy">
          <span>H</span>
          <p>분할 전 엔트로피<strong>{format(entropy(POINTS))}</strong></p>
        </div>
        <div className="metric-guide">
          <b>X</b><span>외부 연결 요소 수</span>
          <b>Y</b><span>의심 표현 수</span>
        </div>
      </div>

      <div className="beam-data-card">
        <div className="card-heading">
          <div>
            <h2>전체 학습 데이터</h2>
            <p>각 카드는 메일 번호 · X값 · Y값 · 실제 클래스를 나타냅니다.</p>
          </div>
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

      <div className="formula-strip">
        <div>
          <span>현재 불확실성</span>
          <strong>H(D)</strong>
        </div>
        <p>
          − <Fraction top={17} bottom={30} /> log₂(<Fraction top={17} bottom={30} />)
          − <Fraction top={13} bottom={30} /> log₂(<Fraction top={13} bottom={30} />)
        </p>
        <b>= 0.987</b>
      </div>

      <TeacherPrompt>
        <p>파란색과 주황색을 잘 나누려면 <b>X축과 Y축 중 어느 축</b>을 먼저 질문하는 것이 좋아 보입니까?</p>
        <p>경계선을 어느 두 격자값 사이에 놓고 싶은지 근거와 함께 말해보세요.</p>
      </TeacherPrompt>
    </section>
  );
}

function CandidateAxis({
  axis,
  selected,
  threshold,
  onSelect,
}: {
  axis: Axis;
  selected: boolean;
  threshold: number | null;
  onSelect: (axis: Axis, threshold: number) => void;
}) {
  const info = AXIS_INFO[axis];

  return (
    <article className={`candidate-axis-card ${selected ? "selected" : ""}`}>
      <div className="axis-title">
        <span>{axis.toUpperCase()}</span>
        <div>
          <h2>{info.name}</h2>
          <p>관측값 {Array.from({ length: info.max + 1 }, (_, index) => index).join(" · ")}</p>
        </div>
      </div>

      <div className="number-line" aria-label={`${info.name} 후보 분할점`}>
        <div className="number-line-values">
          {Array.from({ length: info.max + 1 }, (_, value) => (
            <span key={value}><i />{value}</span>
          ))}
        </div>
        <div className="candidate-slots">
          {info.candidates.map((value) => (
            <button
              className={selected && threshold === value ? "active" : ""}
              type="button"
              onClick={() => onSelect(axis, value)}
              key={value}
            >
              {value.toFixed(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="candidate-explanation">
        <b>{info.candidates.length}개 후보</b>
        <span>서로 다른 관측값의 중간 지점만 비교</span>
      </div>
    </article>
  );
}

function CandidateLesson({
  predictionAxis,
  predictionThreshold,
  onPrediction,
}: {
  predictionAxis: Axis | null;
  predictionThreshold: number | null;
  onPrediction: (axis: Axis, threshold: number) => void;
}) {
  return (
    <section className="page-content">
      <SectionHeader
        eyebrow="STEP 2 · CANDIDATES"
        title="가능한 분할 위치를 먼저 정하세요"
        description="숫자형 특성도 모든 실수 위치를 무한히 탐색하지 않습니다. 관측값 사이의 후보점만 비교합니다."
        time="3분"
      />

      <div className="concept-banner">
        <div><span>관측값</span><strong>0 · 1 · 2 · 3</strong></div>
        <i>→</i>
        <div><span>후보 분할점</span><strong>0.5 · 1.5 · 2.5</strong></div>
        <i>→</i>
        <div className="rule-example"><span>1.5에 선을 놓으면</span><strong>“1개 이하인가?”</strong></div>
      </div>

      <div className="candidate-axis-grid">
        <CandidateAxis
          axis="x"
          selected={predictionAxis === "x"}
          threshold={predictionThreshold}
          onSelect={onPrediction}
        />
        <CandidateAxis
          axis="y"
          selected={predictionAxis === "y"}
          threshold={predictionThreshold}
          onSelect={onPrediction}
        />
      </div>

      <div className={`prediction-box ${predictionAxis ? "filled" : ""}`}>
        <span>나의 1차 분할 예상</span>
        {predictionAxis && predictionThreshold !== null ? (
          <>
            <strong>{splitNotation(predictionAxis, predictionThreshold)}</strong>
            <p>{integerRule(predictionAxis, predictionThreshold)}</p>
          </>
        ) : (
          <p>위 후보점 하나를 선택하세요. 정답은 아직 공개하지 않습니다.</p>
        )}
      </div>

      <TeacherPrompt>
        <p>왜 선을 <b>1.3이나 1.8</b>에 놓지 않고 <b>0.5, 1.5, 2.5</b>에서만 비교할까요?</p>
        <p>1.5라는 경계와 “1개 이하”라는 질문이 어떻게 연결되는지 설명해보세요.</p>
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

function GridScatter({
  items,
  axis,
  threshold,
  focusLeft = false,
  compact = false,
}: {
  items: Point[];
  axis: Axis | null;
  threshold: number | null;
  focusLeft?: boolean;
  compact?: boolean;
}) {
  const viewWidth = 820;
  const viewHeight = 520;
  const plot = { left: 100, right: 760, top: 42, bottom: 440 };
  const xAt = (value: number) => plot.left + (value / 3) * (plot.right - plot.left);
  const yAt = (value: number) => plot.bottom - (value / 5) * (plot.bottom - plot.top);
  const lineX = threshold !== null && axis === "x" ? xAt(threshold) : null;
  const lineY = threshold !== null && axis === "y" ? yAt(threshold) : null;
  const firstLineX = xAt(1.5);
  const cells = aggregateCells(items);

  return (
    <svg
      className={`grid-scatter ${compact ? "compact" : ""}`}
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      role="img"
      aria-label="정수 격자 위의 메일 데이터와 후보 분할선"
    >
      <rect
        className="plot-paper"
        x={plot.left}
        y={plot.top}
        width={plot.right - plot.left}
        height={plot.bottom - plot.top}
        rx="16"
      />

      {lineX !== null && (
        <>
          <rect className="region-a" x={plot.left} y={plot.top} width={lineX - plot.left} height={plot.bottom - plot.top} />
          <rect className="region-b" x={lineX} y={plot.top} width={plot.right - lineX} height={plot.bottom - plot.top} />
        </>
      )}
      {lineY !== null && (
        <>
          <rect className="region-a" x={plot.left} y={lineY} width={plot.right - plot.left} height={plot.bottom - lineY} />
          <rect className="region-b" x={plot.left} y={plot.top} width={plot.right - plot.left} height={lineY - plot.top} />
        </>
      )}

      {Array.from({ length: 4 }, (_, x) => (
        <g key={`x-${x}`}>
          <line className="grid-line" x1={xAt(x)} x2={xAt(x)} y1={plot.top} y2={plot.bottom} />
          <text className="tick" x={xAt(x)} y={plot.bottom + 31}>{x}</text>
        </g>
      ))}
      {Array.from({ length: 6 }, (_, y) => (
        <g key={`y-${y}`}>
          <line className="grid-line" x1={plot.left} x2={plot.right} y1={yAt(y)} y2={yAt(y)} />
          <text className="tick" x={plot.left - 27} y={yAt(y) + 6}>{y}</text>
        </g>
      ))}

      {focusLeft && (
        <>
          <rect className="excluded-zone" x={firstLineX} y={plot.top} width={plot.right - firstLineX} height={plot.bottom - plot.top} />
          <line className="fixed-line" x1={firstLineX} x2={firstLineX} y1={plot.top} y2={plot.bottom} />
          <text className="excluded-label" x={(firstLineX + plot.right) / 2} y={plot.top + 36}>1차 분할에서 분류된 영역</text>
        </>
      )}

      {cells.map((cell) => (
        <g className="grid-cell" transform={`translate(${xAt(cell.x)} ${yAt(cell.y)})`} key={`${cell.x}-${cell.y}`}>
          {cell.normal > 0 && (
            <g transform={`translate(${cell.hack ? -22 : 0} 0)`}>
              <circle className="normal-dot" r="22" />
              <text>✓{cell.normal}</text>
            </g>
          )}
          {cell.hack > 0 && (
            <g transform={`translate(${cell.normal ? 22 : 0} 0)`}>
              <circle className="hack-dot" r="22" />
              <text>!{cell.hack}</text>
            </g>
          )}
        </g>
      ))}

      {lineX !== null && (
        <>
          <line className="split-line" x1={lineX} x2={lineX} y1={plot.top} y2={plot.bottom} />
          <g className="line-label" transform={`translate(${lineX} ${plot.top + 12})`}>
            <rect x="-55" y="-22" width="110" height="34" rx="17" />
            <text y="1">X = {threshold?.toFixed(1)}</text>
          </g>
        </>
      )}
      {lineY !== null && (
        <>
          <line
            className="split-line"
            x1={plot.left}
            x2={focusLeft ? firstLineX : plot.right}
            y1={lineY}
            y2={lineY}
          />
          <g className="line-label" transform={`translate(${plot.left + 52} ${lineY})`}>
            <rect x="-50" y="-17" width="100" height="34" rx="17" />
            <text y="6">Y = {threshold?.toFixed(1)}</text>
          </g>
        </>
      )}

      <text className="axis-label x" x={(plot.left + plot.right) / 2} y={viewHeight - 18}>외부 연결 요소 수 (X)</text>
      <text className="axis-label y" transform={`translate(27 ${(plot.top + plot.bottom) / 2}) rotate(-90)`}>의심 표현 수 (Y)</text>
    </svg>
  );
}

function CandidatePicker({
  axis,
  threshold,
  onSelect,
  restrictAxis,
}: {
  axis: Axis;
  threshold: number;
  onSelect: (axis: Axis, threshold: number) => void;
  restrictAxis?: Axis;
}) {
  const axes: Axis[] = restrictAxis ? [restrictAxis] : ["x", "y"];

  return (
    <div className="candidate-picker">
      <div className="axis-tabs">
        {axes.map((item) => (
          <button
            className={axis === item ? "active" : ""}
            type="button"
            onClick={() => onSelect(item, AXIS_INFO[item].candidates[0])}
            key={item}
          >
            {AXIS_INFO[item].short} · {AXIS_INFO[item].name}
          </button>
        ))}
      </div>
      <div className="snap-controls">
        <span>후보 분할점</span>
        {AXIS_INFO[axis].candidates.map((value) => (
          <button
            className={threshold === value ? "active" : ""}
            type="button"
            onClick={() => onSelect(axis, value)}
            key={value}
          >
            {value.toFixed(1)}
          </button>
        ))}
        <b>격자에 자동 고정</b>
      </div>
    </div>
  );
}

function CountWorksheet({
  result,
  values,
  checked,
  feedback,
  onChange,
  onCheck,
}: {
  result: CandidateResult;
  values: Record<string, string>;
  checked: boolean;
  feedback: string;
  onChange: (key: string, value: string) => void;
  onCheck: () => void;
}) {
  const fields = [
    { key: "leftNormal", label: "이하 · 정상", value: result.leftCounts.normal, tone: "normal" },
    { key: "leftHack", label: "이하 · 해킹", value: result.leftCounts.hack, tone: "hack" },
    { key: "rightNormal", label: "초과 · 정상", value: result.rightCounts.normal, tone: "normal" },
    { key: "rightHack", label: "초과 · 해킹", value: result.rightCounts.hack, tone: "hack" },
  ];

  return (
    <div className="worksheet">
      <div className="worksheet-heading">
        <div>
          <span>점 개수 기록</span>
          <h3>{integerRule(result.axis, result.threshold)}</h3>
        </div>
        <small>그래프의 숫자는 해당 격자점에 겹친 메일 개수입니다.</small>
      </div>
      <div className="count-inputs">
        {fields.map((field) => (
          <label className={field.tone} key={field.key}>
            <span>{field.label}</span>
            <input
              aria-label={field.label}
              inputMode="numeric"
              min="0"
              type="number"
              value={values[field.key] ?? ""}
              disabled={checked}
              onChange={(event) => onChange(field.key, event.target.value)}
            />
          </label>
        ))}
      </div>
      <div className={`worksheet-action ${checked ? "success" : feedback ? "error" : ""}`}>
        <p>{checked ? "개수가 맞습니다. 정보이득을 비교표에 기록했습니다." : feedback || "네 칸을 채운 뒤 정답을 확인하세요."}</p>
        <button className="primary" type="button" disabled={checked} onClick={onCheck}>
          개수 확인 · 정보이득 계산
        </button>
      </div>
    </div>
  );
}

function CalculationReveal({ result }: { result: CandidateResult }) {
  return (
    <div className="calculation-reveal">
      <div>
        <span>이하 집단</span>
        <strong>H = {format(result.leftEntropy)}</strong>
        <small>{result.left.length}개</small>
      </div>
      <i>× {result.left.length}/30</i>
      <div>
        <span>초과 집단</span>
        <strong>H = {format(result.rightEntropy)}</strong>
        <small>{result.right.length}개</small>
      </div>
      <i>× {result.right.length}/30</i>
      <div className="weighted">
        <span>분할 후 H</span>
        <strong>{format(result.weightedEntropy)}</strong>
      </div>
      <div className="gain">
        <span>정보이득</span>
        <strong>0.987 − {format(result.weightedEntropy)} = {format(result.gain)}</strong>
      </div>
    </div>
  );
}

function ComparisonBoard({
  attempts,
  showAll,
  selectedBest,
  predictionAxis,
  predictionThreshold,
  onRevealAll,
  onChooseBest,
}: {
  attempts: Record<string, CandidateResult>;
  showAll: boolean;
  selectedBest: string | null;
  predictionAxis: Axis | null;
  predictionThreshold: number | null;
  onRevealAll: () => void;
  onChooseBest: (key: string) => void;
}) {
  const results = allCandidates(POINTS);
  const attemptedValues = Object.values(attempts);
  const triedAxes = new Set(attemptedValues.map((item) => item.axis));
  const canReveal = attemptedValues.length >= 4 && triedAxes.size === 2;

  return (
    <div className="comparison-board">
      <div className="comparison-heading">
        <div>
          <span>후보 비교표</span>
          <h2>대표 후보 4개를 직접 계산한 뒤 전체 결과를 비교하세요</h2>
        </div>
        <strong>{attemptedValues.length}/4 직접 계산</strong>
      </div>

      <div className="comparison-bars">
        {results.map((result) => {
          const key = candidateKey(result.axis, result.threshold);
          const visible = showAll || attempts[key];
          const predicted = predictionAxis === result.axis && predictionThreshold === result.threshold;
          return (
            <button
              type="button"
              disabled={!showAll}
              onClick={() => onChooseBest(key)}
              className={`${selectedBest === key ? "selected" : ""} ${key === FIRST_BEST_KEY && selectedBest === key ? "correct" : ""}`}
              key={key}
            >
              <div>
                <span>{splitNotation(result.axis, result.threshold)}</span>
                {predicted && <em>나의 예상</em>}
              </div>
              <i><b style={{ width: visible ? `${result.gain / 0.36 * 100}%` : "0%" }} /></i>
              <strong>{visible ? format(result.gain) : "—"}</strong>
            </button>
          );
        })}
      </div>

      {!showAll ? (
        <div className="reveal-all">
          <p>
            {canReveal
              ? "대표 후보 계산을 마쳤습니다. 나머지 후보도 같은 방식으로 계산해 전체 최댓값을 확인하세요."
              : `X축과 Y축을 모두 포함해 ${Math.max(0, 4 - attemptedValues.length)}개 후보를 더 계산하세요.`}
          </p>
          <button className="primary" type="button" disabled={!canReveal} onClick={onRevealAll}>
            전체 후보 계산 결과 펼치기
          </button>
        </div>
      ) : (
        <div className={`best-choice ${selectedBest === FIRST_BEST_KEY ? "success" : selectedBest ? "error" : ""}`}>
          <p>
            {selectedBest === FIRST_BEST_KEY
              ? "정답입니다. X = 1.5에서 정보이득이 가장 큽니다."
              : selectedBest
                ? "정보이득 수치를 다시 비교하세요. 가장 긴 막대를 선택해야 합니다."
                : "정보이득이 가장 큰 후보 막대를 선택하세요."}
          </p>
          {selectedBest === FIRST_BEST_KEY && <strong>첫 질문: 외부 연결 요소 수가 1개 이하인가?</strong>}
        </div>
      )}
    </div>
  );
}

function FirstSplitLab({
  initialAxis,
  initialThreshold,
  predictionAxis,
  predictionThreshold,
  attempts,
  showAll,
  selectedBest,
  onAttempts,
  onShowAll,
  onSelectedBest,
}: {
  initialAxis: Axis;
  initialThreshold: number;
  predictionAxis: Axis | null;
  predictionThreshold: number | null;
  attempts: Record<string, CandidateResult>;
  showAll: boolean;
  selectedBest: string | null;
  onAttempts: (attempts: Record<string, CandidateResult>) => void;
  onShowAll: () => void;
  onSelectedBest: (key: string) => void;
}) {
  const [axis, setAxis] = useState<Axis>(initialAxis);
  const [threshold, setThreshold] = useState(initialThreshold);
  const [values, setValues] = useState<Record<string, string>>({});
  const [checkedKey, setCheckedKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const result = candidate(POINTS, axis, threshold);
  const key = candidateKey(axis, threshold);
  const checked = checkedKey === key || Boolean(attempts[key]);

  function select(nextAxis: Axis, nextThreshold: number) {
    setAxis(nextAxis);
    setThreshold(nextThreshold);
    setFeedback("");
    const previous = attempts[candidateKey(nextAxis, nextThreshold)];
    if (previous) {
      setCheckedKey(candidateKey(nextAxis, nextThreshold));
      setValues({
        leftNormal: String(previous.leftCounts.normal),
        leftHack: String(previous.leftCounts.hack),
        rightNormal: String(previous.rightCounts.normal),
        rightHack: String(previous.rightCounts.hack),
      });
    } else {
      setCheckedKey(null);
      setValues({});
    }
  }

  function checkAnswer() {
    const expected = {
      leftNormal: result.leftCounts.normal,
      leftHack: result.leftCounts.hack,
      rightNormal: result.rightCounts.normal,
      rightHack: result.rightCounts.hack,
    };
    const correct = Object.entries(expected).every(([field, value]) => Number(values[field]) === value);
    if (!correct) {
      setFeedback("한 칸 이상 다릅니다. 격자점의 파란색·주황색 숫자를 다시 더해보세요.");
      return;
    }
    setFeedback("");
    setCheckedKey(key);
    onAttempts({ ...attempts, [key]: result });
  }

  return (
    <section className="page-content wide-page">
      <SectionHeader
        eyebrow="STEP 3 · FIRST SPLIT"
        title="후보 분할점을 직접 계산하고 비교하세요"
        description="선은 후보점 사이를 연속적으로 움직이지 않고, 선택한 격자 후보점에 정확히 고정됩니다."
        time="7분"
      />

      <CandidatePicker axis={axis} threshold={threshold} onSelect={select} />

      <div className="lab-layout">
        <div className="plot-panel">
          <div className="panel-heading">
            <div><span>현재 질문</span><strong>{integerRule(axis, threshold)}</strong></div>
            <ClassLegend />
          </div>
          <GridScatter items={POINTS} axis={axis} threshold={threshold} />
        </div>
        <div className="activity-panel">
          <CountWorksheet
            result={result}
            values={values}
            checked={checked}
            feedback={feedback}
            onChange={(field, value) => setValues((previous) => ({ ...previous, [field]: value }))}
            onCheck={checkAnswer}
          />
          {checked && <CalculationReveal result={result} />}
        </div>
      </div>

      <ComparisonBoard
        attempts={attempts}
        showAll={showAll}
        selectedBest={selectedBest}
        predictionAxis={predictionAxis}
        predictionThreshold={predictionThreshold}
        onRevealAll={onShowAll}
        onChooseBest={onSelectedBest}
      />

      <TeacherPrompt>
        <p>분할선을 한 칸 옮겼을 때 <b>어느 색 점들이 반대 집단으로 이동</b>했습니까?</p>
        <p>정보이득이 커진 이유를 “분할 후 엔트로피”라는 표현을 사용해 설명해보세요.</p>
      </TeacherPrompt>
    </section>
  );
}

function SecondSplitLab({
  visited,
  selectedBest,
  onVisited,
  onSelectedBest,
}: {
  visited: number[];
  selectedBest: number | null;
  onVisited: (values: number[]) => void;
  onSelectedBest: (value: number | null) => void;
}) {
  const leftParent = useMemo(() => candidate(POINTS, "x", 1.5).left, []);
  const [threshold, setThreshold] = useState(0.5);
  const results = AXIS_INFO.y.candidates.map((value) => candidate(leftParent, "y", value));
  const current = candidate(leftParent, "y", threshold);
  const allVisited = visited.length === AXIS_INFO.y.candidates.length;

  function inspect(value: number) {
    setThreshold(value);
    if (!visited.includes(value)) onVisited([...visited, value]);
    onSelectedBest(null);
  }

  function chooseBest(value: number) {
    onSelectedBest(value);
  }

  return (
    <section className="page-content wide-page">
      <SectionHeader
        eyebrow="STEP 4 · SECOND SPLIT"
        title="혼합된 왼쪽 집단을 한 번 더 나누세요"
        description="1차 질문에서 X가 1개 이하였던 23개 데이터만 대상으로 Y축 후보 5개를 다시 비교합니다."
        time="4분"
      />

      <div className="node-context">
        <div><span>1차 질문</span><strong>외부 연결 요소 수가 1개 이하인가?</strong></div>
        <i>예</i>
        <div><span>현재 노드</span><strong>23개 · 정상 17 · 해킹 6 · H = {format(entropy(leftParent))}</strong></div>
      </div>

      <CandidatePicker axis="y" threshold={threshold} restrictAxis="y" onSelect={(_, value) => inspect(value)} />

      <div className="second-layout">
        <div className="plot-panel">
          <div className="panel-heading">
            <div><span>현재 질문</span><strong>{integerRule("y", threshold)}</strong></div>
            <ClassLegend />
          </div>
          <GridScatter items={leftParent} axis="y" threshold={threshold} focusLeft />
        </div>

        <div className="second-comparison">
          <div className="comparison-heading">
            <div><span>2차 후보 비교</span><h2>각 후보점을 눌러 변화 확인</h2></div>
            <strong>{visited.length}/5 확인</strong>
          </div>
          <div className="second-results">
            {results.map((result) => {
              const seen = visited.includes(result.threshold);
              return (
                <button
                  type="button"
                  onClick={() => inspect(result.threshold)}
                  className={threshold === result.threshold ? "active" : ""}
                  key={result.threshold}
                >
                  <span>Y ≤ {result.threshold.toFixed(1)}</span>
                  <i><b style={{ width: seen ? `${result.gain / 0.28 * 100}%` : "0%" }} /></i>
                  <strong>{seen ? format(result.gain) : "눌러보기"}</strong>
                </button>
              );
            })}
          </div>

          <div className="current-split-counts">
            <div className="normal"><span>이하 집단</span><strong>정상 {current.leftCounts.normal} · 해킹 {current.leftCounts.hack}</strong></div>
            <div className="hack"><span>초과 집단</span><strong>정상 {current.rightCounts.normal} · 해킹 {current.rightCounts.hack}</strong></div>
          </div>

          <div className="second-choice">
            <p>{allVisited ? "정보이득이 가장 큰 후보를 선택하세요." : "5개 후보점을 모두 눌러 정보이득을 비교하세요."}</p>
            <div>
              {AXIS_INFO.y.candidates.map((value) => (
                <button type="button" disabled={!allVisited} onClick={() => chooseBest(value)} key={value}>
                  {value.toFixed(1)}
                </button>
              ))}
            </div>
            {selectedBest !== null && (
              <strong className={selectedBest === SECOND_BEST_THRESHOLD ? "correct" : "wrong"}>
                {selectedBest === SECOND_BEST_THRESHOLD
                  ? "정답: Y = 2.5 · 정보이득 0.266"
                  : "다시 확인: 가장 긴 막대의 후보점을 선택하세요."}
              </strong>
            )}
          </div>
        </div>
      </div>

      {selectedBest === SECOND_BEST_THRESHOLD && (
        <div className="tree-summary">
          <div className="root-node"><span>질문 1</span><strong>외부 연결 요소 ≤ 1개?</strong><small>IG 0.352</small></div>
          <div className="tree-row">
            <article>
              <b>예 · 23개</b>
              <div className="child-node"><span>질문 2</span><strong>의심 표현 ≤ 2개?</strong><small>IG 0.266</small></div>
              <div className="leaf-row"><em className="normal">예 → 정상 예측</em><em className="hack">아니오 → 해킹 예측</em></div>
            </article>
            <article className="direct-leaf"><b>아니오 · 7개</b><em className="hack">해킹 예측</em></article>
          </div>
        </div>
      )}

      <TeacherPrompt>
        <p>2차 분할에서는 왜 전체 30개가 아니라 <b>왼쪽 노드의 23개</b>만 다시 계산합니까?</p>
        <p>Y = 2.5가 실제 질문에서는 “의심 표현이 2개 이하인가?”가 되는 이유를 설명해보세요.</p>
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
        eyebrow="STEP 5 · APPLY & REVIEW"
        title="완성한 질문으로 신규 메일을 분류하세요"
        description="각 데이터가 어떤 질문과 가지를 통과하는지 말한 뒤 최종 클래스를 선택하세요."
        time="3분"
      />

      <div className="final-tree">
        <div className="final-root"><span>질문 1</span><strong>외부 연결 요소 ≤ 1개?</strong></div>
        <div className="final-branches">
          <article>
            <b>예</b>
            <div><span>질문 2</span><strong>의심 표현 ≤ 2개?</strong></div>
            <p><em className="normal">예 → 정상</em><em className="hack">아니오 → 해킹</em></p>
          </article>
          <article><b>아니오</b><em className="hack">해킹</em></article>
        </div>
      </div>

      <div className="test-grid">
        {TEST_POINTS.map((point) => {
          const answer = answers[point.id];
          const path = point.x <= 1
            ? `X=${point.x} → 예 · Y=${point.y} → ${point.y <= 2 ? "예" : "아니오"}`
            : `X=${point.x} → 아니오`;
          return (
            <article className={answer ? (answer === point.label ? "correct" : "wrong") : ""} key={point.id}>
              <div className="test-title"><span>{point.id}</span><div><h2>{point.title}</h2><p>X = {point.x} · Y = {point.y}</p></div></div>
              <div className="test-path">{answer ? path : "먼저 질문을 따라가 보세요."}</div>
              <div className="test-actions">
                <button type="button" onClick={() => onAnswer(point.id, "normal")}>✓ 정상 메일</button>
                <button type="button" onClick={() => onAnswer(point.id, "hack")}>! 해킹메일</button>
              </div>
              {answer && <strong>{answer === point.label ? "정답" : "다시 생각해보세요"}</strong>}
            </article>
          );
        })}
      </div>

      {completed && (
        <div className={`score-banner ${score === TEST_POINTS.length ? "perfect" : ""}`}>
          <span>신규 메일 분류 결과</span>
          <strong>{score} / {TEST_POINTS.length}</strong>
          <p>{score === TEST_POINTS.length ? "모든 데이터의 질문 경로를 정확히 따라갔습니다." : "오답 카드의 질문 경로를 다시 확인하세요."}</p>
        </div>
      )}

      <div className="key-review">
        <article><span>① 후보점</span><strong>서로 다른 관측값 사이의 중간 지점</strong><p>연속적으로 아무 위치나 선택하지 않고 유한한 후보를 비교</p></article>
        <article><span>② 질문 선택</span><strong>정보이득이 가장 큰 후보</strong><p>분할 후 엔트로피를 가장 많이 감소시키는 질문</p></article>
        <article><span>③ 반복</span><strong>각 하위 노드에서 다시 비교</strong><p>현재 노드의 데이터만으로 다음 질문을 선택</p></article>
      </div>

      <TeacherPrompt label="마무리 설명">
        <p>오늘 만든 트리의 첫 질문과 두 번째 질문을 순서대로 말해보세요.</p>
        <p>“격자 후보점”, “분할 후 엔트로피”, “정보이득”을 사용해 질문이 선택된 과정을 한 문장으로 정리해보세요.</p>
      </TeacherPrompt>
    </section>
  );
}

export default function ScatterLab() {
  const [stage, setStage] = useState(0);
  const [maxStage, setMaxStage] = useState(0);
  const [predictionAxis, setPredictionAxis] = useState<Axis | null>(null);
  const [predictionThreshold, setPredictionThreshold] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<Record<string, CandidateResult>>({});
  const [showAll, setShowAll] = useState(false);
  const [firstBest, setFirstBest] = useState<string | null>(null);
  const [secondVisited, setSecondVisited] = useState<number[]>([]);
  const [secondBest, setSecondBest] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, Label>>({});

  const initialAxis = predictionAxis ?? "x";
  const initialThreshold = predictionThreshold ?? AXIS_INFO[initialAxis].candidates[0];

  function go(next: number) {
    setStage(next);
    setMaxStage((previous) => Math.max(previous, next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function restart() {
    setStage(0);
    setMaxStage(0);
    setPredictionAxis(null);
    setPredictionThreshold(null);
    setAttempts({});
    setShowAll(false);
    setFirstBest(null);
    setSecondVisited([]);
    setSecondBest(null);
    setAnswers({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const canNext =
    stage === 0 ||
    (stage === 1 && predictionAxis !== null && predictionThreshold !== null) ||
    (stage === 2 && firstBest === FIRST_BEST_KEY) ||
    (stage === 3 && secondBest === SECOND_BEST_THRESHOLD);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span>DT</span>
          <div><small>인공지능 개론</small><strong>8. 의사결정 나무 실습</strong></div>
        </div>
        <div className="session-badge"><span>참여형 실습</span><strong>약 20분</strong></div>
        <button className="restart-button" type="button" onClick={restart}>↻ 처음부터</button>
      </header>

      <nav className="progress-nav" aria-label="실습 진행 단계">
        {STAGES.map((item, index) => (
          <button
            className={`${stage === index ? "active" : ""} ${index < stage ? "done" : ""}`}
            type="button"
            disabled={index > maxStage}
            onClick={() => index <= maxStage && go(index)}
            key={item.label}
          >
            <b>{index < stage ? "✓" : index + 1}</b>
            <span>{item.label}<small>{item.time}</small></span>
          </button>
        ))}
      </nav>

      {stage === 0 && <DataOverview />}
      {stage === 1 && (
        <CandidateLesson
          predictionAxis={predictionAxis}
          predictionThreshold={predictionThreshold}
          onPrediction={(axis, threshold) => {
            setPredictionAxis(axis);
            setPredictionThreshold(threshold);
          }}
        />
      )}
      {stage === 2 && (
        <FirstSplitLab
          initialAxis={initialAxis}
          initialThreshold={initialThreshold}
          predictionAxis={predictionAxis}
          predictionThreshold={predictionThreshold}
          attempts={attempts}
          showAll={showAll}
          selectedBest={firstBest}
          onAttempts={setAttempts}
          onShowAll={() => setShowAll(true)}
          onSelectedBest={setFirstBest}
        />
      )}
      {stage === 3 && (
        <SecondSplitLab
          visited={secondVisited}
          selectedBest={secondBest}
          onVisited={setSecondVisited}
          onSelectedBest={setSecondBest}
        />
      )}
      {stage === 4 && (
        <ApplyAndReview
          answers={answers}
          onAnswer={(id, label) => setAnswers((previous) => ({ ...previous, [id]: label }))}
        />
      )}

      <footer className="page-footer">
        <button type="button" disabled={stage === 0} onClick={() => go(stage - 1)}>← 이전 단계</button>
        <p>※ 가상의 학습 데이터이며 실제 보안 판정 기준이 아닙니다.</p>
        {stage < STAGES.length - 1 ? (
          <button className="primary" type="button" disabled={!canNext} onClick={() => go(stage + 1)}>
            {stage === 0 ? "후보점 찾기 시작 →" : stage === 1 ? "예상 저장 · 직접 계산 →" : stage === 2 ? "2차 분할 계속 →" : "신규메일 분류 →"}
          </button>
        ) : (
          <button className="primary" type="button" onClick={restart}>실습 다시 시작</button>
        )}
      </footer>
    </main>
  );
}
