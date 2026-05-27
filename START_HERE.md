# START HERE

이 패키지는 교육 공공데이터 AI 활용대회용 `AI 교육격차 지도 MVP`입니다.

## 먼저 이해할 점

- 1단계 지수는 공개자료로 산출한 `지원 소요 지수`입니다.
- 점수가 높을수록 공개자료상 AI 교육 지원이 먼저 필요한 신호가 큽니다.
- 데이터 신뢰도는 총점에 넣지 않고 A/B/C 배지로 분리합니다.
- 신뢰도 C는 `현장 확인 우선`으로 분리해 표시합니다.
- AIDT·LMS 접속로그, 장애시간, 사용빈도는 2단계 확장진단 슬롯으로 둡니다.

## 실행 순서

```bash
npm install
cp .env.example .env.local
npm run prepare:data
npm run check:data
npm run check:copy
npm run dev
```

## 검토 문서

- `docs/MVP_STRUCTURE_REVIEW.md`
- `reports/mvp_refinement_report.md`
- `reports/redteam_response.md`
