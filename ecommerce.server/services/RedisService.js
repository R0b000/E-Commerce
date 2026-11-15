const Redis = require('ioredis');

class RedisService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.init();
  }

  init() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
      
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 2000,
        retryStrategy: (times) => {
          if (times > 2) {
            // Stop retrying if not reachable
            return null;
          }
          return 1000;
        },
      });

      this.client.on('connect', () => {
        this.isReady = true;
        console.log('[Redis] Connected successfully.');
      });

      this.client.on('ready', () => {
        this.isReady = true;
        console.log('[Redis] Cache engine is ready for high-speed delivery.');
      });

      this.client.on('error', (err) => {
        this.isReady = false;
        // Do not crash server on Redis error, fallback seamlessly to database
        if (process.env.NODE_ENV === 'development') {
          // Log only concise error message
          // console.warn('[Redis] Connection offline, bypassing cache:', err.message);
        }
      });

      this.client.on('close', () => {
        this.isReady = false;
      });
    } catch (e) {
      this.isReady = false;
    }
  }

  async get(key) {
    if (!this.isReady || !this.client) return null;
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    if (!this.isReady || !this.client) return false;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch {
      return false;
    }
  }

  async del(key) {
    if (!this.isReady || !this.client) return false;
    try {
      await this.client.del(key);
      return true;
    } catch {
      return false;
    }
  }

  async delByPattern(pattern) {
    if (!this.isReady || !this.client) return false;
    try {
      const keys = await this.client.keys(pattern);
      if (keys && keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch {
      return false;
    }
  }
}

const redisService = new RedisService();
module.exports = { RedisService, redisService };
