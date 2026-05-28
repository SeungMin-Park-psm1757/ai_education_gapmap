import Link from "next/link";

const navItems = [
  { href: "/", label: "홈" },
  { href: "/map", label: "격차지도" },
  { href: "/priorities", label: "조치 방안" },
  { href: "/data", label: "데이터" }
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">
            AI
          </div>
          <div>
            <p className="text-sm font-black text-slate-950">AI 교육격차 지도</p>
            <p className="text-xs text-slate-500">지원 소요 진단 MVP</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
