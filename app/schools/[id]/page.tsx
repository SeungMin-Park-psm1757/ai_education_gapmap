import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminActionCards } from "@/components/admin-action-cards";
import { ReadinessScoreCard } from "@/components/readiness-score-card";
import { SectionHeader } from "@/components/section-header";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { getSchoolById, getScoreBySchoolId } from "@/lib/data-loader";
import { isAnonymizeMode } from "@/lib/anonymize";

export default function SchoolDetailPage({ params }: { params: { id: string } }) {
  const school = getSchoolById(params.id);
  const score = getScoreBySchoolId(params.id);
  const anonymized = isAnonymizeMode();
  if (!school || !score) notFound();

  return (
    <div>
      <SectionHeader
        eyebrow="학교 상세 보고서"
        title={`${school.schoolName} 지원 소요 보고서`}
        description="공개자료 기반 점수 근거, 데이터 신뢰도, 조치 방안을 확인합니다."
      />
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <ReadinessScoreCard score={score} />
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-black text-slate-950">학교 기본정보</h2>
          {anonymized ? (
            <p className="mt-2 rounded-md bg-blue-50 px-3 py-2 text-sm font-bold text-blue-800">
              공모전 제출을 위해 학교명과 위치는 익명화했습니다.
            </p>
          ) : null}
          <dl className="mt-4 grid gap-x-8 gap-y-5 text-sm md:grid-cols-2">
            <div className="min-w-0">
              <dt className="font-bold text-slate-500">주소</dt>
              <dd className="mt-1 leading-6 text-slate-950">{school.address ?? "-"}</dd>
            </div>
            <div className="min-w-0">
              <dt className="font-bold text-slate-500">교육지원청</dt>
              <dd className="mt-1 leading-6 text-slate-950">{school.eduOffice ?? "-"}</dd>
            </div>
            <div className="min-w-0">
              <dt className="font-bold text-slate-500">학생 수</dt>
              <dd className="mt-1 leading-6 text-slate-950">{school.studentCount?.toLocaleString() ?? "-"}</dd>
            </div>
            <div className="min-w-0">
              <dt className="font-bold text-slate-500">교원 수</dt>
              <dd className="mt-1 leading-6 text-slate-950">{school.teacherCount?.toLocaleString() ?? "-"}</dd>
            </div>
            {!anonymized ? (
              <>
                <div className="min-w-0">
                  <dt className="font-bold text-slate-500">전화</dt>
                  <dd className="mt-1 leading-6 text-slate-950">{school.phone ?? "-"}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="font-bold text-slate-500">웹사이트</dt>
                  <dd className="mt-1 truncate leading-6">
                    {school.homepage ? <a className="text-blue-700" href={school.homepage}>{school.homepage}</a> : "-"}
                  </dd>
                </div>
              </>
            ) : null}
          </dl>
          <Link href="/data" className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
            데이터 근거 보기
          </Link>
        </section>
      </div>
      {score.level === "field_check" ? (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-black text-slate-700">현장 확인 우선</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">데이터 보완이 먼저 필요합니다</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            이 학교는 지원 소요 지수보다 데이터 보완이 먼저 필요합니다. 교육지원청 확인 또는 학교 추가자료 요청을 권장합니다.
          </p>
        </section>
      ) : null}
      <ScoreBreakdown score={score} school={school} />
      <AdminActionCards score={score} />
    </div>
  );
}
