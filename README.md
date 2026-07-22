# 의사결정 나무 실습

인공지능 개론 수업에서 사용하는 노코딩 ID3 의사결정나무 실습 사이트입니다.

## 실습 흐름

1. 가상 메일 데이터 30개와 정답 클래스를 관찰합니다.
2. 속성 카드를 끌어 놓고 메일 점이 2개 또는 3개 영역으로 나뉘는 모습을 확인합니다.
3. 데이터의 색상 혼합도, 엔트로피, 정보이득을 비교합니다.
4. 범주형 속성의 정보이득을 계산해 의사결정나무를 완성합니다.
5. 완성한 나무로 신규 메일을 분류합니다.

GitHub Pages: https://xognsdl1019.github.io/information-gain-tree-lab/

산점도 분할 체험: https://xognsdl1019.github.io/information-gain-tree-lab/scatter/

## 로컬 실행

```bash
npm install
npm run dev
```

배포용 빌드는 다음 명령으로 확인할 수 있습니다.

```bash
npm run build
```

모든 데이터와 판정 규칙은 교육을 위해 구성한 가상 사례입니다.
