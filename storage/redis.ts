import { createClient } from 'redis';
type RedisClientInstance = ReturnType<typeof createClient>;

/**
 * Redis client wrapper implementing singleton pattern for connection management.
 */
class RedisClient {

    private client: RedisClientInstance;
    private static instance: RedisClient;

    private constructor(client: RedisClientInstance) {
        this.client = client;
    }

    /**
     * Gets the singleton instance of RedisClient.
     * Automatically connects to Redis on first instantiation.
     *
     * @returns Promise resolving to the RedisClient singleton instance
     */
    static async getInstance(): Promise<RedisClient> {
        if (!RedisClient.instance) {
            const client = createClient({
                socket: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                },
            });

            client.on('error', (err) => {
                console.error('Redis Client Error', err);
            });

            await client.connect();

            RedisClient.instance = new RedisClient(client);
        }
        return RedisClient.instance;
    }

    /**
     * Checks if the Redis connection is active and ready.
     *
     * @returns true if Redis is connected and ready, false otherwise
     */
    async ping(): Promise<boolean> {
        try {
           return this.client.isReady;
        } catch (error) {
            return false;
        }
    }

    /**
     * Pushes an element to the tail of a Redis list.
     *
     * @param key - The Redis key for the list
     * @param value - The value to push to the list
     * @returns Promise resolving to the length of the list after the push operation
     */
    async rpush(key: string, value: string): Promise<number> {
        return this.client.rPush(key, value);
    }

    /**
     * Removes and returns the first element (head) of a Redis list.
     *
     * @param key - The Redis key for the list
     * @returns Promise resolving to the popped element, or null if the list is empty
     */
    async lpop(key: string): Promise<string | null> {
        return this.client.lPop(key);
    }

    /**
     * Gets the length of a Redis list.
     *
     * @param key - The Redis key for the list
     * @returns Promise resolving to the number of elements in the list
     */
    async llen(key: string): Promise<number> {
        return this.client.lLen(key);
    }

    /**
     * Gets a range of elements from a Redis list.
     *
     * @param key - The Redis key for the list
     * @param start - Starting index (0-based, inclusive)
     * @param stop - Ending index (0-based, inclusive, -1 for end of list)
     * @returns Promise resolving to array of elements in the specified range
     */
    async lrange(key: string, start: number = 0, stop: number = -1): Promise<string[]> {
        return this.client.lRange(key, start, stop);
    }

    /**
     * Checks if a key exists in Redis.
     *
     * @param key - The Redis key to check
     * @returns Promise resolving to 1 if the key exists, 0 if it doesn't
     */
    async exists(key: string): Promise<number> {
        return this.client.exists(key);
    }

    /**
     * Trims a Redis list to keep only elements within the specified range.
     *
     * @param key - The Redis key for the list
     * @param start - Starting index to keep (0-based, inclusive)
     * @param stop - Ending index to keep (0-based, inclusive)
     * @returns Promise resolving to 'OK' if successful
     */
    async ltrim(key: string, start: number, stop: number): Promise<string> {
        return this.client.lTrim(key, start, stop);
    }

    /**
     * Loads a LUA script into Redis and returns its SHA hash.
     *
     * @param script - The LUA script content as a string
     * @returns Promise resolving to the SHA hash of the loaded script
     */
    async loadScript(script: string): Promise<string> {
        return this.client.scriptLoad(script);
    }

    /**
     * Executes a previously loaded LUA script by its SHA hash.
     *
     * @param scriptSHA - The SHA hash of the script to execute
     * @param keys - Array of Redis keys used by the script
     * @param args - Array of arguments passed to the script
     * @returns Promise resolving to the result of the script execution
     */
    async executeLuaScript(scriptSHA: string, keys: string[], args: string[]): Promise<any> {
        return this.client.evalSha(scriptSHA, {
            keys: keys,
            arguments: args,
        });
    }
}

export { RedisClient };