import { expect, test } from '@jest/globals'
import * as AssertSupportedSubprocessMeasure from '../src/parts/AssertSupportedSubprocessMeasure/AssertSupportedSubprocessMeasure.ts'

test('assertSupportedSubprocessMeasure - allows node subprocess measurement', () => {
  expect(() => {
    AssertSupportedSubprocessMeasure.assertSupportedSubprocessMeasure(true, 'emitter-count', true, 'node')
  }).not.toThrow()
})

test('assertSupportedSubprocessMeasure - allows bun when subprocess measurement is disabled', () => {
  expect(() => {
    AssertSupportedSubprocessMeasure.assertSupportedSubprocessMeasure(true, 'emitter-count', false, 'bun')
  }).not.toThrow()
})

test('assertSupportedSubprocessMeasure - emitter-count throws queryInstances limitation error for bun', () => {
  expect(() => {
    AssertSupportedSubprocessMeasure.assertSupportedSubprocessMeasure(true, 'emitter-count', true, 'bun')
  }).toThrow(
    'Bun subprocess leak measurement is not supported yet because Bun queryInstances cannot be called with Object or Function, which blocks constructor discovery for emitter-count',
  )
})

test('assertSupportedSubprocessMeasure - named-emitter-count throws heap profiler error for bun', () => {
  expect(() => {
    AssertSupportedSubprocessMeasure.assertSupportedSubprocessMeasure(true, 'named-emitter-count', true, 'bun')
  }).toThrow(
    'Bun subprocess leak measurement is not supported yet because Bun inspector does not implement the HeapProfiler domain, which is required for named-emitter-count',
  )
})

test('assertSupportedSubprocessMeasure - unknown measure throws generic bun capability error', () => {
  expect(() => {
    AssertSupportedSubprocessMeasure.assertSupportedSubprocessMeasure(true, 'string-count', true, 'bun')
  }).toThrow(
    'Bun subprocess leak measurement is not supported yet because Bun inspector currently does not implement Runtime.queryObjects or the HeapProfiler domain used by current measures',
  )
})
