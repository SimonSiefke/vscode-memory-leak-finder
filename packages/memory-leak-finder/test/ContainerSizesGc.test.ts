import { expect, test } from '@jest/globals'
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const fixturePath = fileURLToPath(new URL('./fixtures/container-size-gc.mjs', import.meta.url))

test.each(['Map', 'Set'])(
  '%s size does not keep measured containers alive',
  async (kind) => {
    const { stdout } = await execFileAsync(process.execPath, [fixturePath, kind], {
      env: { ...process.env, FORCE_COLOR: '1' },
      timeout: 10_000,
    })
    expect(stdout.trim()).toBe('0')
  },
  15_000,
)
