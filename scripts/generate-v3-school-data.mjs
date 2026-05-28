import path from "node:path";
import { ensureDir, liveDir, readJson, writeJson } from "./helpers.mjs";

const schools = readJson(path.join(liveDir, "schools.normalized.json"), []);
const publicScores = readJson(path.join(liveDir, "readiness-scores.json"), []);
const outputDir = path.join(process.cwd(), "data", "live-v3");

const weights = {
  educationDemand: 25,
  teacherOperation: 20,
  digitalAccess: 20,
  aiLearningOpportunity: 20,
  regionalAccess: 15
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pseudoRandom(seed) {
  let value = seed || 1;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return ((value >>> 0) % 10000) / 10000;
}

function qualityFromNeed(need, seed, spread = 26) {
  return clamp(100 - need * 0.62 - pseudoRandom(seed) * spread + pseudoRandom(seed ^ 0x9e3779b9) * 18, 20, 98);
}

function getLevel(score, reliabilityGrade) {
  if (reliabilityGrade === "C") return "field_check";
  if (score >= 45) return "attention";
  if (score >= 30) return "medium";
  return "high";
}

function getType(raw, reliabilityGrade) {
  if (reliabilityGrade === "C") return "현장 확인 우선";
  const factors = [
    [raw.educationDemand, "교육 수요·취약 여건"],
    [raw.teacherOperation, "교원·운영 여건"],
    [raw.digitalAccess, "디지털·학습공간 기반"],
    [raw.aiLearningOpportunity, "AI·SW 학습기회"],
    [raw.regionalAccess, "지역 지원 접근성"]
  ].sort((a, b) => b[0] - a[0]);
  return factors[0]?.[0] >= 45 ? factors[0][1] : "일반 모니터링";
}

function weakFactors(raw) {
  return [
    raw.educationDemand >= 60 ? "교육 수요·취약 여건" : null,
    raw.teacherOperation >= 55 ? "교원·운영 여건" : null,
    raw.digitalAccess >= 55 ? "디지털·학습공간 기반" : null,
    raw.aiLearningOpportunity >= 55 ? "AI·SW 학습기회" : null,
    raw.regionalAccess >= 55 ? "지역 지원 접근성" : null
  ].filter(Boolean);
}

function recommendedSupports(raw, reliabilityGrade) {
  if (reliabilityGrade === "C") {
    return ["학교 추가자료 보완 요청", "교육지원청 현장 확인 검토"];
  }
  const supports = [];
  if (raw.digitalAccess >= 55) supports.push("디지털 학습공간·기기 현황 점검");
  if (raw.teacherOperation >= 55) supports.push("AI 활용 수업 연수·컨설팅 검토");
  if (raw.aiLearningOpportunity >= 55) supports.push("방과후 AI·SW 프로그램 연계 검토");
  if (raw.regionalAccess >= 55) supports.push("지역 SW교육센터·외부 강사 연계 검토");
  return supports.length ? supports : ["공개자료와 학교 추가자료 기반 일반 모니터링"];
}

const publicScoreById = new Map(publicScores.map((score) => [score.schoolId, score]));

const schoolAdditionalData = schools.map((school, index) => {
  const publicScore = publicScoreById.get(school.id);
  const raw = publicScore?.raw ?? {
    educationDemand: 45,
    teacherOperation: 45,
    digitalAccess: 45,
    aiLearningOpportunity: 45,
    regionalAccess: 45
  };
  const seed = hashString(`${school.id}-${school.schoolName}-${index}`);
  return {
    schoolId: school.id,
    dataKind: "학교 제공 추가자료 예시",
    aidtConnectionStability: qualityFromNeed(raw.digitalAccess, seed),
    lmsUseContinuity: qualityFromNeed(raw.aiLearningOpportunity, seed ^ 0xabcddcba),
    teacherTrainingCompletion: qualityFromNeed(raw.teacherOperation, seed ^ 0x13579bdf),
    deviceAccessReadiness: qualityFromNeed(raw.digitalAccess, seed ^ 0x2468ace0),
    aiSwProgramCoverage: qualityFromNeed(raw.aiLearningOpportunity, seed ^ 0x10203040),
    externalAiProgramAccess: qualityFromNeed(raw.regionalAccess, seed ^ 0x55667788)
  };
});

const additionalById = new Map(schoolAdditionalData.map((row) => [row.schoolId, row]));

const scores = publicScores.map((score) => {
  const extra = additionalById.get(score.schoolId);
  if (!extra) return score;

  const raw = {
    educationDemand: score.raw.educationDemand,
    teacherOperation: clamp(score.raw.teacherOperation * 0.45 + (100 - extra.teacherTrainingCompletion) * 0.55),
    digitalAccess: clamp(
      score.raw.digitalAccess * 0.35 +
        (100 - extra.deviceAccessReadiness) * 0.35 +
        (100 - extra.aidtConnectionStability) * 0.3
    ),
    aiLearningOpportunity: clamp(
      score.raw.aiLearningOpportunity * 0.35 +
        (100 - extra.aiSwProgramCoverage) * 0.35 +
        (100 - extra.lmsUseContinuity) * 0.3
    ),
    regionalAccess: clamp(score.raw.regionalAccess * 0.65 + (100 - extra.externalAiProgramAccess) * 0.35)
  };

  const calculated =
    (raw.educationDemand / 100) * weights.educationDemand +
    (raw.teacherOperation / 100) * weights.teacherOperation +
    (raw.digitalAccess / 100) * weights.digitalAccess +
    (raw.aiLearningOpportunity / 100) * weights.aiLearningOpportunity +
    (raw.regionalAccess / 100) * weights.regionalAccess;

  const reliabilityGrade = score.dataReliability?.grade ?? "B";
  const reliabilityLabel = score.dataReliability?.label ?? (reliabilityGrade === "A" ? "공개자료 충분" : "일부 대리지표");
  const schoolDataAdjustment = 6;
  const scoreValue = clamp(calculated + schoolDataAdjustment);

  return {
    ...score,
    score: scoreValue,
    level: getLevel(scoreValue, reliabilityGrade),
    type: getType(raw, reliabilityGrade),
    signals: [
      `지원 소요 지수: ${scoreValue}점`,
      "공공데이터 + 학교 추가자료 예시 반영",
      `AIDT 접속 안정성: ${extra.aidtConnectionStability}점`,
      `LMS 사용 지속성: ${extra.lmsUseContinuity}점`
    ],
    weakFactors: weakFactors(raw),
    recommendedSupports: recommendedSupports(raw, reliabilityGrade),
    dataReliability: {
      grade: reliabilityGrade,
      label: reliabilityLabel,
      missingCoreCount: score.dataReliability?.missingCoreCount ?? 0,
      directFieldCount: score.dataReliability?.directFieldCount ?? 3,
      proxyFieldCount: score.dataReliability?.proxyFieldCount ?? 5
    },
    raw
  };
});

const manifest = {
  generatedAt: new Date().toISOString(),
  targetSido: "서울특별시",
  targetDistrict: "노원구",
  dataVersion: "v3",
  warnings: [
    "v3는 공공데이터에 학교 제공 추가자료 예시값을 결합한 시연용 산출입니다.",
    "AIDT·LMS 값은 실제 기관 연계 전 임시값이며, 운영 구조 검증 목적으로만 사용합니다."
  ],
  counts: {
    schools: schools.length,
    scores: scores.length,
    schoolAdditionalData: schoolAdditionalData.length
  }
};

ensureDir(outputDir);
writeJson(path.join(outputDir, "schools.normalized.json"), schools);
writeJson(path.join(outputDir, "readiness-scores.json"), scores);
writeJson(path.join(outputDir, "school-additional-v3.json"), schoolAdditionalData);
writeJson(path.join(outputDir, "manifest.json"), manifest);

console.log(`[generate-v3-school-data] schools=${schools.length}, scores=${scores.length}, additional=${schoolAdditionalData.length}`);
