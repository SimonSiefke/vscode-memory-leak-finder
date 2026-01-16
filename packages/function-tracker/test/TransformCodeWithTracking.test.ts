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
    excludePatterns: ['private'],
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

test('TransformCodeWithTracking - should transform destructured parameter functions', async () => {
  const code = `
    function destructuredFunction({ a, b }, [c, d]) {
      return a + b + c + d;
    }

    const arrowDestructured = ({ x, y }) => x + y;
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `function destructuredFunction({
  a,
  b
}, [c, d]) {
  trackFunctionCall("destructuredFunction", "test.js:2");
  return a + b + c + d;
}
const arrowDestructured = ({
  x,
  y
}) => {
  trackFunctionCall("arrowDestructured", "test.js:6");
  return x + y;
};`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform functions with default parameters', async () => {
  const code = `
    function defaultParams(x = 10, y = 'default') {
      return x + y;
    }

    const arrowDefault = (a = 5, b = []) => a + b.length;
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `function defaultParams(x = 10, y = 'default') {
  trackFunctionCall("defaultParams", "test.js:2");
  return x + y;
}
const arrowDefault = (a = 5, b = []) => {
  trackFunctionCall("arrowDefault", "test.js:6");
  return a + b.length;
};`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform functions with rest parameters', async () => {
  const code = `
    function restParams(...args) {
      return args.join(', ');
    }

    const arrowRest = (first, ...rest) => rest.length;
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `function restParams(...args) {
  trackFunctionCall("restParams", "test.js:2");
  return args.join(', ');
}
const arrowRest = (first, ...rest) => {
  trackFunctionCall("arrowRest", "test.js:6");
  return rest.length;
};`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform functions with complex return statements', async () => {
  const code = `
    function complexReturn() {
      if (Math.random() > 0.5) {
        return 'success';
      } else {
        return 'failure';
      }
    }

    const arrowComplex = () => {
      try {
        return riskyOperation();
      } catch (error) {
        return null;
      }
    };
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `function complexReturn() {
  trackFunctionCall("complexReturn", "test.js:2");
  if (Math.random() > 0.5) {
    return 'success';
  } else {
    return 'failure';
  }
}
const arrowComplex = () => {
  trackFunctionCall("arrowComplex", "test.js:10");
  try {
    return riskyOperation();
  } catch (error) {
    return null;
  }
};`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should handle Unicode and special characters', async () => {
  const code = `
    function 测试函数() {
      return 'Unicode test 🚀';
    }

    const emojiFunc = () => '🎉';

    function special$Chars$_123() {
      return 'special chars';
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'unicode.js' })
  const expected = `function 测试函数() {
  trackFunctionCall("测试函数", "unicode.js:2");
  return 'Unicode test 🚀';
}
const emojiFunc = () => {
  trackFunctionCall("emojiFunc", "unicode.js:6");
  return '🎉';
};
function special$Chars$_123() {
  trackFunctionCall("special$Chars$_123", "unicode.js:8");
  return 'special chars';
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should handle comments and directives', async () => {
  const code = `
    'use strict';

    /* This is a multi-line comment
       with function declarations inside
       function notARealFunction() {}
    */

    // Single line comment with function fakeFunction() {}

    function realFunction() {
      return 'real';
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'comments.js' })
  const expected = `'use strict';

/* This is a multi-line comment
   with function declarations inside
   function notARealFunction() {}
*/
// Single line comment with function fakeFunction() {}
function realFunction() {
  trackFunctionCall("realFunction", "comments.js:10");
  return 'real';
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should handle template literals and complex expressions', async () => {
  const code = `
    function templateFunction() {
      const name = 'World';
      return \`Hello \${name}!\`;
    }

    const complexArrow = () => ({
      [computedKey]: () => 'nested computed',
      regular: function() { return 'regular'; }
    });
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'templates.js' })
  const expected = `function templateFunction() {
  trackFunctionCall("templateFunction", "templates.js:2");
  const name = 'World';
  return \`Hello \${name}!\`;
}
const complexArrow = () => {
  trackFunctionCall("complexArrow", "templates.js:7");
  return {
    [computedKey]: () => {
      trackFunctionCall("anonymous_arrow", "templates.js:8");
      return 'nested computed';
    },
    regular: function () {
      trackFunctionCall("regular", "templates.js:9");
      return 'regular';
    }
  };
};`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should handle regex and literals', async () => {
  const code = `
    function regexFunction() {
      const pattern = /test/gi;
      return pattern.test('test string');
    }

    function literalFunction() {
      return 42n; // BigInt literal
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'literals.js' })
  const expected = `function regexFunction() {
  trackFunctionCall("regexFunction", "literals.js:2");
  const pattern = /test/gi;
  return pattern.test('test string');
}
function literalFunction() {
  trackFunctionCall("literalFunction", "literals.js:7");
  return 42n;
  // BigInt literal
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should handle TypeScript-like annotations', async () => {
  const code = `
    function typedFunction(param: string): number {
      return param.length;
    }

    const typedArrow = (x: number, y: number): string => {
      return (x + y).toString();
    };

    interface TestInterface {
      method(): void;
    }

    class GenericClass<T> {
      genericMethod(value: T): T {
        return value;
      }
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'typescript.ts' })
  const expected = `function typedFunction(param: string): number {
  trackFunctionCall("typedFunction", "typescript.ts:2");
  return param.length;
}
const typedArrow = (x: number, y: number): string => {
  trackFunctionCall("typedArrow", "typescript.ts:6");
  return (x + y).toString();
};
interface TestInterface {
  method(): void;
}
class GenericClass<T> {
  genericMethod(value: T): T {
    trackFunctionCall("genericMethod", "typescript.ts:15");
    return value;
  }
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should handle deeply nested function structures', async () => {
  const code = `
    function level1() {
      function level2() {
        function level3() {
          function level4() {
            function level5() {
              return 'deeply nested';
            }
            return level5();
          }
          return level4();
        }
        return level3();
      }
      return level2();
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'nested.js' })
  const expected = `function level1() {
  trackFunctionCall("level1", "nested.js:2");
  function level2() {
    trackFunctionCall("level2", "nested.js:3");
    function level3() {
      trackFunctionCall("level3", "nested.js:4");
      function level4() {
        trackFunctionCall("level4", "nested.js:5");
        function level5() {
          trackFunctionCall("level5", "nested.js:6");
          return 'deeply nested';
        }
        return level5();
      }
      return level4();
    }
    return level3();
  }
  return level2();
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should handle complex class hierarchies', async () => {
  const code = `
    class Animal {
      constructor(name) {
        this.name = name;
      }

      speak() {
        return \`\${this.name} makes a sound\`;
      }
    }

    class Dog extends Animal {
      constructor(name, breed) {
        super(name);
        this.breed = breed;
      }

      speak() {
        return \`\${this.name} barks\`;
      }

      static purr() {
        return 'Purring';
      }
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'classes.js' })
  const expected = `class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    trackFunctionCall("speak", "classes.js:7");
    return \`\${this.name} makes a sound\`;
  }
}
class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }
  speak() {
    trackFunctionCall("speak", "classes.js:18");
    return \`\${this.name} barks\`;
  }
  static purr() {
    trackFunctionCall("purr", "classes.js:22");
    return 'Purring';
  }
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should handle closures and lexical scoping', async () => {
  const code = `
    function outerClosure(outerParam) {
      const outerVar = 'outer';

      return function innerClosure(innerParam) {
        const innerVar = 'inner';

        return function deepestClosure(deepestParam) {
          return outerParam + outerVar + innerParam + innerVar + deepestParam;
        };
      };
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'closures.js' })
  const expected = `function outerClosure(outerParam) {
  trackFunctionCall("outerClosure", "closures.js:2");
  const outerVar = 'outer';
  return function innerClosure(innerParam) {
    trackFunctionCall("innerClosure", "closures.js:5");
    const innerVar = 'inner';
    return function deepestClosure(deepestParam) {
      trackFunctionCall("deepestClosure", "closures.js:8");
      return outerParam + outerVar + innerParam + innerVar + deepestParam;
    };
  };
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should handle higher-order functions and functional programming', async () => {
  const code = `
    function compose(f, g) {
      return function(x) {
        return f(g(x));
      };
    }

    const pipe = (...fns) => (value) =>
      fns.reduce((acc, fn) => fn(acc), value);
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'functional.js' })
  const expected = `function compose(f, g) {
  trackFunctionCall("compose", "functional.js:2");
  return function (x) {
    trackFunctionCall("anonymous", "functional.js:3");
    return f(g(x));
  };
}
const pipe = (...fns) => {
  trackFunctionCall("pipe", "functional.js:8");
  return value => {
    trackFunctionCall("anonymous_arrow", "functional.js:8");
    return fns.reduce((acc, fn) => {
      trackFunctionCall("anonymous_arrow", "functional.js:9");
      return fn(acc);
    }, value);
  };
};`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should handle recursive and mutually recursive functions', async () => {
  const code = `
    function factorial(n) {
      if (n <= 1) {
        return 1;
      }
      return n * factorial(n - 1);
    }

    // Recursive arrow function
    const sumRecursive = (arr, index = 0) => {
      if (index >= arr.length) {
        return 0;
      }
      return arr[index] + sumRecursive(arr, index + 1);
    };
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'recursive.js' })
  const expected = `function factorial(n) {
  trackFunctionCall("factorial", "recursive.js:2");
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}
// Recursive arrow function
const sumRecursive = (arr, index = 0) => {
  trackFunctionCall("sumRecursive", "recursive.js:9");
  if (index >= arr.length) {
    return 0;
  }
  return arr[index] + sumRecursive(arr, index + 1);
};`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should exclude functions matching multiple patterns', async () => {
  const code = `
    function publicFunction() {
      return 'public';
    }

    function privateHelper() {
      return 'private helper';
    }

    function _internalFunction() {
      return 'internal';
    }

    function $secretMethod() {
      return 'secret';
    }
  `

  const transformed = await transformCodeWithTracking(code, {
    filename: 'exclude.js',
    excludePatterns: ['private', '_', '$'],
  })

  const expected = `function publicFunction() {
  trackFunctionCall("publicFunction", "exclude.js:2");
  return 'public';
}
function privateHelper() {
  return 'private helper';
}
function _internalFunction() {
  return 'internal';
}
function $secretMethod() {
  return 'secret';
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should handle regex-like patterns in exclude', async () => {
  const code = `
    function handleEvent() {
      return 'event';
    }

    function handleClick() {
      return 'click';
    }

    function processData() {
      return 'data';
    }
  `

  const transformed = await transformCodeWithTracking(code, {
    filename: 'regex-exclude.js',
    excludePatterns: ['handle', 'process'],
  })

  const expected = `function handleEvent() {
  return 'event';
}
function handleClick() {
  return 'click';
}
function processData() {
  return 'data';
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should exclude methods in objects and classes', async () => {
  const code = `
    const obj = {
      publicMethod() {
        return 'public';
      },

      _privateMethod() {
        return 'private';
      }
    };

    class TestClass {
      publicClassMethod() {
        return this.value;
      }

      _privateClassMethod() {
        return 'private class method';
      }
    }
  `

  const transformed = await transformCodeWithTracking(code, {
    filename: 'exclude-methods.js',
    excludePatterns: ['_'],
  })

  const expected = `const obj = {
  publicMethod() {
    trackFunctionCall("publicMethod", "exclude-methods.js:3");
    return 'public';
  },
  _privateMethod() {
    return 'private';
  }
};
class TestClass {
  publicClassMethod() {
    trackFunctionCall("publicClassMethod", "exclude-methods.js:13");
    return this.value;
  }
  _privateClassMethod() {
    return 'private class method';
  }
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should handle case-sensitive exclude patterns', async () => {
  const code = `
    function TestFunction() {
      return 'uppercase test';
    }

    function testfunction() {
      return 'lowercase test';
    }
  `

  const transformed = await transformCodeWithTracking(code, {
    filename: 'case-exclude.js',
    excludePatterns: ['test'],
  })

  const expected = `function TestFunction() {
  trackFunctionCall("TestFunction", "case-exclude.js:2");
  return 'uppercase test';
}
function testfunction() {
  return 'lowercase test';
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should handle location tracking with different file extensions', async () => {
  const code = `
    function testFunction() {
      return 'test';
    }
  `

  const jsFile = await transformCodeWithTracking(code, { filename: 'script.js' })
  const tsFile = await transformCodeWithTracking(code, { filename: 'module.ts' })

  expect(jsFile).toContain('trackFunctionCall("testFunction", "script.js:2")')
  expect(tsFile).toContain('trackFunctionCall("testFunction", "module.ts:2")')
})

test('TransformCodeWithTracking - should handle location tracking with complex file paths', async () => {
  const code = `
    function testFunction() {
      return 'test';
    }
  `

  const complexPath = await transformCodeWithTracking(code, {
    filename: 'src/components/utils/helper.js',
  })

  expect(complexPath).toContain('trackFunctionCall("testFunction", "src/components/utils/helper.js:2")')
})

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

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
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

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
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

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
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

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
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

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
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

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
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

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js', excludePatterns: ['private'] })
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

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
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
  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
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
  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })

  expect(transformed).toBe(code) // Should return original code
})

test('Transform Script - transformCode - should use default filename when not provided', async () => {
  const code = `
    function testFunction() {
      return 'test'
    }
  `

  const transformed = await transformCodeWithTracking(code)
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

test('Transform Script - transformCode - should transform IIFE (Immediately Invoked Function Expressions)', async () => {
  const code = `
    (function() {
      console.log('IIFE executed');
    })();

    (() => {
      console.log('Arrow IIFE executed');
    })();
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
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
(function () {
  trackFunctionCall("anonymous", "test.js:2");
  console.log('IIFE executed');
})();
(() => {
  trackFunctionCall("anonymous_arrow", "test.js:6");
  console.log('Arrow IIFE executed');
})();`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should transform Promise constructor callbacks', async () => {
  const code = `
    new Promise((resolve, reject) => {
      resolve('success');
    });

    new Promise(function(resolve, reject) {
      reject('error');
    });
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
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
new Promise((resolve, reject) => {
  trackFunctionCall("anonymous_arrow", "test.js:2");
  resolve('success');
});
new Promise(function (resolve, reject) {
  trackFunctionCall("anonymous", "test.js:6");
  reject('error');
});`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should transform async functions', async () => {
  const code = `
    async function asyncFunction() {
      return await fetch('/api/data');
    }

    const asyncArrow = async () => {
      return await Promise.resolve('async arrow');
    };
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
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
async function asyncFunction() {
  trackFunctionCall("asyncFunction", "test.js:2");
  return await fetch('/api/data');
}
const asyncArrow = async () => {
  trackFunctionCall("asyncArrow", "test.js:6");
  return await Promise.resolve('async arrow');
};`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should transform generator functions', async () => {
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
function* generatorFunction() {
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

test('Transform Script - transformCode - should transform computed property methods', async () => {
  const code = `
    const methodName = 'dynamicMethod';
    const obj = {
      [methodName]() {
        return 'computed method';
      },
      ['arrow' + 'Method']() {
        return 'computed arrow method';
      }
    };
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
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
const methodName = 'dynamicMethod';
const obj = {
  [methodName]() {
    return 'computed method';
  },
  ['arrow' + 'Method']() {
    return 'computed arrow method';
  }
};`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should transform Symbol methods', async () => {
  const code = `
    const obj = {
      [Symbol.iterator]() {
        return { next: () => ({ value: 1, done: false }) };
      },
      [Symbol.dispose]() {
        console.log('disposed');
      }
    };
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
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
  [Symbol.iterator]() {
    return {
      next: () => {
        trackFunctionCall("next", "test.js:4");
        return {
          value: 1,
          done: false
        };
      }
    };
  },
  [Symbol.dispose]() {
    console.log('disposed');
  }
};`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should transform class property methods', async () => {
  const code = `
    class TestClass {
      propertyMethod = () => {
        return 'class property arrow';
      };

      propertyFunction = function() {
        return 'class property function';
      };

      static staticMethod() {
        return 'static method';
      }

      static staticArrow = () => {
        return 'static arrow';
      }
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
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
  propertyMethod = () => {
    trackFunctionCall("propertyMethod", "test.js:3");
    return 'class property arrow';
  };
  propertyFunction = function () {
    trackFunctionCall("propertyFunction", "test.js:7");
    return 'class property function';
  };
  static staticMethod() {
    return 'static method';
  }
  static staticArrow = () => {
    trackFunctionCall("staticArrow", "test.js:15");
    return 'static arrow';
  };
}`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should transform nested functions', async () => {
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
function outerFunction() {
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

test('Transform Script - transformCode - should transform functions as parameters', async () => {
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
setTimeout(function () {
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

test('Transform Script - transformCode - should transform destructured parameter functions', async () => {
  const code = `
    function destructuredFunction({ a, b }, [c, d]) {
      return a + b + c + d;
    }

    const arrowDestructured = ({ x, y }) => x + y;
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
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
function destructuredFunction({
  a,
  b
}, [c, d]) {
  trackFunctionCall("destructuredFunction", "test.js:2");
  return a + b + c + d;
}
const arrowDestructured = ({
  x,
  y
}) => {
  trackFunctionCall("arrowDestructured", "test.js:6");
  return x + y;
};`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should transform functions with default parameters', async () => {
  const code = `
    function defaultParams(x = 10, y = 'default') {
      return x + y;
    }

    const arrowDefault = (a = 5, b = []) => a + b.length;
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
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
function defaultParams(x = 10, y = 'default') {
  trackFunctionCall("defaultParams", "test.js:2");
  return x + y;
}
const arrowDefault = (a = 5, b = []) => {
  trackFunctionCall("arrowDefault", "test.js:6");
  return a + b.length;
};`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should transform functions with rest parameters', async () => {
  const code = `
    function restParams(...args) {
      return args.join(', ');
    }

    const arrowRest = (first, ...rest) => rest.length;
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
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
function restParams(...args) {
  trackFunctionCall("restParams", "test.js:2");
  return args.join(', ');
}
const arrowRest = (first, ...rest) => {
  trackFunctionCall("arrowRest", "test.js:6");
  return rest.length;
};`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should transform functions with complex return statements', async () => {
  const code = `
    function complexReturn() {
      if (Math.random() > 0.5) {
        return 'success';
      } else {
        return 'failure';
      }
    }

    const arrowComplex = () => {
      try {
        return riskyOperation();
      } catch (error) {
        return null;
      }
    };
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'test.js' })
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
function complexReturn() {
  trackFunctionCall("complexReturn", "test.js:2");
  if (Math.random() > 0.5) {
    return 'success';
  } else {
    return 'failure';
  }
}
const arrowComplex = () => {
  trackFunctionCall("arrowComplex", "test.js:10");
  try {
    return riskyOperation();
  } catch (error) {
    return null;
  }
};`

  expect(transformed).toBe(expected)
})

// Edge cases and error handling tests
test('Transform Script - transformCode - should handle null/undefined input', async () => {
  const transformedNull = await transformCodeWithTracking(null as any)
  const transformedUndefined = await transformCodeWithTracking(undefined as any)

  expect(transformedNull).toContain('Function call tracking system')
  expect(transformedUndefined).toContain('Function call tracking system')
})

test('Transform Script - transformCode - should handle very large files', async () => {
  const largeCode = `
    function func${'1'.repeat(100)}() { return 'large'; }
    ${Array.from(
      { length: 100 },
      (_, i) => `
      function nested${i}() {
        function deeplyNested${i}() {
          return ${i};
        }
        return deeplyNested${i}();
      }
    `,
    ).join('')}
  `

  const transformed = await transformCodeWithTracking(largeCode, { filename: 'large.js' })

  expect(transformed).toContain('Function call tracking system')
  expect(transformed).toContain('trackFunctionCall')
  expect(transformed.length).toBeGreaterThan(largeCode.length)
})

test('Transform Script - transformCode - should handle Unicode and special characters', async () => {
  const code = `
    function 测试函数() {
      return 'Unicode test 🚀';
    }

    const emojiFunc = () => '🎉';

    function special$Chars$_123() {
      return 'special chars';
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'unicode.js' })

  expect(transformed).toContain('trackFunctionCall')
  expect(transformed).toContain('测试函数')
  expect(transformed).toContain('emojiFunc')
  expect(transformed).toContain('special$Chars$_123')
})

test('Transform Script - transformCode - should handle comments and directives', async () => {
  const code = `
    'use strict';

    /* This is a multi-line comment
       with function declarations inside
       function notARealFunction() {}
    */

    // Single line comment with function fakeFunction() {}

    function realFunction() {
      return 'real';
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'comments.js' })

  expect(transformed).toContain("'use strict'")
  expect(transformed).toContain('/* This is a multi-line comment')
  expect(transformed).toContain('// Single line comment')
  expect(transformed).toContain('trackFunctionCall("realFunction"')
  expect(transformed).not.toContain('trackFunctionCall("notARealFunction"')
  expect(transformed).not.toContain('trackFunctionCall("fakeFunction"')
})

test('Transform Script - transformCode - should handle template literals and complex expressions', async () => {
  const code = `
    function templateFunction() {
      const name = 'World';
      return \`Hello \${name}!\`;
    }

    const complexArrow = () => ({
      [computedKey]: () => 'nested computed',
      regular: function() { return 'regular'; }
    });
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'templates.js' })

  expect(transformed).toContain('trackFunctionCall("templateFunction"')
  expect(transformed).toContain('trackFunctionCall("complexArrow"')
  expect(transformed).toContain('trackFunctionCall("regular"')
})

test('Transform Script - transformCode - should handle regex and literals', async () => {
  const code = `
    function regexFunction() {
      const pattern = /test/gi;
      return pattern.test('test string');
    }

    function literalFunction() {
      return 42n; // BigInt literal
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'literals.js' })

  expect(transformed).toContain('trackFunctionCall("regexFunction"')
  expect(transformed).toContain('trackFunctionCall("literalFunction"')
  expect(transformed).toContain('/test/gi')
  expect(transformed).toContain('42n')
})

// TypeScript-specific syntax tests (treated as JS in transform)
test('Transform Script - transformCode - should handle TypeScript-like annotations', async () => {
  const code = `
    function typedFunction(param: string): number {
      return param.length;
    }

    const typedArrow = (x: number, y: number): string => {
      return (x + y).toString();
    };

    interface TestInterface {
      method(): void;
    }

    class GenericClass<T> {
      genericMethod(value: T): T {
        return value;
      }
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'typescript.ts' })

  expect(transformed).toContain('trackFunctionCall("typedFunction"')
  expect(transformed).toContain('trackFunctionCall("typedArrow"')
  expect(transformed).toContain('trackFunctionCall("genericMethod"')
  expect(transformed).toContain(': string')
  expect(transformed).toContain(': number')
  expect(transformed).toContain('<T>')
})

test('Transform Script - transformCode - should handle decorators and advanced TypeScript', async () => {
  const code = `
    @decorator
    class DecoratedClass {
      @logged
      decoratedMethod() {
        return 'decorated';
      }

      @deprecated
      deprecatedMethod(): never {
        throw new Error('Deprecated');
      }
    }

    function decorator(target: any) {
      return target;
    }

    function logged(target: any, key: string) {
      console.log(\`Logging \${key}\`);
    }

    function deprecated(target: any, key: string) {
      console.warn(\`\${key} is deprecated\`);
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'decorators.ts' })

  expect(transformed).toContain('trackFunctionCall("decorator"')
  expect(transformed).toContain('trackFunctionCall("logged"')
  expect(transformed).toContain('trackFunctionCall("deprecated"')
  expect(transformed).toContain('@decorator')
  expect(transformed).toContain('@logged')
  expect(transformed).toContain('@deprecated')
})

test('Transform Script - transformCode - should handle enums and namespaces', async () => {
  const code = `
    enum Color {
      Red = 'red',
      Green = 'green',
      Blue = 'blue'
    }

    namespace MyNamespace {
      export function namespaceFunction() {
        return 'namespace';
      }

      export const namespaceArrow = () => 'arrow';
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'enums.ts' })

  expect(transformed).toContain('trackFunctionCall("namespaceFunction"')
  expect(transformed).toContain('trackFunctionCall("namespaceArrow"')
  expect(transformed).toContain('enum Color')
  expect(transformed).toContain('namespace MyNamespace')
})

test('Transform Script - transformCode - should handle type aliases and utility types', async () => {
  const code = `
    type StringOrNumber = string | number;

    type Optional<T> = T | null;

    function genericFunction<T extends StringOrNumber>(value: T): Optional<T> {
      return value ?? null;
    }

    const utilityArrow = <U, V>(obj: Record<U, V>): U[] => {
      return Object.keys(obj) as U[];
    };
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'types.ts' })

  expect(transformed).toContain('trackFunctionCall("genericFunction"')
  expect(transformed).toContain('trackFunctionCall("utilityArrow"')
  expect(transformed).toContain('type StringOrNumber')
  expect(transformed).toContain('type Optional')
  expect(transformed).toContain('<T extends StringOrNumber>')
})

// Complex nested scenarios tests
test('Transform Script - transformCode - should handle deeply nested function structures', async () => {
  const code = `
    function level1() {
      function level2() {
        function level3() {
          function level4() {
            function level5() {
              return 'deeply nested';
            }
            return level5();
          }
          return level4();
        }
        return level3();
      }
      return level2();
    }

    const arrowNest = () => {
      const inner1 = () => {
        const inner2 = () => {
          const inner3 = () => 'arrow nested';
          return inner3();
        };
        return inner2();
      };
      return inner1();
    };
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'nested.js' })

  expect(transformed).toContain('trackFunctionCall("level1"')
  expect(transformed).toContain('trackFunctionCall("level2"')
  expect(transformed).toContain('trackFunctionCall("level3"')
  expect(transformed).toContain('trackFunctionCall("level4"')
  expect(transformed).toContain('trackFunctionCall("level5"')
  expect(transformed).toContain('trackFunctionCall("arrowNest"')
  expect(transformed).toContain('trackFunctionCall("inner1"')
  expect(transformed).toContain('trackFunctionCall("inner2"')
  expect(transformed).toContain('trackFunctionCall("inner3"')
})

