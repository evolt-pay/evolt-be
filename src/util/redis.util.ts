import Redis from "ioredis";

const redis = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: +(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
});

redis.on("connect", () => {
    console.log("✅ Redis connected");
});

redis.on("error", (err) => {
    console.error("❌ Redis connection error:", err);
});

class RedisService {
    static async setCache(key: string, value: any, ttlSeconds?: number): Promise<void> {
        const data = typeof value === "string" ? value : JSON.stringify(value);
        if (ttlSeconds) {
            await redis.set(key, data, "EX", ttlSeconds);
        } else {
            await redis.set(key, data);
        }
    }

    static async getCache<T = any>(key: string): Promise<T | null> {
        const value = await redis.get(key);
        if (!value) return null;
        try {
            return JSON.parse(value) as T;
        } catch {
            return value as unknown as T;
        }
    }

    static async delCache(key: string): Promise<void> {
        await redis.del(key);
    }

    static async incrCache(key: string): Promise<number> {
        return await redis.incr(key);
    }


    static async exists(key: string): Promise<boolean> {
        return (await redis.exists(key)) > 0;
    }

    static async setIfNotExists(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
        const data = typeof value === "string" ? value : JSON.stringify(value);
        const result = ttlSeconds
            ? await redis.set(key, data, "EX", ttlSeconds, "NX")
            : await redis.set(key, data, "NX");
        return result === "OK";
    }

    static async expire(key: string, ttlSeconds: number): Promise<void> {
        await redis.expire(key, ttlSeconds);
    }
}

export { redis }; // raw redis instance (for BullMQ or pub/sub)
export default RedisService;