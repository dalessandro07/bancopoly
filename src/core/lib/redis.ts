import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
	throw new Error("REDIS_URL is required. Add it to your .env file.");
}

const isTls = redisUrl.startsWith("rediss://");

export const redis = new Redis(redisUrl, {
	maxRetriesPerRequest: 3,
	retryStrategy: (times) => (times > 20 ? null : Math.min(times * 200, 2000)),
	connectTimeout: 10000,
	...(isTls && {
		tls: {
			rejectUnauthorized: false,
		},
	}),
});

redis.on("error", (err) => {
	console.error("[Redis] Connection error:", err.message);
});
