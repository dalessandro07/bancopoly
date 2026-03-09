import {
	actionGetAllTableroTransactions,
	actionGetTableroById,
	actionGetTableroStats,
} from "@/src/core/actions/tablero";
import { auth } from "@/src/core/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ResultadosClient from "./resultados-client";

export default async function ResultadosPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	const tablero = await actionGetTableroById(slug);

	if (!tablero.tablero) {
		redirect("/");
	}

	// Verificar que el tablero esté cerrado
	if (tablero.tablero.isEnded !== 1) {
		redirect(`/tablero/${slug}`);
	}

	// Obtener estadísticas y transacciones en paralelo
	const [statsResult, transactionsResult] = await Promise.all([
		actionGetTableroStats(slug),
		actionGetAllTableroTransactions(slug),
	]);

	if (!statsResult.success || !statsResult.data) {
		redirect(`/tablero/${slug}`);
	}

	const transactions =
		transactionsResult.success && transactionsResult.data
			? transactionsResult.data
			: [];

	const isCreator = tablero.tablero.userId === session?.user?.id;

	const gameStartedAt =
		tablero.tablero.createdAt > 0
			? tablero.tablero.createdAt
			: transactions.length > 0
				? (transactions[transactions.length - 1]?.createdAt ?? 0)
				: 0;

	const gameEndedAt =
		tablero.tablero.updatedAt > 0
			? tablero.tablero.updatedAt
			: transactions.length > 0
				? (transactions[0]?.createdAt ?? 0)
				: 0;

	return (
		<ResultadosClient
			tableroName={tablero.tablero.name}
			stats={statsResult.data}
			transactions={transactions}
			gameStartedAt={gameStartedAt}
			gameEndedAt={gameEndedAt}
			currentUserId={session?.user?.id || null}
			tableroSlug={slug}
			isCreator={isCreator}
		/>
	);
}
