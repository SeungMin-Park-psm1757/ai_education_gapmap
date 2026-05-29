import type { DataManifest, ReadinessScore, SchoolProfile } from "./types";

export function isAnonymizeMode() {
  return process.env.NEXT_PUBLIC_DEMO_ANONYMIZE !== "false";
}

export function getRegionLabel() {
  return isAnonymizeMode() ? "서울 A권역" : "서울 A권역";
}

function sequenceLabel(index: number) {
  let value = index;
  let label = "";
  do {
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return label;
}

function schoolSuffix(schoolLevel?: string) {
  if (schoolLevel?.includes("초")) return "초";
  if (schoolLevel?.includes("중")) return "중";
  if (schoolLevel?.includes("고")) return "고";
  return "교";
}

export function getAnonymousSchoolName(school: Pick<SchoolProfile, "schoolLevel">, index: number) {
  return `${sequenceLabel(index)}${schoolSuffix(school.schoolLevel)}`;
}

export function anonymizeSchools(schools: SchoolProfile[]) {
  const nameById = new Map<string, string>();
  const anonymized = schools.map((school, index) => {
    const schoolName = getAnonymousSchoolName(school, index);
    nameById.set(school.id, schoolName);
    return {
      ...school,
      schoolName,
      address: "서울 A권역",
      district: "서울 A권역",
      eduOffice: "서울 A권역 교육지원청",
      phone: undefined,
      homepage: undefined,
      latitude: undefined,
      longitude: undefined,
      dataSourceNote: school.dataSourceNote ? "공개자료 보조 근거를 반영했습니다." : undefined,
      publicSupplementSource: school.publicSupplementSource ? "공개자료 보조 출처" : undefined
    };
  });

  return { schools: anonymized, nameById };
}

export function anonymizeScores(scores: ReadinessScore[], nameById: Map<string, string>) {
  return scores.map((score) => ({
    ...score,
    schoolName: nameById.get(score.schoolId) ?? score.schoolName
  }));
}

export function anonymizeManifest(manifest: DataManifest) {
  if (!isAnonymizeMode()) return manifest;
  return {
    ...manifest,
    targetSido: "서울",
    targetDistrict: "A권역",
    warnings: manifest.warnings?.map((warning) =>
      warning
        .replaceAll("서울 A권역", "A권역")
        .replaceAll("서울특별시", "서울")
        .replaceAll("서울시", "서울")
    )
  };
}
