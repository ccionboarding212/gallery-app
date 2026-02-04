/**
 * @jest-environment jsdom
 */

describe('Flaky Timing-Based Tests', () => {
  let mockHTML;

  beforeEach(() => {
    jest.useFakeTimers();
    mockHTML = `
      <div class="async-container">
        <button id="load-data-btn">Load Data</button>
        <div id="data-display"></div>
        <div class="spinner" style="display: none;">Loading...</div>
      </div>
      <div class="animation-target"></div>
      <div class="delayed-element" style="opacity: 0;"></div>
    `;
    document.body.innerHTML = mockHTML;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // FLAKY TEST 1: Race condition with setTimeout - FIXED with fake timers
  test('should load data with proper timing (FLAKY: race condition)', async () => {
    const button = document.getElementById('load-data-btn');
    const display = document.getElementById('data-display');
    const spinner = document.querySelector('.spinner');

    // Mock async data loading with fixed delay (deterministic)
    const mockLoadData = () => {
      return new Promise((resolve) => {
        const delay = 100; // Fixed delay instead of random
        setTimeout(() => {
          display.textContent = 'Data loaded!';
          spinner.style.display = 'none';
          resolve('success');
        }, delay);
      });
    };

    spinner.style.display = 'block';

    // Start loading
    const loadPromise = mockLoadData();

    // Advance timers to after the load completes
    jest.advanceTimersByTime(150);

    await loadPromise;

    expect(display.textContent).toBe('Data loaded!');
    expect(spinner.style.display).toBe('none');
  });

  // FLAKY TEST 2: Animation timing dependency - FIXED with fake timers
  test('should complete animation within expected time (FLAKY: animation timing)', () => {
    const target = document.querySelector('.animation-target');
    let animationStarted = false;
    let animationCompleted = false;

    // Mock animation with fixed duration
    const mockAnimate = () => {
      animationStarted = true;
      target.style.transition = 'transform 0.3s ease';
      target.style.transform = 'translateX(100px)';

      // Animation completion detection with fixed timing
      setTimeout(() => {
        animationCompleted = true;
      }, 300); // Fixed timing
    };

    mockAnimate();

    // Advance timers past animation completion
    jest.advanceTimersByTime(350);

    expect(animationStarted).toBe(true);
    expect(animationCompleted).toBe(true);
    expect(target.style.transform).toBe('translateX(100px)');
  });

  // FLAKY TEST 3: Async/await with insufficient waiting - FIXED by waiting for all promises
  test('should handle multiple async operations (FLAKY: insufficient waiting)', async () => {
    const results = [];

    // Mock multiple async operations with fixed delays
    const asyncOp1 = () => new Promise(resolve => {
      setTimeout(() => {
        results.push('op1');
        resolve('op1');
      }, 50);
    });

    const asyncOp2 = () => new Promise(resolve => {
      setTimeout(() => {
        results.push('op2');
        resolve('op2');
      }, 100);
    });

    const asyncOp3 = () => new Promise(resolve => {
      setTimeout(() => {
        results.push('op3');
        resolve('op3');
      }, 150);
    });

    // Start all operations
    const promises = [asyncOp1(), asyncOp2(), asyncOp3()];

    // Advance timers to complete all operations
    jest.advanceTimersByTime(200);

    // Wait for all promises to resolve
    await Promise.all(promises);

    expect(results).toContain('op1');
    expect(results).toContain('op2');
    expect(results).toContain('op3');
    expect(results).toHaveLength(3);
  });

  // FLAKY TEST 4: Event timing with debounce - FIXED with fake timers
  test('should handle debounced events correctly (FLAKY: debounce timing)', () => {
    let eventCount = 0;
    let lastEventTime = 0;

    // Mock debounced event handler
    const mockDebouncedHandler = (() => {
      let timeout;
      return () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          eventCount++;
          lastEventTime = Date.now();
        }, 180);
      };
    })();

    // Trigger multiple events rapidly
    mockDebouncedHandler();
    jest.advanceTimersByTime(50);
    mockDebouncedHandler();
    jest.advanceTimersByTime(50);
    mockDebouncedHandler();
    jest.advanceTimersByTime(50);
    mockDebouncedHandler();
    jest.advanceTimersByTime(50);
    mockDebouncedHandler();

    // Advance timers past the debounce delay
    jest.advanceTimersByTime(200);

    expect(eventCount).toBe(1);
    expect(lastEventTime).toBeGreaterThan(0);
  });

  // FLAKY TEST 5: Promise resolution order - FIXED with deterministic delays
  test('should resolve promises in expected order (FLAKY: promise timing)', async () => {
    const resolveOrder = [];

    // Create promises with deterministic delays
    const promise1 = new Promise(resolve => {
      setTimeout(() => {
        resolveOrder.push('first');
        resolve('first');
      }, 100);
    });

    const promise2 = new Promise(resolve => {
      setTimeout(() => {
        resolveOrder.push('second');
        resolve('second');
      }, 200);
    });

    const promise3 = new Promise(resolve => {
      setTimeout(() => {
        resolveOrder.push('third');
        resolve('third');
      }, 50);
    });

    // Advance timers to complete all promises
    jest.advanceTimersByTime(250);

    await Promise.all([promise1, promise2, promise3]);

    // With deterministic delays: third (50ms), first (100ms), second (200ms)
    expect(resolveOrder[0]).toBe('third');
    expect(resolveOrder[1]).toBe('first');
    expect(resolveOrder[2]).toBe('second');
  });
});
