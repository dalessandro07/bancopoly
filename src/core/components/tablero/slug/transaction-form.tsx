"use client";

import { useMemo } from "react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/src/core/components/ui/avatar";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/src/core/components/ui/drawer";
import { ScrollArea } from "@/src/core/components/ui/scroll-area";
import { useTransactionForm } from "@/src/core/hooks/tablero/use-transaction-form";
import type { TPlayer } from "@/src/core/lib/db/schema";
import { TransactionFormContent } from "./transaction-form/transaction-form-content";

type PlayerWithUser = TPlayer & {
	user?: {
		id: string;
		name: string;
		email: string;
		image: string | null;
	} | null;
};

interface TransactionFormProps {
	tableroId: string;
	players: PlayerWithUser[];
	currentPlayerId?: string;
	isCreator?: boolean;
	preselectedToPlayerId?: string;
	onOpenChange?: (open: boolean) => void;
}

export default function TransactionForm({
	tableroId,
	players,
	currentPlayerId,
	isCreator = false,
	preselectedToPlayerId,
	onOpenChange,
}: TransactionFormProps) {
	const {
		fromPlayerId,
		setFromPlayerId,
		toPlayerId,
		setToPlayerId,
		amount,
		setAmount,
		description,
		setDescription,
		isOpen,
		handleClose,
		handleSuccess,
	} = useTransactionForm({
		preselectedToPlayerId,
		isCreator,
		currentPlayerId,
		onOpenChange,
	});

	const toPlayer = useMemo(
		() => (toPlayerId ? players.find((p) => p.id === toPlayerId) : null),
		[players, toPlayerId],
	);

	return (
		<Drawer open={isOpen} onOpenChange={handleClose} direction="bottom">
			<DrawerContent className="rounded-t-xl border-t pb-5 h-full">
				<DrawerHeader className="text-center space-y-2">
					<DrawerTitle>Transferir dinero</DrawerTitle>
					{toPlayer ? (
						<div className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-muted/50 border">
							<Avatar className="size-14 ring-2 ring-background">
								<AvatarImage
									src={(toPlayer as PlayerWithUser).user?.image ?? undefined}
									alt={toPlayer.name}
								/>
								<AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
									{toPlayer.name.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<p className="font-semibold text-lg">{toPlayer.name}</p>
						</div>
					) : (
						<DrawerDescription>
							Envía dinero a otro jugador del tablero
						</DrawerDescription>
					)}
				</DrawerHeader>

				<ScrollArea className="flex-1 min-h-0">
					<TransactionFormContent
						tableroId={tableroId}
						players={players}
						currentPlayerId={currentPlayerId}
						isCreator={isCreator}
						fromPlayerId={fromPlayerId}
						toPlayerId={toPlayerId}
						amount={amount}
						description={description}
						isPending={false}
						onFromPlayerChange={setFromPlayerId}
						onToPlayerChange={setToPlayerId}
						onAmountChange={setAmount}
						onDescriptionChange={setDescription}
						onSuccess={handleSuccess}
					/>
				</ScrollArea>
			</DrawerContent>
		</Drawer>
	);
}
