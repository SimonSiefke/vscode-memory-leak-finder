import { expect, test } from '@jest/globals'
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const fixturePath = fileURLToPath(new URL('./fixtures/promise-stack-traces.mjs', import.meta.url))

test.each(['stable', 'growing'])(
  'promise stack traces distinguish a %s cache after warmup',
  async (mode) => {
    const { stdout } = await execFileAsync(process.execPath, [fixturePath, mode], { timeout: 10_000 })
    const result = JSON.parse(stdout)
    expect(result.restored).toBe(true)
    if (mode === 'stable') {
      expect(result.rows).toEqual([])
    } else {
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0]).toMatchObject({ count: 3900, delta: 3700 })
    }
  },
  15_000,
)

test.each(['prepare', 'warmup', 'capture'])(
  'promise tracking is removed after a %s failure',
  async (phase) => {
    const { stdout } = await execFileAsync(process.execPath, [fixturePath, `${phase}-failure`], { timeout: 10_000 })
    expect(JSON.parse(stdout)).toEqual({
      error: `Error: ${phase} failed`,
      restored: true,
      trackingRemoved: true,
      scriptListeners: 0,
    })
  },
  15_000,
)
