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
        title="AI 교육 지원 소요 지도"
        description="점수가 높을수록 우수하다는 뜻이 아니라, 공개자료상 지원이 먼저 필요한 신호가 크다는 의미입니다."
      />
      {!hasData ? <DataRequired /> : null}
      {hasData ? <GapMap scores={scores} schools={schools} manifest={manifest} /> : null}
    </div>
  );
}