test('Transform Script - transformCode - should handle complex class hierarchies', async () => {
  const code = `
    class Animal {
      constructor(name) {
        this.name = name;
      }

      speak() {
        return \`\${this.name} makes a sound\`;
      }
    }

    class Dog extends Animal {
      constructor(name, breed) {
        super(name);
        this.breed = breed;
      }

      speak() {
        return \`\${this.name} barks\`;
      }

      fetch() {
        return 'Fetching ball';
      }
    }

    class Cat extends Animal {
      constructor(name, color) {
        super(name);
        this.color = color;
      }

      speak() {
        return \`\${this.name} meows\`;
      }

      static purr() {
        return 'Purring';
      }
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'classes.js' })

  expect(transformed).toContain('trackFunctionCall("speak"')
  expect(transformed).toContain('trackFunctionCall("fetch"')
  expect(transformed).toContain('trackFunctionCall("purr"')
  expect(transformed).toContain('class Animal')
  expect(transformed).toContain('class Dog extends Animal')
  expect(transformed).toContain('class Cat extends Animal')
})

test('Transform Script - transformCode - should handle closures and lexical scoping', async () => {
  const code = `
    function outerClosure(outerParam) {
      const outerVar = 'outer';

      return function innerClosure(innerParam) {
        const innerVar = 'inner';

        return function deepestClosure(deepestParam) {
          return outerParam + outerVar + innerParam + innerVar + deepestParam;
        };
      };
    }

    function counterFactory() {
      let count = 0;

      return {
        increment: function() {
          count++;
          return count;
        },
        decrement: () => {
          count--;
          return count;
        },
        getCount: function() {
          return count;
        }
      };
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'closures.js' })

  expect(transformed).toContain('trackFunctionCall("outerClosure"')
  expect(transformed).toContain('trackFunctionCall("innerClosure"')
  expect(transformed).toContain('trackFunctionCall("deepestClosure"')
  expect(transformed).toContain('trackFunctionCall("counterFactory"')
  expect(transformed).toContain('trackFunctionCall("increment"')
  expect(transformed).toContain('trackFunctionCall("decrement"')
  expect(transformed).toContain('trackFunctionCall("getCount"')
})

