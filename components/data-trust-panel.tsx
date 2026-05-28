export function DataTrustPanel() {
  const rows = [
    ["교육 공공데이터", "학교 기본정보·학생·교원·시설 신호"],
    ["1단계 산식", "공개자료로 지원 소요 지수 산출"],
    ["신뢰도 배지", "총점 제외, 판단 확실성만 표시"],
    ["2단계 확장", "AI 디지털교과서(AIDT)·학습관리시스템(LMS) 로그 제공 시 운영 안정성 진단"]
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-black text-slate-950">데이터는 이렇게 사용합니다</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {rows.map(([label, text]) => (
          <div key={label} className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-700">{label}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
