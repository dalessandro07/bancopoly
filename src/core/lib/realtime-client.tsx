"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import type { RealtimeEvents } from "./realtime";

type RealtimeStatus = "connecting" | "connected" | "disconnected" | "error";

interface RealtimeContextValue {
	url: string;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

interface UseRealtimeOptions<E extends keyof RealtimeEvents> {
	channels?: string[];
	events: E[];
	onData: (params: {
		event: E;
		data: RealtimeEvents[E];
		channel: string;
	}) => void;
	enabled?: boolean;
	/** Parámetros extra para la URL (ej. playerId, playerName para presencia) */
	params?: Record<string, string>;
}

export function RealtimeProvider({
	children,
	url = "/api/realtime",
}: {
	children: ReactNode;
	url?: string;
}) {
	return (
		<RealtimeContext.Provider value={{ url }}>
			{children}
		</RealtimeContext.Provider>
	);
}

export function createRealtime<T extends RealtimeEvents = RealtimeEvents>() {
	function useRealtime<E extends keyof RealtimeEvents>(
		options: UseRealtimeOptions<E>,
	) {
		const { channels = [], events, onData, enabled = true, params } = options;
		const ctx = useContext(RealtimeContext);
		const [status, setStatus] = useState<RealtimeStatus>("disconnected");
		const eventSourceRef = useRef<EventSource | null>(null);
		const onDataRef = useRef(onData);

		useEffect(() => {
			onDataRef.current = onData;
		}, [onData]);

		const channelsKey = channels.join(",");
		const eventsKey = events.join(",");
		const paramsKey = params ? JSON.stringify(params) : "";

		const connect = useCallback(() => {
			if (!ctx || !channelsKey || !eventsKey) return;

			const searchParams = new URLSearchParams({
				channels: channelsKey,
				events: eventsKey,
			});
			const parsedParams = paramsKey
				? (JSON.parse(paramsKey) as Record<string, string>)
				: undefined;
			if (parsedParams) {
				for (const [key, value] of Object.entries(parsedParams)) {
					if (value) searchParams.set(key, value);
				}
			}
			const eventSource = new EventSource(`${ctx.url}?${searchParams}`);
			eventSourceRef.current = eventSource;

			setStatus("connecting");

			eventSource.onopen = () => setStatus("connected");
			eventSource.onerror = () => setStatus("error");

			eventSource.onmessage = (e) => {
				try {
					const { event, data, channel } = JSON.parse(e.data) as {
						event: E;
						data: T[E];
						channel: string;
					};
					onDataRef.current({ event, data, channel });
				} catch {
					// Ignorar mensajes no JSON (ej: keepalive)
				}
			};
		}, [ctx, channelsKey, eventsKey, paramsKey]);

		const disconnect = useCallback(() => {
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
				eventSourceRef.current = null;
			}
			setStatus("disconnected");
		}, []);

		useEffect(() => {
			const id = setTimeout(() => {
				if (enabled) {
					connect();
				} else {
					disconnect();
				}
			}, 0);
			return () => {
				clearTimeout(id);
				disconnect();
			};
		}, [enabled, connect, disconnect]);

		return { status };
	}

	return { useRealtime };
}

export const { useRealtime } = createRealtime<RealtimeEvents>();