test('Transform Script - transformCode - should handle higher-order functions and functional programming', async () => {
  const code = `
    function compose(f, g) {
      return function(x) {
        return f(g(x));
      };
    }

    function curry(fn) {
      return function curried(...args) {
        if (args.length >= fn.length) {
          return fn.apply(this, args);
        }
        return function(...nextArgs) {
          return curried.apply(this, args.concat(nextArgs));
        };
      };
    }

    const pipe = (...fns) => (value) =>
      fns.reduce((acc, fn) => fn(acc), value);

    function memoize(fn) {
      const cache = new Map();

      return function(...args) {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
          return cache.get(key);
        }

        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
      };
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'functional.js' })

  expect(transformed).toContain('trackFunctionCall("compose"')
  expect(transformed).toContain('trackFunctionCall("curry"')
  expect(transformed).toContain('trackFunctionCall("curried"')
  expect(transformed).toContain('trackFunctionCall("memoize"')
  expect(transformed).toContain('trackFunctionCall("pipe"')
})

test('Transform Script - transformCode - should handle recursive and mutually recursive functions', async () => {
  const code = `
    function factorial(n) {
      if (n <= 1) {
        return 1;
      }
      return n * factorial(n - 1);
    }

    function fibonacci(n) {
      if (n <= 1) {
        return n;
      }
      return fibonacci(n - 1) + fibonacci(n - 2);
    }

    // Mutually recursive functions
    function isEven(n) {
      if (n === 0) {
        return true;
      }
      return isOdd(n - 1);
    }

    function isOdd(n) {
      if (n === 0) {
        return false;
      }
      return isEven(n - 1);
    }

    // Recursive arrow function
    const sumRecursive = (arr, index = 0) => {
      if (index >= arr.length) {
        return 0;
      }
      return arr[index] + sumRecursive(arr, index + 1);
    };
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'recursive.js' })

  expect(transformed).toContain('trackFunctionCall("factorial"')
  expect(transformed).toContain('trackFunctionCall("fibonacci"')
  expect(transformed).toContain('trackFunctionCall("isEven"')
  expect(transformed).toContain('trackFunctionCall("isOdd"')
  expect(transformed).toContain('trackFunctionCall("sumRecursive"')
})

