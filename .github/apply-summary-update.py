from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Could not find expected block: {label}")
    return text.replace(old, new, 1)


page_path = Path("summary-app/page.tsx")
page = page_path.read_text(encoding="utf-8")

sixth_item = '''  {
    id: 6,
    kind: "order",
    scored: false,
    instruction:
      "이 문제는 점수에 포함하지 않습니다. 전체가 함께 순서를 맞춰보세요.",
    question:
      "ID3 알고리즘에서 분할 속성을 선택하고 데이터를 나누는 네 단계를 올바른 순서로 배열하세요.",
    explanation:
      "실제값이 섞인 하위 노드에서는 후보 속성 확인부터 데이터 분할까지의 네 단계를 반복하고, h(D) = 0이면 리프 노드로 확정합니다.",
  },
'''
page = replace_once(page, sixth_item, "", "quiz item 6")

summary_start = page.index('function Summary({ start }: { start: () => void }) {')
summary_end = page.index('\nfunction CadetSetup(', summary_start)
new_summary = '''function Summary({ start }: { start: () => void }) {
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
'''
page = page[:summary_start] + new_summary + page[summary_end:]
page = replace_once(
    page,
    '<p>5개 확인 퀴즈와 전체 공동 풀이를 통해 ID3의 핵심 흐름을 확인했습니다.</p>',
    '<p>5개 확인 퀴즈를 통해 엔트로피와 정보이득의 핵심 개념을 확인했습니다.</p>',
    "completion description",
)
page_path.write_text(page, encoding="utf-8")

main_path = Path("static-site/summary/main.tsx")
main = main_path.read_text(encoding="utf-8")
main = replace_once(
    main,
    'import "../../summary-app/globals.css";\n',
    'import "../../summary-app/globals.css";\nimport "../../summary-app/formula-summary.css";\n',
    "summary css import",
)
main_path.write_text(main, encoding="utf-8")

index_path = Path("static-site/summary/index.html")
index = index_path.read_text(encoding="utf-8")
index = replace_once(
    index,
    "의사결정 트리의 엔트로피, 정보이득, ID3 핵심 개념을 정리하고 확인 퀴즈를 푸는 수업용 자료입니다.",
    "의사결정 트리의 엔트로피, 가중평균 엔트로피, 정보이득 공식을 정리하고 확인 퀴즈를 푸는 수업용 자료입니다.",
    "summary meta description",
)
index_path.write_text(index, encoding="utf-8")

css = r'''
.formula-summary-page{padding-bottom:32px}.formula-summary{margin-top:18px}.formula-concepts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.formula-card{min-width:0;min-height:330px;padding:0;display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--line);border-top:6px solid var(--blue);border-radius:16px;background:#fff;box-shadow:0 7px 22px #142c4f12}.formula-card.weighted-card{border-top-color:#566f9f}.formula-card.gain-card{border-top-color:var(--orange)}.formula-card-title{min-height:92px;padding:22px 25px 18px;display:flex;align-items:center;gap:13px;border-bottom:1px solid #e3eaf1}.formula-card-title>span{width:38px;height:38px;display:grid;place-items:center;flex:0 0 auto;border-radius:50%;color:#fff;background:var(--blue);font-size:14px;font-weight:950}.weighted-card .formula-card-title>span{background:#566f9f}.gain-card .formula-card-title>span{background:var(--orange)}.formula-card-title h2{margin:0;color:var(--ink);font-size:clamp(25px,2vw,32px);letter-spacing:-.04em}.summary-formula{min-width:0;flex:1;padding:34px 20px 40px;display:flex;align-items:center;justify-content:center;text-align:center}.summary-formula .equation{min-width:0;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;column-gap:.16em;row-gap:.5em;color:var(--navy);font-size:clamp(28px,2.35vw,42px);font-weight:650;line-height:1.35}.summary-formula .weighted-equation{font-size:clamp(24px,1.85vw,34px)}.summary-formula sub{font-size:.6em;line-height:0}.sigma{position:relative;width:1.48em;height:1.75em;margin:0 .12em;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto}.sigma>b{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:1.55em;font-weight:400;line-height:1}.sigma>sup,.sigma>sub{position:absolute;left:50%;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:.34em;font-style:italic;font-weight:600;line-height:1;white-space:nowrap;transform:translateX(-50%)}.sigma>sup{top:-.04em}.sigma>sub{bottom:-.12em}.sigma-wide{width:3.9em;margin-right:.25em}.sigma-wide>sub{bottom:-.28em;font-size:.29em}.fraction{min-width:2.35em;margin:0 .12em;display:inline-grid;grid-template-rows:auto auto;align-items:center;justify-items:center;flex:0 0 auto;line-height:1.05}.fraction>span:first-child{width:100%;padding:0 .12em .12em;border-bottom:.065em solid currentColor}.fraction>span:last-child{padding-top:.12em}.formula-summary-page .summary-action{margin-top:18px}@media(max-width:980px){.formula-concepts{grid-template-columns:1fr}.formula-card{min-height:220px}.formula-card-title{min-height:76px;padding:16px 20px}.summary-formula{padding:24px 16px 30px}.summary-formula .equation,.summary-formula .weighted-equation{font-size:clamp(25px,5vw,36px)}}@media(max-width:560px){.formula-summary-page{width:min(100% - 24px,1380px);margin-top:12px}.formula-summary-page .summary-title{padding:18px 20px;border-radius:14px}.formula-summary-page .summary-title>span{font-size:22px}.formula-concepts{gap:12px}.formula-card{min-height:202px;border-radius:13px}.formula-card-title{min-height:68px;padding:14px 16px;gap:10px}.formula-card-title>span{width:32px;height:32px;font-size:12px}.formula-card-title h2{font-size:23px}.summary-formula{padding:22px 10px 28px}.summary-formula .equation{font-size:clamp(22px,7vw,30px)}.summary-formula .weighted-equation{font-size:clamp(19px,5.8vw,25px)}}
'''.lstrip()
Path("summary-app/formula-summary.css").write_text(css, encoding="utf-8")
