export function SectionHeader({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      {eyebrow ? (
        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          {eyebrow}
        </span>
      ) : null}
      <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{title}</h1>
      {description ? <p className="mt-3 max-w-5xl text-base leading-7 text-slate-600">{description}</p> : null}
    </div>
  );
}
