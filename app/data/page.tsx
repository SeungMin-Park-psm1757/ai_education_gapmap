import { DataRequired } from "@/components/data-required";
import { DataTrustPanel } from "@/components/data-trust-panel";
import { MetricCard } from "@/components/metric-card";
import { SectionHeader } from "@/components/section-header";
import { getManifest, getReadinessScores, getSchools } from "@/lib/data-loader";

const sourceRows = [
  ["NEIS 학교 기본정보", "NEIS 교육정보 개방 포털", "예", "학교명, 학교급, 교육지원청, 주소", "학교 식별 및 기본 분모 구성", "UI 익명화", "예"],
  ["학교알리미 공시자료", "학교알리미", "예", "학생 수, 교원 수, 학급 수, 시설·프로그램 공시", "직접지표와 일부 대체지표 산출", "UI 익명화", "예"],
  ["공공데이터포털 학교 표준자료(MVP 익명화 조치)", "공공데이터포털", "예", "학교명, 주소 대조, 기관 구분", "공시자료 대조 및 기관 구분", "UI 익명화", "예"],
  ["교육통계·교육청 공개자료", "교육통계·교육청 공개자료", "예", "시설, 정보화, 프로그램 관련 공개자료", "보강 영역 산출 또는 보조", "집계 단위 사용", "예 또는 보조"],
  ["확장진단 시나리오 데이터", "공모전 목적 상 방법론만 제시", "아니오", "AI 디지털교과서(AIDT), 학습관리시스템(LMS), 연수, AI 관련 기기 및 프로그램 접근성", "추가자료 제공 시 가능한 분석 구조 설명", "실명 미사용", "아니오"]
];

const sourceColumnClasses = [
  "w-[170px]",
  "w-[170px]",
  "w-[120px]",
  "w-[290px]",
  "w-[260px]",
  "w-[150px]",
  "w-[130px]"
];

const processRows = [
  "원천 데이터 수집",
  "학교 ID 기준 정규화",
  "결측·중복 점검",
  "지표별 0~100 정규화",
  "지원 소요 지수 산출",
  "신뢰도 배지 분리"
];

const formulaRows = [
  ["교육 수요·취약 여건", "25점", "학생 수, 학급 수 등 지원 수요"],
  ["교원·운영 여건", "20점", "교원 배치와 운영 부담"],
  ["디지털·학습공간 기반", "20점", "기기·무선망·학습공간 보강 필요"],
  ["AI·SW 학습기회", "20점", "방과후·동아리·프로그램 접근성"],
  ["지역 지원 접근성", "15점", "학교 밖 자원 연계 필요성"]
];

const aiRows = [
  ["취약 요인 자동 라벨링", "산출된 영역 점수를 설명 가능한 보강 요인으로 정리"],
  ["유사 학교군 분류", "학교급과 지표 패턴이 비슷한 학교군을 비교 가능하게 묶음"],
  ["지원 유형 매칭", "취약 요인에 맞춰 예산, 연수, 프로그램, 자료 보완 유형을 연결"],
  ["상세 보고서 설명문 생성 보조", "학교별 점수 근거와 조치 방안을 읽기 쉬운 문장으로 요약"],
  ["제출자료 문구 정리 보조", "대회 제출용 README, 보고서, 화면 문구를 일관된 용어로 정리"]
];

export default function DataPage() {
  const manifest = getManifest();
  const schools = getSchools();
  const scores = getReadinessScores();
  const hasData = schools.length > 0 && scores.length > 0;
  const scenarioCount = manifest.counts?.scenarioDiagnostics ?? 0;

  return (
    <div>
      <SectionHeader
        eyebrow="데이터와 AI 활용"
        title="공개자료 기반 산식과 AI 보조 역할"
        description="메인 지원 소요 지수는 공개 교육 공공데이터 기반 1단계 진단입니다. 확장진단 시나리오 데이터는 가정사항으로, 메인 지수에 반영하지 않습니다."
      />
      {!hasData ? <DataRequired /> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="정규화 학교" value={schools.length} />
        <MetricCard label="지원 소요 산출" value={scores.length} />
        <MetricCard label="확장진단 시나리오(예시)" value={scenarioCount} />
        <MetricCard label="데이터 경고" value={manifest.warnings?.length ?? 0} />
      </div>

      <div className="mt-6">
        <DataTrustPanel />
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-black text-slate-950">활용 데이터 표</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          공공데이터 활용 사실은 유지하되, 공모전 제출 화면에서는 학교 식별정보를 익명화합니다.
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[1290px] table-fixed text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black text-slate-500">
              <tr>
                {["데이터명", "출처", "교육 공공데이터 여부", "사용 항목", "활용 목적", "개인정보·식별정보 처리", "메인 지수 반영 여부"].map((header, index) => (
                  <th key={header} className={`px-4 py-3 align-top ${sourceColumnClasses[index]}`}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sourceRows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, index) => (
                    <td key={`${row[0]}-${index}`} className={`px-4 py-3 align-top leading-6 text-slate-600 ${sourceColumnClasses[index]}`}>
                      {index === 0 ? <span className="font-black text-slate-950">{cell}</span> : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-black text-slate-950">전처리·정규화 절차</h2>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {processRows.map((text, index) => (
              <div key={text} className="flex items-center gap-2">
                <span className="rounded-md bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">{text}</span>
                {index < processRows.length - 1 ? <span className="text-slate-300">→</span> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-black text-slate-950">지원 소요 지수 산식</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            지원 소요 지수는 공개자료상 지원 필요 신호를 보기 위한 1단계 진단 지표입니다.
          </p>
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

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
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
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-black text-slate-950">데이터 신뢰도 처리</h2>
          <div className="mt-4 space-y-3">
            <p className="rounded-lg bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700">
              데이터 신뢰도는 학교 역량이 아니라 해석의 확실성이므로 총점에 섞지 않고 별도 배지로 표시합니다.
            </p>
            <p className="rounded-lg bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700">
              신뢰도 C는 점수와 관계없이 현장 우선확인 필요로 분리합니다.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-black text-slate-950">AI 활용 위치</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            AI는 공개자료 기반 산출 결과를 더 쉽게 해석하고 설명하는 보조 도구로 사용됩니다.
          </p>
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
          <h2 className="text-xl font-black text-slate-950">확장진단 시나리오(예시)</h2>
          <div className="mt-4 grid gap-3">
            {[
              ["메인 지수 반영", "아니오. 공개 공공데이터 기반 1단계 지수에 섞지 않습니다."],
              ["용도", "학교·교육청 추가자료가 제공될 경우 가능한 분석 구조를 보여주는 예시입니다."],
              ["항목", "AI 디지털교과서(AIDT) 접속 안정성, 학습관리시스템(LMS) 사용 지속성, 교원 연수 이수,\n기기 접근성, AI·SW 프로그램 운영, 외부 AI프로그램 접근성"],
              ["실제 운영", "학교별 엑셀·CSV 또는 교육청 시스템 연계자료가 제공되면 같은 구조로 정밀 진단할 수 있습니다."]
            ].map(([label, text]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">{label}</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
