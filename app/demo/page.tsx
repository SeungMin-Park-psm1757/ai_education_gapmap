import Link from "next/link";

export default function DemoRedirectPage() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
      <p className="text-sm font-black text-blue-700">3분 시연 화면 비노출</p>
      <h1 className="mt-2 text-2xl font-black text-slate-950">대시보드 홈에서 확인하세요</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        현재 제출용 버전은 별도 시연 페이지 없이 홈, 지도, 조치 방안, 데이터 화면만으로 설명되도록 구성했습니다.
      </p>
      <Link href="/" className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
        홈으로 이동
      </Link>
    </section>
  );
}