// Exclude patterns functionality tests
test('Transform Script - transformCode - should exclude functions matching multiple patterns', async () => {
  const code = `
    function publicFunction() {
      return 'public';
    }

    function privateHelper() {
      return 'private helper';
    }

    function _internalFunction() {
      return 'internal';
    }

    function $secretMethod() {
      return 'secret';
    }

    function testFunction() {
      return 'test';
    }
  `

  const transformed = await transformCodeWithTracking(code, {
    filename: 'exclude.js',
    excludePatterns: ['private', '_', '$', 'test'],
  })

  expect(transformed).toContain('trackFunctionCall("publicFunction"')
  expect(transformed).not.toContain('trackFunctionCall("privateHelper"')
  expect(transformed).not.toContain('trackFunctionCall("_internalFunction"')
  expect(transformed).not.toContain('trackFunctionCall("$secretMethod"')
  expect(transformed).not.toContain('trackFunctionCall("testFunction"')
})

test('Transform Script - transformCode - should handle empty exclude patterns array', async () => {
  const code = `
    function function1() { return '1'; }
    function function2() { return '2'; }
    const arrow = () => 'arrow';
  `

  const transformed = await transformCodeWithTracking(code, {
    filename: 'no-exclude.js',
    excludePatterns: [],
  })

  expect(transformed).toContain('trackFunctionCall("function1"')
  expect(transformed).toContain('trackFunctionCall("function2"')
  expect(transformed).toContain('trackFunctionCall("arrow"')
})

