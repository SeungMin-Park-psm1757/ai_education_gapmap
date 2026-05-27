import { DataRequired } from "@/components/data-required";
import { DataTrustPanel } from "@/components/data-trust-panel";
import { MetricCard } from "@/components/metric-card";
import { SectionHeader } from "@/components/section-header";
import { getManifest, getReadinessScores, getSchools } from "@/lib/data-loader";

export default function DataPage() {
  const manifest = getManifest();
  const schools = getSchools();
  const scores = getReadinessScores();
  const hasData = schools.length > 0 && scores.length > 0;

  return (
    <div>
      <SectionHeader
        eyebrow="데이터와 모델"
        title="공개자료와 추가자료를 분리합니다"
        description="1단계는 공개자료로 지원 소요 지수를 산출하고, 2단계는 학교·교육청 추가자료가 있을 때 AIDT·LMS 운영 안정성을 별도 진단합니다."
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
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-black text-slate-950">지수 산식</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {[
            ["교육 수요·취약 여건", "25점"],
            ["교원·운영 여건", "20점"],
            ["디지털·학습공간 기반", "20점"],
            ["AI·SW 학습기회", "20점"],
            ["지역 지원 접근성", "15점"]
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-700">{label}</p>
              <p className="mt-2 text-2xl font-black text-blue-700">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm leading-7 text-slate-600">
          데이터 신뢰도는 총점에 넣지 않습니다. 신뢰도는 학교의 역량이 아니라 판단의 확실성이므로 점수와 분리해 A/B/C 배지로 표시합니다.
        </p>
      </section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-black text-slate-950">직접지표와 대리지표를 구분합니다</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          {[
            ["직접지표", "학생 수, 교원 수, 학급 수, 시설 수, 프로그램 수"],
            ["대리지표", "교원 운영 여건, AI·SW 학습기회, 지역 접근성"],
            ["추가자료 필요", "실제 AI 수업 활용률, AIDT 접속 로그, LMS 사용빈도, 교원 연수 이력"]
          ].map(([label, text]) => (
            <div key={label} className="grid gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0 md:grid-cols-[160px_1fr]">
              <p className="font-black text-slate-950">{label}</p>
              <p className="leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm leading-7 text-slate-600">
          공개자료만으로 실제 AI 수업의 질을 확정하지 않습니다. 대신 공개자료상 드러나는 지원 필요 신호를 1차로 찾고,
          AIDT·LMS 등 추가자료가 제공되면 2단계 확장진단으로 보완합니다.
        </p>
      </section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-black text-slate-950">2단계 확장진단 슬롯</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ["접속·가동 안정성", "가동률, 로그인 성공률, 접속 실패율"],
            ["장애·복구 대응", "장애건수, 누적 장애시간, 평균 복구시간"],
            ["사용 지속성", "주간·월간 사용빈도, 적용 수업일수"],
            ["적용 범위", "적용 학년·학급 비율, 대상 학생 커버리지"]
          ].map(([label, text]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-700">{label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
