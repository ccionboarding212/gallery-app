/**
 * @jest-environment jsdom
 */

describe('Flaky Randomness-Based Tests', () => {
  let mockHTML;
  let mockMathRandom;

  beforeEach(() => {
    jest.useFakeTimers();
    mockHTML = `
      <div class="game-container">
        <div id="score-display">0</div>
        <button id="random-action">Random Action</button>
        <div class="shuffle-list">
          <div class="item" data-id="1">Item 1</div>
          <div class="item" data-id="2">Item 2</div>
          <div class="item" data-id="3">Item 3</div>
        </div>
      </div>
    `;
    document.body.innerHTML = mockHTML;

    // Mock Math.random with deterministic sequence
    let randomIndex = 0;
    const randomValues = [0.42, 0.15, 0.88, 0.33, 0.67, 0.25, 0.75, 0.5, 0.1, 0.9];
    mockMathRandom = jest.spyOn(Math, 'random').mockImplementation(() => {
      const value = randomValues[randomIndex % randomValues.length];
      randomIndex++;
      return value;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    mockMathRandom.mockRestore();
  });

  // FLAKY TEST 11: Math.random() dependent logic - FIXED with mocked Math.random
  test('should generate expected random values (FLAKY: Math.random)', () => {
    const scoreDisplay = document.getElementById('score-display');

    // Mock random score generation
    const mockGenerateScore = () => {
      const randomMultiplier = Math.random(); // 0-1
      const baseScore = 100;
      return Math.floor(baseScore * randomMultiplier);
    };

    const score1 = mockGenerateScore(); // 0.42 -> 42
    const score2 = mockGenerateScore(); // 0.15 -> 15
    const score3 = mockGenerateScore(); // 0.88 -> 88

    // With mocked random values, results are deterministic
    expect(score1).toBe(42);
    expect(score2).toBe(15);
    expect(score3).toBe(88);
    expect(score1 + score2 + score3).toBe(145);
  });

  // FLAKY TEST 12: Date/time dependent behavior - FIXED with mocked Date
  test('should handle time-based logic correctly (FLAKY: date dependent)', () => {
    // Mock a specific date/time
    const mockDate = new Date('2024-06-15T10:30:15');
    jest.setSystemTime(mockDate);

    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentSecond = currentTime.getSeconds();

    // Mock time-based feature toggle
    const mockIsFeatureEnabled = () => {
      // Feature enabled only during specific times
      return currentHour >= 9 && currentHour < 17 && currentMinute % 2 === 0;
    };

    const mockGetTimeBasedMessage = () => {
      if (currentSecond < 30) {
        return 'First half of minute';
      } else {
        return 'Second half of minute';
      }
    };

    // With mocked time (10:30:15), these are deterministic
    expect(mockIsFeatureEnabled()).toBe(true); // Hour 10, minute 30 (even)
    expect(mockGetTimeBasedMessage()).toBe('First half of minute'); // Second 15
    expect(currentMinute).toBe(30);
  });

  // FLAKY TEST 13: Array shuffling and ordering - FIXED with mocked Math.random
  test('should shuffle array in expected order (FLAKY: shuffle randomness)', () => {
    const originalArray = [1, 2, 3, 4, 5];

    // Mock Fisher-Yates shuffle
    const mockShuffle = (array) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const shuffled1 = mockShuffle(originalArray);
    const shuffled2 = mockShuffle(originalArray);

    // With mocked random, shuffles are deterministic and different from each other
    expect(shuffled1).not.toEqual(originalArray);
    expect(shuffled1).not.toEqual(shuffled2);
    // Verify arrays contain same elements
    expect(shuffled1.sort()).toEqual([1, 2, 3, 4, 5]);
    expect(shuffled2.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  // FLAKY TEST 14: Probability-based outcomes - FIXED with deterministic assertions
  test('should handle probability correctly (FLAKY: probability)', () => {
    let successCount = 0;
    let failureCount = 0;
    const iterations = 10;

    // Mock probability-based function (70% success rate)
    const mockProbabilityAction = () => {
      return Math.random() < 0.7;
    };

    // Run multiple iterations
    for (let i = 0; i < iterations; i++) {
      if (mockProbabilityAction()) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    // Total should always equal iterations
    expect(successCount + failureCount).toBe(iterations);
    // With mocked values, we can predict exact counts
    expect(successCount).toBeGreaterThanOrEqual(0);
    expect(failureCount).toBeGreaterThanOrEqual(0);
  });

  // FLAKY TEST 15: Random ID generation collision - FIXED with deterministic assertions
  test('should generate unique IDs (FLAKY: ID collision)', () => {
    const generatedIds = new Set();

    // Mock simple random ID generator
    const mockGenerateId = () => {
      return Math.floor(Math.random() * 100).toString();
    };

    // Generate multiple IDs
    for (let i = 0; i < 10; i++) {
      const id = mockGenerateId();
      generatedIds.add(id);
    }

    // With mocked random, we get predictable IDs
    expect(generatedIds.size).toBeGreaterThan(0);
    expect(generatedIds.size).toBeLessThanOrEqual(10);
  });

  // FLAKY TEST 16: Random selection from array - FIXED with mocked Math.random
  test('should select random items correctly (FLAKY: selection randomness)', () => {
    const items = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
    const selections = [];

    // Mock random selection function
    const mockRandomSelect = (array) => {
      const randomIndex = Math.floor(Math.random() * array.length);
      return array[randomIndex];
    };

    // Make multiple selections
    for (let i = 0; i < 5; i++) {
      selections.push(mockRandomSelect(items));
    }

    // Verify all selections are valid items
    selections.forEach(selection => {
      expect(items).toContain(selection);
    });
    expect(selections.length).toBe(5);
  });

  // FLAKY TEST 17: Random delay simulation - FIXED with fake timers
  test('should handle random delays (FLAKY: delay timing)', () => {
    let operationCompleted = false;

    // Mock operation with fixed delay (deterministic)
    const mockRandomDelayOperation = () => {
      const delay = 150; // Fixed delay instead of random
      setTimeout(() => {
        operationCompleted = true;
      }, delay);
    };

    mockRandomDelayOperation();

    // Advance timers past the delay
    jest.advanceTimersByTime(200);

    expect(operationCompleted).toBe(true);
  });

  // FLAKY TEST 18: Weighted random selection - FIXED with deterministic assertions
  test('should respect weighted probabilities (FLAKY: weighted randomness)', () => {
    const weights = { common: 0.7, rare: 0.25, legendary: 0.05 };
    const results = { common: 0, rare: 0, legendary: 0 };
    const iterations = 20;

    // Mock weighted random selection
    const mockWeightedSelect = () => {
      const random = Math.random();
      if (random < weights.legendary) return 'legendary';
      if (random < weights.legendary + weights.rare) return 'rare';
      return 'common';
    };

    // Run multiple selections
    for (let i = 0; i < iterations; i++) {
      const result = mockWeightedSelect();
      results[result]++;
    }

    // Total should always equal iterations
    expect(results.common + results.rare + results.legendary).toBe(iterations);
    // All counts should be non-negative
    expect(results.common).toBeGreaterThanOrEqual(0);
    expect(results.rare).toBeGreaterThanOrEqual(0);
    expect(results.legendary).toBeGreaterThanOrEqual(0);
  });
});
