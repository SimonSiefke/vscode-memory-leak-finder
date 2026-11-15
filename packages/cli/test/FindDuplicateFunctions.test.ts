import { expect, test } from '@jest/globals'
import { findDuplicateFunctions } from '../src/parts/FindDuplicateFunctions/FindDuplicateFunctions.ts'

const hashes = (source: string): string[] => findDuplicateFunctions(source, 'fixture.js').fingerprints.map((item) => item.hash)

test.each([
  ['declaration and concise arrow', 'function add(a,b){return a+b} const addition=(x,y)=>x+y'],
  ['method and function', 'class A { add(a,b){return a+b} } function sum(x,y){return x+y}'],
  ['object method and arrow', 'const obj={add(a,b){return a+b}}; const addition=(x,y)=>x+y'],
  ['local bindings', 'function f(a){let b=a+1;return b} function g(x){let y=x+1;return y}'],
  ['shadowed block bindings', 'function f(a){{let a=1;use(a)}return a} function g(x){{let x=1;use(x)}return x}'],
  ['destructuring', 'function f({value:a},[b]){return a+b} const g=({value:x},[y])=>x+y'],
  ['defaults and rest', 'function f(a=1,...b){return a+b.length} const g=(x=1,...y)=>x+y.length'],
  ['same capture', 'const value=1; function f(a){return a+value} const g=x=>x+value'],
  ['recursion', 'function f(a){return a?f(a-1):0} function g(x){return x?g(x-1):0}'],
  ['recursive arrows and declarations', 'function f(a){return a?f(a-1):0} const g=x=>x?g(x-1):0'],
  ['named expressions and arrows', 'const f=function inner(a){return a?inner(a-1):0}; const g=x=>x?g(x-1):0'],
  ['same property with shorthand', 'function f(a){return {a}} function g(x){return {a:x}}'],
  ['literal spelling', 'function f(){return 0x10} const g=()=>16'],
  ['Unicode identifier names', 'function f(ä){return ä+1} const g=λ=>λ+1'],
  ['same lexical receiver', 'const f=()=>this.x; const g=()=>this.x'],
  ['same object home', 'const obj={f(){return super.x},g(){return super.x}}'],
  ['same class home', 'class A extends Base {f(){return super.x} g(){return super.x}}'],
])('matches %s', (_name, source) => {
  const result = hashes(source)
  expect(result).toHaveLength(2)
  expect(result[0]).toBe(result[1])
})

test.each([
  ['operators', 'const f=(a,b)=>a+b; const g=(x,y)=>x-y'],
  ['parameter order', 'const f=(a,b)=>a-b; const g=(x,y)=>y-x'],
  ['literals', 'const f=a=>a+1; const g=x=>x+2'],
  ['overflowed numbers and null', 'const f=()=>1e999; const g=()=>null'],
  ['property names', 'const f=a=>a.first; const g=x=>x.second'],
  ['object keys', 'const f=a=>({a}); const g=x=>({x})'],
  ['globals', 'const f=a=>first(a); const g=x=>second(x)'],
  ['captures', 'const a=1,b=2; const f=x=>x+a; const g=y=>y+b'],
  ['async', 'const f=async a=>a; const g=x=>x'],
  ['generators', 'function* f(a){return a} function g(x){return x}'],
  ['receiver semantics', 'function f(){return this.x} const g=()=>this.x'],
  ['arguments semantics', 'function f(){return arguments[0]} const g=()=>arguments[0]'],
  ['regular expression patterns', 'const f=()=>/a/gi; const g=()=>/b/gi'],
  ['regular expression flags', 'const f=()=>/a/g; const g=()=>/a/i'],
  ['bigints', 'const f=()=>1n; const g=()=>2n'],
  ['getter and method', 'class A { get f(){return 1} g(){return 1} }'],
  ['private fields from different classes', 'class A { #x; f(){return this.#x} } class B { #x; g(){return this.#x} }'],
  ['super from different classes', 'class A extends Base { f(){return super.x} } class B extends Other { g(){return super.x} }'],
  ['super from different objects', 'const a={__proto__:first,f(){return super.x}}; const b={__proto__:second,g(){return super.x}}'],
  ['static and instance super', 'class A extends Base {static f(){return super.x} g(){return super.x}}'],
  ['lexical receivers in different class fields', 'class A {f=()=>this.x} class B {g=()=>this.x}'],
  ['static and instance lexical receivers', 'class A {static f=()=>this.x;g=()=>this.x}'],
  ['lexical receivers in different static blocks', 'class A {static {this.f=()=>this.x}} class B {static {this.g=()=>this.x}}'],
])('distinguishes %s', (_name, source) => {
  const result = hashes(source)
  expect(result).toHaveLength(2)
  expect(result[0]).not.toBe(result[1])
})

