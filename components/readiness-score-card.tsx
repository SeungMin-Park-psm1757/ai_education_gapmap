import { getLevelLabel } from "@/lib/readiness-score";
import type { ReadinessScore } from "@/lib/types";

function getLevelStyle(level: ReadinessScore["level"]) {
  if (level === "field_check") return "bg-slate-100 text-slate-700";
  if (level === "attention") return "bg-red-50 text-red-700";
  if (level === "medium") return "bg-orange-50 text-orange-700";
  return "bg-blue-50 text-blue-700";
}

export function ReadinessScoreCard({ score }: { score: ReadinessScore }) {
  const level = getLevelLabel(score.score, score.dataReliability);
  const reliability = score.dataReliability;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-500">지원 소요 지수</p>
          <h3 className="mt-2 text-2xl font-black leading-tight text-slate-950 [overflow-wrap:anywhere]">{score.schoolName}</h3>
          {reliability ? (
            <p className="mt-2 text-xs font-bold text-slate-500">
              신뢰도 {reliability.grade} · {reliability.label}
            </p>
          ) : null}
        </div>
        <span
          className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-center text-xs font-black leading-none ${getLevelStyle(score.level)}`}
        >
          {level}
        </span>
      </div>
      <div className="mt-5 flex items-end gap-2">
        <span className="text-5xl font-black text-slate-950">{score.score}</span>
        <span className="mb-2 text-sm font-bold text-slate-500">/ 100</span>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, score.score)}%` }} />
      </div>
      <div className="mt-5 space-y-2">
        {score.signals.slice(0, 3).map((signal) => (
          <p key={signal} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {signal}
          </p>
        ))}
      </div>
      {score.level === "field_check" ? (
        <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold leading-6 text-slate-700">
          지원 소요 지수보다 데이터 보완이 먼저 필요합니다.
        </p>
      ) : null}
    </div>
  );
}
