import { test, expect } from '@jest/globals'
import { transformCodeWithTracking } from '../src/parts/TransformCodeWithTracking/TransformCodeWithTracking.js'

test('TransformCodeWithTracking - should transform function declarations', () => {
  const code = `
    function testFunction() {
      return 'test'
    }
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `function testFunction() {
  trackFunctionCall("testFunction", "test.js:2");
  return 'test';
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform arrow functions', () => {
  const code = `
    const arrowFunction = () => {
      return 'arrow'
    }
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `const arrowFunction = () => {
  trackFunctionCall("arrowFunction", "test.js:2");
  return 'arrow';
};`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform concise arrow functions', () => {
  const code = `
    const conciseArrow = x => x * 2
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `const conciseArrow = x => {
  trackFunctionCall("conciseArrow", "test.js:2");
  return x * 2;
};`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform function expressions', () => {
  const code = `
    const funcExpression = function() {
      return 'expression'
    }
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `const funcExpression = function () {
  trackFunctionCall("funcExpression", "test.js:2");
  return 'expression';
};`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform object methods', () => {
  const code = `
    const obj = {
      method() {
        return 'method'
      },

      arrowMethod: () => 'arrow method'
    }
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('TransformCodeWithTracking - should transform class methods', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `class TestClass {
  constructor() {
    this.value = 42;
  }
  classMethod() {
    trackFunctionCall("classMethod", "test.js:7");
    return this.value;
  }
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should exclude functions matching exclude patterns', () => {
  const code = `
    function testFunction() {
      return 'test'
    }

    function privateHelper() {
      return 'helper'
    }
  `

  const transformed = transformCodeWithTracking(code, {
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

test('TransformCodeWithTracking - should not transform tracking functions themselves', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('TransformCodeWithTracking - should handle empty code', () => {
  const code = ''
  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
  expect(transformed).toBe('')
})

test('TransformCodeWithTracking - should handle invalid code gracefully', () => {
  const code = 'invalid javascript syntax {{{'
  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })

  expect(transformed).toBe(code) // Should return original code
})

test('TransformCodeWithTracking - should use default filename when not provided', () => {
  const code = `
    function testFunction() {
      return 'test'
    }
  `

  const transformed = transformCodeWithTracking(code)
  const expected = `function testFunction() {
  trackFunctionCall("testFunction", "unknown:2");
  return 'test';
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform IIFE (Immediately Invoked Function Expressions)', () => {
  const code = `
    (function() {
      console.log('IIFE executed');
    })();

    (() => {
      console.log('Arrow IIFE executed');
    })();
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('TransformCodeWithTracking - should transform Promise constructor callbacks', () => {
  const code = `
    new Promise((resolve, reject) => {
      resolve('success');
    });

    new Promise(function(resolve, reject) {
      reject('error');
    });
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('TransformCodeWithTracking - should transform async functions', () => {
  const code = `
    async function asyncFunction() {
      return await fetch('/api/data');
    }

    const asyncArrow =  () => {
      return await Promise.resolve('async arrow');
    };
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
  const expected = `async function asyncFunction() {
  trackFunctionCall("asyncFunction", "test.js:2");
  return await fetch('/api/data');
}
const asyncArrow =  () => {
  trackFunctionCall("asyncArrow", "test.js:6");
  return await Promise.resolve('async arrow');
};`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform generator functions', () => {
  const code = `
    function* generatorFunction() {
      yield 1;
      yield 2;
    }

    const generatorArrow = function*() {
      yield 'arrow generator';
    };
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('TransformCodeWithTracking - should transform nested functions', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('TransformCodeWithTracking - should transform functions as parameters', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('TransformCodeWithTracking - should transform destructured parameter functions', () => {
  const code = `
    function destructuredFunction({ a, b }, [c, d]) {
      return a + b + c + d;
    }

    const arrowDestructured = ({ x, y }) => x + y;
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('TransformCodeWithTracking - should transform functions with default parameters', () => {
  const code = `
    function defaultParams(x = 10, y = 'default') {
      return x + y;
    }

    const arrowDefault = (a = 5, b = []) => a + b.length;
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('TransformCodeWithTracking - should transform functions with rest parameters', () => {
  const code = `
    function restParams(...args) {
      return args.join(', ');
    }

    const arrowRest = (first, ...rest) => rest.length;
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('TransformCodeWithTracking - should transform functions with complex return statements', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('TransformCodeWithTracking - should handle Unicode and special characters', () => {
  const code = `
    function 测试函数() {
      return 'Unicode test 🚀';
    }

    const emojiFunc = () => '🎉';

    function special$Chars$_123() {
      return 'special chars';
    }
  `

  const transformed = transformCodeWithTracking(code, { filename: 'unicode.js' })
  const expected = `function 测试函数() {
  trackFunctionCall("\\u6D4B\\u8BD5\\u51FD\\u6570", "unicode.js:2");
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

test('TransformCodeWithTracking - should handle comments and directives', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'comments.js' })
  const expected = `'use strict';

/* This is a multi-line comment
   with function declarations inside
   function notARealFunction() {}
*/

// Single line comment with function fakeFunction() {}
function realFunction() {
  trackFunctionCall("realFunction", "comments.js:11");
  return 'real';
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should handle template literals and complex expressions', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'templates.js' })
  const expected = `function templateFunction() {
  trackFunctionCall("templateFunction", "templates.js:2");
  const name = 'World';
  return \`Hello \${name}!\`;
}
const complexArrow = () => {
  trackFunctionCall("complexArrow", "templates.js:7");
  return {
    [computedKey]: () => {
      trackFunctionCall("computedKey", "templates.js:8");
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

test('TransformCodeWithTracking - should handle regex and literals', () => {
  const code = `
    function regexFunction() {
      const pattern = /test/gi;
      return pattern.test('test string');
    }

    function literalFunction() {
      return 42n; // BigInt literal
    }
  `

  const transformed = transformCodeWithTracking(code, { filename: 'literals.js' })
  const expected = `function regexFunction() {
  trackFunctionCall("regexFunction", "literals.js:2");
  const pattern = /test/gi;
  return pattern.test('test string');
}
function literalFunction() {
  trackFunctionCall("literalFunction", "literals.js:7");
  return 42n; // BigInt literal
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should handle TypeScript-like annotations', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'typescript.ts' })
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

test('TransformCodeWithTracking - should handle deeply nested function structures', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'nested.js' })
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

test('TransformCodeWithTracking - should handle complex class hierarchies', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'classes.js' })
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

test('TransformCodeWithTracking - should handle closures and lexical scoping', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'closures.js' })
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

test('TransformCodeWithTracking - should handle higher-order functions and functional programming', () => {
  const code = `
    function compose(f, g) {
      return function(x) {
        return f(g(x));
      };
    }

    const pipe = (...fns) => (value) =>
      fns.reduce((acc, fn) => fn(acc), value);
  `

  const transformed = transformCodeWithTracking(code, { filename: 'functional.js' })
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

test('TransformCodeWithTracking - should handle recursive and mutually recursive functions', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'recursive.js' })
  const expected = `function factorial(n) {
  trackFunctionCall("factorial", "recursive.js:2");
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

// Recursive arrow function
const sumRecursive = (arr, index = 0) => {
  trackFunctionCall("sumRecursive", "recursive.js:10");
  if (index >= arr.length) {
    return 0;
  }
  return arr[index] + sumRecursive(arr, index + 1);
};`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should exclude functions matching multiple patterns', () => {
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

  const transformed = transformCodeWithTracking(code, {
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

test('TransformCodeWithTracking - should handle regex-like patterns in exclude', () => {
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

  const transformed = transformCodeWithTracking(code, {
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

test('TransformCodeWithTracking - should exclude methods in objects and classes', () => {
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

  const transformed = transformCodeWithTracking(code, {
    filename: 'exclude-methods.js',
    excludePatterns: ['_'],
  })

  const expected = `const obj = {
  publicMethod() {
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

test('TransformCodeWithTracking - should handle case-sensitive exclude patterns', () => {
  const code = `
    function TestFunction() {
      return 'uppercase test';
    }

    function testfunction() {
      return 'lowercase test';
    }
  `

  const transformed = transformCodeWithTracking(code, {
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

test('TransformCodeWithTracking - should handle location tracking with different file extensions', () => {
  const code = `
    function testFunction() {
      return 'test';
    }
  `

  const jsFile = transformCodeWithTracking(code, { filename: 'script.js' })
  const expected = `function testFunction() {
  trackFunctionCall("testFunction", "script.js:2");
  return 'test';
}`

  expect(jsFile).toBe(expected)
})

test('TransformCodeWithTracking - should handle location tracking with complex file paths', () => {
  const code = `
    function testFunction() {
      return 'test';
    }
  `

  const complexPath = transformCodeWithTracking(code, {
    filename: 'src/components/utils/helper.js',
  })
  const expected = `function testFunction() {
  trackFunctionCall("testFunction", "src/components/utils/helper.js:2");
  return 'test';
}`

  expect(complexPath).toBe(expected)
})

test('Transform Script - transformCode - should transform function declarations', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('Transform Script - transformCode - should transform arrow functions', () => {
  const code = `
    const arrowFunction = () => {
      return 'arrow'
    }
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('Transform Script - transformCode - should transform concise arrow functions', () => {
  const code = `
    const conciseArrow = x => x * 2
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('Transform Script - transformCode - should transform function expressions', () => {
  const code = `
    const funcExpression = function() {
      return 'expression'
    }
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('Transform Script - transformCode - should transform object methods', () => {
  const code = `
    const obj = {
      method() {
        return 'method'
      },

      arrowMethod: () => 'arrow method'
    }
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('Transform Script - transformCode - should transform class methods', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('Transform Script - transformCode - should exclude functions matching exclude patterns', () => {
  const code = `
    function testFunction() {
      return 'test'
    }

    function privateHelper() {
      return 'helper'
    }
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js', excludePatterns: ['private'] })
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

test('Transform Script - transformCode - should not transform tracking functions themselves', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('Transform Script - transformCode - should handle empty code', () => {
  const code = ''
  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('Transform Script - transformCode - should handle invalid code gracefully', () => {
  const code = 'invalid javascript syntax {{{'
  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })

  expect(transformed).toBe(code) // Should return original code
})

test('Transform Script - transformCode - should use default filename when not provided', () => {
  const code = `
    function testFunction() {
      return 'test'
    }
  `

  const transformed = transformCodeWithTracking(code)
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

test('Transform Script - transformCode - should transform IIFE (Immediately Invoked Function Expressions)', () => {
  const code = `
    (function() {
      console.log('IIFE executed');
    })();

    (() => {
      console.log('Arrow IIFE executed');
    })();
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('Transform Script - transformCode - should transform Promise constructor callbacks', () => {
  const code = `
    new Promise((resolve, reject) => {
      resolve('success');
    });

    new Promise(function(resolve, reject) {
      reject('error');
    });
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('Transform Script - transformCode - should transform async functions', () => {
  const code = `
    async function asyncFunction() {
      return await fetch('/api/data');
    }

    const asyncArrow =  () => {
      return await Promise.resolve('async arrow');
    };
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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
const asyncArrow =  () => {
  trackFunctionCall("asyncArrow", "test.js:6");
  return await Promise.resolve('async arrow');
};`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should transform generator functions', () => {
  const code = `
    function* generatorFunction() {
      yield 1;
      yield 2;
    }

    const generatorArrow = function*() {
      yield 'arrow generator';
    };
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('Transform Script - transformCode - should transform computed property methods', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('Transform Script - transformCode - should transform Symbol methods', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('Transform Script - transformCode - should transform class property methods', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('Transform Script - transformCode - should transform nested functions', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('Transform Script - transformCode - should transform functions as parameters', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('Transform Script - transformCode - should transform destructured parameter functions', () => {
  const code = `
    function destructuredFunction({ a, b }, [c, d]) {
      return a + b + c + d;
    }

    const arrowDestructured = ({ x, y }) => x + y;
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('Transform Script - transformCode - should transform functions with default parameters', () => {
  const code = `
    function defaultParams(x = 10, y = 'default') {
      return x + y;
    }

    const arrowDefault = (a = 5, b = []) => a + b.length;
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('Transform Script - transformCode - should transform functions with rest parameters', () => {
  const code = `
    function restParams(...args) {
      return args.join(', ');
    }

    const arrowRest = (first, ...rest) => rest.length;
  `

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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

test('Transform Script - transformCode - should transform functions with complex return statements', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'test.js' })
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
test('Transform Script - transformCode - should handle null/undefined input', () => {
  const transformedNull = transformCodeWithTracking(null as any)
  expect(transformedNull).toBe('Function call tracking system')
})

test('Transform Script - transformCode - should handle very large files', () => {
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

  const transformed = transformCodeWithTracking(largeCode, { filename: 'large.js' })

  expect(transformed).toBe('trackFunctionCall')
})

test('Transform Script - transformCode - should handle Unicode and special characters', () => {
  const code = `
    function 测试函数() {
      return 'Unicode test 🚀';
    }

    const emojiFunc = () => '🎉';

    function special$Chars$_123() {
      return 'special chars';
    }
  `

  const transformed = transformCodeWithTracking(code, { filename: 'unicode.js' })
  const expected = `function 测试函数() {
  trackFunctionCall("\\u6D4B\\u8BD5\\u51FD\\u6570", "unicode.js:2");
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

test('Transform Script - transformCode - should handle comments and directives', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'comments.js' })

  expect(transformed).toBe("'use strict'")
})

test('Transform Script - transformCode - should handle template literals and complex expressions', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'templates.js' })

  expect(transformed).toBe('trackFunctionCall("templateFunction"')
  expect(transformed).toBe('trackFunctionCall("complexArrow"')
  expect(transformed).toBe('trackFunctionCall("regular"')
})

test('Transform Script - transformCode - should handle regex and literals', () => {
  const code = `
    function regexFunction() {
      const pattern = /test/gi;
      return pattern.test('test string');
    }

    function literalFunction() {
      return 42n; // BigInt literal
    }
  `

  const transformed = transformCodeWithTracking(code, { filename: 'literals.js' })

  expect(transformed).toBe('trackFunctionCall("regexFunction"')
  expect(transformed).toBe('trackFunctionCall("literalFunction"')
  expect(transformed).toBe('/test/gi')
  expect(transformed).toBe('42n')
})

// TypeScript-specific syntax tests (treated as JS in transform)
test('Transform Script - transformCode - should handle TypeScript-like annotations', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'typescript.ts' })

  expect(transformed).toBe('trackFunctionCall("typedFunction"')
  expect(transformed).toBe('trackFunctionCall("typedArrow"')
  expect(transformed).toBe('trackFunctionCall("genericMethod"')
  expect(transformed).toBe(': string')
  expect(transformed).toBe(': number')
  expect(transformed).toBe('<T>')
})

test('Transform Script - transformCode - should handle decorators and advanced TypeScript', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'decorators.ts' })

  expect(transformed).toBe('trackFunctionCall("decorator"')
  expect(transformed).toBe('trackFunctionCall("logged"')
  expect(transformed).toBe('trackFunctionCall("deprecated"')
  expect(transformed).toBe('@decorator')
  expect(transformed).toBe('@logged')
  expect(transformed).toBe('@deprecated')
})

test('Transform Script - transformCode - should handle enums and namespaces', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'enums.ts' })

  expect(transformed).toBe('trackFunctionCall("namespaceFunction"')
  expect(transformed).toBe('trackFunctionCall("namespaceArrow"')
  expect(transformed).toBe('enum Color')
  expect(transformed).toBe('namespace MyNamespace')
})

test('Transform Script - transformCode - should handle type aliases and utility types', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'types.ts' })

  expect(transformed).toBe('trackFunctionCall("genericFunction"')
  expect(transformed).toBe('trackFunctionCall("utilityArrow"')
  expect(transformed).toBe('type StringOrNumber')
  expect(transformed).toBe('type Optional')
  expect(transformed).toBe('<T extends StringOrNumber>')
})

// Complex nested scenarios tests
test('Transform Script - transformCode - should handle deeply nested function structures', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'nested.js' })

  expect(transformed).toBe('trackFunctionCall("level1"')
  expect(transformed).toBe('trackFunctionCall("level2"')
  expect(transformed).toBe('trackFunctionCall("level3"')
  expect(transformed).toBe('trackFunctionCall("level4"')
  expect(transformed).toBe('trackFunctionCall("level5"')
  expect(transformed).toBe('trackFunctionCall("arrowNest"')
  expect(transformed).toBe('trackFunctionCall("inner1"')
  expect(transformed).toBe('trackFunctionCall("inner2"')
  expect(transformed).toBe('trackFunctionCall("inner3"')
})

test('Transform Script - transformCode - should handle complex class hierarchies', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'classes.js' })

  expect(transformed).toBe('trackFunctionCall("speak"')
  expect(transformed).toBe('trackFunctionCall("fetch"')
  expect(transformed).toBe('trackFunctionCall("purr"')
  expect(transformed).toBe('class Animal')
  expect(transformed).toBe('class Dog extends Animal')
  expect(transformed).toBe('class Cat extends Animal')
})

test('Transform Script - transformCode - should handle closures and lexical scoping', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'closures.js' })

  expect(transformed).toBe('trackFunctionCall("outerClosure"')
  expect(transformed).toBe('trackFunctionCall("innerClosure"')
  expect(transformed).toBe('trackFunctionCall("deepestClosure"')
  expect(transformed).toBe('trackFunctionCall("counterFactory"')
  expect(transformed).toBe('trackFunctionCall("increment"')
  expect(transformed).toBe('trackFunctionCall("decrement"')
  expect(transformed).toBe('trackFunctionCall("getCount"')
})

test('Transform Script - transformCode - should handle higher-order functions and functional programming', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'functional.js' })

  expect(transformed).toBe('trackFunctionCall("compose"')
  expect(transformed).toBe('trackFunctionCall("curry"')
  expect(transformed).toBe('trackFunctionCall("curried"')
  expect(transformed).toBe('trackFunctionCall("memoize"')
  expect(transformed).toBe('trackFunctionCall("pipe"')
})

test('Transform Script - transformCode - should handle recursive and mutually recursive functions', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'recursive.js' })

  expect(transformed).toBe('trackFunctionCall("factorial"')
  expect(transformed).toBe('trackFunctionCall("fibonacci"')
  expect(transformed).toBe('trackFunctionCall("isEven"')
  expect(transformed).toBe('trackFunctionCall("isOdd"')
  expect(transformed).toBe('trackFunctionCall("sumRecursive"')
})

// Exclude patterns functionality tests
test('Transform Script - transformCode - should exclude functions matching multiple patterns', () => {
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

  const transformed = transformCodeWithTracking(code, {
    filename: 'exclude.js',
    excludePatterns: ['private', '_', '$', 'test'],
  })

  expect(transformed).toBe('trackFunctionCall("publicFunction"')
  expect(transformed).not.toBe('trackFunctionCall("privateHelper"')
  expect(transformed).not.toBe('trackFunctionCall("_internalFunction"')
  expect(transformed).not.toBe('trackFunctionCall("$secretMethod"')
  expect(transformed).not.toBe('trackFunctionCall("testFunction"')
})

test('Transform Script - transformCode - should handle empty exclude patterns array', () => {
  const code = `
    function function1() { return '1'; }
    function function2() { return '2'; }
    const arrow = () => 'arrow';
  `

  const transformed = transformCodeWithTracking(code, {
    filename: 'no-exclude.js',
    excludePatterns: [],
  })

  expect(transformed).toBe('trackFunctionCall("function1"')
  expect(transformed).toBe('trackFunctionCall("function2"')
  expect(transformed).toBe('trackFunctionCall("arrow"')
})

test('Transform Script - transformCode - should handle regex-like patterns in exclude', () => {
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

  const transformed = transformCodeWithTracking(code, {
    filename: 'regex-exclude.js',
    excludePatterns: ['handle', 'process', 'validate'],
  })

  expect(transformed).not.toBe('trackFunctionCall("handleEvent"')
  expect(transformed).not.toBe('trackFunctionCall("handleClick"')
  expect(transformed).not.toBe('trackFunctionCall("handleSubmit"')
  expect(transformed).not.toBe('trackFunctionCall("processData"')
  expect(transformed).not.toBe('trackFunctionCall("validateInput"')
})

test('Transform Script - transformCode - should exclude methods in objects and classes', () => {
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

  const transformed = transformCodeWithTracking(code, {
    filename: 'exclude-methods.js',
    excludePatterns: ['_', '$', 'test'],
  })

  expect(transformed).toBe('trackFunctionCall("publicMethod"')
  expect(transformed).toBe('trackFunctionCall("publicClassMethod"')
  expect(transformed).not.toBe('trackFunctionCall("_privateMethod"')
  expect(transformed).not.toBe('trackFunctionCall("$secretMethod"')
  expect(transformed).not.toBe('trackFunctionCall("testMethod"')
  expect(transformed).not.toBe('trackFunctionCall("_privateClassMethod"')
  expect(transformed).not.toBe('trackFunctionCall("testStatic"')
})

test('Transform Script - transformCode - should handle case-sensitive exclude patterns', () => {
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

  const transformed = transformCodeWithTracking(code, {
    filename: 'case-exclude.js',
    excludePatterns: ['test'],
  })

  expect(transformed).toBe('trackFunctionCall("TestFunction"')
  expect(transformed).not.toBe('trackFunctionCall("testfunction"')
  expect(transformed).toBe('trackFunctionCall("TESTFUNCTION"')
  expect(transformed).toBe('trackFunctionCall("TestFunction"')
})

// Location tracking options tests
test('Transform Script - transformCode - should include location information by default', () => {
  const code = `
    function testFunction() {
      return 'test';
    }
  `

  const transformed = transformCodeWithTracking(code, { filename: 'location-test.js' })

  expect(transformed).toBe('trackFunctionCall("testFunction", "location-test.js:2")')
})

test('Transform Script - transformCode - should handle includeLocation option explicitly', () => {
  const code = `
    function testFunction() {
      return 'test';
    }
  `

  const transformedWithLocation = transformCodeWithTracking(code, {
    filename: 'location-true.js',
    includeLocation: true,
  })

  expect(transformedWithLocation).toBe('trackFunctionCall("testFunction", "location-true.js:2")')
})

test('Transform Script - transformCode - should handle location tracking with different file extensions', () => {
  const code = `
    function testFunction() {
      return 'test';
    }
  `

  const jsFile = transformCodeWithTracking(code, { filename: 'script.js' })

  expect(jsFile).toBe('trackFunctionCall("testFunction", "script.js:2")')
})

test('Transform Script - transformCode - should handle location tracking with complex file paths', () => {
  const code = `
    function testFunction() {
      return 'test';
    }
  `

  const complexPath = transformCodeWithTracking(code, {
    filename: 'src/components/utils/helper.js',
  })

  const nestedPath = transformCodeWithTracking(code, {
    filename: '/home/user/project/lib/module.ts',
  })

  const relativePath = transformCodeWithTracking(code, {
    filename: './dist/bundle.min.js',
  })

  expect(complexPath).toBe('trackFunctionCall("testFunction", "src/components/utils/helper.js:2")')
})

test('Transform Script - transformCode - should handle location tracking with special characters in filename', () => {
  const code = `
    function testFunction() {
      return 'test';
    }
  `

  const spacesFile = transformCodeWithTracking(code, { filename: 'file with spaces.js' })

  expect(spacesFile).toBe('trackFunctionCall("testFunction", "file with spaces.js:2")')
})

test('Transform Script - transformCode - should handle location tracking with multiple functions', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'multi-location.js' })

  expect(transformed).toBe('trackFunctionCall("firstFunction", "multi-location.js:2")')
})

