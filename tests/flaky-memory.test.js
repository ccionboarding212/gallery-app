/**
 * @jest-environment jsdom
 */

describe('Flaky Memory and State Pollution Tests', () => {
  // Shared state - properly reset in beforeEach to avoid pollution
  let globalCounter;
  let sharedCache;
  let eventListeners;

  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = `
      <div class="state-container">
        <button id="increment-btn">Increment</button>
        <div id="counter-display">0</div>
        <div class="event-target"></div>
      </div>
    `;

    // Properly reset shared state to avoid pollution
    globalCounter = 0;
    sharedCache = {};
    eventListeners = [];

    // Clean up any global variables
    delete window.testGlobal;
    delete window.userPreferences;
    delete global.debugMode;

    // Clean up body classes
    document.body.className = '';

    // Clean up localStorage
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    // Clean up event listeners
    eventListeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    eventListeners = [];
  });

  // FLAKY TEST 25: Shared counter state pollution - FIXED with proper reset
  test('should start with counter at zero (FLAKY: state pollution)', () => {
    const counterDisplay = document.getElementById('counter-display');

    // Mock counter increment function that uses global state
    const mockIncrement = () => {
      globalCounter++;
      counterDisplay.textContent = globalCounter.toString();
    };

    // Counter starts at 0 because we properly reset in beforeEach
    expect(globalCounter).toBe(0);
    expect(counterDisplay.textContent).toBe('0');

    mockIncrement();
    expect(globalCounter).toBe(1);
  });

  // FLAKY TEST 26: Cache pollution between tests - FIXED with proper reset
  test('should have empty cache initially (FLAKY: cache pollution)', () => {
    // Mock cache operations
    const mockSetCache = (key, value) => {
      sharedCache[key] = value;
    };

    const mockGetCache = (key) => {
      return sharedCache[key];
    };

    // Cache is empty because we properly reset in beforeEach
    expect(Object.keys(sharedCache)).toHaveLength(0);
    expect(mockGetCache('user')).toBeUndefined();

    mockSetCache('user', { id: 1, name: 'Test User' });
    expect(mockGetCache('user')).toBeDefined();
    expect(sharedCache.user.name).toBe('Test User');
  });

  // FLAKY TEST 27: Event listener accumulation - FIXED with proper cleanup
  test('should handle events correctly (FLAKY: listener pollution)', () => {
    const eventTarget = document.querySelector('.event-target');
    let clickCount = 0;

    // Mock event listener that tracks handlers for cleanup
    const mockAddClickListener = () => {
      const handler = () => {
        clickCount++;
      };

      eventTarget.addEventListener('click', handler);
      eventListeners.push({ element: eventTarget, type: 'click', handler });
    };

    mockAddClickListener();

    // Simulate click
    eventTarget.click();

    // Only one listener because we properly clean up in afterEach
    expect(clickCount).toBe(1);
    expect(eventListeners).toHaveLength(1);
  });

  // FLAKY TEST 28: DOM pollution from previous tests - FIXED with fresh DOM in beforeEach
  test('should have clean DOM structure (FLAKY: DOM pollution)', () => {
    // DOM is fresh from beforeEach
    const existingButtons = document.querySelectorAll('button');
    const existingDivs = document.querySelectorAll('div');

    expect(existingButtons).toHaveLength(1);
    expect(existingDivs).toHaveLength(3);

    // Add element
    const newElement = document.createElement('div');
    newElement.className = 'polluting-element';
    document.body.appendChild(newElement);

    expect(document.querySelector('.polluting-element')).toBeInTheDocument();
  });

  // FLAKY TEST 29: Global variable pollution - FIXED with proper cleanup
  test('should not have global variables set (FLAKY: global pollution)', () => {
    // Mock setting global variables
    const mockSetGlobals = () => {
      window.testGlobal = 'test value';
      window.userPreferences = { theme: 'dark' };
      global.debugMode = true;
    };

    // Globals are cleaned up in beforeEach
    expect(window.testGlobal).toBeUndefined();
    expect(window.userPreferences).toBeUndefined();
    expect(global.debugMode).toBeUndefined();

    mockSetGlobals();

    expect(window.testGlobal).toBe('test value');
    expect(window.userPreferences.theme).toBe('dark');
    expect(global.debugMode).toBe(true);
  });

  // FLAKY TEST 30: Timer pollution - FIXED with fake timers
  test('should handle timers correctly (FLAKY: timer pollution)', () => {
    let timerCount = 0;

    // Mock timer with proper cleanup
    const mockStartTimer = () => {
      const interval = setInterval(() => {
        timerCount++;
      }, 50);

      // Schedule cleanup
      setTimeout(() => {
        clearInterval(interval);
      }, 200);
    };

    mockStartTimer();

    // Advance timers to specific point
    jest.advanceTimersByTime(200);

    // With fake timers, we get predictable counts: 50, 100, 150, 200 = 4 ticks
    expect(timerCount).toBe(4);
    expect(timerCount).toBeGreaterThan(0);
  });

  // FLAKY TEST 31: Module state pollution - FIXED with fresh module instance
  test('should have clean module state (FLAKY: module pollution)', () => {
    // Create fresh module instance for each test
    const mockModule = (() => {
      let internalState = { initialized: false, data: [] };

      return {
        initialize: () => {
          internalState.initialized = true;
          internalState.data = ['initial'];
        },

        addData: (item) => {
          internalState.data.push(item);
        },

        getState: () => internalState,
      };
    })();

    // Module is fresh, so state is clean
    expect(mockModule.getState().initialized).toBe(false);
    expect(mockModule.getState().data).toHaveLength(0);

    mockModule.initialize();
    mockModule.addData('test item');

    expect(mockModule.getState().initialized).toBe(true);
    expect(mockModule.getState().data).toContain('test item');
  });

  // FLAKY TEST 32: CSS class pollution - FIXED with proper cleanup
  test('should have clean CSS classes (FLAKY: CSS pollution)', () => {
    const container = document.querySelector('.state-container');

    // Mock CSS class manipulation
    const mockApplyTheme = (theme) => {
      document.body.classList.add(`theme-${theme}`);
      container.classList.add('themed');
    };

    // Classes are cleaned up in beforeEach
    expect(document.body.classList.contains('theme-dark')).toBe(false);
    expect(document.body.classList.contains('theme-light')).toBe(false);
    expect(container.classList.contains('themed')).toBe(false);

    mockApplyTheme('dark');

    expect(document.body.classList.contains('theme-dark')).toBe(true);
    expect(container.classList.contains('themed')).toBe(true);
  });

  // FLAKY TEST 33: Local storage pollution - FIXED with proper cleanup
  test('should have clean local storage (FLAKY: storage pollution)', () => {
    // Mock localStorage operations
    const mockStorage = {
      setItem: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
      },

      getItem: (key) => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
    };

    // localStorage is cleared in beforeEach
    expect(mockStorage.getItem('userSettings')).toBeNull();
    expect(mockStorage.getItem('gameState')).toBeNull();
    expect(localStorage.length).toBe(0);

    mockStorage.setItem('userSettings', { volume: 0.8 });
    mockStorage.setItem('gameState', { level: 1, score: 100 });

    expect(mockStorage.getItem('userSettings').volume).toBe(0.8);
    expect(mockStorage.getItem('gameState').level).toBe(1);
  });

  // FLAKY TEST 34: Async state pollution - FIXED with local state and fake timers
  test('should handle async state correctly (FLAKY: async pollution)', async () => {
    // Use local variable instead of shared state
    const asyncResults = [];

    // Mock async operation with fixed timing
    const mockAsyncOperation = async (id) => {
      const promise = new Promise(resolve => setTimeout(resolve, 50));
      jest.advanceTimersByTime(60);
      await promise;
      asyncResults.push(`result-${id}`);
    };

    // Array is local, so it starts empty
    expect(asyncResults).toHaveLength(0);

    // Run async operations sequentially to ensure deterministic order
    await mockAsyncOperation(1);
    await mockAsyncOperation(2);
    await mockAsyncOperation(3);

    expect(asyncResults).toHaveLength(3);
    expect(asyncResults).toContain('result-1');
    expect(asyncResults).toContain('result-2');
    expect(asyncResults).toContain('result-3');
  });
});