test('Transform Script - transformCode - should handle regex-like patterns in exclude', async () => {
  const code = `
    function handleEvent() {
      return 'event';
    }

    function handleClick() {
      return 'click';
    }

    function handleSubmit() {
      return 'submit';
    }

    function processData() {
      return 'data';
    }

    function validateInput() {
      return 'valid';
    }
  `

  const transformed = await transformCodeWithTracking(code, {
    filename: 'regex-exclude.js',
    excludePatterns: ['handle', 'process', 'validate'],
  })

  expect(transformed).not.toContain('trackFunctionCall("handleEvent"')
  expect(transformed).not.toContain('trackFunctionCall("handleClick"')
  expect(transformed).not.toContain('trackFunctionCall("handleSubmit"')
  expect(transformed).not.toContain('trackFunctionCall("processData"')
  expect(transformed).not.toContain('trackFunctionCall("validateInput"')
})

test('Transform Script - transformCode - should exclude methods in objects and classes', async () => {
  const code = `
    const obj = {
      publicMethod() {
        return 'public';
      },

      _privateMethod() {
        return 'private';
      },

      $secretMethod() {
        return 'secret';
      },

      testMethod() {
        return 'test';
      }
    };

    class TestClass {
      constructor() {
        this.value = 42;
      }

      publicClassMethod() {
        return this.value;
      }

      _privateClassMethod() {
        return 'private class method';
      }

      static testStatic() {
        return 'static test';
      }
    }
  `

  const transformed = await transformCodeWithTracking(code, {
    filename: 'exclude-methods.js',
    excludePatterns: ['_', '$', 'test'],
  })

  expect(transformed).toContain('trackFunctionCall("publicMethod"')
  expect(transformed).toContain('trackFunctionCall("publicClassMethod"')
  expect(transformed).not.toContain('trackFunctionCall("_privateMethod"')
  expect(transformed).not.toContain('trackFunctionCall("$secretMethod"')
  expect(transformed).not.toContain('trackFunctionCall("testMethod"')
  expect(transformed).not.toContain('trackFunctionCall("_privateClassMethod"')
  expect(transformed).not.toContain('trackFunctionCall("testStatic"')
})

