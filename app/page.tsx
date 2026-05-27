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
        description="공개자료 기반 지원 필요 신호를 지도와 행정 조치로 연결합니다."
      />

      {!hasData ? <DataRequired /> : null}

      {hasData ? (
        <>
          <section className="mb-6 rounded-lg border border-blue-100 bg-white p-5 shadow-soft">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">학교 평가가 아니라 지원 소요 진단</span>
              <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">공개자료 기반</span>
              <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                {isAnonymizeMode() ? "제출용 익명화" : "실명 내부 검토"}
              </span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {[
                ["무엇인가", "AI 교육 지원이 먼저 필요한 신호를 찾는 대시보드"],
                ["공공데이터", "NEIS, 학교알리미, 교육통계, 교육청 공개자료"],
                ["AI 활용", "취약 요인 라벨링, 유사 학교군 분류, 지원 유형 매칭"],
                ["결정 지원", "예산·연수·프로그램·현장 확인 우선순위 검토"]
              ].map(([title, text]) => (
                <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black text-blue-700">{title}</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-800">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="분석 학교" value={schools.length} helper={`${regionLabel} 공개자료 기준`} />
            <MetricCard label="우선 지원" value={scores.filter((s) => s.level === "attention").length} />
            <MetricCard label="보완 검토" value={scores.filter((s) => s.level === "medium").length} />
            <MetricCard label="현장 확인" value={scores.filter((s) => s.level === "field_check").length} />
          </div>

          <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm font-black text-blue-700">이 화면에서 볼 것</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">점수가 높을수록 지원 필요 신호가 큽니다</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              AIDT·LMS 접속로그와 장애시간은 총점에 넣지 않고, 추가자료가 제공될 때 `확장진단 대기` 슬롯에서 별도 확인합니다.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/map" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
                격차지도 보기
              </Link>
              <Link href="/priorities" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">
                다음 조치 보기
              </Link>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
