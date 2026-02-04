/**
 * @jest-environment jsdom
 */

// Mock fetch globally for these tests
global.fetch = jest.fn();

describe('Flaky Network-Dependent Tests', () => {
  let mockHTML;

  beforeEach(() => {
    jest.useFakeTimers();
    mockHTML = `
      <div class="api-container">
        <button id="fetch-data">Fetch Data</button>
        <div id="api-result"></div>
        <div class="loading-indicator" style="display: none;">Loading...</div>
      </div>
    `;
    document.body.innerHTML = mockHTML;

    // Reset fetch mock
    fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  // FLAKY TEST 19: Network request with variable response time - FIXED with deterministic mock
  test('should handle API response timing (FLAKY: network timing)', async () => {
    const resultDiv = document.getElementById('api-result');

    // Mock API response with fixed delay and no failure
    const mockApiCall = () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: 'API response', timestamp: Date.now() });
        }, 100); // Fixed delay
      });
    };

    const apiPromise = mockApiCall();

    // Advance timers past the delay
    jest.advanceTimersByTime(150);

    const response = await apiPromise;
    resultDiv.textContent = response.data;

    expect(response.data).toBe('API response');
    expect(resultDiv.textContent).toBe('API response');
  });

  // FLAKY TEST 20: Multiple concurrent requests - FIXED with deterministic timing
  test('should handle concurrent API calls (FLAKY: race conditions)', async () => {
    const results = [];

    // Mock multiple API endpoints with fixed response times
    const mockApiCall1 = () => new Promise(resolve => {
      setTimeout(() => resolve({ id: 1, data: 'First API' }), 150);
    });

    const mockApiCall2 = () => new Promise(resolve => {
      setTimeout(() => resolve({ id: 2, data: 'Second API' }), 200);
    });

    const mockApiCall3 = () => new Promise(resolve => {
      setTimeout(() => resolve({ id: 3, data: 'Third API' }), 100);
    });

    // Start all requests concurrently
    const promises = [
      mockApiCall1().then(result => results.push(result)),
      mockApiCall2().then(result => results.push(result)),
      mockApiCall3().then(result => results.push(result))
    ];

    // Advance timers past all delays
    jest.advanceTimersByTime(250);

    await Promise.all(promises);

    // With fixed timing: 3 (100ms), 1 (150ms), 2 (200ms)
    expect(results).toHaveLength(3);
    expect(results[0].id).toBe(3);
    expect(results[1].id).toBe(1);
    expect(results[2].id).toBe(2);
  });

  // FLAKY TEST 21: Retry logic with intermittent failures - FIXED with deterministic behavior
  test('should retry failed requests correctly (FLAKY: retry timing)', async () => {
    let attemptCount = 0;
    const maxRetries = 3;

    // Mock API that succeeds on third attempt
    const mockUnreliableApi = () => {
      attemptCount++;
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (attemptCount < 3) {
            reject(new Error(`Attempt ${attemptCount} failed`));
          } else {
            resolve({ success: true, attempts: attemptCount });
          }
        }, 50);
      });
    };

    // Mock retry logic
    const mockRetryRequest = async () => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          const apiPromise = mockUnreliableApi();
          jest.advanceTimersByTime(60);
          return await apiPromise;
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          const retryPromise = new Promise(resolve => setTimeout(resolve, 50));
          jest.advanceTimersByTime(60);
          await retryPromise;
        }
      }
    };

    const result = await mockRetryRequest();

    expect(result.success).toBe(true);
    expect(result.attempts).toBe(3);
    expect(attemptCount).toBe(3);
  });

  // FLAKY TEST 22: Cache behavior with expiration - FIXED with fake timers
  test('should handle cache expiration correctly (FLAKY: cache timing)', async () => {
    const cache = new Map();
    const cacheExpiry = 200; // 200ms cache

    // Mock API with caching
    const mockCachedApiCall = async (key) => {
      const now = Date.now();
      const cached = cache.get(key);

      if (cached && (now - cached.timestamp) < cacheExpiry) {
        return { ...cached.data, fromCache: true };
      }

      // Simulate API delay
      const apiPromise = new Promise(resolve => setTimeout(resolve, 50));
      jest.advanceTimersByTime(60);
      await apiPromise;

      const currentNow = Date.now();
      const data = { result: `Data for ${key}`, timestamp: currentNow };
      cache.set(key, { data, timestamp: currentNow });

      return { ...data, fromCache: false };
    };

    // First call - should not be from cache
    const result1 = await mockCachedApiCall('test-key');
    expect(result1.fromCache).toBe(false);

    // Second call immediately - should be from cache
    const result2 = await mockCachedApiCall('test-key');
    expect(result2.fromCache).toBe(true);

    // Wait for cache to expire and call again
    jest.advanceTimersByTime(250);
    const result3 = await mockCachedApiCall('test-key');
    expect(result3.fromCache).toBe(false);
  });

  // FLAKY TEST 23: WebSocket connection simulation - FIXED with fake timers
  test('should handle WebSocket events (FLAKY: connection timing)', () => {
    let connectionState = 'disconnected';
    let messagesReceived = [];

    // Mock WebSocket behavior with fixed timing
    const mockWebSocket = {
      connect: () => {
        setTimeout(() => {
          connectionState = 'connected';
          mockWebSocket.onopen && mockWebSocket.onopen();
        }, 50); // Fixed delay
      },

      send: (message) => {
        if (connectionState === 'connected') {
          setTimeout(() => {
            messagesReceived.push(`Echo: ${message}`);
            mockWebSocket.onmessage && mockWebSocket.onmessage({ data: `Echo: ${message}` });
          }, 30); // Fixed delay
        }
      },

      onopen: null,
      onmessage: null
    };

    // Set up event handlers
    mockWebSocket.onopen = () => {
      mockWebSocket.send('Hello WebSocket');
    };

    // Start connection
    mockWebSocket.connect();

    // Advance timers to establish connection
    jest.advanceTimersByTime(60);
    expect(connectionState).toBe('connected');

    // Advance timers to receive message
    jest.advanceTimersByTime(40);
    expect(messagesReceived).toContain('Echo: Hello WebSocket');
    expect(messagesReceived).toHaveLength(1);
  });

  // FLAKY TEST 24: File upload with progress - FIXED with fake timers
  test('should track upload progress correctly (FLAKY: progress timing)', () => {
    let uploadProgress = 0;
    let uploadComplete = false;

    // Mock file upload with deterministic progress updates
    const mockFileUpload = (file) => {
      const totalSize = 1000;
      let uploaded = 0;
      const chunkSize = 200; // Fixed chunk size

      const uploadChunk = () => {
        uploaded = Math.min(uploaded + chunkSize, totalSize);
        uploadProgress = Math.floor((uploaded / totalSize) * 100);

        if (uploaded >= totalSize) {
          uploadComplete = true;
          return;
        }

        setTimeout(uploadChunk, 30); // Fixed delay
      };

      uploadChunk();
    };

    mockFileUpload({ name: 'test.jpg', size: 1000 });

    // Check progress at intervals
    jest.advanceTimersByTime(30);
    expect(uploadProgress).toBe(40); // 2 chunks done

    jest.advanceTimersByTime(30);
    expect(uploadProgress).toBe(60); // 3 chunks done

    jest.advanceTimersByTime(60);
    expect(uploadComplete).toBe(true);
    expect(uploadProgress).toBe(100);
  });
});
