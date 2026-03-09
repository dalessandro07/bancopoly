"use client";

import { HistoryIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { TransactionCard } from "@/src/core/components/tablero/slug/transaction-history/transaction-card";
import { getPlayerFullName } from "@/src/core/components/tablero/slug/transaction-history/utils";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/src/core/components/ui/accordion";
import { Button } from "@/src/core/components/ui/button";
import type { EnrichedTransaction } from "./types";

type PlayerOption = { id: string; name: string };

interface TransactionsAccordionProps {
	transactions: EnrichedTransaction[];
	currentPlayerId?: string | null;
}

export function TransactionsAccordion({
	transactions,
	currentPlayerId,
}: TransactionsAccordionProps) {
	const [playerFilter, setPlayerFilter] = useState<string | null>(null);

	const players = useMemo(() => {
		const seen = new Set<string>();
		const list: PlayerOption[] = [];
		for (const t of transactions) {
			if (t.fromPlayer?.id && !seen.has(t.fromPlayer.id)) {
				seen.add(t.fromPlayer.id);
				list.push({
					id: t.fromPlayer.id,
					name: getPlayerFullName(t.fromPlayer),
				});
			}
			if (t.toPlayer?.id && !seen.has(t.toPlayer.id)) {
				seen.add(t.toPlayer.id);
				list.push({ id: t.toPlayer.id, name: getPlayerFullName(t.toPlayer) });
			}
		}
		return list.sort((a, b) => a.name.localeCompare(b.name));
	}, [transactions]);

	const filteredTransactions = useMemo(() => {
		if (!playerFilter) return transactions;
		return transactions.filter(
			(t) => t.fromPlayerId === playerFilter || t.toPlayerId === playerFilter,
		);
	}, [transactions, playerFilter]);

	if (transactions.length === 0) {
		return (
			<Accordion type="single" collapsible className="w-full">
				<AccordionItem value="history">
					<AccordionTrigger className="hover:no-underline">
						<div className="flex items-center gap-2">
							<HistoryIcon className="size-5 text-muted-foreground" />
							<span>Historial de transferencias</span>
							<span className="text-sm text-muted-foreground font-normal">
								(0)
							</span>
						</div>
					</AccordionTrigger>
					<AccordionContent>
						<p className="text-sm text-muted-foreground text-center py-6">
							No hay transferencias registradas en este juego
						</p>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		);
	}

	return (
		<Accordion type="single" collapsible className="w-full">
			<AccordionItem value="history">
				<AccordionTrigger className="hover:no-underline">
					<div className="flex items-center gap-2">
						<HistoryIcon className="size-5 text-muted-foreground" />
						<span>Historial de transferencias</span>
						<span className="text-sm text-muted-foreground font-normal">
							({filteredTransactions.length}
							{playerFilter ? ` de ${transactions.length}` : ""})
						</span>
					</div>
				</AccordionTrigger>
				<AccordionContent>
					<div className="space-y-4">
						<div className="flex flex-wrap gap-2">
							<Button
								variant={!playerFilter ? "default" : "outline"}
								size="sm"
								onClick={() => setPlayerFilter(null)}
								className="h-8 text-xs"
							>
								Todas
							</Button>
							{players.map((player) => (
								<Button
									key={player.id}
									variant={playerFilter === player.id ? "default" : "outline"}
									size="sm"
									onClick={() => setPlayerFilter(player.id)}
									className="h-8 text-xs max-w-[140px] truncate"
									title={player.name}
								>
									{player.name}
								</Button>
							))}
						</div>
						<div className="space-y-3">
							{filteredTransactions.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-6">
									No hay transferencias para este filtro
								</p>
							) : (
								filteredTransactions.map((transaction) => (
									<TransactionCard
										key={transaction.id}
										transaction={transaction}
										currentPlayerId={currentPlayerId ?? undefined}
									/>
								))
							)}
						</div>
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}
