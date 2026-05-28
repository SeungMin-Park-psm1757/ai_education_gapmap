import { isFieldCheckFirst } from "@/lib/readiness-score";
import type { ReadinessScore } from "@/lib/types";

export type AdminAction = {
  title: string;
  why: string;
  action: string;
  requiredData: string;
};

export function getPrimaryAction(score: ReadinessScore) {
  return getAdminActions(score)[0];
}

export function getAdminActions(score: ReadinessScore): AdminAction[] {
  if (isFieldCheckFirst(score)) {
    return [
      {
        title: "현장 확인",
        why: "공개자료 결측이 많아 점수 해석의 확실성이 낮습니다.",
        action: "자료 결측 항목 보완을 위한 학교 추가자료 요청을 검토하세요.",
        requiredData: "학생·교원·시설·프로그램 최신 자료"
      },
      {
        title: "자료 보완",
        why: "핵심 지표 일부가 공개자료 기반 대체지표에 의존합니다.",
        action: "교육지원청 보유 자료와 학교 제출자료를 대조하세요.",
        requiredData: "공시 원자료, 학교 자체 운영자료"
      },
      {
        title: "연수 배정",
        why: "교원 지원 필요성은 추가 확인 후 판단해야 합니다.",
        action: "교사의 AI 활용 수업 연수 및 수업설계 컨설팅 추진 여부를 재검토하세요.",
        requiredData: "교원 연수 이력, 수업 활용 계획"
      },
      {
        title: "프로그램 연계",
        why: "학습기회 보강 여부는 학교 운영자료 확인이 필요합니다.",
        action: "방과후 AI·SW 프로그램 또는 지역 SW교육센터 연계를 검토하세요.",
        requiredData: "동아리·방과후 운영 현황"
      }
    ];
  }

  const actions: AdminAction[] = [];

  if (score.raw.digitalAccess >= 55) {
    actions.push({
      title: "예산 검토",
      why: "디지털 학습공간과 기기 여건 보강이 필요합니다.",
      action: "디지털 학습공간·기기 현황 점검 후 정보화 예산 우선 검토를 진행하세요.",
      requiredData: "기기 보유 현황, 무선망 점검표, 학습공간 자료"
    });
  }

  if (score.raw.teacherOperation >= 55) {
    actions.push({
      title: "연수 배정",
      why: "교사의 AI 활용 수업 운영을 지원할 필요가 있습니다.",
      action: "교사의 AI 활용 수업 연수 및 수업설계 컨설팅 추진을 검토하세요.",
      requiredData: "교원 연수 이력, 희망 교과, 컨설팅 수요"
    });
  }

  if (score.raw.aiLearningOpportunity >= 55) {
    actions.push({
      title: "프로그램 연계",
      why: "학생의 AI·SW 학습기회를 보강할 필요가 있습니다.",
      action: "방과후 AI·SW 프로그램 또는 지역 SW교육센터 연계를 검토하세요.",
      requiredData: "방과후·동아리 개설 현황, 참여 학생 수"
    });
  }

  if (score.raw.regionalAccess >= 55) {
    actions.push({
      title: "자원 연계",
      why: "학교 밖 AI·SW 자원과의 연결 지원이 필요합니다.",
      action: "온라인 공동수업, 거점학교, 외부 강사 파견 등 학교 밖 자원 연계 추진을 검토하세요.",
      requiredData: "통학·접근 여건, 인근 프로그램, 강사풀"
    });
  }

  if (!actions.length) {
    actions.push(
      {
        title: "프로그램 연계",
        why: "현재 자료상 큰 보강 항목은 없지만 운영 현황 확인은 필요합니다.",
        action: "기존 AI·SW 학습기회 유지와 확산을 검토하세요.",
        requiredData: "프로그램 운영 실적, 학생 참여 변화"
      },
      {
        title: "연수 배정",
        why: "공개자료만으로 교실 활용 수준까지 보기는 어렵습니다.",
        action: "AI 디지털교과서(AIDT)·학습관리시스템(LMS) 자료가 연결되면 교원 연수와 수업설계 지원 필요성을 재점검하세요.",
        requiredData: "AI 디지털교과서(AIDT)·학습관리시스템(LMS) 사용빈도, 교원 연수 이력"
      }
    );
  }

  const defaults: AdminAction[] = [
    {
      title: "예산 검토",
      why: "지원 소요 지수로 예산 검토 대상을 좁힐 수 있습니다.",
      action: "지원 소요 지수와 학교 의견을 함께 보고 예산 배정 우선순위를 검토하세요.",
      requiredData: "학교 의견서, 예산 신청 내역"
    },
    {
      title: "자료 보완",
      why: "공개자료와 학교 제공자료가 다를 수 있습니다.",
      action: "학교 추가자료 요청으로 최신 운영 현황을 확인하세요.",
      requiredData: "학교 제출자료, 최신 운영 기록"
    }
  ];

  for (const action of defaults) {
    if (actions.length >= 4) break;
    if (!actions.some((item) => item.title === action.title)) actions.push(action);
  }

  return actions.slice(0, 4);
}
