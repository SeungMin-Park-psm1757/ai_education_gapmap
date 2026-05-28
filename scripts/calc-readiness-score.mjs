import path from "node:path";
import { findValue, liveDir, readJson, sourceDir, toNumber, writeJson } from "./helpers.mjs";

const neis = readJson(path.join(liveDir, "neis-schools.raw.json"), []);
const schoolLocations = readJson(path.join(liveDir, "school-location-standard.raw.json"), []);
const schoolInfo = readJson(path.join(liveDir, "schoolinfo-public.raw.json"), []);
const facilities = readJson(path.join(liveDir, "school-facility.raw.json"), []);
const infra = readJson(path.join(liveDir, "digital-infra.raw.json"), []);
const aiPrograms = readJson(path.join(liveDir, "ai-program.raw.json"), []);
const training = readJson(path.join(liveDir, "teacher-training.raw.json"), []);
const aiCenters = readJson(path.join(liveDir, "ai-centers.raw.json"), []);
const camps = readJson(path.join(liveDir, "sw-ai-camps.raw.json"), []);
const learningCenters = readJson(path.join(liveDir, "public-learning-centers.raw.json"), []);
const publicSupplements = readJson(path.join(sourceDir, "public-supplements.json"), []);
const excludedSchoolNames = new Set([
  "학력인정 청암고등학교(2년제)",
  "학력인정 청암중학교(2년제)"
]);

const byName = new Map();
const locationByName = new Map(
  schoolLocations
    .filter((row) => row.SCHUL_NM)
    .map((row) => [row.SCHUL_NM, row])
);

for (const row of neis) {
  const name = row.SCHUL_NM;
  if (!name) continue;
  const location = locationByName.get(name);
  byName.set(name, {
    id: row.SD_SCHUL_CODE || name,
    schoolName: name,
    address: row.ORG_RDNMA || location?.ORG_RDNMA,
    schoolLevel: row.SCHUL_KND_SC_NM,
    eduOffice: row.JU_ORG_NM,
    phone: row.ORG_TELNO,
    homepage: row.HMPG_ADRES,
    latitude: toNumber(location?.latitude),
    longitude: toNumber(location?.longitude)
  });
}

for (const row of schoolInfo) {
  const name = findValue(row, ["학교명", "SCHUL_NM", "schoolName", "학교"]);
  if (!name) continue;
  const school = byName.get(name) ?? { id: name, schoolName: name };
  mergeNumber(school, "studentCount", findValue(row, ["학생수", "전체학생수", "studentCount"]));
  mergeNumber(school, "teacherCount", findValue(row, ["교원수", "teacherCount"]));
  mergeNumber(school, "classCount", findValue(row, ["학급수", "classCount"]));

  for (const key of [
    "studentsPerClass",
    "generalClassroomCount",
    "subjectClassroomCount",
    "learningSupportRoomCount",
    "studentWelfareRoomCount",
    "restroomCount",
    "careerCounselRoomCount",
    "broadcastCapacity",
    "clubCount",
    "clubStudentCount",
    "clubTeacherCount",
    "clubExternalInstructorCount",
    "studentSelectedClubCount",
    "creativeActivityBudget",
    "afterSchoolProgramCount",
    "afterSchoolStudentCount",
    "currentAfterSchoolProgramCount",
    "currentAfterSchoolStudentCount",
    "vacationAfterSchoolProgramCount",
    "vacationAfterSchoolStudentCount"
  ]) {
    mergeNumber(school, key, row[key]);
  }

  if (Array.isArray(row.apiTypes)) school.schoolInfoApiTypes = [...new Set([...(school.schoolInfoApiTypes ?? []), ...row.apiTypes])];
  if (row.hasSwimmingPool) school.hasSwimmingPool = true;
  if (row.hasIntegratedOperation) school.hasIntegratedOperation = true;
  byName.set(name, school);
}

function bumpSignal(sourceRows, candidates, fieldName, value = 70) {
  for (const row of sourceRows) {
    const name = findValue(row, candidates);
    if (!name) continue;
    const school = byName.get(name);
    if (!school) continue;
    school[fieldName] = Math.max(school[fieldName] ?? 0, value);
  }
}

bumpSignal(facilities, ["학교명", "SCHUL_NM", "schoolName"], "facilitySignal", 60);
bumpSignal(infra, ["학교명", "SCHUL_NM", "schoolName"], "digitalInfraSignal", 70);
bumpSignal(aiPrograms, ["학교명", "SCHUL_NM", "schoolName"], "aiProgramSignal", 80);
bumpSignal(training, ["학교명", "SCHUL_NM", "schoolName"], "teacherTrainingSignal", 70);

for (const row of publicSupplements) {
  const name = findValue(row, ["학교명", "SCHUL_NM", "schoolName"]);
  if (!name) continue;
  const school = byName.get(name);
  if (!school) continue;

  for (const key of [
    "studentCount",
    "teacherCount",
    "classCount",
    "studentTeacherRatio",
    "digitalInfraSignal",
    "aiProgramSignal",
    "regionalSupportSignal"
  ]) {
    mergeNumber(school, key, row[key]);
  }

  if (row.dataSourceNote) school.dataSourceNote = row.dataSourceNote;
  if (row.publicSupplementSource) school.publicSupplementSource = row.publicSupplementSource;
}

