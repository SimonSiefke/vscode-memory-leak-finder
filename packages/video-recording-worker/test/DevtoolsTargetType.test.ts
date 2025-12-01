import { expect, test } from '@jest/globals'
import * as DevtoolsTargetType from '../src/parts/DevtoolsTargetType/DevtoolsTargetType.ts'

test('DevtoolsTargetType exports Page', () => {
  expect(DevtoolsTargetType.Page).toBe('page')
})

test('DevtoolsTargetType exports Worker', () => {
  expect(DevtoolsTargetType.Worker).toBe('worker')
})

test('DevtoolsTargetType exports Iframe', () => {
  expect(DevtoolsTargetType.Iframe).toBe('iframe')
})

test('DevtoolsTargetType exports Browser', () => {
  expect(DevtoolsTargetType.Browser).toBe('browser')
})

test('DevtoolsTargetType exports ServiceWorker', () => {
  expect(DevtoolsTargetType.ServiceWorker).toBe('service_worker')
})
