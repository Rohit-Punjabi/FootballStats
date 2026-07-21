import { getPlayers } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { PlayerTable } from "@/components/PlayerTable";

export default function PlayersPage() {
  const players = getPlayers();
  return (
    <div>
      <PageHeader title="Players" subtitle={`${players.length} players — click a column to sort`} />
      <PlayerTable players={players} />
    </div>
  );
}
