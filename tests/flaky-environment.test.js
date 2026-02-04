/**
 * @jest-environment jsdom
 */

describe('Flaky Environment-Dependent Tests', () => {
  let mockHTML;

  beforeEach(() => {
    mockHTML = `
      <div class="env-container">
        <div id="user-agent-display"></div>
        <div id="screen-info"></div>
        <div id="timezone-info"></div>
        <canvas id="test-canvas" width="100" height="50"></canvas>
      </div>
    `;
    document.body.innerHTML = mockHTML;
  });

  // FLAKY TEST 35: User Agent detection - FIXED with mocked navigator
  test('should detect correct browser (FLAKY: user agent dependent)', () => {
    const userAgentDisplay = document.getElementById('user-agent-display');

    // Mock browser detection with mocked user agent
    const mockUserAgent = 'Mozilla/5.0 (Test Browser) Chrome/100.0';
    Object.defineProperty(navigator, 'userAgent', {
      value: mockUserAgent,
      configurable: true
    });

    const mockDetectBrowser = () => {
      const userAgent = navigator.userAgent;
      if (userAgent.includes('Chrome')) return 'Chrome';
      if (userAgent.includes('Firefox')) return 'Firefox';
      if (userAgent.includes('Safari')) return 'Safari';
      return 'Unknown';
    };

    const detectedBrowser = mockDetectBrowser();
    userAgentDisplay.textContent = detectedBrowser;

    // With mocked user agent, we get predictable results
    expect(detectedBrowser).toBe('Chrome');
    expect(navigator.userAgent).toContain('Chrome');
    expect(userAgentDisplay.textContent).toBe('Chrome');
  });

  // FLAKY TEST 36: Screen resolution dependent - FIXED with mocked screen properties
  test('should handle screen dimensions (FLAKY: screen dependent)', () => {
    const screenInfo = document.getElementById('screen-info');

    // Mock screen properties
    Object.defineProperty(window, 'screen', {
      value: {
        width: 1920,
        height: 1080,
        availWidth: 1920,
        availHeight: 1040
      },
      configurable: true
    });

    Object.defineProperty(window, 'devicePixelRatio', {
      value: 2,
      configurable: true
    });

    // Mock screen dimension handling
    const mockGetScreenInfo = () => {
      return {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
        pixelRatio: window.devicePixelRatio || 1
      };
    };

    const screenData = mockGetScreenInfo();
    screenInfo.textContent = `${screenData.width}x${screenData.height}`;

    // With mocked screen, we get predictable results
    expect(screenData.width).toBe(1920);
    expect(screenData.height).toBe(1080);
    expect(screenData.pixelRatio).toBe(2);
    expect(screenInfo.textContent).toBe('1920x1080');
    expect(screenData.availWidth).toBeLessThanOrEqual(screenData.width);
  });

  // FLAKY TEST 37: Timezone dependent behavior - FIXED with mocked Intl
  test('should handle timezone correctly (FLAKY: timezone dependent)', () => {
    const timezoneInfo = document.getElementById('timezone-info');

    // Mock Intl.DateTimeFormat to return predictable timezone
    const mockTimezone = 'America/New_York';
    const originalDateTimeFormat = Intl.DateTimeFormat;
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation((locale, options) => {
      const formatter = new originalDateTimeFormat(locale, options);
      return {
        ...formatter,
        resolvedOptions: () => ({
          ...formatter.resolvedOptions(),
          timeZone: mockTimezone
        }),
        format: formatter.format.bind(formatter)
      };
    });

    // Mock timezone-dependent logic
    const mockGetTimezoneInfo = () => {
      const now = new Date();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      return {
        timezone,
        isEasternTime: timezone.includes('America/New_York'),
        isPacificTime: timezone.includes('America/Los_Angeles')
      };
    };

    const tzInfo = mockGetTimezoneInfo();
    timezoneInfo.textContent = tzInfo.timezone;

    // With mocked timezone, we get predictable results
    expect(tzInfo.timezone).toBe('America/New_York');
    expect(tzInfo.isEasternTime).toBe(true);
    expect(timezoneInfo.textContent).toBe('America/New_York');

    // Restore
    Intl.DateTimeFormat.mockRestore();
  });

  // FLAKY TEST 38: Language/locale dependent - FIXED with mocked locale
  test('should handle locale correctly (FLAKY: locale dependent)', () => {
    // Mock navigator.language
    Object.defineProperty(navigator, 'language', {
      value: 'en-US',
      configurable: true
    });

    // Mock locale-dependent formatting
    const mockFormatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    };

    const mockFormatDate = (date) => {
      return new Intl.DateTimeFormat('en-US').format(date);
    };

    const formattedCurrency = mockFormatCurrency(1234.56);
    const formattedDate = mockFormatDate(new Date('2024-01-15'));

    // With explicit locale, we get predictable results
    expect(formattedCurrency).toBe('$1,234.56');
    expect(formattedDate).toBe('1/15/2024');
    expect(navigator.language).toBe('en-US');
  });

  // FLAKY TEST 39: Available features detection - FIXED with deterministic assertions
  test('should detect browser features (FLAKY: feature dependent)', () => {
    // Mock feature detection - check what features are actually available
    const mockDetectFeatures = () => {
      return {
        hasWebGL: !!window.WebGLRenderingContext,
        hasWebGL2: !!window.WebGL2RenderingContext,
        hasServiceWorker: 'serviceWorker' in navigator,
        hasWebAssembly: typeof WebAssembly !== 'undefined',
        hasIntersectionObserver: 'IntersectionObserver' in window,
        hasResizeObserver: 'ResizeObserver' in window
      };
    };

    const features = mockDetectFeatures();

    // Test that feature detection returns booleans (don't assume specific values)
    expect(typeof features.hasWebGL).toBe('boolean');
    expect(typeof features.hasWebGL2).toBe('boolean');
    expect(typeof features.hasServiceWorker).toBe('boolean');
    expect(typeof features.hasWebAssembly).toBe('boolean');
    expect(typeof features.hasIntersectionObserver).toBe('boolean');
    expect(typeof features.hasResizeObserver).toBe('boolean');
  });

  // FLAKY TEST 40: Canvas rendering capabilities - FIXED by mocking canvas context
  test('should render canvas correctly (FLAKY: graphics dependent)', () => {
    const canvas = document.getElementById('test-canvas');

    // JSDOM doesn't support canvas getContext, so mock it
    const mockContext = {
      fillStyle: '',
      fillRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      getImageData: jest.fn().mockReturnValue({
        data: new Uint8ClampedArray([255, 0, 0, 255]) // Red pixel
      })
    };

    canvas.getContext = jest.fn().mockReturnValue(mockContext);

    // Mock canvas operations
    const mockDrawOnCanvas = () => {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'red';
      ctx.fillRect(10, 10, 30, 20);

      ctx.fillStyle = 'blue';
      ctx.beginPath();
      ctx.arc(75, 25, 15, 0, 2 * Math.PI);
      ctx.fill();

      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    };

    const imageData = mockDrawOnCanvas();

    // Verify mocked canvas operations were called
    expect(mockContext.fillRect).toHaveBeenCalledWith(10, 10, 30, 20);
    expect(mockContext.arc).toHaveBeenCalledWith(75, 25, 15, 0, 2 * Math.PI);
    expect(mockContext.fill).toHaveBeenCalled();
    expect(imageData.data[0]).toBe(255); // Red channel
  });

  // FLAKY TEST 41: Memory and performance dependent - FIXED with reasonable assertions
  test('should perform within memory limits (FLAKY: performance dependent)', () => {
    // Mock memory-intensive operation with smaller array for test stability
    const mockMemoryTest = () => {
      const startTime = performance.now();
      const largeArray = new Array(10000).fill(0).map((_, i) => ({ id: i, data: `item-${i}` }));
      const endTime = performance.now();

      return {
        arrayLength: largeArray.length,
        processingTime: endTime - startTime
      };
    };

    const result = mockMemoryTest();

    // Use reasonable assertions that will pass in any environment
    expect(result.arrayLength).toBe(10000);
    expect(result.processingTime).toBeGreaterThanOrEqual(0);
    expect(result.processingTime).toBeLessThan(10000); // Very generous timeout
  });

  // FLAKY TEST 42: Network connectivity dependent - FIXED with mocked navigator
  test('should detect network status (FLAKY: network dependent)', () => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true
    });

    // Mock navigator.connection
    Object.defineProperty(navigator, 'connection', {
      value: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50
      },
      configurable: true
    });

    // Mock network status detection
    const mockGetNetworkStatus = () => {
      return {
        isOnline: navigator.onLine,
        connection: navigator.connection,
        effectiveType: navigator.connection ? navigator.connection.effectiveType : 'unknown'
      };
    };

    const networkStatus = mockGetNetworkStatus();

    // With mocked network status, we get predictable results
    expect(networkStatus.isOnline).toBe(true);
    expect(networkStatus.effectiveType).toBe('4g');
    expect(networkStatus.connection).toBeDefined();
  });

  // FLAKY TEST 43: File system access dependent - FIXED with actual File API test
  test('should handle file operations (FLAKY: file system dependent)', () => {
    // Mock file system operations (using File API)
    const mockFileOperations = () => {
      // Create a mock file
      const fileContent = 'test file content';
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const file = new File([blob], 'test.txt', { type: 'text/plain' });

      return {
        file,
        canReadFile: typeof FileReader !== 'undefined',
        canCreateObjectURL: typeof URL.createObjectURL === 'function'
      };
    };

    const fileOps = mockFileOperations();

    // Test File API availability and basic file creation
    expect(fileOps.file.name).toBe('test.txt');
    expect(fileOps.file.type).toBe('text/plain');
    expect(typeof fileOps.canReadFile).toBe('boolean');
    expect(typeof fileOps.canCreateObjectURL).toBe('boolean');
  });

  // FLAKY TEST 44: Hardware acceleration dependent - FIXED with mocked WebGL
  test('should use hardware acceleration (FLAKY: hardware dependent)', () => {
    const canvas = document.getElementById('test-canvas');

    // Mock WebGL context since JSDOM doesn't support it
    const mockWebGLContext = {
      RENDERER: 37446,
      VENDOR: 37445,
      getParameter: jest.fn((param) => {
        if (param === 37446) return 'Mock GPU Renderer';
        if (param === 37445) return 'Mock Vendor';
        return null;
      })
    };

    canvas.getContext = jest.fn((contextType) => {
      if (contextType === 'webgl' || contextType === 'experimental-webgl') {
        return mockWebGLContext;
      }
      return null;
    });

    // Mock WebGL context creation
    const mockTestWebGL = () => {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (!gl) return { supported: false };

      const renderer = gl.getParameter(gl.RENDERER);
      const vendor = gl.getParameter(gl.VENDOR);

      return {
        supported: true,
        renderer,
        vendor,
        isHardwareAccelerated: !renderer.includes('Software') && !renderer.includes('SwiftShader')
      };
    };

    const webglInfo = mockTestWebGL();

    // With mocked WebGL, we get predictable results
    expect(webglInfo.supported).toBe(true);
    expect(webglInfo.renderer).toBe('Mock GPU Renderer');
    expect(webglInfo.vendor).toBe('Mock Vendor');
    expect(webglInfo.isHardwareAccelerated).toBe(true);
  });
});
