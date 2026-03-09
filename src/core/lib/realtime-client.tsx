"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	type ReactNode,
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
		const { channels = [], events, onData, enabled = true } = options;
		const ctx = useContext(RealtimeContext);
		const [status, setStatus] = useState<RealtimeStatus>("disconnected");
		const eventSourceRef = useRef<EventSource | null>(null);
		const onDataRef = useRef(onData);

		useEffect(() => {
			onDataRef.current = onData;
		}, [onData]);

		const channelsKey = channels.join(",");
		const eventsKey = events.join(",");

		const connect = useCallback(() => {
			if (!ctx || !channelsKey || !eventsKey) return;

			const params = new URLSearchParams({
				channels: channelsKey,
				events: eventsKey,
			});
			const eventSource = new EventSource(`${ctx.url}?${params}`);
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
		}, [ctx, channelsKey, eventsKey]);

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
