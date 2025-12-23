import { expect, test } from '@jest/globals'
import { getCACertPath } from '../src/parts/GetCACertPath/GetCACertPath.ts'

test('getCACertPath - returns a string path', () => {
  const path = getCACertPath()
  expect(typeof path).toBe('string')
  expect(path.length).toBeGreaterThan(0)
})

test('getCACertPath - returns path ending with ca-cert.pem', () => {
  const path = getCACertPath()
  expect(path).toContain('ca-cert.pem')
})

