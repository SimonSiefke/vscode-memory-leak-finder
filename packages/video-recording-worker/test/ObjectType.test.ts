import { expect, test } from '@jest/globals'
import * as ObjectType from '../src/parts/ObjectType/ObjectType.ts'

test('ObjectType exports ElectronApp', () => {
  expect(ObjectType.ElectronApp).toBe('electronApp')
})

test('ObjectType exports Rpc', () => {
  expect(ObjectType.Rpc).toBe('rpc')
})

test('ObjectType exports Browser', () => {
  expect(ObjectType.Browser).toBe('browser')
})

test('ObjectType exports Locator', () => {
  expect(ObjectType.Locator).toBe('locator')
})

test('ObjectType exports Page', () => {
  expect(ObjectType.Page).toBe('page')
})
