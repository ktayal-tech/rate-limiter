-- should-proceed.lua
-- Sliding window rate limiter using Redis LIST

-- KEYS[1] = rate limit key
-- ARGV[1] = current timestamp in milliseconds
-- ARGV[2] = window size in milliseconds
-- ARGV[3] = request limit per window

local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

-- Remove expired timestamps from head
while true do
    local head = redis.call('LINDEX', key, 0)
    if not head then
        break
    end

    if (now - tonumber(head)) > window then
        redis.call('LPOP', key)
    else
        break
    end
end

-- Current valid request count
local currentSize = redis.call('LLEN', key)

-- Check rate limit
if currentSize < limit then
    redis.call('RPUSH', key, now)
    return 1
end

-- Not allowed
return 0