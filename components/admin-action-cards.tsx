import { getAdminActions } from "@/lib/action-recommendations";
import type { ReadinessScore } from "@/lib/types";

export function AdminActionCards({ score }: { score: ReadinessScore }) {
  const actions = getAdminActions(score);

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black text-blue-700">실행 연결</p>
          <h2 className="text-2xl font-black text-slate-950">행정 조치 방안</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          산출 결과를 예산·연수·프로그램·자료 보완으로 연결합니다.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <div key={action.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
              {action.title}
            </span>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              <p>
                <span className="font-black text-slate-950">왜 필요한가: </span>
                {action.why}
              </p>
              <p>
                <span className="font-black text-slate-950">무엇을 할 것인가: </span>
                {action.action}
              </p>
              <p>
                <span className="font-black text-slate-950">필요한 추가자료: </span>
                {action.requiredData}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
