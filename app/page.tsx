import Link from "next/link";
import { DataRequired } from "@/components/data-required";
import { MetricCard } from "@/components/metric-card";
import { SectionHeader } from "@/components/section-header";
import { getManifest, getReadinessScores, getSchools } from "@/lib/data-loader";
import { COPY } from "@/lib/copy";
import { getRegionLabel, isAnonymizeMode } from "@/lib/anonymize";

export default function HomePage() {
  const schools = getSchools();
  const scores = getReadinessScores();
  const manifest = getManifest();
  const hasData = schools.length > 0 && scores.length > 0;
  const regionLabel = getRegionLabel();

  return (
    <div>
      <SectionHeader
        eyebrow="교육 공공데이터 AI 활용대회 MVP"
        title={COPY.productName}
        description="공공데이터와 학교 데이터를 종합하여 AI 교육여건 활성화를 위한 지원소요를 확인합니다."
      />

      {!hasData ? <DataRequired /> : null}

      {hasData ? (
        <>
          <section className="mb-6 rounded-lg border border-blue-100 bg-white p-5 shadow-soft">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">학교 평가가 아니라 AI 교육 지원 소요 진단</span>
              <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">공개자료 기반</span>
              <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                {isAnonymizeMode() ? "노원구 학교를 모델로 구축(단, 학교명과 위치 익명화)" : "실명 내부 검토"}
              </span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {[
                ["공공데이터", "NEIS, 학교알리미,\n교육통계, 교육청 공개자료"],
                [
                  "임시데이터 구축(공모전 목적)",
                  "AI 디지털교과서(AIDT) 접속 안정성,\n학습관리시스템(LMS) 사용 지속성,\n교원 연수 이수, 기기 접근성,\nAI·SW 프로그램 운영,\n외부 AI프로그램 접근성"
                ],
                ["AI 활용", "취약 요인 라벨링, 유사 학교군 분류,\n지원 유형 매칭"],
                ["지원소요 산출", "예산·연수·프로그램·시설지원 확인 우선순위 검토"]
              ].map(([title, text]) => (
                <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black text-blue-700">{title}</p>
                  <p className="mt-2 whitespace-pre-line text-sm font-bold leading-6 text-slate-800">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "분석 학교", value: schools.length, helper: `${regionLabel} 공개자료 기준` },
              { label: "우선지원 필요", value: scores.filter((s) => s.level === "attention").length },
              { label: "지원 필요사항 검토", value: scores.filter((s) => s.level === "medium").length },
              { label: "현장 확인", value: scores.filter((s) => s.level === "field_check").length }
            ].filter((metric) => metric.label !== "현장 확인" || metric.value > 0).map((metric) => (
              <MetricCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} />
            ))}
          </div>

          <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-black text-slate-950">점수가 높을수록 AI교육을 위한 지원이 필요합니다.</h2>
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
