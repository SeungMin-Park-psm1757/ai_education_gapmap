import { DataRequired } from "@/components/data-required";
import { GapMap } from "@/components/gap-map";
import { SectionHeader } from "@/components/section-header";
import { getManifest, getReadinessScores, getSchools } from "@/lib/data-loader";

export default function MapPage() {
  const schools = getSchools();
  const scores = getReadinessScores().sort((a, b) => b.score - a.score);
  const hasData = scores.length > 0;
  const manifest = getManifest();

  return (
    <div>
      <SectionHeader
        eyebrow="AI 교육격차 지도"
        title="노원구 지원 소요 지도"
        description="공개자료로 학교별 지원 필요 신호와 현장 확인 대상을 구분합니다."
      />
      {!hasData ? <DataRequired /> : null}
      {hasData ? <GapMap scores={scores} schools={schools} manifest={manifest} /> : null}
    </div>
  );
}
