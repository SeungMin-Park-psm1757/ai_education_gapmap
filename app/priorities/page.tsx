import Link from "next/link";
import { DataRequired } from "@/components/data-required";
import { SectionHeader } from "@/components/section-header";
import { getPrimaryAction } from "@/lib/action-recommendations";
import { getReadinessScores } from "@/lib/data-loader";

export default function PrioritiesPage() {
  const scores = getReadinessScores().sort((a, b) => b.score - a.score);
  const hasData = scores.length > 0;
  const fieldCheckItems = scores.filter((score) => score.level === "field_check");
  const priorityItems = scores.filter((score) => score.level !== "field_check").slice(0, 8);

  return (
    <div>
      <SectionHeader
        eyebrow="지원 우선순위"
        title="먼저 볼 학교와 다음 조치"
        description="지원 소요 지수, 신뢰도, 대표 보강 영역을 행정 조치로 연결합니다."
      />
      {!hasData ? <DataRequired /> : null}
      {hasData ? (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            {priorityItems.map((score) => {
              const action = getPrimaryAction(score);
              return (
                <Link
                  href={`/schools/${score.schoolId}`}
                  key={score.schoolId}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft hover:border-slate-400"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex rounded-md bg-red-50 px-2.5 py-1 text-xs font-black text-red-700">
                        {score.type}
                      </span>
                      <h2 className="mt-3 text-lg font-black text-slate-950">{score.schoolName}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500">지원 소요</p>
                      <p className="text-2xl font-black text-slate-950">{score.score}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                    <p className="rounded-lg bg-slate-50 px-3 py-2 font-bold text-slate-700">
                      신뢰도 {score.dataReliability?.grade ?? "-"} · {score.dataReliability?.label ?? "확인 필요"}
                    </p>
                    <p className="rounded-lg bg-slate-50 px-3 py-2 font-bold text-slate-700">{action.title}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{action.description}</p>
                  <span className="mt-4 inline-flex text-sm font-black text-blue-700">상세 보기</span>
                </Link>
              );
            })}
          </div>

          {fieldCheckItems.length ? (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-black text-slate-950">현장 확인 우선</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                공개자료가 부족해 점수보다 현장 확인이 먼저 필요한 학교입니다.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {fieldCheckItems.map((score) => (
                  <Link
                    href={`/schools/${score.schoolId}`}
                    key={score.schoolId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
                  >
                    <span className="font-black text-slate-800">{score.schoolName}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">신뢰도 C</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
