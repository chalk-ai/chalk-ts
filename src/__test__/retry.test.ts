import { ChalkHTTPService } from "../_services/_http";
import { ChalkError } from "../_errors";
import { RetryConfig } from "../_interface/_options";

describe("Retry logic with exponential backoff", () => {
  it("should not retry when no retry config is provided at any level", async () => {
    let attemptCount = 0;
    const mockFetch = jest.fn(async () => {
      attemptCount++;
      return {
        status: 503,
        statusText: "Service Unavailable",
        text: async () => "Service temporarily unavailable",
      } as Response;
    });

    const service = new ChalkHTTPService(
      mockFetch as any,
      undefined,
      undefined,
      undefined,
      3,
      undefined // No service-level config
    );

    const endpoint = (service as any).createEndpoint({
      path: "/test",
      authKind: "none",
      method: "POST",
      responseBody: null as any,
      // No endpoint-level config
    });

    await expect(
      endpoint({
        baseUrl: "http://test.com",
        // No call-time config
      })
    ).rejects.toThrow(ChalkError);

    expect(attemptCount).toBe(1); // Only initial attempt, no retry
  });

  it("should retry when endpoint has default retry config", async () => {
    let attemptCount = 0;
    const mockFetch = jest.fn(async () => {
      attemptCount++;
      if (attemptCount < 2) {
        return {
          status: 503,
          statusText: "Service Unavailable",
          text: async () => "Service temporarily unavailable",
        } as Response;
      }
      return {
        status: 200,
        ok: true,
        json: async () => ({ success: true }),
      } as Response;
    });

    const service = new ChalkHTTPService(
      mockFetch as any,
      undefined,
      undefined,
      undefined,
      3,
      undefined // No service-level config
    );

    const endpoint = (service as any).createEndpoint({
      path: "/test",
      authKind: "none",
      method: "POST",
      responseBody: null as any,
      retryConfig: { maxRetries: 1, initialDelayMs: 10, retryableStatusCodes: [503] },
    });

    const result = await endpoint({
      baseUrl: "http://test.com",
    });

    expect(result).toEqual({ success: true });
    expect(attemptCount).toBe(2); // Initial attempt + 1 retry
  });

  it("should retry on 503 errors with service-level config", async () => {
    let attemptCount = 0;
    const mockFetch = jest.fn(async () => {
      attemptCount++;
      if (attemptCount < 2) {
        return {
          status: 503,
          statusText: "Service Unavailable",
          text: async () => "Service temporarily unavailable",
        } as Response;
      }
      return {
        status: 200,
        ok: true,
        json: async () => ({ success: true }),
      } as Response;
    });

    const service = new ChalkHTTPService(
      mockFetch as any,
      undefined,
      undefined,
      undefined,
      3,
      { maxRetries: 1, initialDelayMs: 10, retryableStatusCodes: [503] }
    );

    const endpoint = (service as any).createEndpoint({
      path: "/test",
      authKind: "none",
      method: "POST",
      responseBody: null as any,
    });

    const result = await endpoint({
      baseUrl: "http://test.com",
    });

    expect(result).toEqual({ success: true });
    expect(attemptCount).toBe(2); // Initial attempt + 1 retry
  });

  it("should not retry on non-retryable status codes", async () => {
    let attemptCount = 0;
    const mockFetch = jest.fn(async () => {
      attemptCount++;
      return {
        status: 400,
        statusText: "Bad Request",
        text: async () => "Bad request",
      } as Response;
    });

    const service = new ChalkHTTPService(
      mockFetch as any,
      undefined,
      undefined,
      undefined,
      3,
      { maxRetries: 2, initialDelayMs: 10, retryableStatusCodes: [503] }
    );

    const endpoint = (service as any).createEndpoint({
      path: "/test",
      authKind: "none",
      method: "POST",
      responseBody: null as any,
    });

    await expect(
      endpoint({
        baseUrl: "http://test.com",
      })
    ).rejects.toThrow(ChalkError);

    expect(attemptCount).toBe(1); // Only initial attempt, no retry
  });

  it("should respect maxRetries configuration", async () => {
    let attemptCount = 0;
    const mockFetch = jest.fn(async () => {
      attemptCount++;
      return {
        status: 503,
        statusText: "Service Unavailable",
        text: async () => "Service temporarily unavailable",
      } as Response;
    });

    const service = new ChalkHTTPService(
      mockFetch as any,
      undefined,
      undefined,
      undefined,
      3,
      { maxRetries: 3, initialDelayMs: 10, retryableStatusCodes: [503] }
    );

    const endpoint = (service as any).createEndpoint({
      path: "/test",
      authKind: "none",
      method: "POST",
      responseBody: null as any,
    });

    await expect(
      endpoint({
        baseUrl: "http://test.com",
      })
    ).rejects.toThrow(ChalkError);

    expect(attemptCount).toBe(4); // Initial attempt + 3 retries
  });

  it("should allow per-request retry config to override endpoint config", async () => {
    let attemptCount = 0;
    const mockFetch = jest.fn(async () => {
      attemptCount++;
      return {
        status: 503,
        statusText: "Service Unavailable",
        text: async () => "Service temporarily unavailable",
      } as Response;
    });

    const service = new ChalkHTTPService(
      mockFetch as any,
      undefined,
      undefined,
      undefined,
      3,
      undefined
    );

    const endpoint = (service as any).createEndpoint({
      path: "/test",
      authKind: "none",
      method: "POST",
      responseBody: null as any,
      retryConfig: { maxRetries: 1, initialDelayMs: 10, retryableStatusCodes: [503] },
    });

    const perRequestRetryConfig: RetryConfig = {
      maxRetries: 2,
      initialDelayMs: 5,
      retryableStatusCodes: [503],
    };

    await expect(
      endpoint({
        baseUrl: "http://test.com",
        retryConfig: perRequestRetryConfig,
      })
    ).rejects.toThrow(ChalkError);

    expect(attemptCount).toBe(3); // Initial attempt + 2 retries (override)
  });

  it("should allow per-request retry config to enable retries on endpoints without default config", async () => {
    let attemptCount = 0;
    const mockFetch = jest.fn(async () => {
      attemptCount++;
      if (attemptCount < 2) {
        return {
          status: 503,
          statusText: "Service Unavailable",
          text: async () => "Service temporarily unavailable",
        } as Response;
      }
      return {
        status: 200,
        ok: true,
        json: async () => ({ success: true }),
      } as Response;
    });

    const service = new ChalkHTTPService(
      mockFetch as any,
      undefined,
      undefined,
      undefined,
      3,
      undefined
    );

    const endpoint = (service as any).createEndpoint({
      path: "/test",
      authKind: "none",
      method: "POST",
      responseBody: null as any,
      // No endpoint-level config
    });

    const perRequestRetryConfig: RetryConfig = {
      maxRetries: 1,
      initialDelayMs: 5,
      retryableStatusCodes: [503],
    };

    const result = await endpoint({
      baseUrl: "http://test.com",
      retryConfig: perRequestRetryConfig,
    });

    expect(result).toEqual({ success: true });
    expect(attemptCount).toBe(2); // Initial attempt + 1 retry (enabled by call-time config)
  });

  it("should support custom retryable status codes", async () => {
    let attemptCount = 0;
    const mockFetch = jest.fn(async () => {
      attemptCount++;
      if (attemptCount < 2) {
        return {
          status: 429, // Too Many Requests
          statusText: "Too Many Requests",
          text: async () => "Rate limited",
        } as Response;
      }
      return {
        status: 200,
        ok: true,
        json: async () => ({ success: true }),
      } as Response;
    });

    const service = new ChalkHTTPService(
      mockFetch as any,
      undefined,
      undefined,
      undefined,
      3,
      { maxRetries: 1, initialDelayMs: 10, retryableStatusCodes: [429, 503] }
    );

    const endpoint = (service as any).createEndpoint({
      path: "/test",
      authKind: "none",
      method: "POST",
      responseBody: null as any,
    });

    const result = await endpoint({
      baseUrl: "http://test.com",
    });

    expect(result).toEqual({ success: true });
    expect(attemptCount).toBe(2); // Initial attempt + 1 retry
  });

  it("should retry network errors using maxNetworkRetries without retryConfig (backwards compatibility)", async () => {
    let attemptCount = 0;
    const mockFetch = jest.fn(async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error("Network error");
      }
      return {
        status: 200,
        ok: true,
        json: async () => ({ success: true }),
      } as Response;
    });

    const service = new ChalkHTTPService(
      mockFetch as any,
      undefined,
      undefined,
      undefined,
      3, // maxNetworkRetries
      undefined // No retry config
    );

    const endpoint = (service as any).createEndpoint({
      path: "/test",
      authKind: "none",
      method: "POST",
      responseBody: null as any,
      // No endpoint-level config
    });

    const result = await endpoint({
      baseUrl: "http://test.com",
    });

    expect(result).toEqual({ success: true });
    expect(attemptCount).toBe(3); // 3 attempts due to maxNetworkRetries
  });

  it("should exhaust network retries before propagating error to status code retry layer", async () => {
    let attemptCount = 0;
    const mockFetch = jest.fn(async () => {
      attemptCount++;
      throw new Error("Network error");
    });

    const service = new ChalkHTTPService(
      mockFetch as any,
      undefined,
      undefined,
      undefined,
      2, // maxNetworkRetries
      undefined
    );

    const endpoint = (service as any).createEndpoint({
      path: "/test",
      authKind: "none",
      method: "POST",
      responseBody: null as any,
      retryConfig: {
        maxRetries: 2,
        initialDelayMs: 10,
        retryableStatusCodes: [503]
      },
    });

    await expect(
      endpoint({
        baseUrl: "http://test.com",
      })
    ).rejects.toThrow("Network error");

    // Should only try maxNetworkRetries times, not maxRetries * maxNetworkRetries
    // The outer retry layer should not retry network errors
    expect(attemptCount).toBe(2); // Only network retries, no status code retries
  });

  it("should combine network retries and status code retries correctly", async () => {
    let attemptCount = 0;
    const mockFetch = jest.fn(async () => {
      attemptCount++;

      // First call: network error (will be retried by inner function)
      if (attemptCount === 1) {
        throw new Error("Network error");
      }

      // Second call: succeeds with 503 (will be retried by outer function)
      if (attemptCount === 2) {
        return {
          status: 503,
          statusText: "Service Unavailable",
          text: async () => "Service temporarily unavailable",
        } as Response;
      }

      // Third attempt from outer retry: network error again
      if (attemptCount === 3) {
        throw new Error("Network error");
      }

      // Fourth call: success
      return {
        status: 200,
        ok: true,
        json: async () => ({ success: true }),
      } as Response;
    });

    const service = new ChalkHTTPService(
      mockFetch as any,
      undefined,
      undefined,
      undefined,
      2, // maxNetworkRetries
      undefined
    );

    const endpoint = (service as any).createEndpoint({
      path: "/test",
      authKind: "none",
      method: "POST",
      responseBody: null as any,
      retryConfig: {
        maxRetries: 2,
        initialDelayMs: 5,
        retryableStatusCodes: [503]
      },
    });

    const result = await endpoint({
      baseUrl: "http://test.com",
    });

    expect(result).toEqual({ success: true });
    expect(attemptCount).toBe(4);
  });

  it("should handle initialDelayMs of 0 correctly (first retry immediate, subsequent use 1ms base)", async () => {
    const delays: number[] = [];
    let attemptCount = 0;
    const mockFetch = jest.fn(async () => {
      attemptCount++;
      return {
        status: 503,
        statusText: "Service Unavailable",
        text: async () => "Service temporarily unavailable",
      } as Response;
    });

    // Mock setTimeout to capture delays
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = jest.fn((fn: any, delay: number) => {
      delays.push(delay);
      return originalSetTimeout(fn, 0);
    }) as any;

    const service = new ChalkHTTPService(
      mockFetch as any,
      undefined,
      undefined,
      undefined,
      3,
      {
        maxRetries: 3,
        initialDelayMs: 0,
        backoffMultiplier: 2,
        enableJitter: false, // Disable jitter for predictable values
        retryableStatusCodes: [503],
      }
    );

    const endpoint = (service as any).createEndpoint({
      path: "/test",
      authKind: "none",
      method: "POST",
      responseBody: null as any,
    });

    await expect(
      endpoint({
        baseUrl: "http://test.com",
      })
    ).rejects.toThrow(ChalkError);

    // Restore original setTimeout
    global.setTimeout = originalSetTimeout;

    expect(attemptCount).toBe(4); // Initial attempt + 3 retries
    expect(delays.length).toBe(3); // Three delays between 4 attempts

    // First retry should be immediate (0ms)
    expect(delays[0]).toBe(0);

    // Subsequent retries should use 1ms as base with exponential backoff
    // Attempt 0: 0ms
    // Attempt 1: 1ms * 2^1 = 2ms
    // Attempt 2: 1ms * 2^2 = 4ms
    expect(delays[1]).toBe(2);
    expect(delays[2]).toBe(4);
  });

  it("should apply exponential backoff with jitter", async () => {
    const delays: number[] = [];
    let attemptCount = 0;
    const mockFetch = jest.fn(async () => {
      attemptCount++;
      return {
        status: 503,
        statusText: "Service Unavailable",
        text: async () => "Service temporarily unavailable",
      } as Response;
    });

    // Mock setTimeout to capture delays
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = jest.fn((fn: any, delay: number) => {
      delays.push(delay);
      return originalSetTimeout(fn, 0);
    }) as any;

    const service = new ChalkHTTPService(
      mockFetch as any,
      undefined,
      undefined,
      undefined,
      3,
      {
        maxRetries: 2,
        initialDelayMs: 100,
        backoffMultiplier: 2,
        enableJitter: true,
        retryableStatusCodes: [503],
      }
    );

    const endpoint = (service as any).createEndpoint({
      path: "/test",
      authKind: "none",
      method: "POST",
      responseBody: null as any,
    });

    await expect(
      endpoint({
        baseUrl: "http://test.com",
      })
    ).rejects.toThrow(ChalkError);

    // Restore original setTimeout
    global.setTimeout = originalSetTimeout;

    expect(attemptCount).toBe(3); // Initial attempt + 2 retries
    expect(delays.length).toBe(2); // Two delays between 3 attempts

    // First delay should be around 100ms (with jitter, between 50-150ms)
    expect(delays[0]).toBeGreaterThanOrEqual(50);
    expect(delays[0]).toBeLessThanOrEqual(150);

    // Second delay should be around 200ms (with jitter, between 100-300ms)
    expect(delays[1]).toBeGreaterThanOrEqual(100);
    expect(delays[1]).toBeLessThanOrEqual(300);
  });
});
