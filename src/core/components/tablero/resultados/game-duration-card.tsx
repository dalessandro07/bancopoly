import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/src/core/components/ui/card";
import { formatDate } from "@/src/core/components/tablero/slug/transaction-history/utils";
import { ClockIcon } from "lucide-react";

function formatDuration(ms: number): string {
	if (ms < 0) return "—";
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	const parts: string[] = [];
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0 || hours > 0) parts.push(`${minutes}min`);
	parts.push(`${seconds}s`);

	return parts.join(" ");
}

interface GameDurationCardProps {
	startedAt: number;
	endedAt: number;
}

export function GameDurationCard({
	startedAt,
	endedAt,
}: GameDurationCardProps) {
	const durationMs = endedAt > startedAt ? endedAt - startedAt : 0;
	const hasValidDuration = startedAt > 0 && endedAt >= startedAt;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<ClockIcon className="size-5 text-muted-foreground" />
					<CardTitle className="text-lg">Tiempo de juego</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				{hasValidDuration ? (
					<>
						<div>
							<p className="text-2xl font-bold">{formatDuration(durationMs)}</p>
							<p className="text-xs text-muted-foreground mt-1">
								Desde {formatDate(startedAt)} hasta {formatDate(endedAt)}
							</p>
						</div>
					</>
				) : (
					<p className="text-sm text-muted-foreground">No disponible</p>
				)}
			</CardContent>
		</Card>
	);
}
