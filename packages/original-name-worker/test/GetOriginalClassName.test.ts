import { test, expect } from '@jest/globals'
import * as GetOriginalClassName from '../src/parts/GetOriginalClassName/GetOriginalClassName.ts'

test('getOriginalClassName', () => {
  const sourceContent = `class Test {
  constructor(value){
    this.value = value
  }
}`
  const originalLine = 1
  const originalColumn = 14
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn)).toBe('Test')
})

test('getOriginalClassName - extends', () => {
  const sourceContent = `class extends Test {
  constructor(value){
    this.value = value
  }
}`
  const originalLine = 1
  const originalColumn = 14
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn)).toBe('class extends Test')
})

test('getOriginalClassName - class method', () => {
  const sourceContent = `class ToolBar {
  handleClick(){
    const x = 1
  }
}`
  const originalLine = 2
  const originalColumn = 4
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn)).toBe('ToolBar.handleClick')
})

test('getOriginalClassName - static class method', () => {
  const sourceContent = `class App {
  static init(){
    return 0
  }
}`
  const originalLine = 2
  const originalColumn = 2
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn)).toBe('App.init')
})

test('getOriginalClassName - class field arrow function', () => {
  const sourceContent = `class A {
  onClick = () => {
    return 1
  }
}`
  const originalLine = 2
  const originalColumn = 2
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn)).toBe('A.onClick')
})

test('getOriginalClassName - function declaration', () => {
  const sourceContent = `function doSomething(){
  return 1
}`
  const originalLine = 1
  const originalColumn = 2
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn)).toBe('doSomething')
})

test('getOriginalClassName - nested function', () => {
  const sourceContent = `function outer(){
  function inner(){
    return 1
  }
  return inner()
}`
  const originalLine = 2
  const originalColumn = 4
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn)).toBe('inner')
})

test('getOriginalClassName - variable arrow function', () => {
  const sourceContent = `const run = () => {
  return 1
}`
  const originalLine = 1
  const originalColumn = 2
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn)).toBe('run')
})

test('getOriginalClassName - getter method', () => {
  const sourceContent = `class Store {
  get value(){
    return 1
  }
}`
  const originalLine = 2
  const originalColumn = 4
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn)).toBe('Store.value')
})

test('getOriginalClassName - function expression', () => {
  const sourceContent = `const compute = function(){
  return 1
}`
  const originalLine = 1
  const originalColumn = 2
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn)).toBe('compute')
})

test('getOriginalClassName - prototype method assignment', () => {
  const sourceContent = `function App(){}
App.prototype.start = function(){
  return 1
}`
  const originalLine = 2
  const originalColumn = 2
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn)).toBe('App.start')
})
