import { getAdminActions } from "@/lib/action-recommendations";
import type { ReadinessScore } from "@/lib/types";

export function AdminActionCards({ score }: { score: ReadinessScore }) {
  const actions = getAdminActions(score);

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black text-blue-700">실행 연결</p>
          <h2 className="text-2xl font-black text-slate-950">다음 행정 조치</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          공개자료 기반 1차 신호를 예산·연수·프로그램·현장 확인으로 연결합니다.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {actions.map((action) => (
          <div key={action.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
              {action.title}
            </span>
            <p className="mt-3 text-sm leading-6 text-slate-700">{action.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
