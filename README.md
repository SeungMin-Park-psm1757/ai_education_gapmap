# AI 교육격차 지도 MVP

교육 공공데이터 AI 활용대회용 MVP입니다.

## 제품 정의

AI 교육격차 지도는 공개자료로 학교별 지원 필요 신호를 찾고, 교육청이 예산·연수·프로그램 지원을 어디에 먼저 투입할지 돕는 의사결정 MVP입니다.

## 현재 범위

- 대상: 노원구 학교 100개
- 1단계: 공개자료 기반 `지원 소요 지수`
- 2단계: AIDT·LMS 추가자료 연계 시 운영 안정성 확장진단
- 데이터 신뢰도: 총점에서 제외하고 A/B/C 배지로 표시

## 주요 화면

- `/`: 서비스 목적과 전체 현황
- `/map`: 지도 기반 지원 소요 분포와 우선 지원 TOP 3
- `/priorities`: 학교별 다음 행정 조치
- `/schools/[id]`: 학교 상세 리포트, 점수 근거, 행정 조치, 확장진단 예시
- `/data`: 데이터 출처, 산식, 직접지표와 대리지표 구분

## 실행

```bash
npm install
cp .env.example .env.local
npm run prepare:data
npm run check:data
npm run dev
```

## 검증

```bash
npm run check:copy
npm run typecheck
npm run build
```
