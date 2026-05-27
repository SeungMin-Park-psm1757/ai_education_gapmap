import fs from "node:fs";
import path from "node:path";
import { ensureDir, liveDir, parseCsv, writeJson } from "./helpers.mjs";

ensureDir(liveDir);

const imports = [
  ["schoolinfo-public.raw.json", process.env.SCHOOLINFO_PUBLIC_CSV_PATH],
  ["edu-stats.raw.json", process.env.EDU_STATS_CSV_PATH],
  ["school-facility.raw.json", process.env.SCHOOL_FACILITY_CSV_PATH],
  ["digital-infra.raw.json", process.env.DIGITAL_INFRA_CSV_PATH],
  ["ai-program.raw.json", process.env.AI_PROGRAM_CSV_PATH],
  ["teacher-training.raw.json", process.env.TEACHER_TRAINING_CSV_PATH],
  ["ai-centers.raw.json", process.env.AI_CENTER_CSV_PATH],
  ["sw-ai-camps.raw.json", process.env.SW_AI_CAMP_CSV_PATH],
  ["public-learning-centers.raw.json", process.env.PUBLIC_LEARNING_CENTER_CSV_PATH]
];

const importManifest = [];

for (const [outputName, filePath] of imports) {
  const outputPath = path.join(liveDir, outputName);
  if (!filePath) {
    if (fs.existsSync(outputPath)) {
      importManifest.push({ outputName, status: "preserved-api-output" });
    } else {
      importManifest.push({ outputName, status: "not-configured" });
      writeJson(outputPath, []);
    }
    continue;
  }
  if (!fs.existsSync(filePath)) {
    importManifest.push({ outputName, status: "missing-file", filePath });
    writeJson(outputPath, []);
    continue;
  }
  const text = fs.readFileSync(filePath, "utf8");
  const rows = parseCsv(text);
  writeJson(outputPath, rows);
  importManifest.push({ outputName, status: "imported", filePath, rows: rows.length });
}

writeJson(path.join(liveDir, "import-manifest.json"), importManifest);
console.log("[import-public-files] done");