const regionalSupportSignal = Math.min(100, (aiCenters.length + camps.length + learningCenters.length) * 5);

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalize(value = 0, max = 100) {
  if (!value || value <= 0) return 0;
  return clamp((value / max) * 100);
}

function mergeNumber(target, key, value) {
  const parsed = toNumber(value);
  if (parsed === undefined) return;
  target[key] = Math.max(target[key] ?? 0, parsed);
}

function deriveSignals(school) {
  const roomCount =
    (school.generalClassroomCount ?? 0) +
    (school.subjectClassroomCount ?? 0) +
    (school.learningSupportRoomCount ?? 0) +
    (school.studentWelfareRoomCount ?? 0);
  const supportRoomCount = school.careerCounselRoomCount ?? 0;
  const facilityFields = [
    school.generalClassroomCount,
    school.subjectClassroomCount,
    school.learningSupportRoomCount,
    school.studentWelfareRoomCount,
    school.careerCounselRoomCount,
    school.broadcastCapacity
  ];
  const hasFacilityData = facilityFields.some((value) => value !== undefined);

  if (hasFacilityData) {
    const roomScore = normalize(roomCount, 18) * 55;
    const supportScore = normalize(supportRoomCount, 2) * 15;
    const broadcastScore = normalize(school.broadcastCapacity ?? 0, 150) * 20;
    const operationScore = (school.hasIntegratedOperation ? 5 : 0) + (school.hasSwimmingPool ? 5 : 0);
    school.facilitySignal = Math.round(clamp(roomScore + supportScore + broadcastScore + operationScore));
    school.digitalInfraSignal = Math.max(school.digitalInfraSignal ?? 0, school.facilitySignal);
  }

  const activityFields = [
    school.clubCount,
    school.clubStudentCount,
    school.clubTeacherCount,
    school.clubExternalInstructorCount,
    school.afterSchoolProgramCount,
    school.afterSchoolStudentCount
  ];
  const hasActivityData = activityFields.some((value) => value !== undefined);

  if (hasActivityData) {
    const programScore = normalize(school.afterSchoolProgramCount ?? 0, 20) * 35;
    const clubScore = normalize(school.clubCount ?? 0, 60) * 30;
    const participantBase = Math.max(school.studentCount ?? 0, 1);
    const participantCount = (school.afterSchoolStudentCount ?? 0) + (school.clubStudentCount ?? 0);
    const participantScore = normalize(participantCount, participantBase) * 25;
    const staffScore = normalize((school.clubTeacherCount ?? 0) + (school.clubExternalInstructorCount ?? 0), 80) * 10;
    school.aiProgramSignal = Math.max(school.aiProgramSignal ?? 0, Math.round(clamp(programScore + clubScore + participantScore + staffScore)));
  }

  if (hasFacilityData) {
    const supportScore = normalize((school.careerCounselRoomCount ?? 0) + (school.learningSupportRoomCount ?? 0), 5) * 45;
    const capacityScore = normalize(school.broadcastCapacity ?? 0, 150) * 35;
    const activityAccessScore = normalize((school.afterSchoolProgramCount ?? 0) + (school.studentSelectedClubCount ?? 0), 24) * 20;
    school.regionalSupportSignal = Math.max(
      school.regionalSupportSignal ?? 0,
      Math.round(clamp(supportScore + capacityScore + activityAccessScore))
    );
  }
}

function copyPublicSignals(target, source) {
  for (const key of [
    "studentCount",
    "teacherCount",
    "classCount",
    "studentsPerClass",
    "generalClassroomCount",
    "subjectClassroomCount",
    "learningSupportRoomCount",
    "studentWelfareRoomCount",
    "restroomCount",
    "careerCounselRoomCount",
    "broadcastCapacity",
    "clubCount",
    "clubStudentCount",
    "clubTeacherCount",
    "clubExternalInstructorCount",
    "studentSelectedClubCount",
    "creativeActivityBudget",
    "afterSchoolProgramCount",
    "afterSchoolStudentCount",
    "currentAfterSchoolProgramCount",
    "currentAfterSchoolStudentCount",
    "vacationAfterSchoolProgramCount",
    "vacationAfterSchoolStudentCount",
    "facilitySignal",
    "digitalInfraSignal",
    "aiProgramSignal",
    "regionalSupportSignal"
  ]) {
    if ((target[key] === undefined || target[key] === 0) && source[key] !== undefined) target[key] = source[key];
  }

  if (source.schoolInfoApiTypes) target.schoolInfoApiTypes = source.schoolInfoApiTypes;
  if (source.hasSwimmingPool) target.hasSwimmingPool = true;
  if (source.hasIntegratedOperation) target.hasIntegratedOperation = true;
  target.dataSourceNote = `학교알리미 공시가 별도 기관명으로 제공되지 않아 동일 주소 본교(${source.schoolName}) 공시자료를 보조 근거로 반영했습니다.`;
}

