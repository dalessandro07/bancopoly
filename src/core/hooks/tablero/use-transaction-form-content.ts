"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { actionCreateTransaction } from "@/src/core/actions/tablero";
import type { TPlayer } from "@/src/core/lib/db/schema";

interface UseTransactionFormContentOptions {
	tableroId: string;
	players: TPlayer[];
	currentPlayerId?: string;
	isCreator?: boolean;
	fromPlayerId: string;
	toPlayerId: string;
	amount: string;
	description: string;
	isPending: boolean;
	onFromPlayerChange: (value: string) => void;
	onToPlayerChange: (value: string) => void;
	onAmountChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onSuccess: () => void;
}

export function useTransactionFormContent({
	tableroId,
	players,
	currentPlayerId,
	isCreator = false,
	fromPlayerId,
	toPlayerId,
	amount,
	description,
	isPending,
	onFromPlayerChange,
	onToPlayerChange,
	onAmountChange,
	onDescriptionChange,
	onSuccess,
}: UseTransactionFormContentOptions) {
	const [isSubmitting, startTransition] = useTransition();
	const [animationTrigger, setAnimationTrigger] = useState(0);
	const formRef = useRef<HTMLFormElement>(null);
	const router = useRouter();

	const isLoading = isPending || isSubmitting;

	const fromPlayers = useMemo(
		() =>
			players.filter((p) => {
				if (p.id === currentPlayerId) return true;
				if (p.isSystemPlayer && isCreator) return true;
				return false;
			}),
		[players, currentPlayerId, isCreator],
	);

	const actualFromPlayerId = isCreator ? fromPlayerId : currentPlayerId;

	const fromPlayer = useMemo(() => {
		if (!actualFromPlayerId) return null;
		return players.find((p) => p.id === actualFromPlayerId);
	}, [players, actualFromPlayerId]);

	const toPlayer = useMemo(
		() => (toPlayerId ? players.find((p) => p.id === toPlayerId) : null),
		[players, toPlayerId],
	);

	const isFromBank =
		fromPlayer?.isSystemPlayer && fromPlayer?.systemPlayerType === "bank";

	const isFromFreeParking =
		fromPlayer?.isSystemPlayer &&
		fromPlayer?.systemPlayerType === "free_parking";

	const isBankReceiving = Boolean(
		toPlayer?.isSystemPlayer && toPlayer?.systemPlayerType === "bank",
	);

	const isFreeParkingReceiving = Boolean(
		toPlayer?.isSystemPlayer && toPlayer?.systemPlayerType === "free_parking",
	);

	/** Jugador recibe: cuando no es banco ni parada libre (incluye sin destinatario) */
	const isPlayerReceiving = !isBankReceiving && !isFreeParkingReceiving;

	/** Banco envía a jugador: Salida, Fortuna, Arca Comunal, Deshipoteca */
	const isBankSendingToPlayer = Boolean(isFromBank && isPlayerReceiving);

	/** Parada libre envía a jugador: Pozo */
	const isFreeParkingSendingToPlayer = Boolean(
		isFromFreeParking && isPlayerReceiving,
	);

	/** Jugador envía a jugador: Renta, Compra, Servicios (no banco ni parada libre) */
	const isPlayerSendingToPlayer = Boolean(
		isPlayerReceiving && !isFromBank && !isFromFreeParking,
	);

	const maxAmount = isFromBank
		? undefined
		: fromPlayer
			? fromPlayer.balance
			: undefined;

	const toPlayers = useMemo(
		() => players.filter((p) => p.id !== actualFromPlayerId),
		[players, actualFromPlayerId],
	);

	const handleQuickAmount = useCallback(
		(quickAmount: number, quickDescription?: string) => {
			const currentAmount = parseFloat(amount) || 0;
			let newAmount = currentAmount + quickAmount;
			if (maxAmount != null && newAmount > maxAmount) {
				newAmount = maxAmount;
			}
			onAmountChange(newAmount.toString());
			if (quickDescription) {
				onDescriptionChange(quickDescription);
			}
		},
		[amount, maxAmount, onAmountChange, onDescriptionChange],
	);

	const handleFromPlayerChange = useCallback(
		(value: string) => {
			onFromPlayerChange(value);
			if (toPlayerId === value) {
				onToPlayerChange("");
			}
		},
		[toPlayerId, onFromPlayerChange, onToPlayerChange],
	);

	const handleToPlayerChange = useCallback(
		(value: string) => {
			onToPlayerChange(value);
			if (isCreator && !fromPlayerId && currentPlayerId) {
				onFromPlayerChange(currentPlayerId);
			}
		},
		[
			isCreator,
			fromPlayerId,
			currentPlayerId,
			onToPlayerChange,
			onFromPlayerChange,
		],
	);

	const handleSubmit = useCallback(
		async (formData: FormData) => {
			const amountNum = parseInt(formData.get("amount") as string) || 0;
			if (maxAmount != null && amountNum > maxAmount) {
				toast.error(
					`El monto no puede ser mayor a tu saldo ($${maxAmount.toLocaleString()})`,
				);
				return;
			}

			startTransition(async () => {
				const result = await actionCreateTransaction(null, formData);

				if (result?.error) {
					toast.error(result.error);
					return;
				}

				if (result?.success) {
					setAnimationTrigger((prev) => prev + 1);
					onSuccess();
					router.refresh();
				}
			});
		},
		[maxAmount, onSuccess, router],
	);

	return {
		formRef,
		isLoading,
		animationTrigger,
		fromPlayers,
		toPlayers,
		fromPlayer,
		isFromBank,
		maxAmount,
		isBankReceiving,
		isFreeParkingReceiving,
		isPlayerReceiving,
		isBankSendingToPlayer,
		isFreeParkingSendingToPlayer,
		isPlayerSendingToPlayer,
		handleQuickAmount,
		handleFromPlayerChange,
		handleToPlayerChange,
		handleSubmit,
	};
}
