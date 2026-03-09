"use client";

import { GameDurationCard } from "@/src/core/components/tablero/resultados/game-duration-card";
import { GameStatsCard } from "@/src/core/components/tablero/resultados/game-stats-card";
import { LargestFreeParkingCard } from "@/src/core/components/tablero/resultados/largest-free-parking-card";
import { LargestTransferCard } from "@/src/core/components/tablero/resultados/largest-transfer-card";
import { RankingCard } from "@/src/core/components/tablero/resultados/ranking-card";
import { ResultadosActions } from "@/src/core/components/tablero/resultados/resultados-actions";
import { StatsCards } from "@/src/core/components/tablero/resultados/stats-cards";
import { TransactionsAccordion } from "@/src/core/components/tablero/resultados/transactions-accordion";
import type {
	EnrichedTransaction,
	TableroStats,
} from "@/src/core/components/tablero/resultados/types";
import { useConfetti } from "@/src/core/components/tablero/resultados/use-confetti";

interface ResultadosClientProps {
	tableroName: string;
	stats: TableroStats;
	transactions: EnrichedTransaction[];
	gameStartedAt: number;
	gameEndedAt: number;
	currentUserId: string | null;
	tableroSlug: string;
	isCreator: boolean;
}

export default function ResultadosClient({
	tableroName,
	stats,
	transactions,
	gameStartedAt,
	gameEndedAt,
	currentUserId,
	tableroSlug,
	isCreator,
}: ResultadosClientProps) {
	const winnerUserId = stats.winner.player.user?.id;
	useConfetti(currentUserId, winnerUserId);

	const isWinner = currentUserId === winnerUserId;

	const currentPlayerId =
		stats.ranking.find((p) => p.player.user?.id === currentUserId)?.player.id ??
		null;

	return (
		<main className="p-5 flex flex-col h-full w-full gap-6">
			<div>
				<h1 className="text-2xl font-bold">{tableroName}</h1>
				<p className="text-sm text-muted-foreground">Resultados finales</p>
			</div>

			<RankingCard ranking={stats.ranking} currentUserId={currentUserId} />

			<StatsCards largestTransfer={stats.largestTransfer} />

			<LargestTransferCard largestTransfer={stats.largestTransfer} />

			<LargestFreeParkingCard
				largestFreeParkingTransfer={stats.largestFreeParkingTransfer}
			/>

			<GameStatsCard
				totalTransactions={stats.totalTransactions}
				playersCount={stats.playersCount}
			/>

			<GameDurationCard startedAt={gameStartedAt} endedAt={gameEndedAt} />

			<TransactionsAccordion
				transactions={transactions}
				currentPlayerId={currentPlayerId}
			/>

			<ResultadosActions tableroSlug={tableroSlug} isCreator={isCreator} />
		</main>
	);
}
