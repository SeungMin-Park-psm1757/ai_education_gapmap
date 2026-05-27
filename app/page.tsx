import Link from "next/link";
import { DataRequired } from "@/components/data-required";
import { MetricCard } from "@/components/metric-card";
import { SectionHeader } from "@/components/section-header";
import { getManifest, getReadinessScores, getSchools } from "@/lib/data-loader";
import { COPY } from "@/lib/copy";

export default function HomePage() {
  const schools = getSchools();
  const scores = getReadinessScores();
  const manifest = getManifest();
  const hasData = schools.length > 0 && scores.length > 0;

  return (
    <div>
      <SectionHeader
        eyebrow="교육 공공데이터 AI 활용대회 MVP"
        title={COPY.productName}
        description={COPY.definition}
      />

      {!hasData ? <DataRequired /> : null}

      {hasData ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="분석 학교" value={schools.length} helper="노원구 공개자료 기준" />
            <MetricCard label="우선 지원" value={scores.filter((s) => s.level === "attention").length} />
            <MetricCard label="보완 검토" value={scores.filter((s) => s.level === "medium").length} />
            <MetricCard label="현장 확인" value={scores.filter((s) => s.level === "field_check").length} />
          </div>

          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm font-black text-blue-700">1단계 공개자료형</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">한정된 지원 자원이 먼저 가야 할 학교를 찾습니다.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              지원 소요 지수는 공개자료상 AI 교육 지원이 먼저 필요한 정도입니다. AIDT·LMS 접속로그와 장애시간은
              총점에 섞지 않고, 추가자료가 제공될 때 2단계 확장진단으로 봅니다.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/map" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
                교육격차 지도 보기
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
