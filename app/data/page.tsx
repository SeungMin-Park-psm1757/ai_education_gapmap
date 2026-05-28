import { DataRequired } from "@/components/data-required";
import { DataTrustPanel } from "@/components/data-trust-panel";
import { MetricCard } from "@/components/metric-card";
import { SectionHeader } from "@/components/section-header";
import { getManifest, getReadinessScores, getSchools } from "@/lib/data-loader";

const sourceRows = [
  ["NEIS 학교 기본정보", "학교명, 학교급, 교육지원청, 주소", "공공누리·공공데이터포털 정책에 따름", "학교 식별 및 기본 분모 구성"],
  ["학교알리미 공시자료", "학생 수, 교원 수, 학급 수, 시설·프로그램 공시", "학교알리미 공개자료 이용 기준", "직접지표와 일부 대체지표 산출"],
  ["교육통계·교육청 공개자료", "학교 시설, 정보화, AI·SW 프로그램 관련 공개자료", "출처별 공개자료 이용 기준", "보강 영역 산출"],
  ["지역 학습자원 공개자료", "AI·SW 센터, 캠프, 공공 학습공간", "공공데이터 제공기관 기준", "지역 지원 접근성 보조"]
];

const processRows = [
  ["수집", "학교 기본정보와 공시자료를 학교명·주소 기준으로 결합"],
  ["정제", "학력인정 평생교육시설 2개교 제외, 결측·중복 항목 점검"],
  ["정규화", "비율·개수·접근 신호를 0-100 범위로 변환"],
  ["분류", "신뢰도 C가 있을 경우 점수 순위에서 분리"]
];

const formulaRows = [
  ["교육 수요", "25점", "학생 수, 학급 수 등 지원 수요"],
  ["교원·운영 여건", "20점", "교원 배치와 운영 부담"],
  ["디지털·학습공간 기반", "20점", "기기·무선망·학습공간 보강 필요"],
  ["AI·SW 학습기회", "20점", "방과후·동아리·프로그램 접근성"],
  ["지역 지원 접근성", "15점", "학교 밖 자원 연계 필요성"]
];

const aiRows = [
  ["규칙 기반 산식", "5개 영역 가중치와 신뢰도 분류는 명시 산식으로 계산"],
  ["AI 요약·분류", "취약 요인 자동 라벨링, 유사 학교군 분류, 지원 유형 매칭"],
  ["보고서 보조", "상세 보고서 설명문과 조치 방안 문구 생성 보조"],
  ["역할 구분", "AI 역할은 공개자료 해석, 유형 분류, 설명문 작성 보조"]
];

export default function DataPage() {
  const manifest = getManifest();
  const schools = getSchools();
  const scores = getReadinessScores();
  const hasData = schools.length > 0 && scores.length > 0;

  return (
    <div>
      <SectionHeader
        eyebrow="데이터와 AI 활용"
        title="공개자료와 산식을 공개합니다"
        description="점수가 높을수록 AI교육을 위한 우선 지원이 필요합니다. 이 화면에서는 데이터, 산식, AI 보조 역할을 확인합니다."
      />
      {!hasData ? <DataRequired /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="정규화 학교" value={schools.length} />
        <MetricCard label="지원 소요 산출" value={scores.length} />
        <MetricCard label="데이터 경고" value={manifest.warnings?.length ?? 0} />
      </div>

      <div className="mt-6">
        <DataTrustPanel />
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-black text-slate-950">활용 데이터 표</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">공공데이터 활용 사실은 유지하되, 공모전 제출 화면에서는 학교 식별정보를 익명화합니다.</p>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <div className="hidden grid-cols-[180px_1.1fr_1fr_1fr] bg-slate-50 px-4 py-3 text-xs font-black text-slate-500 md:grid">
            <span>출처</span>
            <span>사용 항목</span>
            <span>라이선스·이용 기준</span>
            <span>활용 목적</span>
          </div>
          {sourceRows.map(([source, item, license, use]) => (
            <div key={source} className="grid gap-2 border-t border-slate-100 px-4 py-3 text-sm md:grid-cols-[180px_1.1fr_1fr_1fr]">
              <p className="font-black text-slate-950">{source}</p>
              <p className="leading-6 text-slate-600">{item}</p>
              <p className="leading-6 text-slate-600">{license}</p>
              <p className="leading-6 text-slate-600">{use}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-black text-slate-950">전처리·정규화 절차</h2>
          <div className="mt-4 space-y-3">
            {processRows.map(([label, text]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-black text-blue-700">{label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-black text-slate-950">지원 소요 지수 산식</h2>
          <div className="mt-4 space-y-3">
            {formulaRows.map(([label, weight, text]) => (
              <div key={label} className="grid grid-cols-[1fr_72px] gap-3 rounded-lg bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-black text-slate-950">{label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                </div>
                <p className="text-right text-xl font-black text-blue-700">{weight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-black text-slate-950">직접지표와 대체지표</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          {[
            ["직접지표", "학생 수, 교원 수, 학급 수, 시설 수, 프로그램 수"],
            ["대체지표(공개자료 기반)", "교원 운영 여건, AI·SW 학습기회, 지역 접근성"],
            ["추가자료 필요", "AI 수업 활용률, AI 디지털교과서(AIDT) 접속 로그, 학습관리시스템(LMS) 사용빈도, 교원 연수 이력"]
          ].map(([label, text]) => (
            <div key={label} className="grid gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0 md:grid-cols-[160px_1fr]">
              <p className="font-black text-slate-950">{label}</p>
              <p className="leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          신뢰도는 학교 역량이 아니라 데이터 해석의 확실성입니다. 신뢰도 C가 있을 경우 우선지원 목록과 분리해 추가자료 확인 대상으로 표시합니다.
        </p>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-black text-slate-950">AI 활용 위치</h2>
          <div className="mt-4 space-y-3">
            {aiRows.map(([label, text]) => (
              <div key={label} className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-black text-blue-800">{label}</p>
                <p className="mt-1 text-sm leading-6 text-blue-950">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-black text-slate-950">임시 학교데이터와 향후 조사</h2>
          <div className="mt-4 grid gap-3">
            {[
              ["현재 v3", "공모전 목적 임시데이터 98건을 만들어 공공데이터와 결합했습니다."],
              ["학교 조사 항목", "AI 디지털교과서(AIDT) 접속 안정성, 학습관리시스템(LMS) 사용 지속성, 교원 연수 이수, 기기 접근성, AI·SW 프로그램 운영, 외부 AI프로그램 접근성을 조사합니다."],
              ["반영 방법", "학교별 엑셀·CSV를 학교 ID 기준으로 연결하고, 항목별 0-100점 정규화 후 기존 지원 소요 지수에 반영합니다."],
              ["운영 원칙", "학교 제공자료가 들어오면 점수는 갱신하되, 데이터 신뢰도는 총점과 분리해 표시합니다."]
            ].map(([label, text]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">{label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
