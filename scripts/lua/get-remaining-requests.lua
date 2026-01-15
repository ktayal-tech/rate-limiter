-- get-remaining-requests.lua
-- Returns remaining requests in a sliding window using Redis LIST
-- KEYS[1] = rate limit key
-- ARGV[1] = current timestamp in ms
-- ARGV[2] = window size in ms
-- ARGV[3] = request limit per window

local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

-- 1. Remove expired timestamps from head
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

-- 2. Current valid request count
local currentSize = redis.call('LLEN', key)

-- 3. Remaining requests
local remaining = math.max(limit - currentSize, 0)

return remaining