import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { getRedisUrl } from '../config/redis.config';

function useMemoryCache(): boolean {
  return process.env.CACHE_STORE === 'memory' || process.env.NODE_ENV === 'test';
}

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        if (useMemoryCache()) {
          return { ttl: 60_000 };
        }
        return {
          stores: [createKeyv(getRedisUrl())]
        };
      }
    })
  ],
  exports: [CacheModule]
})
export class AppCacheModule {}
