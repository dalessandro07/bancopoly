"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const TABLERO_CONFIRM_BACK = "tableroConfirmBack";

/** Si est? definido, al pulsar atr?s se llama a esta funci?n y no se muestra el di?logo de salir (p. ej. cerrar un drawer). */
let backConsumer: (() => void) | null = null;

export function setBackConsumer(fn: (() => void) | null): void {
	backConsumer = fn;
}

/**
 * Intercepta el bot?n atr?s del navegador/dispositivo y muestra confirmaci?n
 * antes de salir de la p?gina actual (p. ej. del tablero).
 * Devuelve estado y handlers para un di?logo de confirmaci?n.
 * @param enabled - Si es false, no se intercepta el atr?s (p. ej. en /resultados).
 */
export function useConfirmBack(enabled = true) {
	const pathname = usePathname();
	const router = useRouter();
	const [showConfirm, setShowConfirm] = useState(false);

	const cancelLeave = useCallback(() => {
		setShowConfirm(false);
		setBackConsumer(null);
		if (typeof window !== "undefined") {
			window.history.pushState(
				{ [TABLERO_CONFIRM_BACK]: true },
				"",
				pathname ?? window.location.pathname,
			);
		}
	}, [pathname]);

	const confirmLeave = useCallback(() => {
		setShowConfirm(false);
		router.back();
	}, [router]);

	useEffect(() => {
		if (!enabled || typeof window === "undefined" || !pathname) return;

		const state = { [TABLERO_CONFIRM_BACK]: true };
		window.history.replaceState(state, "", pathname);
		window.history.pushState(state, "", pathname);
	}, [pathname, enabled]);

	useEffect(() => {
		if (!enabled || !showConfirm) return;
		setBackConsumer(() => cancelLeave);
		return () => setBackConsumer(null);
	}, [enabled, showConfirm, cancelLeave]);

	useEffect(() => {
		const handlePopState = (event: PopStateEvent) => {
			if (!enabled) return;
			const state = event.state as Record<string, unknown> | null;
			if (state?.[TABLERO_CONFIRM_BACK]) {
				if (backConsumer) {
					backConsumer();
					cancelLeave();
				} else {
					setShowConfirm(true);
					if (typeof window !== "undefined") {
						window.history.pushState(
							{ [TABLERO_CONFIRM_BACK]: true },
							"",
							window.location.pathname,
						);
					}
				}
			}
		};

		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, [enabled, cancelLeave]);

	return { showConfirm, setShowConfirm, confirmLeave, cancelLeave };
}
