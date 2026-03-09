"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { setBackConsumer } from "@/src/core/hooks/use-confirm-back";

interface UseTransactionFormOptions {
	preselectedToPlayerId?: string;
	isCreator?: boolean;
	currentPlayerId?: string;
	onOpenChange?: (open: boolean) => void;
}

export function useTransactionForm({
	preselectedToPlayerId,
	isCreator = false,
	currentPlayerId,
	onOpenChange,
}: UseTransactionFormOptions) {
	const [fromPlayerId, setFromPlayerId] = useState<string>("");
	const [toPlayerId, setToPlayerId] = useState<string>(
		() => preselectedToPlayerId || "",
	);
	const [amount, setAmount] = useState<string>("");
	const [description, setDescription] = useState<string>("");
	const [isOpen, setIsOpen] = useState(() => !!preselectedToPlayerId);
	const [, startTransition] = useTransition();

	// Abrir el formulario cuando se preselecciona un jugador
	useEffect(() => {
		if (preselectedToPlayerId) {
			startTransition(() => {
				setToPlayerId(preselectedToPlayerId);
				if (isCreator && !fromPlayerId && currentPlayerId) {
					setFromPlayerId(currentPlayerId);
				}
				setIsOpen(true);
			});
			onOpenChange?.(true);
		}
	}, [
		preselectedToPlayerId,
		onOpenChange,
		isCreator,
		fromPlayerId,
		currentPlayerId,
	]);

	const handleClose = useCallback(
		(open: boolean) => {
			setIsOpen(open);
			if (!open) {
				setAmount("");
				setDescription("");
				if (preselectedToPlayerId) {
					setToPlayerId("");
				}
			}
			onOpenChange?.(open);
		},
		[preselectedToPlayerId, onOpenChange],
	);

	useEffect(() => {
		if (isOpen) {
			setBackConsumer(() => () => handleClose(false));
			return () => setBackConsumer(null);
		}
		setBackConsumer(null);
	}, [isOpen, handleClose]);

	const handleSuccess = useCallback(() => {
		setFromPlayerId("");
		setToPlayerId("");
		setAmount("");
		setDescription("");
		setIsOpen(false);
		onOpenChange?.(false);
	}, [onOpenChange]);

	return {
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
	};
}
