"use client";

import { Label } from "@/src/core/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/src/core/components/ui/select";
import type { TPlayer } from "@/src/core/lib/db/schema";
import { memo, useMemo } from "react";

interface PlayerSelectorProps {
	label: string;
	name: string;
	value: string;
	players: TPlayer[];
	onValueChange: (value: string) => void;
	disabled?: boolean;
	required?: boolean;
	placeholder?: string;
}

function PlayerSelectorComponent({
	label,
	name,
	value,
	players,
	onValueChange,
	disabled,
	required,
	placeholder = "Seleccionar jugador",
}: PlayerSelectorProps) {
	const formatBalance = (player: TPlayer) => {
		if (player.isSystemPlayer === 1 && player.systemPlayerType === "bank") {
			return "∞";
		}
		return `$${player.balance}`;
	};

	const formatPlayerOption = useMemo(
		() => (player: TPlayer) => {
			// Los montos de todos los jugadores son visibles para todos
			return `${player.name} (${formatBalance(player)})`;
		},
		[],
	);

	return (
		<div className="space-y-2">
			<Label htmlFor={name}>{label}</Label>
			<Select
				name={name}
				value={value}
				onValueChange={onValueChange}
				disabled={disabled}
				required={required}
			>
				<SelectTrigger className="w-full">
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{players.map((player) => (
						<SelectItem key={player.id} value={player.id}>
							{formatPlayerOption(player)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

export const PlayerSelector = memo(PlayerSelectorComponent);
