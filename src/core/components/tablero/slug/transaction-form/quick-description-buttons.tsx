"use client";

import { memo } from "react";
import { Button } from "@/src/core/components/ui/button";

/**
 * Reglas Monopoly:
 * - Banco recibe: Casa, Hotel, Hipoteca, Impuestos
 * - Parada libre recibe: Hipoteca, Impuestos (multas/penalizaciones)
 * - Jugador envía a jugador: Renta, Compra de propiedad, Pago de servicios
 * - Banco envía a jugador: Salida, Fortuna, Arca Comunal, Deshipoteca
 * - Parada libre envía a jugador: Pozo
 */
type ShowWhen =
	| "bank_receives"
	| "free_parking_receives"
	| "bank_or_free_parking"
	| "player_sends_to_player"
	| "bank_sends_to_player"
	| "free_parking_sends_to_player";

interface DescriptionButton {
	label: string;
	value: string;
	showWhen: ShowWhen;
	/** Orden de visualización (menor = primero) */
	sortOrder: number;
}

interface QuickDescriptionButtonsProps {
	buttons: readonly DescriptionButton[];
	isBankReceiving: boolean;
	isFreeParkingReceiving: boolean;
	isPlayerSendingToPlayer: boolean;
	isBankSendingToPlayer: boolean;
	isFreeParkingSendingToPlayer: boolean;
	onDescriptionChange: (value: string) => void;
	disabled?: boolean;
}

function isButtonVisible(
	showWhen: ShowWhen,
	isBankReceiving: boolean,
	isFreeParkingReceiving: boolean,
	isPlayerSendingToPlayer: boolean,
	isBankSendingToPlayer: boolean,
	isFreeParkingSendingToPlayer: boolean,
): boolean {
	switch (showWhen) {
		case "bank_receives":
			return isBankReceiving;
		case "free_parking_receives":
			return isFreeParkingReceiving;
		case "bank_or_free_parking":
			return isBankReceiving || isFreeParkingReceiving;
		case "player_sends_to_player":
			return isPlayerSendingToPlayer;
		case "bank_sends_to_player":
			return isBankSendingToPlayer;
		case "free_parking_sends_to_player":
			return isFreeParkingSendingToPlayer;
		default:
			return false;
	}
}

function QuickDescriptionButtonsComponent({
	buttons,
	isBankReceiving,
	isFreeParkingReceiving,
	isPlayerSendingToPlayer,
	isBankSendingToPlayer,
	isFreeParkingSendingToPlayer,
	onDescriptionChange,
	disabled,
}: QuickDescriptionButtonsProps) {
	const visibleButtons = buttons
		.filter((btn) =>
			isButtonVisible(
				btn.showWhen,
				isBankReceiving,
				isFreeParkingReceiving,
				isPlayerSendingToPlayer,
				isBankSendingToPlayer,
				isFreeParkingSendingToPlayer,
			),
		)
		.sort((a, b) => a.sortOrder - b.sortOrder);

	return (
		<div className="flex gap-2 flex-wrap">
			{visibleButtons.map(({ label, value }) => (
				<Button
					key={value}
					type="button"
					variant="outline"
					size="sm"
					onClick={() => onDescriptionChange(value)}
					disabled={disabled}
					className="text-xs"
				>
					{label}
				</Button>
			))}
		</div>
	);
}

export const QuickDescriptionButtons = memo(QuickDescriptionButtonsComponent);
