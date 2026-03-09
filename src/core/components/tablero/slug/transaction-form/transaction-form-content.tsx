"use client";

import { memo } from "react";
import { QuickDescriptionButtons } from "@/src/core/components/tablero/slug/transaction-form/quick-description-buttons";
import { TransactionAnimation } from "@/src/core/components/tablero/transaction-animation";
import { Button } from "@/src/core/components/ui/button";
import { Input } from "@/src/core/components/ui/input";
import { Label } from "@/src/core/components/ui/label";
import { useTransactionFormContent } from "@/src/core/hooks/tablero/use-transaction-form-content";
import type { TPlayer } from "@/src/core/lib/db/schema";
import { AmountInput } from "./amount-input";
import { PlayerSelector } from "./player-selector";
import { QuickAmountButtons } from "./quick-amount-buttons";

interface TransactionFormContentProps {
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

/** Botones ordenados según reglas Monopoly: banco, parada libre, jugador */
const DESCRIPTION_BUTTONS = [
	{
		label: "Casa",
		value: "Compra de casa",
		showWhen: "bank_receives" as const,
		sortOrder: 1,
	},
	{
		label: "Hotel",
		value: "Compra de hotel",
		showWhen: "bank_receives" as const,
		sortOrder: 2,
	},
	{
		label: "Hipoteca",
		value: "Hipoteca",
		showWhen: "bank_or_free_parking" as const,
		sortOrder: 3,
	},
	{
		label: "Impuestos",
		value: "Impuestos",
		showWhen: "bank_or_free_parking" as const,
		sortOrder: 4,
	},
	{
		label: "Renta",
		value: "Renta",
		showWhen: "player_sends_to_player" as const,
		sortOrder: 5,
	},
	{
		label: "Compra",
		value: "Compra de propiedad",
		showWhen: "player_sends_to_player" as const,
		sortOrder: 6,
	},
	{
		label: "Servicios",
		value: "Pago de servicios",
		showWhen: "player_sends_to_player" as const,
		sortOrder: 7,
	},
	{
		label: "Salida",
		value: "Salida",
		showWhen: "bank_sends_to_player" as const,
		sortOrder: 8,
	},
	{
		label: "Fortuna",
		value: "Fortuna",
		showWhen: "bank_sends_to_player" as const,
		sortOrder: 9,
	},
	{
		label: "Arca Comunal",
		value: "Arca Comunal",
		showWhen: "bank_sends_to_player" as const,
		sortOrder: 10,
	},
	{
		label: "Deshipoteca",
		value: "Deshipoteca",
		showWhen: "bank_sends_to_player" as const,
		sortOrder: 11,
	},
	{
		label: "Pozo",
		value: "Pozo",
		showWhen: "free_parking_sends_to_player" as const,
		sortOrder: 12,
	},
] as const;

function TransactionFormContentComponent({
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
}: TransactionFormContentProps) {
	const {
		formRef,
		isLoading,
		animationTrigger,
		fromPlayers,
		toPlayers,
		isFromBank,
		maxAmount,
		isBankReceiving,
		isFreeParkingReceiving,
		isPlayerSendingToPlayer,
		isBankSendingToPlayer,
		isFreeParkingSendingToPlayer,
		handleQuickAmount,
		handleFromPlayerChange,
		handleToPlayerChange,
		handleSubmit,
	} = useTransactionFormContent({
		tableroId,
		players,
		currentPlayerId,
		isCreator,
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
	});

	return (
		<>
			<TransactionAnimation trigger={animationTrigger > 0} />
			<form
				ref={formRef}
				action={handleSubmit}
				className="flex flex-col gap-4 px-4 pb-8"
			>
				<input type="hidden" name="tableroId" value={tableroId} />

				<div className="space-y-2">
					<AmountInput
						amount={amount}
						onAmountChange={onAmountChange}
						disabled={isLoading}
						maxAmount={maxAmount}
					/>
					<QuickAmountButtons
						onQuickAmount={handleQuickAmount}
						disabled={isLoading}
						showBankAmount={!!isFromBank}
					/>
				</div>

				{isCreator ? (
					<>
						<PlayerSelector
							label="Desde:"
							name="fromPlayerId"
							value={fromPlayerId}
							players={fromPlayers}
							onValueChange={handleFromPlayerChange}
							disabled={isLoading}
							required
						/>

						<PlayerSelector
							label="Hacia:"
							name="toPlayerId"
							value={toPlayerId}
							players={toPlayers}
							onValueChange={handleToPlayerChange}
							disabled={isLoading}
							required
						/>
					</>
				) : (
					<>
						<input
							type="hidden"
							name="fromPlayerId"
							value={currentPlayerId || ""}
						/>
						<input type="hidden" name="toPlayerId" value={toPlayerId || ""} />
					</>
				)}

				<div className="space-y-2">
					<Label htmlFor="description">Descripción (opcional):</Label>
					<Input
						type="text"
						id="description"
						name="description"
						list="description-options"
						disabled={isLoading}
						placeholder="Concepto de la transferencia"
						value={description}
						onChange={(e) => onDescriptionChange(e.target.value)}
					/>
					<datalist id="description-options">
						<option value="Pago de alquiler" />
						<option value="Impuestos" />
						<option value="Pago de servicios" />
						<option value="Compra de propiedad" />
						<option value="Hipoteca" />
						<option value="Deshipoteca" />
						<option value="Salida" />
						<option value="Fortuna" />
						<option value="Arca Comunal" />
						<option value="Pozo" />
					</datalist>
					<QuickDescriptionButtons
						buttons={DESCRIPTION_BUTTONS}
						isBankReceiving={isBankReceiving}
						isFreeParkingReceiving={isFreeParkingReceiving}
						isPlayerSendingToPlayer={isPlayerSendingToPlayer}
						isBankSendingToPlayer={isBankSendingToPlayer}
						isFreeParkingSendingToPlayer={isFreeParkingSendingToPlayer}
						onDescriptionChange={onDescriptionChange}
						disabled={isLoading}
					/>
				</div>

				<Button type="submit" disabled={isLoading} className="w-full" size="lg">
					{isLoading ? "Procesando..." : "Transferir"}
				</Button>
			</form>
		</>
	);
}

export const TransactionFormContent = memo(TransactionFormContentComponent);
