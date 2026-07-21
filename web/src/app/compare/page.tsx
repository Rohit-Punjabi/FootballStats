import { getPlayers } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { CompareTool } from "@/components/CompareTool";

export default function ComparePage() {
  const players = getPlayers();
  return (
    <div>
      <PageHeader
        title="Compare players"
        subtitle="Pick any two players to see their tournament stats head to head."
      />
      <CompareTool players={players} />
    </div>
  );
}
