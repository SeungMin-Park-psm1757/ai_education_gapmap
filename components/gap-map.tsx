import Link from "next/link";
import { AlertTriangle, CheckCircle2, MapPinned, School2 } from "lucide-react";
import { getLevelLabel, isFieldCheckFirst } from "@/lib/readiness-score";
import { SchoolRealMap, type RealMapPoint } from "@/components/school-real-map";
import { getRegionLabel, isAnonymizeMode } from "@/lib/anonymize";
import type { DataManifest, ReadinessScore, SchoolProfile } from "@/lib/types";

type MapItem = RealMapPoint & ReadinessScore & {
  bucketBg: string;
  bucketText: string;
  hasCoordinate: boolean;
  studentCount?: number;
  teacherCount?: number;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getBucket(score: ReadinessScore) {
  if (isFieldCheckFirst(score)) {
    return {
      label: "현장 우선확인 필요",
      color: "repeating-linear-gradient(135deg, #64748b 0, #64748b 6px, #cbd5e1 6px, #cbd5e1 12px)",
      bg: "bg-slate-100",
      text: "text-slate-700",
      dot: "bg-slate-400"
    };
  }
  if (score.score >= 45) {
    return {
      label: "우선지원 필요",
      color: "#dc2626",
      bg: "bg-red-50",
      text: "text-red-700",
      dot: "bg-red-600"
    };
  }
  if (score.score >= 30) {
    return {
      label: "지원여부 검토",
      color: "#ea580c",
      bg: "bg-orange-50",
      text: "text-orange-700",
      dot: "bg-orange-500"
    };
  }
  return {
    label: "일반 모니터링",
    color: "#2563eb",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-600"
  };
}

function buildItems(scores: ReadinessScore[], schools: SchoolProfile[]): MapItem[] {
  const schoolById = new Map(schools.map((school) => [school.id, school]));

  return scores.map((score) => {
    const school = schoolById.get(score.schoolId);
    const bucket = getBucket(score);
    const hasCoordinate = isFiniteNumber(school?.latitude) && isFiniteNumber(school?.longitude);

    return {
      ...score,
      address: school?.address,
      schoolLevel: school?.schoolLevel,
      studentCount: school?.studentCount,
      teacherCount: school?.teacherCount,
      latitude: school?.latitude,
      longitude: school?.longitude,
      levelLabel: getLevelLabel(score.score, score.dataReliability),
      bucketLabel: bucket.label,
      bucketBg: bucket.bg,
      bucketText: bucket.text,
      color: bucket.color,
      hasCoordinate
    };
  });
}

function getGradeGroups(schools: SchoolProfile[]) {
  const groups = new Map<string, number>();
  schools.forEach((school) => {
    const label = school.schoolLevel?.includes("초등")
      ? "초등학교"
      : school.schoolLevel?.includes("중")
        ? "중학교"
        : school.schoolLevel?.includes("고등")
          ? "고등학교"
          : "기타";
    groups.set(label, (groups.get(label) ?? 0) + 1);
  });
  const otherCount = groups.get("기타") ?? 0;
  return [
    { label: "초등학교", count: groups.get("초등학교") ?? 0 },
    { label: "중학교", count: groups.get("중학교") ?? 0 },
    { label: "고등학교", count: groups.get("고등학교") ?? 0 },
    { label: `기타(${otherCount}학교)`, count: otherCount }
  ];
}

function average(scores: ReadinessScore[]) {
  if (!scores.length) return 0;
  return Math.round(scores.reduce((total, score) => total + score.score, 0) / scores.length);
}

export function GapMap({
  scores,
  schools,
  manifest
}: {
  scores: ReadinessScore[];
  schools: SchoolProfile[];
  manifest: DataManifest;
}) {
  const sorted = scores.slice().sort((a, b) => b.score - a.score);
  const items = buildItems(sorted, schools);
  const priorityItems = items.filter((item) => !isFieldCheckFirst(item)).slice(0, 8);
  const topThree = priorityItems.slice(0, 3);
  const fieldCheckItems = items.filter((item) => isFieldCheckFirst(item)).slice(0, 5);
  const coordinateCount = items.filter((item) => item.hasCoordinate).length;
  const gradeGroups = getGradeGroups(schools);
  const attentionCount = scores.filter((score) => score.level === "attention").length;
  const fieldCheckCount = scores.filter((score) => score.level === "field_check").length;
  const maxScore = sorted[0]?.score ?? 0;
  const minScore = sorted[sorted.length - 1]?.score ?? 0;
  const scoreBuckets = [
    { label: "우선지원 필요", count: scores.filter((score) => score.level === "attention").length, dot: "bg-red-600" },
    { label: "지원여부 검토", count: scores.filter((score) => score.level === "medium").length, dot: "bg-orange-500" },
    { label: "일반 모니터링", count: scores.filter((score) => score.level === "high").length, dot: "bg-blue-600" },
    { label: "현장 우선확인 필요", count: fieldCheckCount, dot: "bg-slate-400" }
  ].filter((bucket) => bucket.count > 0);
  const regionLabel = getRegionLabel();
  const anonymized = isAnonymizeMode();
  const publicDataSources = manifest.publicDataSources?.length
    ? manifest.publicDataSources
    : [
        { name: "NEIS 학교 기본정보", count: manifest.counts?.neisSchools ?? schools.length, fields: ["학교명", "학교급", "교육지원청", "주소"] },
        { name: "학교알리미 공시자료", count: manifest.counts?.schoolInfo ?? scores.length, fields: ["학생 수", "교원 수", "학급 수", "시설·프로그램"] },
        { name: "공공데이터포털 학교 표준자료(MVP 익명화 조치)", count: manifest.counts?.schoolLocationStandard ?? coordinateCount, fields: ["학교명", "주소 대조", "기관 구분"] }
      ];
  const publicRecordCount = manifest.counts?.actualPublicRecords ?? publicDataSources.reduce((total, source) => total + source.count, 0);
  const scenarioDataSources = manifest.scenarioDataSources ?? [];
  const scenarioRecordCount = scenarioDataSources.reduce((total, source) => total + source.count, 0);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-3">
        {topThree.map((item, index) => (
          <Link
            href={`/schools/${item.schoolId}`}
            key={item.schoolId}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft hover:border-slate-400"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-black text-red-700">우선지원 필요 TOP {index + 1}</span>
              <span className="text-2xl font-black text-slate-950">{item.score}</span>
            </div>
            <h2 className="mt-3 truncate text-lg font-black text-slate-950">{item.schoolName}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.type} 보강 검토</p>
          </Link>
        ))}
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                <MapPinned className="h-4 w-4" aria-hidden="true" />
                {anonymized ? "권역화 지도(예시)" : `${regionLabel} 실제 지도`}
              </div>
              <h2 className="mt-3 text-2xl font-black text-slate-950">지원 소요 분포</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                점수가 높을수록 AI 교육 지원소요가 큽니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:min-w-[430px]">
              {[
                ["학교(가상배치)", scores.length],
                ["평균점수", average(scores)],
                ["우선지원 필요", attentionCount]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-slate-50 px-3 py-2">
                  <p className="text-xs font-bold text-slate-500">{label}</p>
                  <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-h-[560px] bg-slate-100">
            <SchoolRealMap points={items} />
          </div>

          <aside className="border-t border-slate-200 bg-white p-5 xl:border-l xl:border-t-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" aria-hidden="true" />
              <h3 className="text-lg font-black text-slate-950">우선 확인</h3>
            </div>
            <div className="mt-4 space-y-2">
              {priorityItems.map((item, index) => (
                <Link
                  href={`/schools/${item.schoolId}`}
                  key={item.schoolId}
                  className="grid grid-cols-[34px_minmax(0,1fr)_52px] items-center gap-3 rounded-md border border-slate-200 px-3 py-2 hover:border-slate-400"
                >
                  <span className="text-sm font-black text-slate-400">{index + 1}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-slate-950">{item.schoolName}</span>
                    <span className={`mt-1 inline-flex rounded px-2 py-0.5 text-[11px] font-bold ${item.bucketBg} ${item.bucketText}`}>
                      {item.bucketLabel}
                    </span>
                  </span>
                  <span className="text-right text-lg font-black text-slate-950">{item.score}</span>
                </Link>
              ))}
            </div>

            {fieldCheckItems.length ? (
              <div className="mt-5 rounded-md bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-600" aria-hidden="true" />
                  <h3 className="text-sm font-black text-slate-950">현장 우선확인 필요</h3>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">공개자료가 부족해 점수보다 현장 확인이 먼저 필요한 학교입니다.</p>
                <div className="mt-3 space-y-2">
                  {fieldCheckItems.map((item) => (
                    <Link
                      href={`/schools/${item.schoolId}`}
                      key={`field-${item.schoolId}`}
                      className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <span className="truncate font-bold text-slate-700">{item.schoolName}</span>
                      <span className="font-black text-slate-500">C</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 border-t border-slate-200 pt-5">
              <h3 className="text-sm font-black text-slate-950">범례</h3>
              <div className="mt-3 space-y-2">
                {scoreBuckets.map((bucket) => (
                  <div key={bucket.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 font-bold text-slate-700">
                      <span className={`h-3 w-3 rounded-full ${bucket.dot}`} />
                      {bucket.label}
                    </span>
                    <span className="font-black text-slate-950">{bucket.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <h3 className="text-sm font-black text-slate-950">학교급</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {gradeGroups.map((group) => (
                  <div key={group.label} className="rounded-md bg-slate-50 px-3 py-2">
                    <p className="text-xs font-bold text-slate-500">{group.label}</p>
                    <p className="text-xl font-black text-slate-950">{group.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-soft">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <School2 className="h-5 w-5 text-blue-700" aria-hidden="true" />
              <h2 className="text-xl font-black text-slate-950">AI교육여건 지원요소 상세</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              지원 소요 지수가 높은 학교부터 지원소요와 조치를 제안합니다.
            </p>
          </div>
          <div className="hidden border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-black text-slate-500 md:grid md:grid-cols-[86px_minmax(0,0.65fr)_minmax(420px,1.25fr)]">
            <span>지원소요</span>
            <span>학교·지원요소</span>
            <span>제안 조치</span>
          </div>
          <div className="divide-y divide-slate-100">
            {priorityItems.map((item) => (
              <Link
                href={`/schools/${item.schoolId}`}
                key={`detail-${item.schoolId}`}
                className="grid gap-3 px-5 py-4 hover:bg-slate-50 md:grid-cols-[86px_minmax(0,0.65fr)_minmax(420px,1.25fr)]"
              >
                <div>
                  <p className="text-xs font-bold text-slate-500">지원 소요</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{item.score}</p>
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-black text-slate-950">{item.schoolName}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {item.schoolLevel ?? "학교급 자료 없음"} · {item.address ?? "권역 자료 없음"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.weakFactors.slice(0, 3).map((factor) => (
                      <span key={factor} className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-sm leading-6 text-slate-600">
                  {item.recommendedSupports.slice(0, 2).map((support) => (
                    <p key={support}>· {support}</p>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-black text-slate-950">데이터 근거</h2>
          <div className="mt-4 space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-bold text-slate-600">실제 데이터 활용</span>
                <span className="font-black text-slate-950">{publicRecordCount}건</span>
              </div>
              <ul className="mt-3 space-y-1 text-sm leading-6 text-slate-600">
                {publicDataSources.map((source) => (
                  <li key={source.name}>* {source.name}: {source.fields?.join("·")} 등 {source.count}건</li>
                ))}
              </ul>
            </div>
            {scenarioDataSources.length ? (
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-bold text-slate-600">확장진단 시나리오(예시)</span>
                <span className="font-black text-slate-950">{scenarioRecordCount}건</span>
              </div>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                지수 반영은 안되었으나, 실제 구현시 필요 데이터에 대한 가정(예시) 데이터 명 입니다.
              </p>
              <ul className="mt-3 space-y-1 text-sm leading-6 text-slate-600">
                {scenarioDataSources.map((source) => (
                  <li key={source.name}>
                    <p>* {source.name}</p>
                    <div className="mt-1 space-y-1 pl-3">
                      {source.fields?.map((field) => (
                        <p key={field}>{field}</p>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            ) : null}
            <div className="space-y-3">
              {[
                ["지원 소요 산출", scores.length],
                ["우선지원 필요", attentionCount],
                ["점수 범위", `${minScore}-${maxScore}`]
              ].filter(([label]) => label !== "현장 확인" || fieldCheckCount > 0).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-600">{label}</span>
                  <span className="font-black text-slate-950">{value}</span>
                </div>
              ))}
            </div>
          </div>
          {manifest.warnings?.filter((warning) => !warning.includes("AI 디지털교과서(AIDT)·학습관리시스템(LMS) 값")).length ? (
            <div className="mt-5 rounded-md bg-orange-50 p-4">
              <p className="text-sm font-black text-orange-800">보강 필요 데이터</p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-orange-900">
                {manifest.warnings.filter((warning) => !warning.includes("AI 디지털교과서(AIDT)·학습관리시스템(LMS) 값")).map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

