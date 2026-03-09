"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/src/core/components/ui/avatar";
import type { TPlayer, User } from "@/src/core/lib/db/schema";
import { WalletIcon } from "lucide-react";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

type PlayerWithUser = TPlayer & {
	user?: User | null;
};

interface BalanceChangeState {
	changed: boolean;
	isIncrease: boolean;
	previousBalance: number | null;
}

// Hook personalizado para detectar cambios en el balance
function useBalanceChange(currentBalance: number | null) {
	const [state, setState] = useState<BalanceChangeState>({
		changed: false,
		isIncrease: false,
		previousBalance: currentBalance ?? null,
	});
	const isInitializedRef = useRef(false);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const previousBalanceRef = useRef<number | null>(currentBalance ?? null);

	useEffect(() => {
		if (currentBalance === null) {
			return;
		}

		if (!isInitializedRef.current) {
			isInitializedRef.current = true;
			previousBalanceRef.current = currentBalance;
			// Actualizar el estado inicial
			startTransition(() => {
				setState({
					changed: false,
					isIncrease: false,
					previousBalance: currentBalance,
				});
			});
			return;
		}

		// Detectar cambio comparando con el ref en lugar del estado
		if (
			previousBalanceRef.current !== null &&
			previousBalanceRef.current !== currentBalance
		) {
			const isIncrease = currentBalance > previousBalanceRef.current;
			const previousBalance = previousBalanceRef.current;

			// Actualizar el ref después de detectar el cambio, pero antes de activar la animación
			// para evitar detectar el mismo cambio múltiples veces
			previousBalanceRef.current = currentBalance;

			// Usar startTransition para marcar el cambio
			startTransition(() => {
				setState({
					changed: true,
					isIncrease,
					previousBalance,
				});
			});

			// Limpiar timeout anterior si existe
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			// Actualizar después de un delay para que la animación se muestre
			timeoutRef.current = setTimeout(() => {
				startTransition(() => {
					setState({
						changed: false,
						isIncrease: false,
						previousBalance: currentBalance,
					});
				});
				timeoutRef.current = null;
			}, 2000);
		} else if (previousBalanceRef.current !== currentBalance) {
			// Si el balance cambió pero no se detectó antes (por ejemplo, si se actualizó directamente)
			// Actualizar el ref para mantener la sincronización
			previousBalanceRef.current = currentBalance;
		}

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
		};
	}, [currentBalance]);

	return state;
}

// Helper para obtener estilos según el balance
function getBalanceStyles(balance: number) {
	const isPositive = balance >= 0;
	const isLowBalance = balance < 50 && balance >= 0;

	return {
		balanceColor: isPositive
			? "text-green-600 dark:text-green-400"
			: "text-destructive",
		cardBgClass: isLowBalance
			? "bg-gradient-to-br from-destructive/15 via-destructive/8 to-background border border-destructive/30 shadow-md shadow-destructive/5"
			: "bg-gradient-to-br from-primary/15 via-primary/8 to-background border border-primary/30 shadow-md shadow-primary/5",
		iconBgClass: isLowBalance ? "bg-destructive/15" : "bg-primary/15",
		iconColor: isLowBalance ? "text-destructive" : "text-primary",
		avatarBorderClass: isLowBalance
			? "border-destructive/30"
			: "border-primary/30",
		avatarBgClass: isLowBalance
			? "bg-destructive/15 text-destructive"
			: "bg-primary/15 text-primary",
		isLowBalance,
	};
}

export default function CurrentPlayerBalance({
	players,
	currentPlayerId,
}: {
	tableroId: string;
	players: PlayerWithUser[];
	currentPlayerId?: string;
}) {
	// Usar useMemo para asegurar que se actualice cuando cambia el array de jugadores
	const currentPlayer = useMemo(
		() => players.find((p) => p.id === currentPlayerId),
		[players, currentPlayerId],
	);
	const currentBalance = currentPlayer?.balance ?? null;
	const balanceChange = useBalanceChange(currentBalance);

	if (!currentPlayer) {
		return null;
	}

	const styles = getBalanceStyles(currentPlayer.balance);
	const changeAmount =
		balanceChange.previousBalance !== null
			? Math.abs(currentPlayer.balance - balanceChange.previousBalance)
			: 0;

	return (
		<section
			className={`relative overflow-hidden rounded-2xl ${styles.cardBgClass} p-6 animate-in fade-in slide-in-from-top-4 duration-300`}
		>
			<div
				key={currentPlayer.balance}
				className={`relative z-10 transition-transform ${balanceChange.changed ? "scale-[1.02]" : "scale-100"}`}
				style={{ transitionDuration: "300ms" }}
			>
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-3 mb-2">
							<div
								className={`p-2.5 rounded-xl ${styles.iconBgClass} transition-transform shrink-0 ${balanceChange.changed ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
							>
								<WalletIcon className={`size-5 ${styles.iconColor}`} />
							</div>
							<span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Tu saldo
							</span>
						</div>
						<p
							key={currentPlayer.balance}
							className={`text-3xl sm:text-4xl font-bold tabular-nums tracking-tight ${styles.balanceColor} transition-all duration-200 animate-in fade-in slide-in-from-top-2`}
						>
							${currentPlayer.balance.toLocaleString()}
						</p>
						{balanceChange.changed && (
							<div
								key={`change-${currentPlayer.balance}-${changeAmount}`}
								className={`text-sm font-semibold mt-1.5 tabular-nums animate-in fade-in slide-in-from-top-1 duration-300 ${balanceChange.isIncrease ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
							>
								{balanceChange.isIncrease ? "↑" : "↓"} $
								{changeAmount.toLocaleString()}
							</div>
						)}
					</div>
					{currentPlayer.user && (
						<div className="flex flex-col items-end gap-1 shrink-0">
							<Avatar
								className={`size-11 border-2 ${styles.avatarBorderClass} transition-transform hover:scale-105 active:scale-95 shrink-0`}
							>
								<AvatarImage
									src={currentPlayer.user.image || undefined}
									alt={currentPlayer.name}
								/>
								<AvatarFallback
									className={`${styles.avatarBgClass} font-semibold text-base`}
								>
									{currentPlayer.name.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<span className="text-xs font-medium text-muted-foreground text-right break-words">
								{currentPlayer.name}
							</span>
						</div>
					)}
				</div>
			</div>
			<div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
		</section>
	);
}
