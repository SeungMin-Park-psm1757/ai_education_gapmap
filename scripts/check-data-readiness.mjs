import path from "node:path";
import { liveDir, readJson } from "./helpers.mjs";

const schools = readJson(path.join(liveDir, "schools.normalized.json"), []);
const scores = readJson(path.join(liveDir, "readiness-scores.json"), []);
const manifest = readJson(path.join(liveDir, "manifest.json"), { warnings: [] });

console.log("데이터 준비 상태");
console.log(`- 정규화 학교: ${schools.length}`);
console.log(`- 지원지수 산출: ${scores.length}`);
console.log(`- 경고: ${(manifest.warnings ?? []).length}`);

if (schools.length === 0 || scores.length === 0) {
  console.error("실제 공공데이터가 준비되지 않았습니다. API 키 또는 실제 CSV를 연결한 뒤 npm run prepare:data를 실행하세요.");
  process.exit(1);
}
