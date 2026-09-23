import { expect, test } from '@jest/globals'

import { getMaxAttempts, runInstall } from '../src/parts/Install/Install.js'

test('install retries up to five times on Windows', async () => {
  const commands: string[][] = []
  const waits: number[] = []
  let ciAttempt = 0

  const exitCode = await runInstall({
    platform: 'win32',
    runCommand: (args) => {
      commands.push(args)
      if (args[0] === 'ci') {
        ciAttempt++
        return ciAttempt < 5 ? 1 : 0
      }
      return 0
    },
    sleep: async (milliseconds) => {
      waits.push(milliseconds)
    },
  })

  expect(exitCode).toBe(0)
  expect(ciAttempt).toBe(5)
  expect(commands.at(-1)).toEqual(['run', 'postinstall'])
  expect(waits).toHaveLength(4)
})

test('install runs once on non-Windows platforms', async () => {
  const commands: string[][] = []

  const exitCode = await runInstall({
    platform: 'linux',
    runCommand: (args) => {
      commands.push(args)
      return 0
    },
  })

  expect(exitCode).toBe(0)
  expect(commands).toEqual([
    ['ci', '--ignore-scripts'],
    ['run', 'postinstall'],
  ])
  expect(getMaxAttempts('linux')).toBe(1)
  expect(getMaxAttempts('win32')).toBe(5)
})
