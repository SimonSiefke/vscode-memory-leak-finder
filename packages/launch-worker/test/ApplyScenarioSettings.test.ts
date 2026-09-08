import { afterEach, beforeEach, expect, test } from '@jest/globals'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applyScenarioSettings } from '../src/parts/ApplyScenarioSettings/ApplyScenarioSettings.ts'

let directory: string
let settingsPath: string
let overridesPath: string
const original = '{"telemetry.feedback.enabled":false,"editor.fontSize":14}\n'

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'scenario-settings-'))
  settingsPath = join(directory, 'settings.json')
  overridesPath = join(directory, 'overrides.json')
  await writeFile(settingsPath, original)
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

test('overrides startup settings, preserves unrelated settings, and restores the original file', async () => {
  await writeFile(overridesPath, '{"telemetry.feedback.enabled":true,"issueReporter.wizard.enabled":true}')
  const restore = await applyScenarioSettings(settingsPath, overridesPath)
  expect(JSON.parse(await readFile(settingsPath, 'utf8'))).toEqual({
    'editor.fontSize': 14,
    'issueReporter.wizard.enabled': true,
    'telemetry.feedback.enabled': true,
  })
  await restore()
  expect(await readFile(settingsPath, 'utf8')).toBe(original)
})

test('leaves settings untouched when the scenario has no overrides', async () => {
  const restore = await applyScenarioSettings(settingsPath, overridesPath)
  expect(await readFile(settingsPath, 'utf8')).toBe(original)
  await restore()
  expect(await readFile(settingsPath, 'utf8')).toBe(original)
})

test.each(['null', '[]', 'true', '{invalid'])('rejects invalid overrides without changing settings: %s', async (value) => {
  await writeFile(overridesPath, value)
  await expect(applyScenarioSettings(settingsPath, overridesPath)).rejects.toThrow()
  expect(await readFile(settingsPath, 'utf8')).toBe(original)
})
