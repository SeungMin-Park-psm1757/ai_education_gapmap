import path from "node:path";
import { ensureDir, liveDir, writeJson } from "./helpers.mjs";

ensureDir(liveDir);

const warnings = [];
const targetEduOffice = process.env.TARGET_EDU_OFFICE_CODE || "B10";
const targetDistrict = process.env.TARGET_DISTRICT || "노원구";
const schoolInfoSidoCode = process.env.SCHOOLINFO_SIDO_CODE || "11";
const schoolInfoSggCode = process.env.SCHOOLINFO_SGG_CODE || "11350";
const schoolInfoYear = process.env.SCHOOLINFO_PBAN_YEAR || String(new Date().getFullYear() - 1);

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchJson(url, attempts = 4) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await wait(350 * attempt);
    }
  }

  throw lastError;
}

async function fetchNeisSchools() {
  const key = process.env.NEIS_API_KEY;
  const pageSize = 1000;
  const rows = [];

  try {
    for (let page = 1; ; page += 1) {
      const url = new URL("https://open.neis.go.kr/hub/schoolInfo");
      if (key) url.searchParams.set("KEY", key);
      url.searchParams.set("Type", "json");
      url.searchParams.set("pIndex", String(page));
      url.searchParams.set("pSize", String(pageSize));
      url.searchParams.set("ATPT_OFCDC_SC_CODE", targetEduOffice);

      const json = await fetchJson(url);
      const total = Number(json?.schoolInfo?.[0]?.head?.[0]?.list_total_count ?? 0);
      const pageRows = json?.schoolInfo?.[1]?.row ?? [];
      rows.push(...pageRows);

      if (rows.length >= total || pageRows.length < pageSize) break;
    }

    return rows.filter((row) => String(row.ORG_RDNMA ?? "").includes(targetDistrict));
  } catch (error) {
    warnings.push(`NEIS 수집 실패: ${error.message}`);
    return [];
  }
}

async function fetchSchoolLocationStandard() {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (serviceKey) return fetchSchoolLocationOpenApi(serviceKey);

  const detailPk = "uddi:67310bcf-928b-43cc-9833-eeb2f6c2886d";
  const pageSize = 500;
  const rows = [];
  const seen = new Set();

  for (let page = 1; page <= 80; page += 1) {
    const body = new URLSearchParams({
      publicDataPk: "15021148",
      publicDataDetailPk: detailPk,
      pageIndex: String(page),
      pageUnit: String(pageSize),
      recordCountPerPage: String(pageSize)
    });

    const response = await fetch("https://www.data.go.kr/tcs/dss/selectStdDataDetailView.do", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        referer: "https://www.data.go.kr/data/15021148/standard.do"
      },
      body
    });

    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

    const pageRows = parseSchoolLocationRows(await response.text());
    if (!pageRows.length) break;

    for (const row of pageRows) {
      const id = row.SD_SCHUL_CODE || row.SCHUL_NM;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      rows.push(row);
    }

    if (pageRows.length < pageSize) break;
  }

  return rows.filter((row) => {
    const address = String(row.ORG_RDNMA ?? row.ORG_RDNDA ?? "");
    return row.ATPT_OFCDC_SC_CODE === targetEduOffice && address.includes(targetDistrict);
  });
}

async function fetchSchoolLocationOpenApi(serviceKey) {
  const pageSize = 1000;
  const rows = [];

  for (let page = 1; ; page += 1) {
    const url = new URL("https://api.data.go.kr/openapi/tn_pubr_public_elesch_mskul_lc_api");
    url.searchParams.set("serviceKey", serviceKey);
    url.searchParams.set("type", "json");
    url.searchParams.set("pageNo", String(page));
    url.searchParams.set("numOfRows", String(pageSize));

    const json = await fetchJson(url);
    const header = json?.response?.header;
    if (header?.resultCode && header.resultCode !== "00") {
      throw new Error(`공공데이터포털 API 오류 ${header.resultCode}: ${header.resultMsg}`);
    }

    const body = json?.response?.body ?? {};
    const pageRows = body?.items ?? [];
    rows.push(...pageRows.map(mapSchoolLocationApiRow));

    const total = Number(body?.totalCount ?? rows.length);
    if (rows.length >= total || pageRows.length < pageSize) break;
  }

  return rows.filter((row) => {
    const address = String(row.ORG_RDNMA ?? row.ORG_RDNDA ?? "");
    return row.ATPT_OFCDC_SC_CODE === targetEduOffice && address.includes(targetDistrict);
  });
}