const baseSchools = [...byName.values()].map((school) => ({
  ...school,
  regionalSupportSignal: Math.max(school.regionalSupportSignal ?? 0, regionalSupportSignal)
})).filter((school) => !excludedSchoolNames.has(school.schoolName));

for (const school of baseSchools) deriveSignals(school);

for (const school of baseSchools) {
  const needsPublicData =
    school.studentCount === undefined ||
    school.teacherCount === undefined ||
    school.aiProgramSignal === undefined ||
    school.regionalSupportSignal === 0;
  if (!needsPublicData || !school.address) continue;

  const source = baseSchools.find(
    (candidate) =>
      candidate !== school &&
      candidate.address === school.address &&
      candidate.schoolInfoApiTypes?.length &&
      (school.schoolName.includes(candidate.schoolName) || candidate.schoolName.includes(school.schoolName))
  );

  if (source) copyPublicSignals(school, source);
}

const schools = baseSchools;

const supportPriorityWeights = {
  educationDemand: 25,
  teacherOperation: 20,
  digitalAccess: 20,
  aiLearningOpportunity: 20,
  regionalAccess: 15
};

function inverseSignal(value, fallback = 50) {
  if (value === undefined) return fallback;
  return clamp(100 - value);
}

function ratio(numerator, denominator) {
  if (!numerator || !denominator || denominator <= 0) return undefined;
  return numerator / denominator;
}

function getDataReliability(school) {
  const directFieldCount = [school.studentCount, school.teacherCount, school.classCount].filter((value) => value !== undefined).length;
  const proxyFieldCount = [
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
  const grade = missingCoreCount <= 1 && directFieldCount + proxyFieldCount >= 7 ? "A" : missingCoreCount <= 2 ? "B" : "C";

  return {
    grade,
    label: grade === "A" ? "공개자료 충분" : grade === "B" ? "일부 대리지표" : "현장 확인 우선",
    missingCoreCount,
    directFieldCount,
    proxyFieldCount
  };
}

function getLevel(score, reliability) {
  if (reliability?.grade === "C") return "field_check";
  if (score >= 45) return "attention";
  if (score >= 30) return "medium";
  return "high";
}

function calc(school) {
  const studentsPerClass = school.studentsPerClass ?? ratio(school.studentCount, school.classCount);
  const studentTeacherRatio = school.studentTeacherRatio ?? ratio(school.studentCount, school.teacherCount);
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
    (educationDemand / 100) * supportPriorityWeights.educationDemand +
      (teacherOperation / 100) * supportPriorityWeights.teacherOperation +
      (digitalAccess / 100) * supportPriorityWeights.digitalAccess +
      (aiLearningOpportunity / 100) * supportPriorityWeights.aiLearningOpportunity +
      (regionalAccess / 100) * supportPriorityWeights.regionalAccess
  );

  const weakFactors = [
    educationDemand >= 60 ? "교육 수요·취약 여건" : null,
    teacherOperation >= 60 ? "교원·운영 여건" : null,
    digitalAccess >= 60 ? "디지털·학습공간 기반" : null,
    aiLearningOpportunity >= 60 ? "AI·SW 학습기회" : null,
    regionalAccess >= 60 ? "지역 지원 접근성" : null
  ].filter(Boolean);

  const dataReliability = getDataReliability(school);

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
    recommendedSupports: weakFactors.length ? weakFactors.map((f) => `${f} 보강 검토`) : ["공개자료 기반 일반 모니터링", "AI 디지털교과서(AIDT)·학습관리시스템(LMS) 추가자료 연계 시 확장진단 검토"],
    dataReliability,
    raw: { educationDemand, teacherOperation, digitalAccess, aiLearningOpportunity, regionalAccess }
  };
}

const scores = schools.map(calc);

writeJson(path.join(liveDir, "schools.normalized.json"), schools);
writeJson(path.join(liveDir, "readiness-scores.json"), scores);

const manifest = readJson(path.join(liveDir, "manifest.json"), {});
const hasAiProgramSignals = schools.some((school) => (school.aiProgramSignal ?? 0) > 0);
writeJson(path.join(liveDir, "manifest.json"), {
  ...manifest,
  generatedAt: new Date().toISOString(),
  counts: {
    ...(manifest.counts ?? {}),
    normalizedSchools: schools.length,
    readinessScores: scores.length
  },
  warnings: [
    ...(manifest.warnings ?? []),
    ...(schoolInfo.length === 0 ? ["학교알리미 또는 실제 학교 공시 CSV가 없어 학생·교원 지표가 제한됩니다."] : []),
    ...(!hasAiProgramSignals ? ["AI 교육 운영 공개자료가 없어 AI 프로그램 신호가 제한됩니다."] : [])
  ]
});

console.log(`[calc-readiness-score] schools=${schools.length}, scores=${scores.length}`);
