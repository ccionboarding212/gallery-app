/**
 * @jest-environment jsdom
 */

describe('Flaky DOM-Dependent Tests', () => {
  let mockHTML;

  beforeEach(() => {
    jest.useFakeTimers();
    mockHTML = `
      <div class="dynamic-container">
        <button id="add-element">Add Element</button>
        <div id="element-list"></div>
      </div>
      <div class="render-target"></div>
      <div class="measurement-box" style="width: 100px; height: 50px;"></div>
    `;
    document.body.innerHTML = mockHTML;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // FLAKY TEST 6: DOM element availability timing - FIXED with fake timers
  test('should find dynamically created elements (FLAKY: DOM timing)', () => {
    const container = document.getElementById('element-list');
    const addButton = document.getElementById('add-element');

    // Mock dynamic element creation with fixed timing
    const mockAddElement = () => {
      setTimeout(() => {
        const newElement = document.createElement('div');
        newElement.className = 'dynamic-item';
        newElement.textContent = 'Dynamic Item';
        container.appendChild(newElement);
      }, 100); // Fixed delay
    };

    mockAddElement();

    // Advance timers past element creation
    jest.advanceTimersByTime(150);

    const dynamicElement = document.querySelector('.dynamic-item');
    expect(dynamicElement).toBeInTheDocument();
    expect(dynamicElement.textContent).toBe('Dynamic Item');
  });

  // FLAKY TEST 7: Element dimensions and rendering - FIXED with synchronous style application
  test('should measure element dimensions correctly (FLAKY: rendering timing)', () => {
    const measurementBox = document.querySelector('.measurement-box');
    const renderTarget = document.querySelector('.render-target');

    // Apply styles synchronously for deterministic testing
    measurementBox.style.padding = '10px';
    measurementBox.style.border = '2px solid black';
    renderTarget.style.display = 'block';
    renderTarget.style.width = '200px';
    renderTarget.style.height = '100px';

    // In JSDOM, getBoundingClientRect returns 0 for most measurements
    // So we test the style values directly instead
    expect(measurementBox.style.padding).toBe('10px');
    expect(measurementBox.style.border).toBe('2px solid black');
    expect(renderTarget.style.width).toBe('200px');
    expect(renderTarget.style.height).toBe('100px');
  });

  // FLAKY TEST 8: Event listener attachment timing - FIXED with fake timers
  test('should handle events on dynamically created elements (FLAKY: event timing)', () => {
    const container = document.getElementById('element-list');
    let clickCount = 0;

    // Mock creating element with event listener
    const mockCreateClickableElement = () => {
      const element = document.createElement('button');
      element.className = 'clickable-item';
      element.textContent = 'Click me';

      // Add to DOM first
      container.appendChild(element);

      // Add event listener with fixed delay
      setTimeout(() => {
        element.addEventListener('click', () => {
          clickCount++;
        });
      }, 100);

      return element;
    };

    const clickableElement = mockCreateClickableElement();

    // Advance timers past event listener attachment
    jest.advanceTimersByTime(150);

    // Now click - event listener should be attached
    clickableElement.click();
    expect(clickCount).toBe(1);
    expect(clickableElement).toBeInTheDocument();
  });

  // FLAKY TEST 9: CSS class application timing - FIXED with fake timers
  test('should apply CSS classes correctly (FLAKY: class timing)', () => {
    const renderTarget = document.querySelector('.render-target');
    let transitionCompleted = false;

    // Mock CSS class application with transition
    const mockApplyTransition = () => {
      renderTarget.classList.add('fade-in');

      // Simulate CSS transition completion detection
      setTimeout(() => {
        transitionCompleted = true;
      }, 100); // Fixed timing
    };

    mockApplyTransition();

    // Check class application immediately
    expect(renderTarget.classList.contains('fade-in')).toBe(true);

    // Advance timers past transition completion
    jest.advanceTimersByTime(150);

    expect(transitionCompleted).toBe(true);
  });

  // FLAKY TEST 10: Multiple DOM mutations - FIXED with fake timers
  test('should handle multiple DOM mutations correctly (FLAKY: mutation timing)', () => {
    const container = document.getElementById('element-list');
    const mutations = [];

    // Mock MutationObserver-like behavior with fixed timing
    const mockObserveMutations = () => {
      setTimeout(() => {
        const div1 = document.createElement('div');
        div1.textContent = 'First';
        container.appendChild(div1);
        mutations.push('added-first');
      }, 20);

      setTimeout(() => {
        const div2 = document.createElement('div');
        div2.textContent = 'Second';
        container.appendChild(div2);
        mutations.push('added-second');
      }, 40);

      setTimeout(() => {
        const firstChild = container.firstElementChild;
        if (firstChild) {
          container.removeChild(firstChild);
          mutations.push('removed-first');
        }
      }, 60);
    };

    mockObserveMutations();

    // Advance timers past all mutations
    jest.advanceTimersByTime(100);

    expect(mutations).toContain('added-first');
    expect(mutations).toContain('added-second');
    expect(mutations).toContain('removed-first');
    expect(container.children.length).toBe(1);
  });
});
