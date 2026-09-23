import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import { getPoolmonData } from '../src/parts/GetPoolmonData/GetPoolmonData.ts'

test('getPoolmonData reads before and after pool sizes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'poolmon-chart-'))
  try {
    const results = join(root, 'poolmon')
    await mkdir(results)
    await writeFile(join(results, 'editor-open.json'), JSON.stringify({ pool: { beforeBytes: 1024, afterBytes: 2048 } }))
    await writeFile(join(results, 'ignored.log'), 'not JSON')

    await expect(getPoolmonData(root)).resolves.toEqual([
      {
        data: [
          { name: 'Before iterations', value: 1024 },
          { name: 'After iterations', value: 2048 },
        ],
        filename: 'editor-open',
      },
    ])
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

test('getPoolmonData rejects incomplete results', async () => {
  const root = await mkdtemp(join(tmpdir(), 'poolmon-chart-incomplete-'))
  try {
    const results = join(root, 'poolmon')
    await mkdir(results)
    await writeFile(join(results, 'incomplete.json'), JSON.stringify({ pool: { afterBytes: 2048 } }))

    await expect(getPoolmonData(root)).rejects.toThrow('Missing finite before/after PoolMon bytes in incomplete.json')
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})
