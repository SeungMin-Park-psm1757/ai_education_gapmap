# API 키와 사용자 조치

## 현재 연결됨

### NEIS_API_KEY

- 발급처: 나이스 교육정보 개방 포털
- 용도: `schoolInfo` 학교기본정보 전체 수집
- 현재 상태: `.env.local`에 입력됨

### SCHOOLINFO_API_KEY

- 발급처: 학교알리미 Open API
- 발급 절차: 학교알리미에서 SNS 로그인 후 인증키를 발급받고, 발급된 키는 나의 정보 조회에서 확인합니다.
- 용도: 학생 수, 교원 수, 학급 수, 직위별 교원 현황 등 학교 공시정보 수집
- 입력 위치: `.env.local`의 `SCHOOLINFO_API_KEY`
- 현재 코드 상태: API 자동 수집 연결됨. 2026년 공시가 아직 공개 전이어서 기본값은 2025년 공시 기준입니다.

### DATA_GO_KR_SERVICE_KEY

- 발급처: 공공데이터포털
- 용도: `전국초중등학교위치표준데이터` 표준 API 전체 조회
- 입력 위치: `.env.local`의 `DATA_GO_KR_SERVICE_KEY`
- 현재 코드 상태: API 자동 수집 연결됨. 학교별 위경도 좌표를 격차지도 배치에 사용합니다.

## 사용자가 추가 조치할 항목

- 현재 필수 API 키 조치는 없습니다.

## CSV로 대체 가능한 항목

자동 API가 없거나 더 세밀한 공개자료를 반영하려면 실제 다운로드 CSV 경로를 `.env.local`에 입력해도 됩니다.

- `SCHOOLINFO_PUBLIC_CSV_PATH`: 학생 수, 교원 수, 학급 수
- `SCHOOL_FACILITY_CSV_PATH`: 시설 신호
- `DIGITAL_INFRA_CSV_PATH`: 디지털 인프라 신호
- `AI_PROGRAM_CSV_PATH`: AI·디지털 교육 운영 신호
- `TEACHER_TRAINING_CSV_PATH`: 교원 연수 신호
- `AI_CENTER_CSV_PATH`, `SW_AI_CAMP_CSV_PATH`, `PUBLIC_LEARNING_CENTER_CSV_PATH`: 지역 지원 접근성