test('preserves capture identity across scopes with identical variable names', () => {
  const result = findDuplicateFunctions('function a(value){return ()=>value} function b(value){return ()=>value}', 'fixture.js')
  const arrows = result.fingerprints.filter((item) => item.occurrence.name === '<anonymous>')
  expect(arrows).toHaveLength(2)
  expect(arrows[0].hash).not.toBe(arrows[1].hash)
})

test('normalizes bindings within nested functions', () => {
  const result = findDuplicateFunctions('function f(a){return b=>a+b} function g(x){return y=>x+y}', 'fixture.js')
  const outer = result.fingerprints.filter((item) => ['f', 'g'].includes(item.occurrence.name))
  expect(outer).toHaveLength(2)
  expect(outer[0].hash).toBe(outer[1].hash)
})

test('parameter defaults resolve outside body declarations', () => {
  const result = hashes('const value=1; function f(x=value){let value=2;return x} function g(y=value){let local=2;return y}')
  expect(result[0]).toBe(result[1])
})

test('skips eval, its enclosing function, and closures affected by dynamic lookup', () => {
  const result = findDuplicateFunctions('function f(){eval("var x=1");return ()=>x} const g=()=>1', 'fixture.js', 'script')
  expect(result.functions).toBe(3)
  expect(result.skippedDynamicFunctions).toBe(2)
  expect(result.fingerprints).toHaveLength(1)
})

test('skips with statements and their enclosed closures', () => {
  const result = findDuplicateFunctions('function f(){with(obj){return ()=>x}}', 'fixture.js', 'script')
  expect(result.skippedDynamicFunctions).toBe(2)
})

test('preserves inherited strict mode', () => {
  const result = findDuplicateFunctions(
    'function f(){return this} function outer(){"use strict";return function g(){return this}}',
    'fixture.js',
    'script',
  )
  const f = result.fingerprints.find((item) => item.occurrence.name === 'f')!
  const g = result.fingerprints.find((item) => item.occurrence.name === 'g')!
  expect(f.hash).not.toBe(g.hash)
})

test('reports offsets, UTF-8 sizes and one-based locations for all JavaScript line terminators', () => {
  const source = '// ä\r\n// comment\u2028const plus=(ä)=>ä+1'
  const result = findDuplicateFunctions(source, 'fixture.js')
  const start = source.indexOf('(ä)')
  expect(result.fingerprints[0].occurrence).toEqual({
    file: 'fixture.js',
    name: 'plus',
    start,
    end: source.length,
    line: 3,
    column: 12,
    bytes: Buffer.byteLength(source.slice(start)),
  })
})

test('handles declaration hoisting, catch bindings and computed keys', () => {
  const result = hashes('function f(a){try{return b[a]}catch(e){return e}var b} function g(x){try{return y[x]}catch(err){return err}var y}')
  expect(result[0]).toBe(result[1])
})

test('reports parse errors', () => {
  expect(() => hashes('function {')).toThrow()
})

test('reads only real source map comments, preferring the last directive', () => {
  expect(findDuplicateFunctions('const text="//# sourceMappingURL=fake.map"', 'fixture.js').sourceMap).toBeUndefined()
  expect(findDuplicateFunctions('//# sourceMappingURL=first.map\n/*# sourceMappingURL=last.map */', 'fixture.js').sourceMap).toEqual({
    url: 'last.map',
  })
})