test('Transform Script - transformCode - should handle case-sensitive exclude patterns', async () => {
  const code = `
    function TestFunction() {
      return 'uppercase test';
    }

    function testfunction() {
      return 'lowercase test';
    }

    function TESTFUNCTION() {
      return 'all caps test';
    }

    function TestFunction() {
      return 'mixed case test';
    }
  `

  const transformed = await transformCodeWithTracking(code, {
    filename: 'case-exclude.js',
    excludePatterns: ['test'],
  })

  expect(transformed).toContain('trackFunctionCall("TestFunction"')
  expect(transformed).not.toContain('trackFunctionCall("testfunction"')
  expect(transformed).toContain('trackFunctionCall("TESTFUNCTION"')
  expect(transformed).toContain('trackFunctionCall("TestFunction"')
})

// Location tracking options tests
test('Transform Script - transformCode - should include location information by default', async () => {
  const code = `
    function testFunction() {
      return 'test';
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'location-test.js' })

  expect(transformed).toContain('trackFunctionCall("testFunction", "location-test.js:2")')
})

test('Transform Script - transformCode - should handle includeLocation option explicitly', async () => {
  const code = `
    function testFunction() {
      return 'test';
    }
  `

  const transformedWithLocation = await transformCodeWithTracking(code, {
    filename: 'location-true.js',
    includeLocation: true,
  })

  const transformedWithoutLocation = await transformCodeWithTracking(code, {
    filename: 'location-false.js',
    includeLocation: false,
  })

  expect(transformedWithLocation).toContain('trackFunctionCall("testFunction", "location-true.js:2")')
  expect(transformedWithoutLocation).toContain('trackFunctionCall("testFunction")')
  expect(transformedWithoutLocation).not.toContain('trackFunctionCall("testFunction",')
})

test('Transform Script - transformCode - should handle location tracking with different file extensions', async () => {
  const code = `
    function testFunction() {
      return 'test';
    }
  `

  const jsFile = await transformCodeWithTracking(code, { filename: 'script.js' })
  const tsFile = await transformCodeWithTracking(code, { filename: 'module.ts' })
  const jsxFile = await transformCodeWithTracking(code, { filename: 'component.jsx' })
  const tsxFile = await transformCodeWithTracking(code, { filename: 'component.tsx' })
  const mjsFile = await transformCodeWithTracking(code, { filename: 'module.mjs' })

  expect(jsFile).toContain('trackFunctionCall("testFunction", "script.js:2")')
  expect(tsFile).toContain('trackFunctionCall("testFunction", "module.ts:2")')
  expect(jsxFile).toContain('trackFunctionCall("testFunction", "component.jsx:2")')
  expect(tsxFile).toContain('trackFunctionCall("testFunction", "component.tsx:2")')
  expect(mjsFile).toContain('trackFunctionCall("testFunction", "module.mjs:2")')
})

test('Transform Script - transformCode - should handle location tracking with complex file paths', async () => {
  const code = `
    function testFunction() {
      return 'test';
    }
  `

  const complexPath = await transformCodeWithTracking(code, {
    filename: 'src/components/utils/helper.js',
  })

  const nestedPath = await transformCodeWithTracking(code, {
    filename: '/home/user/project/lib/module.ts',
  })

  const relativePath = await transformCodeWithTracking(code, {
    filename: './dist/bundle.min.js',
  })

  expect(complexPath).toContain('trackFunctionCall("testFunction", "src/components/utils/helper.js:2")')
  expect(nestedPath).toContain('trackFunctionCall("testFunction", "/home/user/project/lib/module.ts:2")')
  expect(relativePath).toContain('trackFunctionCall("testFunction", "./dist/bundle.min.js:2")')
})

test('Transform Script - transformCode - should handle location tracking with special characters in filename', async () => {
  const code = `
    function testFunction() {
      return 'test';
    }
  `

  const spacesFile = await transformCodeWithTracking(code, { filename: 'file with spaces.js' })
  const unicodeFile = await transformCodeWithTracking(code, { filename: 'файл.js' })
  const emojiFile = await transformCodeWithTracking(code, { filename: '🚀launch.js' })

  expect(spacesFile).toContain('trackFunctionCall("testFunction", "file with spaces.js:2")')
  expect(unicodeFile).toContain('trackFunctionCall("testFunction", "файл.js:2")')
  expect(emojiFile).toContain('trackFunctionCall("testFunction", "🚀launch.js:2")')
})

test('Transform Script - transformCode - should handle location tracking with multiple functions', async () => {
  const code = `
    function firstFunction() {
      return 'first';
    }

    const secondFunction = () => {
      return 'second';
    };

    function thirdFunction() {
      return 'third';
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'multi-location.js' })

  expect(transformed).toContain('trackFunctionCall("firstFunction", "multi-location.js:2")')
  expect(transformed).toContain('trackFunctionCall("secondFunction", "multi-location.js:7")')
  expect(transformed).toContain('trackFunctionCall("thirdFunction", "multi-location.js:12")')
})

