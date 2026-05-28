import Link from "next/link";
import { DataRequired } from "@/components/data-required";
import { MetricCard } from "@/components/metric-card";
import { SectionHeader } from "@/components/section-header";
import { getReadinessScores, getSchools } from "@/lib/data-loader";
import { COPY } from "@/lib/copy";
import { getRegionLabel } from "@/lib/anonymize";

export default function HomePage() {
  const schools = getSchools();
  const scores = getReadinessScores();
  const hasData = schools.length > 0 && scores.length > 0;
  const regionLabel = getRegionLabel();

  return (
    <div>
      <SectionHeader
        eyebrow="교육 공공데이터 AI 활용대회 MVP"
        title={COPY.productName}
        description={COPY.subtitle}
      />

      {!hasData ? <DataRequired /> : null}

      {hasData ? (
        <>
          <section className="mb-6 rounded-lg border border-blue-100 bg-white p-5 shadow-soft">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">공개자료 기반</span>
              <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">학교명 익명화</span>
              <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">지원 소요 진단</span>
              <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">확장진단 시나리오 분리</span>
            </div>
            <p className="mt-4 max-w-4xl text-sm font-bold leading-6 text-slate-700">
              공개 교육 공공데이터로 학교별 지원 필요 신호를 결합해, 교육청이 예산·연수·프로그램·자료 보완을 어디에 먼저 검토할지 돕습니다.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                ["공개 공공데이터", "NEIS, 학교알리미,\n교육통계, 교육청 공개자료"],
                ["AI 활용", "취약 요인 라벨링, 유사 학교군 분류,\n지원 유형 매칭"],
                ["지원소요 산출", "예산·연수·프로그램·자료 보완 검토 순서 제안"]
              ].map(([title, text]) => (
                <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black text-blue-700">{title}</p>
                  <p className="mt-2 whitespace-pre-line text-sm font-bold leading-6 text-slate-800">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "분석 학교", value: schools.length, helper: `${regionLabel} 공개자료 기준` },
              { label: "우선 지원 검토", value: scores.filter((s) => s.level === "attention").length },
              { label: "보완 검토", value: scores.filter((s) => s.level === "medium").length },
              { label: "현장 확인 우선", value: scores.filter((s) => s.level === "field_check").length }
            ].map((metric) => (
              <MetricCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} />
            ))}
          </div>

          <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-black text-slate-950">점수가 높을수록 공개자료상 지원 필요 신호가 큽니다.</h2>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-600">
              확장진단 시나리오 데이터는 메인 지원 소요 지수에 반영하지 않고, 추가자료 제공 시 가능한 분석 구조로만 설명합니다.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/map" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
                AI 교육격차 지도로 확인
              </Link>
              <Link href="/priorities" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">
                조치 방안 보기
              </Link>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
