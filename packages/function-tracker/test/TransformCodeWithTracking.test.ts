import { test, expect } from '@jest/globals'
import { transformCodeWithTracking } from '../src/parts/TransformCodeWithTracking/TransformCodeWithTracking.js'

test('TransformCodeWithTracking - should transform function declarations', async () => {
  const code = `
    function testFunction() {
      return 'test'
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `function testFunction() {
  trackFunctionCall("testFunction", "test.js:2");
  return 'test';
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform arrow functions', async () => {
  const code = `
    const arrowFunction = () => {
      return 'arrow'
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `const arrowFunction = () => {
  trackFunctionCall("arrowFunction", "test.js:2");
  return 'arrow';
};`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform concise arrow functions', async () => {
  const code = `
    const conciseArrow = x => x * 2
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `const conciseArrow = x => {
  trackFunctionCall("conciseArrow", "test.js:2");
  return x * 2;
};`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform function expressions', async () => {
  const code = `
    const funcExpression = function() {
      return 'expression'
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `const funcExpression = function () {
  trackFunctionCall("funcExpression", "test.js:2");
  return 'expression';
};`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform object methods', async () => {
  const code = `
    const obj = {
      method() {
        return 'method'
      },

      arrowMethod: () => 'arrow method'
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `const obj = {
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

test('TransformCodeWithTracking - should transform class methods', async () => {
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

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `class TestClass {
  constructor() {
    this.value = 42;
  }
  classMethod() {
    return this.value;
  }
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should exclude functions matching exclude patterns', async () => {
  const code = `
    function testFunction() {
      return 'test'
    }

    function privateHelper() {
      return 'helper'
    }
  `

  const transformed = await transformCodeWithTracking(code, { 
    filename: 'test.js',
    excludePatterns: ['private']
  })
  const expected = `function testFunction() {
  trackFunctionCall("testFunction", "test.js:2");
  return 'test';
}
function privateHelper() {
  return 'helper';
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should not transform tracking functions themselves', async () => {
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

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `function trackFunctionCall() {
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

test('TransformCodeWithTracking - should handle empty code', async () => {
  const code = ''
  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
  expect(transformed).toBe('')
})

test('TransformCodeWithTracking - should handle invalid code gracefully', async () => {
  const code = 'invalid javascript syntax {{{'
  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })

  expect(transformed).toBe(code) // Should return original code
})

test('TransformCodeWithTracking - should use default filename when not provided', async () => {
  const code = `
    function testFunction() {
      return 'test'
    }
  `

  const transformed = await transformCodeWithTracking(code)
  const expected = `function testFunction() {
  trackFunctionCall("testFunction", "unknown:2");
  return 'test';
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform IIFE (Immediately Invoked Function Expressions)', async () => {
  const code = `
    (function() {
      console.log('IIFE executed');
    })();

    (() => {
      console.log('Arrow IIFE executed');
    })();
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `(function () {
  trackFunctionCall("anonymous", "test.js:2");
  console.log('IIFE executed');
})();
(() => {
  trackFunctionCall("anonymous_arrow", "test.js:6");
  console.log('Arrow IIFE executed');
})();`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform Promise constructor callbacks', async () => {
  const code = `
    new Promise((resolve, reject) => {
      resolve('success');
    });

    new Promise(function(resolve, reject) {
      reject('error');
    });
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `new Promise((resolve, reject) => {
  trackFunctionCall("anonymous_arrow", "test.js:2");
  resolve('success');
});
new Promise(function (resolve, reject) {
  trackFunctionCall("anonymous", "test.js:6");
  reject('error');
});`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform async functions', async () => {
  const code = `
    async function asyncFunction() {
      return await fetch('/api/data');
    }

    const asyncArrow = async () => {
      return await Promise.resolve('async arrow');
    };
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `async function asyncFunction() {
  trackFunctionCall("asyncFunction", "test.js:2");
  return await fetch('/api/data');
}
const asyncArrow = async () => {
  trackFunctionCall("asyncArrow", "test.js:6");
  return await Promise.resolve('async arrow');
};`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform generator functions', async () => {
  const code = `
    function* generatorFunction() {
      yield 1;
      yield 2;
    }

    const generatorArrow = function*() {
      yield 'arrow generator';
    };
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `function* generatorFunction() {
  trackFunctionCall("generatorFunction", "test.js:2");
  yield 1;
  yield 2;
}
const generatorArrow = function* () {
  trackFunctionCall("generatorArrow", "test.js:7");
  yield 'arrow generator';
};`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform nested functions', async () => {
  const code = `
    function outerFunction() {
      function innerFunction() {
        return 'inner';
      }
      
      const innerArrow = () => {
        return 'inner arrow';
      };
      
      return innerFunction();
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `function outerFunction() {
  trackFunctionCall("outerFunction", "test.js:2");
  function innerFunction() {
    trackFunctionCall("innerFunction", "test.js:3");
    return 'inner';
  }
  const innerArrow = () => {
    trackFunctionCall("innerArrow", "test.js:7");
    return 'inner arrow';
  };
  return innerFunction();
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform functions as parameters', async () => {
  const code = `
    setTimeout(function() {
      console.log('timeout callback');
    }, 1000);

    setInterval(() => {
      console.log('interval callback');
    }, 2000);

    [1, 2, 3].map(function(item) {
      return item * 2;
    });

    [4, 5, 6].filter(item => item > 4);
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `setTimeout(function () {
  trackFunctionCall("anonymous", "test.js:2");
  console.log('timeout callback');
}, 1000);
setInterval(() => {
  trackFunctionCall("anonymous_arrow", "test.js:6");
  console.log('interval callback');
}, 2000);
[1, 2, 3].map(function (item) {
  trackFunctionCall("anonymous", "test.js:10");
  return item * 2;
});
[4, 5, 6].filter(item => {
  trackFunctionCall("anonymous_arrow", "test.js:14");
  return item > 4;
});`

  expect(transformed).toBe(expected)
})
