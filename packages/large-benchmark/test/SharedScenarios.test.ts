import { afterEach, expect, jest, test } from '@jest/globals'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { interactionScenarios } from '../src/largePerformance/manifest.ts'

const fixtureUrl = new URL('../../e2e/helpers/performanceFixtures.ts', import.meta.url).href
const { files, prepareFixture, setup } = await import(fixtureUrl)
const directories: string[] = []
afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

test('shared scenario setup preserves prelaunch fixtures and resets changed workloads', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'shared-scenario-'))
  directories.push(directory)
  await prepareFixture(directory)
  const before = await stat(join(directory, 'small.txt'))
  const reset = jest.fn()
  const close = jest.fn<() => Promise<void>>().mockResolvedValue()
  const context = { Workspace: { getWorkspacePath: () => directory, setFiles: reset }, Editor: { closeAll: close } }
  await setup(context)
  expect(reset).not.toHaveBeenCalled()
  expect((await stat(join(directory, 'small.txt'))).mtimeMs).toBe(before.mtimeMs)
  await writeFile(join(directory, 'small.txt'), 'modified')
  await setup(context)
  expect(reset).toHaveBeenCalledWith(files)
  expect(close).toHaveBeenCalledTimes(2)
  expect(await readFile(join(directory, 'small.txt'), 'utf8')).toBe('modified')
})

test('every interaction maps to an ordinary opt-in E2E scenario with separate cleanup', async () => {
  for (const id of interactionScenarios) {
    const url = new URL(`../../e2e/src/performance-${id}.ts`, import.meta.url).href
    const module = await import(url)
    expect(module.skip).toBeTruthy()
    expect(typeof module.setup).toBe('function')
    expect(typeof module.run).toBe('function')
    expect(typeof module.teardown).toBe('function')
  }
})