// Additional edge case tests
test('Transform Script - transformCode - should handle functions with special characters in names', async () => {
  const code = `
    function $jquery() {
      return 'jquery';
    }

    function _private() {
      return 'private';
    }

    function camelCase() {
      return 'camelCase';
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'special-chars.js' })

  expect(transformed).toContain('trackFunctionCall("$jquery"')
  expect(transformed).toContain('trackFunctionCall("_private"')
  expect(transformed).toContain('trackFunctionCall("camelCase"')
})

test('Transform Script - transformCode - should handle functions with Unicode characters', async () => {
  const code = `
    function español() {
      return 'español';
    }

    function русский() {
      return 'русский';
    }

    function 日本語() {
      return '日本語';
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'unicode.js' })

  expect(transformed).toContain('trackFunctionCall("español"')
  expect(transformed).toContain('trackFunctionCall("русский"')
  expect(transformed).toContain('trackFunctionCall("日本語"')
})

test('Transform Script - transformCode - should handle mixed function types in same scope', async () => {
  const code = `
    function declaration() {
      return 'declaration';
    }

    const expression = function() {
      return 'expression';
    };

    const arrow = () => {
      return 'arrow';
    };

    const concise = x => x * 2;

    class TestClass {
      method() {
        return 'method';
      }

      static staticMethod() {
        return 'static';
      }
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'mixed.js' })

  expect(transformed).toContain('trackFunctionCall("declaration"')
  expect(transformed).toContain('trackFunctionCall("expression"')
  expect(transformed).toContain('trackFunctionCall("arrow"')
  expect(transformed).toContain('trackFunctionCall("concise"')
  expect(transformed).toContain('trackFunctionCall("method"')
  expect(transformed).toContain('trackFunctionCall("staticMethod"')
})

test('Transform Script - transformCode - should handle functions in various contexts', async () => {
  const code = `
    // Global scope
    function globalFunction() {
      return 'global';
    }

    // Object property
    const obj = {
      propertyFunction: function() {
        return 'property';
      },

      propertyArrow: () => {
        return 'arrow property';
      },

      method() {
        return 'method';
      }
    };

    // Array methods
    const arr = [1, 2, 3].map(function(item) {
      return item * 2;
    });

    const arr2 = [4, 5, 6].filter(item => item > 4);

    // Callback
    setTimeout(function() {
      console.log('timeout');
    }, 1000);
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'contexts.js' })

  expect(transformed).toContain('trackFunctionCall("globalFunction"')
  expect(transformed).toContain('trackFunctionCall("propertyFunction"')
  expect(transformed).toContain('trackFunctionCall("propertyArrow"')
  expect(transformed).toContain('trackFunctionCall("method"')
  expect(transformed).toContain('trackFunctionCall("anonymous"') // For map callback
  expect(transformed).toContain('trackFunctionCall("anonymous_arrow"') // For filter callback
  expect(transformed).toContain('trackFunctionCall("anonymous"') // For setTimeout callback
})

