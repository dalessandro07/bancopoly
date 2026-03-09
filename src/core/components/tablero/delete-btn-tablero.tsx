"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { actionDeleteTablero } from "@/src/core/actions/tablero";
import { Button } from "@/src/core/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/src/core/components/ui/dialog";

interface DeleteBtnTableroProps {
	tableroId: string;
	className?: string;
}

export default function DeleteBtnTablero({
	tableroId,
	className,
}: DeleteBtnTableroProps) {
	const [isPending, startTransition] = useTransition();
	const [isOpen, setIsOpen] = useState(false);
	const router = useRouter();

	const handleDeleteTablero = async () => {
		startTransition(async () => {
			const result = await actionDeleteTablero(tableroId);
			if (result.success) {
				toast.success(result.message);
				setIsOpen(false);
				router.refresh();
			} else {
				toast.error(result.error);
			}
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="destructive" size="sm" className={className}>
					Eliminar
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>¿Eliminar tablero?</DialogTitle>
					<DialogDescription>
						Esta acción no se puede deshacer. El tablero será eliminado
						permanentemente junto con todos los jugadores y transacciones
						asociadas.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setIsOpen(false)}
						disabled={isPending}
					>
						Cancelar
					</Button>
					<Button
						variant="destructive"
						onClick={handleDeleteTablero}
						disabled={isPending}
					>
						{isPending ? "Eliminando..." : "Eliminar"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
