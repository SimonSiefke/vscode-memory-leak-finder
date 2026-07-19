import { afterEach, expect, test } from '@jest/globals'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as ApplyPerformanceSettings from '../src/parts/ApplyPerformanceSettings/ApplyPerformanceSettings.ts'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { force: true, recursive: true })))
})

test('applyPerformanceSettings disables core AI work only for performance runs', async () => {
  const root = await mkdtemp(join(tmpdir(), 'performance-settings-'))
  temporaryDirectories.push(root)
  const settingsPath = join(root, 'settings.json')
  await writeFile(settingsPath, JSON.stringify({ existing: true }))

  await ApplyPerformanceSettings.applyPerformanceSettings(settingsPath, {
    VSCODE_PERFORMANCE_CORE_WORKLOAD: '1',
  })

  expect(JSON.parse(await readFile(settingsPath, 'utf8'))).toEqual({
    'chat.agentHost.enabled': false,
    'chat.allowAnonymousAccess': false,
    'chat.disableAIFeatures': true,
    existing: true,
  })
})

test('applyPerformanceSettings leaves regular test settings unchanged', async () => {
  const root = await mkdtemp(join(tmpdir(), 'regular-settings-'))
  temporaryDirectories.push(root)
  const settingsPath = join(root, 'settings.json')
  await writeFile(settingsPath, '{"existing":true}')

  await ApplyPerformanceSettings.applyPerformanceSettings(settingsPath, {})

  expect(await readFile(settingsPath, 'utf8')).toBe('{"existing":true}')
})
