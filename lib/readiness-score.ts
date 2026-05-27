import type { ReadinessScore, SchoolProfile } from "./types";

export const SUPPORT_PRIORITY_WEIGHTS = {
  educationDemand: 25,
  teacherOperation: 20,
  digitalAccess: 20,
  aiLearningOpportunity: 20,
  regionalAccess: 15
} as const;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalize(value = 0, max = 100) {
  if (!value || value <= 0) return 0;
  return clamp((value / max) * 100);
}

function inverseSignal(value: number | undefined, fallback = 50) {
  if (value === undefined) return fallback;
  return clamp(100 - value);
}

function ratio(numerator?: number, denominator?: number) {
  if (!numerator || !denominator || denominator <= 0) return undefined;
  return numerator / denominator;
}

function getStudentsPerClass(school: SchoolProfile) {
  return school.studentsPerClass ?? ratio(school.studentCount, school.classCount);
}

function getStudentTeacherRatio(school: SchoolProfile) {
  return school.studentTeacherRatio ?? ratio(school.studentCount, school.teacherCount);
}

function getDataReliability(school: SchoolProfile): ReadinessScore["dataReliability"] {
  const directFields = [school.studentCount, school.teacherCount, school.classCount].filter((value) => value !== undefined).length;
  const proxyFields = [
    school.digitalInfraSignal,
    school.facilitySignal,
    school.aiProgramSignal,
    school.regionalSupportSignal,
    school.generalClassroomCount,
    school.subjectClassroomCount,
    school.learningSupportRoomCount,
    school.clubCount,
    school.afterSchoolProgramCount
  ].filter((value) => value !== undefined).length;
  const missingCoreCount = [
    school.studentCount,
    school.teacherCount ?? school.studentTeacherRatio,
    school.digitalInfraSignal ?? school.facilitySignal,
    school.aiProgramSignal,
    school.regionalSupportSignal
  ].filter((value) => value === undefined).length;
  const grade = missingCoreCount <= 1 && directFields + proxyFields >= 7 ? "A" : missingCoreCount <= 2 ? "B" : "C";

  return {
    grade,
    label: grade === "A" ? "공개자료 충분" : grade === "B" ? "일부 대리지표" : "현장 확인 우선",
    missingCoreCount,
    directFieldCount: directFields,
    proxyFieldCount: proxyFields
  };
}

export function isFieldCheckFirst(score: Pick<ReadinessScore, "dataReliability">) {
  return score.dataReliability?.grade === "C";
}

export function getLevelLabel(score: number, reliability?: ReadinessScore["dataReliability"]) {
  if (reliability?.grade === "C") return "현장 확인 우선";
  if (score >= 45) return "우선 지원";
  if (score >= 30) return "보완 검토";
  return "일반 모니터링";
}

export function getLevel(score: number, reliability?: ReadinessScore["dataReliability"]): ReadinessScore["level"] {
  if (reliability?.grade === "C") return "field_check";
  if (score >= 45) return "attention";
  if (score >= 30) return "medium";
  return "high";
}

export function calculateReadinessScore(school: SchoolProfile): ReadinessScore {
  const studentsPerClass = getStudentsPerClass(school);
  const studentTeacherRatio = getStudentTeacherRatio(school);
  const roomCount =
    (school.generalClassroomCount ?? 0) +
    (school.subjectClassroomCount ?? 0) +
    (school.learningSupportRoomCount ?? 0) +
    (school.studentWelfareRoomCount ?? 0);

  const educationDemand = Math.round(
    clamp(
      normalize(school.studentCount ?? 0, 1200) * 0.45 +
        normalize(studentsPerClass ?? 0, 30) * 0.35 +
        normalize(studentTeacherRatio ?? 0, 25) * 0.2
    )
  );

  const teacherOperation = Math.round(
    clamp(
      normalize(studentTeacherRatio ?? 0, 25) * 0.55 +
        inverseSignal(school.teacherCount !== undefined ? normalize(school.teacherCount, 80) : undefined) * 0.25 +
        inverseSignal(school.teacherTrainingSignal, 55) * 0.2
    )
  );

  const digitalAccess = Math.round(
    clamp(
      inverseSignal(school.digitalInfraSignal ?? school.facilitySignal, 55) * 0.55 +
        inverseSignal(roomCount && school.classCount ? normalize(roomCount / school.classCount, 1.1) : undefined, 50) * 0.25 +
        inverseSignal(normalize((school.learningSupportRoomCount ?? 0) + (school.subjectClassroomCount ?? 0), 10), 50) * 0.2
    )
  );

  const aiLearningOpportunity = Math.round(
    clamp(
      inverseSignal(school.aiProgramSignal, 60) * 0.5 +
        inverseSignal(school.clubCount !== undefined ? normalize(school.clubCount, 60) : undefined, 50) * 0.25 +
        inverseSignal(school.afterSchoolProgramCount !== undefined ? normalize(school.afterSchoolProgramCount, 20) : undefined, 50) * 0.25
    )
  );

  const regionalAccess = Math.round(
    clamp(
      inverseSignal(school.regionalSupportSignal, 50) * 0.45 +
        inverseSignal(normalize((school.careerCounselRoomCount ?? 0) + (school.learningSupportRoomCount ?? 0), 5), 50) * 0.3 +
        inverseSignal(normalize((school.afterSchoolProgramCount ?? 0) + (school.studentSelectedClubCount ?? 0), 24), 50) * 0.25
    )
  );

  const score = Math.round(
    (educationDemand / 100) * SUPPORT_PRIORITY_WEIGHTS.educationDemand +
      (teacherOperation / 100) * SUPPORT_PRIORITY_WEIGHTS.teacherOperation +
      (digitalAccess / 100) * SUPPORT_PRIORITY_WEIGHTS.digitalAccess +
      (aiLearningOpportunity / 100) * SUPPORT_PRIORITY_WEIGHTS.aiLearningOpportunity +
      (regionalAccess / 100) * SUPPORT_PRIORITY_WEIGHTS.regionalAccess
  );

  const weakFactors = [
    educationDemand >= 60 ? "교육 수요·취약 여건" : null,
    teacherOperation >= 60 ? "교원·운영 여건" : null,
    digitalAccess >= 60 ? "디지털·학습공간 기반" : null,
    aiLearningOpportunity >= 60 ? "AI·SW 학습기회" : null,
    regionalAccess >= 60 ? "지역 지원 접근성" : null
  ].filter(Boolean) as string[];

  const recommendedSupports = weakFactors.length
    ? weakFactors.map((factor) => `${factor} 보강 검토`)
    : ["공개자료 기반 일반 모니터링", "AIDT·LMS 추가자료 연계 시 확장진단 검토"];
  const dataReliability = getDataReliability(school)!;

  return {
    schoolId: school.id,
    schoolName: school.schoolName,
    score,
    level: getLevel(score, dataReliability),
    type: dataReliability.grade === "C" ? "현장 확인 우선" : weakFactors[0] ?? "일반 모니터링",
    signals: [
      `지원 소요 지수: ${score}점`,
      `교육 수요 신호: ${educationDemand}점`,
      `AI·SW 학습기회 보강 신호: ${aiLearningOpportunity}점`
    ],
    weakFactors,
    recommendedSupports,
    dataReliability,
    raw: {
      educationDemand,
      teacherOperation,
      digitalAccess,
      aiLearningOpportunity,
      regionalAccess
    }
  };
}
