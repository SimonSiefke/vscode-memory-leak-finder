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
