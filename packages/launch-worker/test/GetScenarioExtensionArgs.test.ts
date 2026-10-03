import { afterEach, expect, test } from '@jest/globals'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getScenarioExtensionArgs } from '../src/parts/GetScenarioExtensionArgs/GetScenarioExtensionArgs.ts'

const roots: string[] = []
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

const fixture = async (manifest: object) => {
  const root = await mkdtemp(join(tmpdir(), 'scenario-extension-'))
  roots.push(root)
  const extensionPath = join(root, 'sample.test-scenario')
  await mkdir(extensionPath)
  await writeFile(join(extensionPath, 'package.json'), JSON.stringify(manifest))
  return { root, extensionPath }
}

test('loads the selected fixture directly without installing or restarting the host', async () => {
  const { root, extensionPath } = await fixture({ name: 'fixture', publisher: 'sample' })
  expect(await getScenarioExtensionArgs(root, 'test-scenario', true)).toEqual([`--extensionDevelopmentPath=${extensionPath}`])
  expect(await getScenarioExtensionArgs(root, 'another-scenario', true)).toEqual([])
})

test('enables proposals only for the selected fixture', async () => {
  const { root, extensionPath } = await fixture({ name: 'fixture', publisher: 'sample', enabledApiProposals: ['testObserver'] })
  expect(await getScenarioExtensionArgs(root, 'test-scenario', true)).toEqual([
    `--extensionDevelopmentPath=${extensionPath}`,
    '--enable-proposed-api=sample.fixture',
  ])
  expect(await getScenarioExtensionArgs(root, 'test-scenario', false)).toEqual([])
})

test('reports a broken manifest rather than silently running without the fixture', async () => {
  const { root, extensionPath } = await fixture({})
  await writeFile(join(extensionPath, 'package.json'), '{')
  await expect(getScenarioExtensionArgs(root, 'test-scenario', true)).rejects.toThrow()
})

test('does not resolve paths outside the scenario fixture convention', async () => {
  expect(await getScenarioExtensionArgs('/missing', '../elsewhere', true)).toEqual([])
})
