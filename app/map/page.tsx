import { DataRequired } from "@/components/data-required";
import { GapMap } from "@/components/gap-map";
import { SectionHeader } from "@/components/section-header";
import { getManifest, getReadinessScores, getSchools } from "@/lib/data-loader";
import { getRegionLabel } from "@/lib/anonymize";

export default function MapPage() {
  const schools = getSchools();
  const scores = getReadinessScores().sort((a, b) => b.score - a.score);
  const hasData = scores.length > 0;
  const manifest = getManifest();
  const regionLabel = getRegionLabel();

  return (
    <div>
      <SectionHeader
        eyebrow="AI 교육격차 지도"
        title={`${regionLabel} 지원 소요 지도`}
        description="이 화면에서는 우선지원 필요 TOP 3, 현장 확인 우선 대상, 점수 방향을 먼저 확인합니다."
      />
      {!hasData ? <DataRequired /> : null}
      {hasData ? <GapMap scores={scores} schools={schools} manifest={manifest} /> : null}
    </div>
  );
}