function mapSchoolLocationApiRow(row) {
  return {
    ATPT_OFCDC_SC_CODE: educationOfficeCode(row.cddcNm),
    ATPT_OFCDC_SC_NM: row.cddcNm,
    SD_SCHUL_CODE: row.schoolId,
    SCHUL_NM: row.schoolNm,
    SCHUL_KND_SC_NM: row.schoolSe,
    LCTN_SC_NM: row.cddcNm?.replace("교육청", "") ?? "",
    JU_ORG_NM: row.edcSportNm,
    FOND_SC_NM: row.fondType,
    ORG_RDNMA: row.rdnmadr,
    ORG_RDNDA: row.lnmadr,
    LOAD_DTM: row.referenceDate,
    latitude: row.latitude,
    longitude: row.longitude
  };
}

function parseSchoolLocationRows(html) {
  const rows = [];
  const trPattern = /<tr class="contentsTr">([\s\S]*?)<\/tr>/g;
  let match;

  while ((match = trPattern.exec(html))) {
    const cells = [...match[1].matchAll(/<td>\s*([\s\S]*?)\s*<\/td>/g)].map((cell) => cleanHtml(cell[1]));
    if (cells.length < 18) continue;

    rows.push({
      ATPT_OFCDC_SC_CODE: educationOfficeCode(cells[10]),
      ATPT_OFCDC_SC_NM: cells[10],
      SD_SCHUL_CODE: cells[0],
      SCHUL_NM: cells[1],
      SCHUL_KND_SC_NM: cells[2],
      LCTN_SC_NM: cells[10]?.replace("교육청", "") ?? "",
      JU_ORG_NM: cells[12],
      FOND_SC_NM: cells[4],
      ORG_RDNMA: cells[8],
      ORG_RDNDA: cells[7],
      LOAD_DTM: cells[17],
      latitude: cells[15],
      longitude: cells[16]
    });
  }

  return rows;
}

function cleanHtml(value) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function educationOfficeCode(name) {
  const codes = {
    "서울특별시교육청": "B10",
    "부산광역시교육청": "C10",
    "대구광역시교육청": "D10",
    "인천광역시교육청": "E10",
    "광주광역시교육청": "F10",
    "대전광역시교육청": "G10",
    "울산광역시교육청": "H10",
    "세종특별자치시교육청": "I10",
    "경기도교육청": "J10",
    "강원특별자치도교육청": "K10",
    "충청북도교육청": "M10",
    "충청남도교육청": "N10",
    "전북특별자치도교육청": "P10",
    "전라남도교육청": "Q10",
    "경상북도교육청": "R10",
    "경상남도교육청": "S10",
    "제주특별자치도교육청": "T10"
  };

  return codes[name] ?? "";
}

async function fetchSchoolInfoDisclosure() {
  const key = process.env.SCHOOLINFO_API_KEY;
  if (!key) {
    warnings.push("SCHOOLINFO_API_KEY 미설정: 학교알리미 학생·교원 공시정보를 수집하지 못했습니다.");
    return [];
  }

  const byName = new Map();
  const schoolKinds = ["02", "03", "04", "05", "07"];
  const apiTypes = ["62", "09", "22", "17", "18", "56", "59"];

  for (const schoolKind of schoolKinds) {
    for (const apiType of apiTypes) {
      const rows = await fetchSchoolInfoApi(apiType, schoolKind);
      await wait(120);
      for (const row of rows) {
      const school = getSchoolInfoRecord(byName, row);
        mergeSchoolInfoRow(school, row, apiType);
      }
    }
  }

  return [...byName.values()];
}

