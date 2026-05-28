import fs from "node:fs";
import path from "node:path";
import { anonymizeManifest, anonymizeScores, anonymizeSchools, isAnonymizeMode } from "./anonymize";
import type { DataManifest, ReadinessScore, SchoolProfile } from "./types";

const dataVersion = process.env.NEXT_PUBLIC_DATA_VERSION === "v3" ? "v3" : "v2";
const liveDirName = dataVersion === "v3" ? "live-v3" : "live";
const liveDir = path.join(process.cwd(), "data", liveDirName);
const fallbackLiveDir = path.join(process.cwd(), "data", "live");

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
  return anonymizeManifest(readJson<DataManifest>("manifest.json", { warnings: ["실데이터 준비 필요"], counts: {} }));
}

export function getSchoolById(id: string) {
  return getSchools().find((school) => school.id === id);
}

export function getScoreBySchoolId(id: string) {
  return getReadinessScores().find((score) => score.schoolId === id);
}