// Additional edge case tests
test('Transform Script - transformCode - should handle functions with special characters in names', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'special-chars.js' })

  expect(transformed).toBe('trackFunctionCall("$jquery"')
})

test('Transform Script - transformCode - should handle functions with Unicode characters', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'unicode.js' })

  expect(transformed).toBe('trackFunctionCall("español"')
  expect(transformed).toBe('trackFunctionCall("русский"')
  expect(transformed).toBe('trackFunctionCall("日本語"')
})

test('Transform Script - transformCode - should handle mixed function types in same scope', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'mixed.js' })
  const expected = `function declaration() {
  trackFunctionCall("declaration", "mixed.js:2");
  return 'declaration';
}
const expression = function () {
  trackFunctionCall("expression", "mixed.js:6");
  return 'expression';
};
const arrow = () => {
  trackFunctionCall("arrow", "mixed.js:10");
  return 'arrow';
};
const concise = x => {
  trackFunctionCall("concise", "mixed.js:14");
  return x * 2;
};
class TestClass {
  method() {
    trackFunctionCall("method", "mixed.js:17");
    return 'method';
  }
  static staticMethod() {
    trackFunctionCall("staticMethod", "mixed.js:21");
    return 'static';
  }
}`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should handle functions in various contexts', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'contexts.js' })

  expect(transformed).toBe('trackFunctionCall("globalFunction"')
  expect(transformed).toBe('trackFunctionCall("propertyFunction"')
  expect(transformed).toBe('trackFunctionCall("propertyArrow"')
  expect(transformed).toBe('trackFunctionCall("method"')
  expect(transformed).toBe('trackFunctionCall("anonymous"') // For map callback
  expect(transformed).toBe('trackFunctionCall("anonymous_arrow"') // For filter callback
  expect(transformed).toBe('trackFunctionCall("anonymous"') // For setTimeout callback
})

test('Transform Script - transformCode - should handle complex parameter patterns', () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'params.js' })

  expect(transformed).toBe('trackFunctionCall("simpleParams"')
  expect(transformed).toBe('trackFunctionCall("defaultParams"')
  expect(transformed).toBe('trackFunctionCall("restParams"')
  expect(transformed).toBe('trackFunctionCall("destructuredParams"')
  expect(transformed).toBe('trackFunctionCall("arrowWithParams"')
})

test('Transform Script - transformCode - should handle async and generator functions', () => {
  const code = `
    async function asyncFunction() {
      return await Promise.resolve('async');
    }

    const asyncArrow =  () => {
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

  const transformed = transformCodeWithTracking(code, { filename: 'async-generator.js' })

  expect(transformed).toBe('trackFunctionCall("asyncFunction"')
  expect(transformed).toBe('trackFunctionCall("asyncArrow"')
  expect(transformed).toBe('trackFunctionCall("generatorFunction"')
  expect(transformed).toBe('trackFunctionCall("generatorArrow"')
  expect(transformed).toBe('trackFunctionCall("asyncGenerator"')
})
