import { Injectable, Logger } from '@nestjs/common';
import CircuitBreaker = require('opossum');

export interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  volumeThreshold?: number;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  timeout: 10000, // 10s per call
  errorThresholdPercentage: 50, // open after 50% errors
  resetTimeout: 30000, // try half-open after 30s
  volumeThreshold: 5, // min calls before tracking
};

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly breakers = new Map<string, CircuitBreaker<any[], any>>();

  /**
   * Returns (or creates) a CircuitBreaker for the given key.
   * Wraps `fn` so that calls go through the breaker.
   */
  getBreaker<TArgs extends unknown[], TReturn>(
    key: string,
    fn: (...args: TArgs) => Promise<TReturn>,
    options: CircuitBreakerOptions = {},
  ): CircuitBreaker<TArgs, TReturn> {
    if (!this.breakers.has(key)) {
      const merged = { ...DEFAULT_OPTIONS, ...options };
      const breaker = new CircuitBreaker(fn, merged);

      breaker.on('open', () =>
        this.logger.warn(`[${key}] Circuit breaker OPEN — calls blocked`),
      );
      breaker.on('halfOpen', () =>
        this.logger.log(`[${key}] Circuit breaker HALF-OPEN — testing`),
      );
      breaker.on('close', () =>
        this.logger.log(`[${key}] Circuit breaker CLOSED — normal operation`),
      );
      breaker.fallback((...args: unknown[]) => {
        this.logger.warn(
          `[${key}] Fallback triggered for args: ${JSON.stringify(args)}`,
        );
        throw new Error(`Service ${key} is unavailable (circuit open)`);
      });

      this.breakers.set(key, breaker);
    }

    return this.breakers.get(key) as CircuitBreaker<TArgs, TReturn>;
  }

  /**
   * Convenience: wraps a single async call through a named breaker.
   * Usage: await cbService.fire('my-api', myAsyncFn, arg1, arg2)
   */
  async fire<TArgs extends unknown[], TReturn>(
    key: string,
    fn: (...args: TArgs) => Promise<TReturn>,
    ...args: TArgs
  ): Promise<TReturn> {
    const breaker = this.getBreaker(key, fn);
    return breaker.fire(...args);
  }

  getStats(key: string) {
    const breaker = this.breakers.get(key);
    if (!breaker) return null;
    return breaker.stats;
  }
}
