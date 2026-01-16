import { test, expect } from '@jest/globals'
import { transformCodeWithTracking } from '../src/parts/TransformCodeWithTracking/TransformCodeWithTracking.js'

test('TransformCodeWithTracking - should transform function declarations', () => {
  const code = `
    function testFunction() {
      return 'test'
    }
  `

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function testFunction() {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 456 })
  const expected = `const arrowFunction = () => {
  trackFunctionCall(456, 2, 26);
  return 'arrow';
};`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform concise arrow functions', () => {
  const code = `
    const conciseArrow = x => x * 2
  `

  const transformed = transformCodeWithTracking(code, { scriptId: 789 })
  const expected = `const conciseArrow = x => {
  trackFunctionCall(789, 2, 25);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 999 })
  const expected = `const funcExpression = function () {
  trackFunctionCall(999, 2, 27);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `const obj = {
  method() {
    trackFunctionCall(123, 2, 4);
    return 'method';
  },
  arrowMethod: () => {
    trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `class TestClass {
  constructor() {
    this.value = 42;
  }
  classMethod() {
    trackFunctionCall(123, 2, 4);
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
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function trackFunctionCall() {
  return 'tracking';
}
function getFunctionStatistics() {
  return 'stats';
}
function regularFunction() {
  trackFunctionCall(123, 2, 4);
  return 'regular';
}`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should handle empty code', () => {
  const code = ''
  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  expect(transformed).toBe('Function call tracking system')
})

test('TransformCodeWithTracking - should handle invalid code gracefully', () => {
  const code = 'invalid javascript syntax {{{'
  expect(() => transformCodeWithTracking(code, { scriptId: 123 })).toThrow(
    new Error('Error transforming code with tracking:: SyntaxError: Missing semicolon. (1:7)'),
  )
})

test('TransformCodeWithTracking - should use default filename when not provided', () => {
  const code = `
    function testFunction() {
      return 'test'
    }
  `

  const transformed = transformCodeWithTracking(code)
  const expected = `function testFunction() {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `(function () {
  trackFunctionCall(123, 2, 4);
  console.log('IIFE executed');
})();
(() => {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `new Promise((resolve, reject) => {
  trackFunctionCall(123, 2, 4);
  resolve('success');
});
new Promise(function (resolve, reject) {
  trackFunctionCall(123, 2, 4);
  reject('error');
});`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithTracking - should transform async functions', () => {
  const code = `
    async function asyncFunction() {
      return await fetch('/api/data');
    }

    const asyncArrow = async () => {
      return await Promise.resolve('async arrow');
    };
  `

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `async function asyncFunction() {
  trackFunctionCall(123, 2, 4);
  return await fetch('/api/data');
}
const asyncArrow = async () => {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function* generatorFunction() {
  trackFunctionCall(123, 2, 4);
  yield 1;
  yield 2;
}
const generatorArrow = function* () {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function outerFunction() {
  trackFunctionCall(123, 2, 4);
  function innerFunction() {
    trackFunctionCall(123, 2, 4);
    return 'inner';
  }
  const innerArrow = () => {
    trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `setTimeout(function () {
  trackFunctionCall(123, 2, 4);
  console.log('timeout callback');
}, 1000);
setInterval(() => {
  trackFunctionCall(123, 2, 4);
  console.log('interval callback');
}, 2000);
[1, 2, 3].map(function (item) {
  trackFunctionCall(123, 2, 4);
  return item * 2;
});
[4, 5, 6].filter(item => {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function destructuredFunction({
  a,
  b
}, [c, d]) {
  trackFunctionCall(123, 2, 4);
  return a + b + c + d;
}
const arrowDestructured = ({
  x,
  y
}) => {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function defaultParams(x = 10, y = 'default') {
  trackFunctionCall(123, 2, 4);
  return x + y;
}
const arrowDefault = (a = 5, b = []) => {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function restParams(...args) {
  trackFunctionCall(123, 2, 4);
  return args.join(', ');
}
const arrowRest = (first, ...rest) => {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function complexReturn() {
  trackFunctionCall(123, 2, 4);
  if (Math.random() > 0.5) {
    return 'success';
  } else {
    return 'failure';
  }
}
const arrowComplex = () => {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function 测试函数() {
  trackFunctionCall(123, 2, 4);
  return 'Unicode test 🚀';
}
const emojiFunc = () => {
  trackFunctionCall(123, 2, 4);
  return '🎉';
};
function special$Chars$_123() {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `'use strict';

/* This is a multi-line comment
   with function declarations inside
   function notARealFunction() {}
*/

// Single line comment with function fakeFunction() {}
function realFunction() {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function templateFunction() {
  trackFunctionCall(123, 2, 4);
  const name = 'World';
  return \`Hello \${name}!\`;
}
const complexArrow = () => {
  trackFunctionCall(123, 2, 4);
  return {
    [computedKey]: () => {
      trackFunctionCall(123, 2, 4);
      return 'nested computed';
    },
    regular: function () {
      trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function regexFunction() {
  trackFunctionCall(123, 2, 4);
  const pattern = /test/gi;
  return pattern.test('test string');
}
function literalFunction() {
  trackFunctionCall(123, 2, 4);
  return 42n; // BigInt literal
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function level1() {
  trackFunctionCall(123, 2, 4);
  function level2() {
    trackFunctionCall(123, 2, 4);
    function level3() {
      trackFunctionCall(123, 2, 4);
      function level4() {
        trackFunctionCall(123, 2, 4);
        function level5() {
          trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    trackFunctionCall(123, 2, 4);
    return \`\${this.name} makes a sound\`;
  }
}
class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }
  speak() {
    trackFunctionCall(123, 2, 4);
    return \`\${this.name} barks\`;
  }
  static purr() {
    trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function outerClosure(outerParam) {
  trackFunctionCall(123, 2, 4);
  const outerVar = 'outer';
  return function innerClosure(innerParam) {
    trackFunctionCall(123, 2, 4);
    const innerVar = 'inner';
    return function deepestClosure(deepestParam) {
      trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function compose(f, g) {
  trackFunctionCall(123, 2, 4);
  return function (x) {
    trackFunctionCall(123, 2, 4);
    return f(g(x));
  };
}
const pipe = (...fns) => {
  trackFunctionCall(123, 2, 4);
  return value => {
    trackFunctionCall(123, 2, 4);
    return fns.reduce((acc, fn) => {
      trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function factorial(n) {
  trackFunctionCall(123, 2, 4);
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

// Recursive arrow function
const sumRecursive = (arr, index = 0) => {
  trackFunctionCall(123, 2, 4);
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
  trackFunctionCall(123, 2, 4);
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
    trackFunctionCall(123, 2, 4);
    return 'public';
  },
  _privateMethod() {
    return 'private';
  }
};
class TestClass {
  publicClassMethod() {
    trackFunctionCall(123, 2, 4);
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
  trackFunctionCall(123, 2, 4);
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

  const jsFile = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function testFunction() {
  trackFunctionCall(123, 2, 4);
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
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function testFunction() {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `const arrowFunction = () => {
  trackFunctionCall(456, 2, 26);
  return 'arrow';
};`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should transform concise arrow functions', () => {
  const code = `
    const conciseArrow = x => x * 2
  `

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `const conciseArrow = x => {
  trackFunctionCall(789, 2, 25);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `const funcExpression = function () {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `const obj = {
  method() {
    trackFunctionCall(123, 2, 4);
    return 'method';
  },
  arrowMethod: () => {
    trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `class TestClass {
  constructor() {
    this.value = 42;
  }
  classMethod() {
    trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function testFunction() {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function trackFunctionCall() {
  return 'tracking';
}
function getFunctionStatistics() {
  return 'stats';
}
function regularFunction() {
  trackFunctionCall(123, 2, 4);
  return 'regular';
}`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should handle empty code', () => {
  const code = ''
  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = 'Function call tracking system'

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should handle invalid code gracefully', () => {
  const code = 'invalid javascript syntax {{{'
  expect(() => transformCodeWithTracking(code, { scriptId: 123 })).toThrow(
    new Error('Error transforming code with tracking:: SyntaxError: Missing semicolon. (1:7)'),
  )
})

test('Transform Script - transformCode - should use default filename when not provided', () => {
  const code = `
    function testFunction() {
      return 'test'
    }
  `

  const transformed = transformCodeWithTracking(code)
  const expected = `function testFunction() {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `(function () {
  trackFunctionCall(123, 2, 4);
  console.log('IIFE executed');
})();
(() => {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `new Promise((resolve, reject) => {
  trackFunctionCall(123, 2, 4);
  resolve('success');
});
new Promise(function (resolve, reject) {
  trackFunctionCall(123, 2, 4);
  reject('error');
});`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should transform async functions', () => {
  const code = `
    async function asyncFunction() {
      return await fetch('/api/data');
    }

    const asyncArrow = async () => {
      return await Promise.resolve('async arrow');
    };
  `

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `async function asyncFunction() {
  trackFunctionCall(123, 2, 4);
  return await fetch('/api/data');
}
const asyncArrow = async () => {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function* generatorFunction() {
  trackFunctionCall(123, 2, 4);
  yield 1;
  yield 2;
}
const generatorArrow = function* () {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `const methodName = 'dynamicMethod';
const obj = {
  [methodName]() {
    trackFunctionCall(123, 2, 4);
    return 'computed method';
  },
  ['arrow' + 'Method']() {
    trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `const obj = {
  [Symbol.iterator]() {
    trackFunctionCall(123, 2, 4);
    return {
      next: () => {
        trackFunctionCall(123, 2, 4);
        return {
          value: 1,
          done: false
        };
      }
    };
  },
  [Symbol.dispose]() {
    trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `class TestClass {
  propertyMethod = () => {
    trackFunctionCall(123, 2, 4);
    return 'class property arrow';
  };
  propertyFunction = function () {
    trackFunctionCall(123, 2, 4);
    return 'class property function';
  };
  static staticMethod() {
    trackFunctionCall(123, 2, 4);
    return 'static method';
  }
  static staticArrow = () => {
    trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function outerFunction() {
  trackFunctionCall(123, 2, 4);
  function innerFunction() {
    trackFunctionCall(123, 2, 4);
    return 'inner';
  }
  const innerArrow = () => {
    trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `setTimeout(function () {
  trackFunctionCall(123, 2, 4);
  console.log('timeout callback');
}, 1000);
setInterval(() => {
  trackFunctionCall(123, 2, 4);
  console.log('interval callback');
}, 2000);
[1, 2, 3].map(function (item) {
  trackFunctionCall(123, 2, 4);
  return item * 2;
});
[4, 5, 6].filter(item => {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function destructuredFunction({
  a,
  b
}, [c, d]) {
  trackFunctionCall(123, 2, 4);
  return a + b + c + d;
}
const arrowDestructured = ({
  x,
  y
}) => {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function defaultParams(x = 10, y = 'default') {
  trackFunctionCall(123, 2, 4);
  return x + y;
}
const arrowDefault = (a = 5, b = []) => {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function restParams(...args) {
  trackFunctionCall(123, 2, 4);
  return args.join(', ');
}
const arrowRest = (first, ...rest) => {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function complexReturn() {
  trackFunctionCall(123, 2, 4);
  if (Math.random() > 0.5) {
    return 'success';
  } else {
    return 'failure';
  }
}
const arrowComplex = () => {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(largeCode, { scriptId: 123 })

  expect(transformed).toContain('trackFunctionCall')
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function 测试函数() {
  trackFunctionCall(123, 2, 4);
  return 'Unicode test 🚀';
}
const emojiFunc = () => {
  trackFunctionCall(123, 2, 4);
  return '🎉';
};
function special$Chars$_123() {
  trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })

  const expected = `'use strict';

/* This is a multi-line comment
   with function declarations inside
   function notARealFunction() {}
*/

// Single line comment with function fakeFunction() {}
function realFunction() {
  trackFunctionCall(123, 2, 4);
  return 'real';
}`

  expect(transformed).toBe(expected)
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function templateFunction() {
  trackFunctionCall(123, 2, 4);
  const name = 'World';
  return \`Hello \${name}!\`;
}
const complexArrow = () => {
  trackFunctionCall(123, 2, 4);
  return {
    [computedKey]: () => {
      trackFunctionCall(123, 2, 4);
      return 'nested computed';
    },
    regular: function () {
      trackFunctionCall(123, 2, 4);
      return 'regular';
    }
  };
};`

  expect(transformed).toBe(expected)
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function regexFunction() {
  trackFunctionCall(123, 2, 4);
  const pattern = /test/gi;
  return pattern.test('test string');
}
function literalFunction() {
  trackFunctionCall(123, 2, 4);
  return 42n; // BigInt literal
}`

  expect(transformed).toBe(expected)
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function level1() {
  trackFunctionCall(123, 2, 4);
  function level2() {
    trackFunctionCall(123, 2, 4);
    function level3() {
      trackFunctionCall(123, 2, 4);
      function level4() {
        trackFunctionCall(123, 2, 4);
        function level5() {
          trackFunctionCall(123, 2, 4);
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
  trackFunctionCall(123, 2, 4);
  const inner1 = () => {
    trackFunctionCall(123, 2, 4);
    const inner2 = () => {
      trackFunctionCall(123, 2, 4);
      const inner3 = () => {
        trackFunctionCall(123, 2, 4);
        return 'arrow nested';
      };
      return inner3();
    };
    return inner2();
  };
  return inner1();
};`

  expect(transformed).toBe(expected)
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    trackFunctionCall(123, 2, 4);
    return \`\${this.name} makes a sound\`;
  }
}
class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }
  speak() {
    trackFunctionCall(123, 2, 4);
    return \`\${this.name} barks\`;
  }
  fetch() {
    trackFunctionCall(123, 2, 4);
    return 'Fetching ball';
  }
}
class Cat extends Animal {
  constructor(name, color) {
    super(name);
    this.color = color;
  }
  speak() {
    trackFunctionCall(123, 2, 4);
    return \`\${this.name} meows\`;
  }
  static purr() {
    trackFunctionCall(123, 2, 4);
    return 'Purring';
  }
}`

  expect(transformed).toBe(expected)
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function outerClosure(outerParam) {
  trackFunctionCall(123, 2, 4);
  const outerVar = 'outer';
  return function innerClosure(innerParam) {
    trackFunctionCall(123, 2, 4);
    const innerVar = 'inner';
    return function deepestClosure(deepestParam) {
      trackFunctionCall(123, 2, 4);
      return outerParam + outerVar + innerParam + innerVar + deepestParam;
    };
  };
}
function counterFactory() {
  trackFunctionCall(123, 2, 4);
  let count = 0;
  return {
    increment: function () {
      trackFunctionCall(123, 2, 4);
      count++;
      return count;
    },
    decrement: () => {
      trackFunctionCall(123, 2, 4);
      count--;
      return count;
    },
    getCount: function () {
      trackFunctionCall(123, 2, 4);
      return count;
    }
  };
}`

  expect(transformed).toBe(expected)
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function compose(f, g) {
  trackFunctionCall(123, 2, 4);
  return function (x) {
    trackFunctionCall(123, 2, 4);
    return f(g(x));
  };
}
function curry(fn) {
  trackFunctionCall(123, 2, 4);
  return function curried(...args) {
    trackFunctionCall(123, 2, 4);
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function (...nextArgs) {
      trackFunctionCall(123, 2, 4);
      return curried.apply(this, args.concat(nextArgs));
    };
  };
}
const pipe = (...fns) => {
  trackFunctionCall(123, 2, 4);
  return value => {
    trackFunctionCall(123, 2, 4);
    return fns.reduce((acc, fn) => {
      trackFunctionCall(123, 2, 4);
      return fn(acc);
    }, value);
  };
};
function memoize(fn) {
  trackFunctionCall(123, 2, 4);
  const cache = new Map();
  return function (...args) {
    trackFunctionCall(123, 2, 4);
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}`

  expect(transformed).toBe(expected)
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
  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function factorial(n) {
  trackFunctionCall(123, 2, 4);
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}
function fibonacci(n) {
  trackFunctionCall(123, 2, 4);
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Mutually recursive functions
function isEven(n) {
  trackFunctionCall(123, 2, 4);
  if (n === 0) {
    return true;
  }
  return isOdd(n - 1);
}
function isOdd(n) {
  trackFunctionCall(123, 2, 4);
  if (n === 0) {
    return false;
  }
  return isEven(n - 1);
}

// Recursive arrow function
const sumRecursive = (arr, index = 0) => {
  trackFunctionCall(123, 2, 4);
  if (index >= arr.length) {
    return 0;
  }
  return arr[index] + sumRecursive(arr, index + 1);
};`

  expect(transformed).toBe(expected)
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
  const expected = `function publicFunction() {
  trackFunctionCall(123, 2, 4);
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
}`

  expect(transformed).toBe(expected)
  expect(transformed).toContain('trackFunctionCall("publicFunction"')
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
  const expected = `function function1() {
  trackFunctionCall(123, 2, 4);
  return '1';
}
function function2() {
  trackFunctionCall(123, 2, 4);
  return '2';
}
const arrow = () => {
  trackFunctionCall(123, 2, 4);
  return 'arrow';
};`

  expect(transformed).toBe(expected)
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
  const expected = `function handleEvent() {
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
}`

  expect(transformed).toBe(expected)
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
  const expected = `const obj = {
  publicMethod() {
    trackFunctionCall(123, 2, 4);
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
    trackFunctionCall(123, 2, 4);
    return this.value;
  }
  _privateClassMethod() {
    return 'private class method';
  }
  static testStatic() {
    return 'static test';
  }
}`

  expect(transformed).toBe(expected)
  expect(transformed).toContain('trackFunctionCall("publicMethod"')
  expect(transformed).toContain('trackFunctionCall("publicClassMethod"')
})

test('Transform Script - transformCode - should handle case-sensitive exclude patterns', () => {
  const code = `function TestFunction() {
  return 'uppercase test';
}

function testfunction() {
  return 'lowercase test';
}

function TESTFUNCTION() {
  return 'all caps test';
}

  `

  const transformed = transformCodeWithTracking(code, {
    filename: 'case-exclude.js',
    excludePatterns: ['test'],
  })
  const expected = `function TestFunction() {
  trackFunctionCall(123, 2, 4);
  return 'uppercase test';
}
function testfunction() {
  return 'lowercase test';
}
function TESTFUNCTION() {
  trackFunctionCall(123, 2, 4);
  return 'all caps test';
}`

  expect(transformed).toBe(expected)
  expect(transformed).toContain('trackFunctionCall("TestFunction"')
  expect(transformed).toContain('trackFunctionCall("TESTFUNCTION"')
})

// Location tracking options tests
test('Transform Script - transformCode - should include location information by default', () => {
  const code = `
    function testFunction() {
      return 'test';
    }
  `

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function testFunction() {
  trackFunctionCall(123, 2, 4);
  return 'test';
}`

  expect(transformed).toBe(expected)
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
  const expected = `function testFunction() {
  trackFunctionCall(123, 2, 4);
  return 'test';
}`

  expect(transformedWithLocation).toBe(expected)
})

test('Transform Script - transformCode - should handle location tracking with different file extensions', () => {
  const code = `
    function testFunction() {
      return 'test';
    }
  `

  const jsFile = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function testFunction() {
  trackFunctionCall(123, 2, 4);
  return 'test';
}`

  expect(jsFile).toBe(expected)
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
  const expected = `function testFunction() {
  trackFunctionCall(123, 2, 4);
  return 'test';
}`

  expect(complexPath).toBe(expected)
})

test('Transform Script - transformCode - should handle location tracking with special characters in filename', () => {
  const code = `
    function testFunction() {
      return 'test';
    }
  `

  const spacesFile = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function testFunction() {
  trackFunctionCall(123, 2, 4);
  return 'test';
}`

  expect(spacesFile).toBe(expected)
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function firstFunction() {
  trackFunctionCall(123, 2, 4);
  return 'first';
}
const secondFunction = () => {
  trackFunctionCall(123, 2, 4);
  return 'second';
};
function thirdFunction() {
  trackFunctionCall(123, 2, 4);
  return 'third';
}`

  expect(transformed).toBe(expected)
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function $jquery() {
  trackFunctionCall(123, 2, 4);
  return 'jquery';
}
function _private() {
  trackFunctionCall(123, 2, 4);
  return 'private';
}
function camelCase() {
  trackFunctionCall(123, 2, 4);
  return 'camelCase';
}`

  expect(transformed).toBe(expected)
})

test.skip('Transform Script - transformCode - should handle functions with Unicode characters', () => {
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function español() {
  trackFunctionCall(123, 2, 4);
  return 'español';
}
function русский() {
  trackFunctionCall(123, 2, 4);
  return 'русский';
}
function 日本語() {
  trackFunctionCall(123, 2, 4);
  return '日本語';
}`

  expect(transformed).toBe(expected)
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function declaration() {
  trackFunctionCall(123, 2, 4);
  return 'declaration';
}
const expression = function () {
  trackFunctionCall(123, 2, 4);
  return 'expression';
};
const arrow = () => {
  trackFunctionCall(123, 2, 4);
  return 'arrow';
};
const concise = x => {
  trackFunctionCall(123, 2, 4);
  return x * 2;
};
class TestClass {
  method() {
    trackFunctionCall(123, 2, 4);
    return 'method';
  }
  static staticMethod() {
    trackFunctionCall(123, 2, 4);
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `// Global scope
function globalFunction() {
  trackFunctionCall(123, 2, 4);
  return 'global';
}

// Object property
const obj = {
  propertyFunction: function () {
    trackFunctionCall(123, 2, 4);
    return 'property';
  },
  propertyArrow: () => {
    trackFunctionCall(123, 2, 4);
    return 'arrow property';
  },
  method() {
    trackFunctionCall(123, 2, 4);
    return 'method';
  }
};

// Array methods
const arr = [1, 2, 3].map(function (item) {
  trackFunctionCall(123, 2, 4);
  return item * 2;
});
const arr2 = [4, 5, 6].filter(item => {
  trackFunctionCall(123, 2, 4);
  return item > 4;
});

// Callback
setTimeout(function () {
  trackFunctionCall(123, 2, 4);
  console.log('timeout');
}, 1000);`

  expect(transformed).toBe(expected)
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `function simpleParams(a, b, c) {
  trackFunctionCall(123, 2, 4);
  return a + b + c;
}
function defaultParams(x = 10, y = 'default') {
  trackFunctionCall(123, 2, 4);
  return x + y;
}
function restParams(first, ...rest) {
  trackFunctionCall(123, 2, 4);
  return rest.length;
}
function destructuredParams({
  a,
  b
}, [c, d]) {
  trackFunctionCall(123, 2, 4);
  return a + b + c + d;
}
const arrowWithParams = (x, y = 5, ...z) => {
  trackFunctionCall(123, 2, 4);
  return x + y + z.length;
};`

  expect(transformed).toBe(expected)
})

test('Transform Script - transformCode - should handle async and generator functions', () => {
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

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  const expected = `async function asyncFunction() {
  trackFunctionCall(123, 2, 4);
  return await Promise.resolve('async');
}
const asyncArrow = async () => {
  trackFunctionCall(123, 2, 4);
  return await fetch('/api/data');
};
function* generatorFunction() {
  trackFunctionCall(123, 2, 4);
  yield 1;
  yield 2;
  yield 3;
}
const generatorArrow = function* () {
  trackFunctionCall(123, 2, 4);
  yield 'arrow generator';
};
async function* asyncGenerator() {
  trackFunctionCall(123, 2, 4);
  yield await Promise.resolve(1);
  yield await Promise.resolve(2);
}`

  expect(transformed).toBe(expected)
})
