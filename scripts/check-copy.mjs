import fs from "node:fs";
import path from "node:path";

const roots = ["app", "components", "lib", "README.md", "START_HERE.md", "reports"];
const ignoredFiles = new Set([
  path.normalize("docs/COPY_GUIDE.md"),
  path.normalize("docs/MVP_STRUCTURE_REVIEW.md"),
  path.normalize("reports/copy_review_report.md"),
  path.normalize("reports/redteam_response.md")
]);

const risky = [
  "AI 교육 준비도",
  "학교 평가",
  "낮은 학교",
  "부실 학교",
  "AI가 판단",
  "확정 추천",
  "실제 수업 수준",
  "우수 학교",
  "열악 학교",
  "지원우선 지수",
  "지원우선",
  "집중 지원",
  "보완 우선",
  "현행 유지",
  "자료 미연계"
];

const allowedContext = [
  "피해야",
  "권장 표현",
  "대체어",
  "리스크",
  "위험",
  "현재 대응",
  "발표 답변",
  "용어 변경",
  "기존",
  "기술 문서 병기",
  "지원 소요 지수(기존 지원우선 지수)"
];

const findings = [];

function isAllowedContext(line) {
  return allowedContext.some((pattern) => line.includes(pattern));
}

function scanFile(file) {
  if (!/\.(tsx|ts|md|mjs|js)$/.test(file)) return;
  const normalized = path.normalize(file);
  if (ignoredFiles.has(normalized)) return;
  const text = fs.readFileSync(file, "utf8");
  text.split(/\r?\n/).forEach((line, index) => {
    for (const word of risky) {
      if (line.includes(word) && !isAllowedContext(line)) {
        findings.push({ file, line: index + 1, word, text: line.trim() });
      }
    }
  });
}

function walk(target) {
  if (!fs.existsSync(target)) return;
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(target)) walk(path.join(target, name));
    return;
  }
  scanFile(target);
}

roots.forEach(walk);

fs.mkdirSync("reports", { recursive: true });
const report = findings.length
  ? [
      "# Copy Review Report",
      "",
      "다음 표현을 화면/문서에서 재검토하세요.",
      "",
      ...findings.map((item) => `- ${item.file}:${item.line} · \`${item.word}\` · ${item.text}`)
    ].join("\n")
  : "# Copy Review Report\n\n위험 표현 없음\n";
fs.writeFileSync("reports/copy_review_report.md", report, "utf8");

if (findings.length) {
  console.error("위험 표현이 발견되었습니다. reports/copy_review_report.md를 확인하세요.");
  process.exit(1);
}

console.log("문구 검수 통과");
