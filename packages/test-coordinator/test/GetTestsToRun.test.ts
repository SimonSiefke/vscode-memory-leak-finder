import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import { getTestsToRun } from '../src/parts/GetTestToRun/GetTestsToRun.ts'

const withTestFiles = async (fn: (root: string) => Promise<void>): Promise<void> => {
  const root = await mkdtemp(join(tmpdir(), 'get-tests-to-run-'))
  const testsPath = join(root, 'src')
  await mkdir(testsPath)
  await Promise.all(
    ['delta.ts', 'alpha.ts', 'charlie.ts', 'bravo.ts', 'echo.ts'].map((fileName) => writeFile(join(testsPath, fileName), '')),
  )
  try {
    await fn(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

test('getTestsToRun sorts tests before sharding', async () => {
  await withTestFiles(async (root) => {
    const firstShard = await getTestsToRun(root, root, '', '', 1, 2)
    const secondShard = await getTestsToRun(root, root, '', '', 2, 2)

    expect(firstShard.map(({ dirent }) => dirent)).toEqual(['alpha.ts', 'charlie.ts', 'echo.ts'])
    expect(secondShard.map(({ dirent }) => dirent)).toEqual(['bravo.ts', 'delta.ts'])
  })
})

test('getTestsToRun applies continue after selecting the stable shard', async () => {
  await withTestFiles(async (root) => {
    const firstShard = await getTestsToRun(root, root, '', 'charlie.ts', 1, 2)
    const secondShard = await getTestsToRun(root, root, '', 'charlie.ts', 2, 2)

    expect(firstShard.map(({ dirent }) => dirent)).toEqual(['charlie.ts', 'echo.ts'])
    expect(secondShard.map(({ dirent }) => dirent)).toEqual(['delta.ts'])
  })
})
