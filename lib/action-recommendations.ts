import { isFieldCheckFirst } from "@/lib/readiness-score";
import type { ReadinessScore } from "@/lib/types";

export type AdminAction = {
  title: string;
  description: string;
};

export function getPrimaryAction(score: ReadinessScore) {
  return getAdminActions(score)[0];
}

export function getAdminActions(score: ReadinessScore): AdminAction[] {
  if (isFieldCheckFirst(score)) {
    return [
      {
        title: "현장 확인",
        description: "점수 해석보다 학교 추가자료 요청과 현장 확인을 먼저 진행하세요."
      },
      {
        title: "자료 보완",
        description: "학생·교원·시설·프로그램 공시 항목의 최신 여부를 확인하세요."
      },
      {
        title: "연수 배정",
        description: "자료 보완 후 AI 활용 수업 연수 필요성을 다시 검토하세요."
      },
      {
        title: "프로그램 연계",
        description: "확인 결과에 따라 방과후 AI·SW 프로그램 연계를 검토하세요."
      }
    ];
  }

  const actions: AdminAction[] = [];

  if (score.raw.digitalAccess >= 55) {
    actions.push({
      title: "예산 검토",
      description: "무선망·기기·디지털 학습공간 현황을 우선 점검하고, 관련 예산 배정을 검토하세요."
    });
  }

  if (score.raw.teacherOperation >= 55) {
    actions.push({
      title: "연수 배정",
      description: "AI 활용 수업 연수 대상학교로 우선 검토하고, 수업설계 컨설팅을 연결하세요."
    });
  }

  if (score.raw.aiLearningOpportunity >= 55) {
    actions.push({
      title: "프로그램 연계",
      description: "방과후 AI·SW 프로그램, 지역 SW교육센터, 대학·기업 연계 프로그램 배정을 검토하세요."
    });
  }

  if (score.raw.regionalAccess >= 55) {
    actions.push({
      title: "현장 확인",
      description: "온라인 공동수업, 거점학교, 외부 강사 파견 등 학교 밖 자원 연계를 우선 검토하세요."
    });
  }

  if (!actions.length) {
    actions.push(
      {
        title: "프로그램 연계",
        description: "현재 공개자료상 긴급 신호는 낮으므로, 기존 AI·SW 학습기회 유지와 확산을 검토하세요."
      },
      {
        title: "연수 배정",
        description: "AIDT·LMS 자료가 연결되면 교원 연수와 수업설계 지원 필요성을 재점검하세요."
      }
    );
  }

  const defaults: AdminAction[] = [
    {
      title: "예산 검토",
      description: "지원 소요 지수와 학교 의견을 함께 보고 예산 배정 우선순위를 검토하세요."
    },
    {
      title: "현장 확인",
      description: "공개자료와 다른 현장 상황이 있는지 교육지원청 확인을 검토하세요."
    }
  ];

  for (const action of defaults) {
    if (actions.length >= 4) break;
    if (!actions.some((item) => item.title === action.title)) actions.push(action);
  }

  return actions.slice(0, 4);
}
