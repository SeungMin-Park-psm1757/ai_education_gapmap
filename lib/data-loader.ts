import fs from "node:fs";
import path from "node:path";
import { anonymizeManifest, anonymizeScores, anonymizeSchools, isAnonymizeMode } from "./anonymize";
import type { DataManifest, ReadinessScore, ScenarioDiagnosis, SchoolProfile } from "./types";

const dataVersion = process.env.NEXT_PUBLIC_DATA_VERSION;
const liveDirName = dataVersion === "v3-scenario" || dataVersion === "v3-dev" ? "live-v3" : "live";
const liveDir = path.join(process.cwd(), "data", liveDirName);
const fallbackLiveDir = path.join(process.cwd(), "data", "live");
const scenarioDir = path.join(process.cwd(), "data", "live-v3");

function readJson<T>(fileName: string, fallback: T): T {
  const filePath = path.join(liveDir, fileName);
  if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  const fallbackPath = path.join(fallbackLiveDir, fileName);
  if (fs.existsSync(fallbackPath)) return JSON.parse(fs.readFileSync(fallbackPath, "utf8")) as T;
  return fallback;
}

export function getSchools(): SchoolProfile[] {
  const schools = readJson<SchoolProfile[]>("schools.normalized.json", []);
  if (!isAnonymizeMode()) return schools;
  return anonymizeSchools(schools).schools;
}

export function getReadinessScores(): ReadinessScore[] {
  const scores = readJson<ReadinessScore[]>("readiness-scores.json", []);
  if (!isAnonymizeMode()) return scores;
  const rawSchools = readJson<SchoolProfile[]>("schools.normalized.json", []);
  const { nameById } = anonymizeSchools(rawSchools);
  return anonymizeScores(scores, nameById);
}

export function getManifest(): DataManifest {
  const manifest = anonymizeManifest(readJson<DataManifest>("manifest.json", { warnings: ["실데이터 준비 필요"], counts: {} }));
  if (dataVersion === "v3-scenario" || dataVersion === "v3-dev") return manifest;
  const scenarioDiagnostics = readScenarioDiagnostics();
  return {
    ...manifest,
    counts: {
      ...manifest.counts,
      scenarioDiagnostics: scenarioDiagnostics.length
    },
    scenarioDataSources: [
      {
        name: "확장진단 시나리오 데이터",
        count: scenarioDiagnostics.length,
        fields: [
          "AI 디지털교과서(AIDT) 접속 안정성",
          "학습관리시스템(LMS) 사용 지속성",
          "교원 연수 이수",
          "기기 접근성",
          "AI·SW 프로그램 운영",
          "외부 AI프로그램 접근성"
        ],
        isIncludedInMainScore: false
      }
    ]
  };
}

export function getSchoolById(id: string) {
  return getSchools().find((school) => school.id === id);
}

export function getScoreBySchoolId(id: string) {
  return getReadinessScores().find((score) => score.schoolId === id);
}

function readScenarioDiagnostics(): ScenarioDiagnosis[] {
  const filePath = path.join(scenarioDir, "scenario-diagnostics.json");
  if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, "utf8")) as ScenarioDiagnosis[];
  const legacyPath = path.join(scenarioDir, "school-additional-v3.json");
  if (!fs.existsSync(legacyPath)) return [];
  const legacy = JSON.parse(fs.readFileSync(legacyPath, "utf8")) as Array<Record<string, unknown>>;
  return legacy.map((row) => ({
    schoolId: String(row.schoolId ?? ""),
    mode: "scenario",
    label: "확장진단 시나리오",
    description: "학교·교육청 추가자료가 제공될 경우 가능한 분석 구조를 보여주는 예시입니다. 메인 지원 소요 지수에는 반영하지 않습니다.",
    aidtAccessStability: Number(row.aidtConnectionStability ?? 0),
    lmsUsageContinuity: Number(row.lmsUseContinuity ?? 0),
    teacherTrainingCompletion: Number(row.teacherTrainingCompletion ?? 0),
    deviceAccessibility: Number(row.deviceAccessReadiness ?? 0),
    aiSwProgramOperation: Number(row.aiSwProgramCoverage ?? 0),
    externalProgramAccessibility: Number(row.externalAiProgramAccess ?? 0),
    isIncludedInMainScore: false
  }));
}

export function getScenarioDiagnostics(): ScenarioDiagnosis[] {
  return readScenarioDiagnostics();
}
