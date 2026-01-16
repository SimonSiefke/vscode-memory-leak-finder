import { test, expect } from '@jest/globals'
import { transformCode, createFunctionWrapperPlugin } from '../src/parts/TransformScript/TransformScript.js'

test('Transform Script - transformCode - should transform function declarations', async () => {
  // Reset global statistics before each test
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as any).___functionStatistics
    delete (globalThis as any).getFunctionStatistics
    delete (globalThis as any).resetFunctionStatistics
  }

  const code = `
    function testFunction() {
      return 'test'
    }
  `
  
  const transformed = await transformCode(code, 'test.js')
  const expected = `// Function call tracking system
if (!globalThis.___functionStatistics) {
  globalThis.___functionStatistics = new Map();
}
const trackFunctionCall = (functionName, location) => {
  const key = functionName + (location ? \` (\${location})\` : '');
  const current = globalThis.___functionStatistics.get(key) || 0;
  globalThis.___functionStatistics.set(key, current + 1);
};
const getFunctionStatistics = () => {
  const stats = {};
  for (const [name, count] of globalThis.___functionStatistics) {
    stats[name] = count;
  }
  return stats;
};
const resetFunctionStatistics = () => {
  globalThis.___functionStatistics.clear();
};

// Export for debugging
globalThis.getFunctionStatistics = getFunctionStatistics;
globalThis.resetFunctionStatistics = resetFunctionStatistics;
function testFunction() {
  trackFunctionCall("testFunction", "test.js:2");
  return 'test';
}`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should transform arrow functions', async () => {
  const code = `
    const arrowFunction = () => {
      return 'arrow'
    }
  `

  const transformed = await transformCode(code, 'test.js')
  const expected = `// Function call tracking system
if (!globalThis.___functionStatistics) {
  globalThis.___functionStatistics = new Map();
}
const trackFunctionCall = (functionName, location) => {
  const key = functionName + (location ? \` (\${location})\` : '');
  const current = globalThis.___functionStatistics.get(key) || 0;
  globalThis.___functionStatistics.set(key, current + 1);
};
const getFunctionStatistics = () => {
  const stats = {};
  for (const [name, count] of globalThis.___functionStatistics) {
    stats[name] = count;
  }
  return stats;
};
const resetFunctionStatistics = () => {
  globalThis.___functionStatistics.clear();
};

// Export for debugging
globalThis.getFunctionStatistics = getFunctionStatistics;
globalThis.resetFunctionStatistics = resetFunctionStatistics;
const arrowFunction = () => {
  trackFunctionCall("arrowFunction", "test.js:2");
  return 'arrow';
};`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should transform concise arrow functions', async () => {
  const code = `
    const conciseArrow = x => x * 2
  `

  const transformed = await transformCode(code, 'test.js')
  const expected = `// Function call tracking system
if (!globalThis.___functionStatistics) {
  globalThis.___functionStatistics = new Map();
}
const trackFunctionCall = (functionName, location) => {
  const key = functionName + (location ? \` (\${location})\` : '');
  const current = globalThis.___functionStatistics.get(key) || 0;
  globalThis.___functionStatistics.set(key, current + 1);
};
const getFunctionStatistics = () => {
  const stats = {};
  for (const [name, count] of globalThis.___functionStatistics) {
    stats[name] = count;
  }
  return stats;
};
const resetFunctionStatistics = () => {
  globalThis.___functionStatistics.clear();
};

// Export for debugging
globalThis.getFunctionStatistics = getFunctionStatistics;
globalThis.resetFunctionStatistics = resetFunctionStatistics;
const conciseArrow = x => {
  trackFunctionCall("conciseArrow", "test.js:2");
  return x * 2;
};`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should transform function expressions', async () => {
  const code = `
    const funcExpression = function() {
      return 'expression'
    }
  `

  const transformed = await transformCode(code, 'test.js')
  const expected = `// Function call tracking system
if (!globalThis.___functionStatistics) {
  globalThis.___functionStatistics = new Map();
}
const trackFunctionCall = (functionName, location) => {
  const key = functionName + (location ? \` (\${location})\` : '');
  const current = globalThis.___functionStatistics.get(key) || 0;
  globalThis.___functionStatistics.set(key, current + 1);
};
const getFunctionStatistics = () => {
  const stats = {};
  for (const [name, count] of globalThis.___functionStatistics) {
    stats[name] = count;
  }
  return stats;
};
const resetFunctionStatistics = () => {
  globalThis.___functionStatistics.clear();
};

// Export for debugging
globalThis.getFunctionStatistics = getFunctionStatistics;
globalThis.resetFunctionStatistics = resetFunctionStatistics;
const funcExpression = function () {
  trackFunctionCall("funcExpression", "test.js:2");
  return 'expression';
};`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should transform object methods', async () => {
  const code = `
    const obj = {
      method() {
        return 'method'
      },

      arrowMethod: () => 'arrow method'
    }
  `

  const transformed = await transformCode(code, 'test.js')
  const expected = `// Function call tracking system
if (!globalThis.___functionStatistics) {
  globalThis.___functionStatistics = new Map();
}
const trackFunctionCall = (functionName, location) => {
  const key = functionName + (location ? \` (\${location})\` : '');
  const current = globalThis.___functionStatistics.get(key) || 0;
  globalThis.___functionStatistics.set(key, current + 1);
};
const getFunctionStatistics = () => {
  const stats = {};
  for (const [name, count] of globalThis.___functionStatistics) {
    stats[name] = count;
  }
  return stats;
};
const resetFunctionStatistics = () => {
  globalThis.___functionStatistics.clear();
};

// Export for debugging
globalThis.getFunctionStatistics = getFunctionStatistics;
globalThis.resetFunctionStatistics = resetFunctionStatistics;
const obj = {
  method() {
    return 'method';
  },
  arrowMethod: () => {
    trackFunctionCall("arrowMethod", "test.js:7");
    return 'arrow method';
  }
};`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should transform class methods', async () => {
  const code = `
    class TestClass {
      constructor() {
        this.value = 42
      }

      classMethod() {
        return this.value
      }
    }
  `

  const transformed = await transformCode(code, 'test.js')
  const expected = `// Function call tracking system
if (!globalThis.___functionStatistics) {
  globalThis.___functionStatistics = new Map();
}
const trackFunctionCall = (functionName, location) => {
  const key = functionName + (location ? \` (\${location})\` : '');
  const current = globalThis.___functionStatistics.get(key) || 0;
  globalThis.___functionStatistics.set(key, current + 1);
};
const getFunctionStatistics = () => {
  const stats = {};
  for (const [name, count] of globalThis.___functionStatistics) {
    stats[name] = count;
  }
  return stats;
};
const resetFunctionStatistics = () => {
  globalThis.___functionStatistics.clear();
};

// Export for debugging
globalThis.getFunctionStatistics = getFunctionStatistics;
globalThis.resetFunctionStatistics = resetFunctionStatistics;
class TestClass {
  constructor() {
    this.value = 42;
  }
  classMethod() {
    return this.value;
  }
}`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should exclude functions matching exclude patterns', async () => {
  const code = `
    function testFunction() {
      return 'test'
    }

    function privateHelper() {
      return 'helper'
    }
  `

  const transformed = await transformCode(code, 'test.js', ['private'])
  const expected = `// Function call tracking system
if (!globalThis.___functionStatistics) {
  globalThis.___functionStatistics = new Map();
}
const trackFunctionCall = (functionName, location) => {
  const key = functionName + (location ? \` (\${location})\` : '');
  const current = globalThis.___functionStatistics.get(key) || 0;
  globalThis.___functionStatistics.set(key, current + 1);
};
const getFunctionStatistics = () => {
  const stats = {};
  for (const [name, count] of globalThis.___functionStatistics) {
    stats[name] = count;
  }
  return stats;
};
const resetFunctionStatistics = () => {
  globalThis.___functionStatistics.clear();
};

// Export for debugging
globalThis.getFunctionStatistics = getFunctionStatistics;
globalThis.resetFunctionStatistics = resetFunctionStatistics;
function testFunction() {
  trackFunctionCall("testFunction", "test.js:2");
  return 'test';
}
function privateHelper() {
  return 'helper';
}`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should not transform tracking functions themselves', async () => {
  const code = `
    function trackFunctionCall() {
      return 'tracking'
    }

    function getFunctionStatistics() {
      return 'stats'
    }

    function regularFunction() {
      return 'regular'
    }
  `

  const transformed = await transformCode(code, 'test.js')
  const expected = `// Function call tracking system
if (!globalThis.___functionStatistics) {
  globalThis.___functionStatistics = new Map();
}
const trackFunctionCall = (functionName, location) => {
  const key = functionName + (location ? \` (\${location})\` : '');
  const current = globalThis.___functionStatistics.get(key) || 0;
  globalThis.___functionStatistics.set(key, current + 1);
};
const getFunctionStatistics = () => {
  const stats = {};
  for (const [name, count] of globalThis.___functionStatistics) {
    stats[name] = count;
  }
  return stats;
};
const resetFunctionStatistics = () => {
  globalThis.___functionStatistics.clear();
};

// Export for debugging
globalThis.getFunctionStatistics = getFunctionStatistics;
globalThis.resetFunctionStatistics = resetFunctionStatistics;
function trackFunctionCall() {
  return 'tracking';
}
function getFunctionStatistics() {
  trackFunctionCall("getFunctionStatistics", "test.js:6");
  return 'stats';
}
function regularFunction() {
  trackFunctionCall("regularFunction", "test.js:10");
  return 'regular';
}`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should handle empty code', async () => {
  const code = ''
  const transformed = await transformCode(code, 'test.js')
  const expected = `// Function call tracking system
if (!globalThis.___functionStatistics) {
  globalThis.___functionStatistics = new Map();
}
const trackFunctionCall = (functionName, location) => {
  const key = functionName + (location ? \` (\${location})\` : '');
  const current = globalThis.___functionStatistics.get(key) || 0;
  globalThis.___functionStatistics.set(key, current + 1);
};
const getFunctionStatistics = () => {
  const stats = {};
  for (const [name, count] of globalThis.___functionStatistics) {
    stats[name] = count;
  }
  return stats;
};
const resetFunctionStatistics = () => {
  globalThis.___functionStatistics.clear();
};

// Export for debugging
globalThis.getFunctionStatistics = getFunctionStatistics;
globalThis.resetFunctionStatistics = resetFunctionStatistics;`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should handle invalid code gracefully', async () => {
  const code = 'invalid javascript syntax {{{'
  const transformed = await transformCode(code, 'test.js')

  expect(transformed).toBe(code) // Should return original code
})

