import { test, expect } from '@jest/globals'
import * as Exec from '../src/parts/Exec/Exec.ts'

test('Exec - should export exec function from execa', () => {
  expect(Exec.exec).toBeDefined()
  expect(typeof Exec.exec).toBe('function')
})

test('Exec - should execute simple command', async () => {
  const result = await Exec.exec('echo', ['hello'])
  expect(result.stdout).toBe('hello')
  expect(result.exitCode).toBe(0)
})

test('Exec - should handle command with options', async () => {
  const result = await Exec.exec('pwd', [], { cwd: '/' })
  expect(result.stdout).toBe('/')
  expect(result.exitCode).toBe(0)
})

test('Exec - should throw on invalid command', async () => {
  await expect(Exec.exec('nonexistent-command-xyz', [])).rejects.toThrow()
})
