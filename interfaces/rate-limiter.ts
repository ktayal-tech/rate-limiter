interface IRateLimiter {

    requestLimitPerWindow: number;
    windowSizeInMS: number;

    generateKey(userId: number | undefined, ipAddress: string): string;
    getRemainingRequestsQuota(key: string): Promise<number>;
    shouldProceed(key: string): Promise<boolean>;
    getRateLimit(): number;
}

export { IRateLimiter };