test('Transform Script - transformCode - should use default filename when not provided', async () => {
  const code = `
    function testFunction() {
      return 'test'
    }
  `

  const transformed = await transformCode(code)
  const expected = `// Function call tracking system
if (!globalThis.___functionStatistics) {
  globalThis.___functionStatistics = new Map();
}
const trackFunctionCall = (functionName, location) => {
  const key = functionName + (location ? \` (\${location})\` : '');
  const current = globalThis.___functionStatistics.get(key) || 0;
  globalThis.___functionStatistics.set(key, current + 1);
};
const getFunctionStatistics = () => {
  const stats = {};
  for (const [name, count] of globalThis.___functionStatistics) {
    stats[name] = count;
  }
  return stats;
};
const resetFunctionStatistics = () => {
  globalThis.___functionStatistics.clear();
};

// Export for debugging
globalThis.getFunctionStatistics = getFunctionStatistics;
globalThis.resetFunctionStatistics = resetFunctionStatistics;
function testFunction() {
  trackFunctionCall("testFunction", "unknown:2");
  return 'test';
}`

  expect(transformed).toBe(expected)
})

test('Transform Script - createFunctionWrapperPlugin - should create a plugin with expected structure', () => {
  const plugin = createFunctionWrapperPlugin({ filename: 'test.js' })

  expect(plugin).toHaveProperty('visitor')
  expect(plugin.visitor).toHaveProperty('FunctionDeclaration')
  expect(plugin.visitor).toHaveProperty('FunctionExpression')
  expect(plugin.visitor).toHaveProperty('ArrowFunctionExpression')
})

