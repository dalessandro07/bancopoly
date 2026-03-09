import { redis } from "./redis";

export type RealtimeEvents = {
	"tablero.player.inserted": {
		id: string;
		tableroId: string;
		userId: string | null;
		name: string;
		balance: number;
		isSystemPlayer: boolean;
		systemPlayerType: string | null;
		createdAt: string;
		updatedAt: string;
	};
	"tablero.player.updated": {
		id: string;
		tableroId: string;
		userId: string | null;
		name: string;
		balance: number;
		isSystemPlayer: boolean;
		systemPlayerType: string | null;
		createdAt: string;
		updatedAt: string;
	};
	"tablero.player.deleted": { id: string };
	"tablero.transaction.inserted": {
		id: string;
		tableroId: string;
		fromPlayerId: string | null;
		toPlayerId: string | null;
		amount: number;
		type: string;
		description: string | null;
		fromBalance?: number | null;
		toBalance?: number | null;
		createdAt: string;
	};
	"tablero.tablero.updated": { id: string; isEnded: boolean };
	"tablero.tablero.deleted": { id: string };
	"tablero.presence.leave": {
		playerId: string;
		playerName: string;
		tableroId: string;
	};
	"tablero.presence.enter": {
		playerId: string;
		playerName: string;
		tableroId: string;
	};
};

function createChannel(name: string) {
	return {
		emit: async <E extends keyof RealtimeEvents>(
			event: E,
			data: RealtimeEvents[E],
		) => {
			const message = JSON.stringify({ event, data });
			await redis.publish(name, message);
		},
	};
}

export const realtime = {
	channel: createChannel,
};
