import { SUPPORT_PRIORITY_WEIGHTS } from "@/lib/readiness-score";
import type { ReadinessScore, SchoolProfile } from "@/lib/types";

function contribution(score: number, weight: number) {
  const value = (score / 100) * weight;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function scoreTone(score: number) {
  if (score >= 60) return "text-red-700";
  if (score >= 40) return "text-orange-700";
  return "text-blue-700";
}

function reasonFor(key: keyof ReadinessScore["raw"], score: ReadinessScore, school: SchoolProfile) {
  const sourcePrefix = school.dataSourceNote ? "동일 주소 본교 공시자료를 보조 근거로 사용했습니다. " : "";

  if (key === "educationDemand") {
    return `${sourcePrefix}학생 수 ${school.studentCount?.toLocaleString() ?? "미확인"}명, 학급 수 ${
      school.classCount?.toLocaleString() ?? "미확인"
    }개, 학급당 학생 수 ${school.studentsPerClass?.toLocaleString() ?? "추정"}를 함께 보아 교육 수요 부담을 산출했습니다.`;
  }

  if (key === "teacherOperation") {
    if (school.teacherCount === undefined && school.studentTeacherRatio === undefined) {
      return "교원 수 또는 학생 대 교사 비율이 공개자료에서 확인되지 않아 중간값으로 처리했습니다. 교원 연수 이력은 추가자료 연계 시 보완할 수 있습니다.";
    }
    return `${sourcePrefix}교원 수 ${
      school.teacherCount?.toLocaleString() ?? "미확인"
    }명과 학생 대 교사 비율을 기준으로 수업 운영 부담을 계산했습니다.`;
  }

  if (key === "digitalAccess") {
    const facilityTotal =
      (school.generalClassroomCount ?? 0) +
      (school.subjectClassroomCount ?? 0) +
      (school.learningSupportRoomCount ?? 0) +
      (school.studentWelfareRoomCount ?? 0);
    return `${sourcePrefix}학교알리미 시설 공시의 일반·교과·학습지원·학생복지 공간 ${
      facilityTotal || "미확인"
    }개와 디지털 인프라 대체지표(공개자료 기반)를 반영했습니다.`;
  }

  if (key === "aiLearningOpportunity") {
    return `${sourcePrefix}동아리 ${school.clubCount?.toLocaleString() ?? "미확인"}개, 방과후 프로그램 ${
      school.afterSchoolProgramCount?.toLocaleString() ?? "미확인"
    }개, 참여 학생 ${
      school.afterSchoolStudentCount?.toLocaleString() ?? "미확인"
    }명 등 공개자료상 학습기회 여건을 사용했습니다.`;
  }

  if (score.raw.regionalAccess >= 60) {
    return "학교 안팎의 지원공간, 학생선택 활동, 지역 학습자원 접근성이 낮아 지역 연계 지원을 우선 검토할 수 있습니다.";
  }
  return `${sourcePrefix}지역 AI·SW 센터와 학교 내 상담·학습지원 공간, 방과후·학생선택 활동 접근 신호를 함께 반영했습니다.`;
}

export function ScoreBreakdown({ score, school }: { score: ReadinessScore; school: SchoolProfile }) {
  const rows: Array<{
    key: keyof ReadinessScore["raw"];
    label: string;
    weight: number;
  }> = [
    { key: "educationDemand", label: "교육 수요·취약 여건", weight: SUPPORT_PRIORITY_WEIGHTS.educationDemand },
    { key: "teacherOperation", label: "교원·운영 여건", weight: SUPPORT_PRIORITY_WEIGHTS.teacherOperation },
    { key: "digitalAccess", label: "디지털·학습공간 기반", weight: SUPPORT_PRIORITY_WEIGHTS.digitalAccess },
    { key: "aiLearningOpportunity", label: "AI·SW 학습기회", weight: SUPPORT_PRIORITY_WEIGHTS.aiLearningOpportunity },
    { key: "regionalAccess", label: "지역 지원 접근성", weight: SUPPORT_PRIORITY_WEIGHTS.regionalAccess }
  ];

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black text-blue-700">점수산정 기준 및 결과</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">왜 {score.score}점인가</h2>
          {school.dataSourceNote ? <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{school.dataSourceNote}</p> : null}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
        <div className="hidden grid-cols-[190px_120px_120px_minmax(0,1fr)] bg-slate-50 px-4 py-3 text-xs font-black text-slate-500 md:grid">
          <span>지수열</span>
          <span>점수(100점)</span>
          <span>반영 점수</span>
          <span>판단 이유</span>
        </div>
        <div className="divide-y divide-slate-100">
          {rows.map((row) => {
            const rawScore = score.raw[row.key];
            return (
              <div key={row.key} className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[190px_120px_120px_minmax(0,1fr)] md:items-start">
                <div>
                  <p className="font-black text-slate-950">{row.label}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">배점 {row.weight}점</p>
                </div>
                <div>
                  <p className={`text-xl font-black ${scoreTone(rawScore)}`}>{rawScore}</p>
                  <p className="text-xs font-bold text-slate-500">/ 100</p>
                </div>
                <div>
                  <p className="text-xl font-black text-slate-950">{contribution(rawScore, row.weight)}</p>
                  <p className="text-xs font-bold text-slate-500">/ {row.weight}점</p>
                </div>
                <p className="leading-6 text-slate-600">{reasonFor(row.key, score, school)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
