"use client";

import { useState } from "react";

const examples = [
  {
    title: "접속 장애형",
    description: "공개자료상 지원 소요는 낮지만 AIDT 접속 장애가 잦은 학교",
    signals: ["가동률 91%", "로그인 실패율 8%", "평균 복구 2.4시간"]
  },
  {
    title: "사용 지속성형",
    description: "공개자료상 지원 소요는 보통이지만 LMS 사용 지속성이 약한 사례",
    signals: ["월간 사용 2회", "적용 수업일수 4일", "활성 학급 28%"]
  },
  {
    title: "복합 지원형",
    description: "공개자료상 지원 소요가 높고 사용 안정성도 낮아 지원 필요성이 커지는 학교",
    signals: ["가동률 88%", "장애 6건", "활성 학생 41%"]
  }
];

export function ExtensionDiagnostics() {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-black text-blue-700">2단계 확장진단</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">AIDT·LMS 활용 안정성</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            추가자료 연계 시 접속 안정성, 장애·복구, 사용 지속성, 적용 범위를 별도 리포트로 산출합니다.
          </p>
        </div>
        <span className="inline-flex rounded-md bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
          확장진단 대기
        </span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {[
          ["접속·가동", "로그인 성공률, 가동률"],
          ["장애·복구", "장애건수, 평균 복구시간"],
          ["사용 지속성", "주간·월간 사용빈도"],
          ["적용 범위", "학년·학급·학생 커버리지"]
        ].map(([label, text]) => (
          <div key={label} className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-800">{label}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-50"
      >
        확장진단 예시 보기
      </button>
      {open ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-bold leading-6 text-slate-700">
            아래는 AIDT·LMS 자료가 제공될 경우 가능한 2단계 확장진단 예시입니다. 현재 1단계 지원 소요 지수에는 반영하지 않습니다.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {examples.map((example) => (
              <div key={example.title} className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-black text-slate-950">{example.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{example.description}</p>
                <ul className="mt-3 space-y-1 text-xs font-bold text-slate-600">
                  {example.signals.map((signal) => (
                    <li key={signal}>{signal}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
