import { redis } from "@/src/core/lib/redis";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const channelsParam = searchParams.get("channels");
	const eventsParam = searchParams.get("events");

	const channels = channelsParam
		? channelsParam.split(",").filter(Boolean).slice(0, 20)
		: [];
	const events = eventsParam
		? eventsParam.split(",").filter(Boolean).slice(0, 50)
		: [];

	if (channels.length === 0) {
		return new Response("Missing channels parameter", { status: 400 });
	}

	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		async start(controller) {
			const subscriber = redis.duplicate();

			const messageHandler = (_channel: string, message: string) => {
				try {
					const parsed = JSON.parse(message) as {
						event: string;
						data: unknown;
					};
					if (events.length === 0 || events.includes(parsed.event)) {
						const data = `data: ${JSON.stringify({
							event: parsed.event,
							data: parsed.data,
							channel: _channel,
						})}\n\n`;
						controller.enqueue(encoder.encode(data));
					}
				} catch {
					// Ignorar mensajes malformados
				}
			};

			await subscriber.subscribe(...channels);
			subscriber.on("message", messageHandler);

			// Mantener la conexión viva con comentarios periódicos
			const keepAlive = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(": keepalive\n\n"));
				} catch {
					clearInterval(keepAlive);
				}
			}, 15000);

			// Cleanup al cerrar
			request.signal.addEventListener("abort", () => {
				clearInterval(keepAlive);
				subscriber.unsubscribe(...channels);
				subscriber.disconnect();
				controller.close();
			});
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
		},
	});
}