test('Transform Script - transformCode - should handle complex parameter patterns', async () => {
  const code = `
    function simpleParams(a, b, c) {
      return a + b + c;
    }

    function defaultParams(x = 10, y = 'default') {
      return x + y;
    }

    function restParams(first, ...rest) {
      return rest.length;
    }

    function destructuredParams({ a, b }, [c, d]) {
      return a + b + c + d;
    }

    const arrowWithParams = (x, y = 5, ...z) => x + y + z.length;
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'params.js' })

  expect(transformed).toContain('trackFunctionCall("simpleParams"')
  expect(transformed).toContain('trackFunctionCall("defaultParams"')
  expect(transformed).toContain('trackFunctionCall("restParams"')
  expect(transformed).toContain('trackFunctionCall("destructuredParams"')
  expect(transformed).toContain('trackFunctionCall("arrowWithParams"')
})

test('Transform Script - transformCode - should handle async and generator functions', async () => {
  const code = `
    async function asyncFunction() {
      return await Promise.resolve('async');
    }

    const asyncArrow = async () => {
      return await fetch('/api/data');
    };

    function* generatorFunction() {
      yield 1;
      yield 2;
      yield 3;
    }

    const generatorArrow = function*() {
      yield 'arrow generator';
    };

    async function* asyncGenerator() {
      yield await Promise.resolve(1);
      yield await Promise.resolve(2);
    }
  `

  const transformed = await transformCodeWithTracking(code, { filename: 'async-generator.js' })

  expect(transformed).toContain('trackFunctionCall("asyncFunction"')
  expect(transformed).toContain('trackFunctionCall("asyncArrow"')
  expect(transformed).toContain('trackFunctionCall("generatorFunction"')
  expect(transformed).toContain('trackFunctionCall("generatorArrow"')
  expect(transformed).toContain('trackFunctionCall("asyncGenerator"')
})
