const { Redis } = require('@upstash/redis');
require('dotenv').config();

// Create Upstash Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Test connection
redis.ping()
    .then(() => console.log('✅ Upstash Redis connected successfully'))
    .catch((err) => console.error('❌ Upstash Redis connection failed:', err.message));

module.exports = redis;