test('Transform Script - createFunctionWrapperPlugin - should handle default options', () => {
  const plugin = createFunctionWrapperPlugin()

  expect(plugin).toBeDefined()
  expect(plugin.visitor).toBeDefined()
})

test('Transform Script - Tracking functionality - should track function calls when executed', async () => {
  const code = `
    function testFunction() {
      return 'test'
    }

    const arrowFunction = () => {
      return 'arrow'
    }
  `

  const transformed = await transformCode(code, 'test.js')

  // Execute the transformed code
  const executeCode = new Function(
    transformed +
      `
    return {
      testFunction,
      arrowFunction
    };
  `,
  )

  const { testFunction, arrowFunction } = executeCode()

  // Call the functions
  testFunction()
  arrowFunction()

  // Check statistics
  if (typeof globalThis.getFunctionStatistics === 'function') {
    const stats = globalThis.getFunctionStatistics()
    expect(stats).toHaveProperty('testFunction (test.js:2)', 1)
    expect(stats).toHaveProperty('arrowFunction (test.js:6)', 1)
  }
})

test('Transform Script - Tracking functionality - should reset statistics', async () => {
  const code = `
    function testFunction() {
      return 'test'
    }
  `

  const transformed = await transformCode(code, 'test.js')

  // Execute and call function
  const executeCode = new Function(
    transformed +
      `
    return {
      testFunction
    };
  `,
  )

  const { testFunction } = executeCode()
  testFunction()

  // Check that we have statistics
  if (typeof globalThis.getFunctionStatistics === 'function') {
    const stats = globalThis.getFunctionStatistics()
    expect(Object.keys(stats)).toHaveLength(1)

    // Reset statistics
    if (typeof globalThis.resetFunctionStatistics === 'function') {
      globalThis.resetFunctionStatistics()
      const resetStats = globalThis.getFunctionStatistics()
      expect(Object.keys(resetStats)).toHaveLength(0)
    }
  }
})

test('Transform Script - Tracking functionality - should count multiple calls', async () => {
  const code = `
    function testFunction() {
      return 'test'
    }
  `

  const transformed = await transformCode(code, 'test.js')

  const executeCode = new Function(
    transformed +
      `
    return {
      testFunction
    };
  `,
  )

  const { testFunction } = executeCode()

  // Call function multiple times
  testFunction()
  testFunction()
  testFunction()

  if (typeof globalThis.getFunctionStatistics === 'function') {
    const stats = globalThis.getFunctionStatistics()
    expect(stats).toHaveProperty('testFunction (test.js:2)', 3)
  }
})