async function fetchSchoolInfoApi(apiType, schoolKind) {
  const url = new URL("https://www.schoolinfo.go.kr/openApi.do");
  url.searchParams.set("apiKey", process.env.SCHOOLINFO_API_KEY);
  url.searchParams.set("apiType", apiType);
  url.searchParams.set("sidoCode", schoolInfoSidoCode);
  url.searchParams.set("sggCode", schoolInfoSggCode);
  url.searchParams.set("schulKndCode", schoolKind);
  url.searchParams.set("pbanYr", schoolInfoYear);

  const json = await fetchJson(url);
  if (json.resultCode !== "success") {
    if (!String(json.resultMsg ?? "").includes("데이터가 존재하지 않습니다")) {
      warnings.push(`학교알리미 apiType=${apiType}, schoolKind=${schoolKind} 수집 실패: ${json.resultMsg}`);
    }
    return [];
  }

  return Array.isArray(json.list) ? json.list : [];
}

function getSchoolInfoRecord(byName, row) {
  const name = row.SCHUL_NM;
  if (!byName.has(name)) {
    byName.set(name, {
      schoolName: name,
      SCHUL_NM: name,
      schoolInfoCode: row.SCHUL_CODE,
      schoolKindCode: row.SCHUL_KND_SC_CODE,
      eduOffice: row.JU_ORG_NM,
      publicNoticeYear: schoolInfoYear
    });
  }

  return byName.get(name);
}

function mergeSchoolInfoRow(school, row, apiType) {
  school.apiTypes = [...new Set([...(school.apiTypes ?? []), apiType])];

  if (apiType === "62") {
    setNumberIfBetter(school, "studentCount", row.COL_FGR_SUM ?? row.COL_SUM_FGR4 ?? row.COL_SUM_FGR2 ?? row.COL_S_SUM);
    setNumberIfBetter(school, "classCount", row.COL_SUM ?? row.COL_SUM_4 ?? row.COL_SUM_2 ?? row.COL_C_SUM);
    setNumberIfBetter(school, "studentsPerClass", row.AVG_FGR_SUM ?? row.AVG_SUM_FGR2 ?? row.COL_SUM_4);
  }

  if (apiType === "09") {
    setNumberIfBetter(school, "studentCount", row.COL_S_SUM ?? row.COL_SUM_S4 ?? row.COL_SUM_S2);
    setNumberIfBetter(school, "classCount", row.COL_C_SUM ?? row.COL_SUM_C4 ?? row.COL_SUM_C2);
    setNumberIfBetter(school, "teacherCount", row.TEACH_CNT);
  }

  if (apiType === "22") {
    setNumberIfBetter(school, "teacherCount", row.COL_S);
  }

  if (apiType === "17") {
    addToNumber(school, "generalClassroomCount", row.COM_CCCLA_FGR);
    addToNumber(school, "subjectClassroomCount", row.CURR_CCCLA_FGR);
    addToNumber(school, "learningSupportRoomCount", row.LRN_SPORT_ETC_CCCLA_FGR);
    addToNumber(school, "studentWelfareRoomCount", row.STDNT_SWRM_FGR);
    addToNumber(school, "restroomCount", row.ML_TOI_FGR);
    addToNumber(school, "restroomCount", row.FML_TOI_FGR);
  }

  if (apiType === "18") {
    addToNumber(school, "careerCounselRoomCount", row.COSE_CNSRM_FGR);
    setNumberIfBetter(school, "broadcastCapacity", row.BRHS_RCPTN_NMPR_FGR);
    school.hasSwimmingPool = truthyMark(row.SWMPL_ENNC);
    school.hasIntegratedOperation = truthyMark(row.UNITY_UON);
  }

  if (apiType === "56") {
    setNumberIfBetter(school, "clubCount", row.CREAT_EXPER_ACT_CCCLU_FGR);
    setNumberIfBetter(school, "clubStudentCount", row.CREAT_EXPER_ACT_STDNT_FGR);
    setNumberIfBetter(school, "clubTeacherCount", row.CREAT_EXPER_ACT_CCH_TCR_FGR);
    setNumberIfBetter(school, "clubExternalInstructorCount", row.CREAT_EXPER_ACT_EXTRLLECTR_FGR);
    setNumberIfBetter(school, "studentSelectedClubCount", row.STDNT_SLCTL_CCCLU_FGR);
    setNumberIfBetter(school, "creativeActivityBudget", row.CREAT_EXPER_ACT_BDG_SPORT_AMT);
  }

  if (apiType === "59") {
    setNumberIfBetter(school, "afterSchoolProgramCount", row.SUM_ASL_PGM_FGR ?? row.ASL_CURR_PGM_FGR);
    setNumberIfBetter(school, "afterSchoolStudentCount", row.SUM_ASL_REG_STDNT_FGR ?? row.ASL_CURR_REG_STDNT_FGR ?? row.ASL_PTPT_STDNT_FGR);
    setNumberIfBetter(school, "currentAfterSchoolProgramCount", row.ASL_CURR_PGM_FGR);
    setNumberIfBetter(school, "currentAfterSchoolStudentCount", row.ASL_CURR_REG_STDNT_FGR);
    setNumberIfBetter(school, "vacationAfterSchoolProgramCount", row.SUM_ASL_PGM_FGR);
    setNumberIfBetter(school, "vacationAfterSchoolStudentCount", row.SUM_ASL_REG_STDNT_FGR);
  }
}

