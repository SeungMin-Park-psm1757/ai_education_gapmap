import Link from "next/link";

export function DataRequired() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <p className="text-sm font-black text-amber-700">실데이터 연결 필요</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">공공데이터를 먼저 연결해 주세요</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700">
        이 MVP는 실제 API 키 또는 실제 공공데이터 CSV를 연결한 뒤
        <code className="mx-1 rounded bg-white px-1 py-0.5">npm run prepare:data</code>를 실행해야 합니다.
      </p>
      <Link href="/data" className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white">
        데이터 연결 방법 보기
      </Link>
    </div>
  );
}
