import { ChalkHTTPService } from "../_services/_http";
import { ChalkError } from "../_errors";
import { RetryConfig } from "../_interface/_options";

describe("Retry logic with exponential backoff", () => {
  it("should retry on 503 errors with default config", async () => {
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

  it("should allow per-request retry config override", async () => {
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
      { maxRetries: 1, initialDelayMs: 10, retryableStatusCodes: [503] }
    );

    const endpoint = (service as any).createEndpoint({
      path: "/test",
      authKind: "none",
      method: "POST",
      responseBody: null as any,
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