function setNumberIfBetter(target, key, value) {
  const parsed = toNumber(value);
  if (parsed === undefined) return;
  target[key] = Math.max(target[key] ?? 0, parsed);
}

function addToNumber(target, key, value) {
  const parsed = toNumber(value);
  if (parsed === undefined) return;
  target[key] = (target[key] ?? 0) + parsed;
}

function truthyMark(value) {
  const text = String(value ?? "").trim();
  if (!text) return false;
  return ["유", "Y", "O", "○", "있음", "운영"].includes(text);
}

function toNumber(value) {
  const match = String(value ?? "")
    .replace(/,/g, "")
    .match(/-?\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function main() {
  let neisSchools = await fetchNeisSchools();
  let schoolLocationStandard = [];
  const schoolInfo = await fetchSchoolInfoDisclosure();

  if (process.env.DATA_GO_KR_SERVICE_KEY || !neisSchools.length) {
    try {
      schoolLocationStandard = await fetchSchoolLocationStandard();
    } catch (error) {
      warnings.push(`공공데이터포털 학교위치 표준데이터 수집 실패: ${error.message}`);
    }
  }

  if (!neisSchools.length) {
    try {
      neisSchools = schoolLocationStandard;
      if (schoolLocationStandard.length) {
        warnings.push("NEIS 전체 수집 키가 없어 공공데이터포털 전국초중등학교위치표준데이터를 사용했습니다.");
      }
    } catch (error) {
      warnings.push(`공공데이터포털 학교위치 표준데이터 대체 실패: ${error.message}`);
    }
  }

  writeJson(path.join(liveDir, "neis-schools.raw.json"), neisSchools);
  writeJson(path.join(liveDir, "school-location-standard.raw.json"), schoolLocationStandard);
  writeJson(path.join(liveDir, "schoolinfo-public.raw.json"), schoolInfo);
  writeJson(path.join(liveDir, "manifest.json"), {
    generatedAt: new Date().toISOString(),
    targetDistrict,
    counts: {
      neisSchools: neisSchools.length,
      schoolLocationStandard: schoolLocationStandard.length,
      schoolInfo: schoolInfo.length
    },
    warnings
  });

  console.log(`[fetch-public-data] NEIS schools: ${neisSchools.length}`);
  console.log(`[fetch-public-data] school location rows: ${schoolLocationStandard.length}`);
  console.log(`[fetch-public-data] schoolinfo rows: ${schoolInfo.length}`);
  if (warnings.length) console.warn(warnings.join("\n"));
}

main();
