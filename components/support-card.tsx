import type { SupportPackage } from "@/lib/types";

export function SupportCard({ item }: { item: SupportPackage }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
        {item.type}
      </span>
      <h3 className="mt-3 text-lg font-black text-slate-950">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        {item.actions.map((action) => (
          <li key={action} className="rounded-lg bg-slate-50 px-3 py-2">
            {action}
          </li>
        ))}
      </ul>
    </div>
  );
}
