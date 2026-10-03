import { afterEach, expect, test } from '@jest/globals'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applyScenarioSettings } from '../src/parts/ApplyScenarioSettings/ApplyScenarioSettings.ts'

const roots: string[] = []
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})
const fixture = async (overrides: unknown) => {
  const root = await mkdtemp(join(tmpdir(), 'scenario-settings-'))
  roots.push(root)
  await mkdir(join(root, 'sample.native-menu'))
  await writeFile(join(root, 'sample.native-menu', 'e2e-settings.json'), JSON.stringify(overrides))
  const settingsPath = join(root, 'user-settings.json')
  await writeFile(settingsPath, JSON.stringify({ 'window.menuStyle': 'custom', 'editor.fontSize': 14 }))
  return { root, settingsPath }
}
test('overrides selected startup settings and preserves other harness settings', async () => {
  const { root, settingsPath } = await fixture({ 'window.menuStyle': 'native' })
  await applyScenarioSettings(root, 'native-menu', true, settingsPath)
  expect(JSON.parse(await readFile(settingsPath, 'utf8'))).toEqual({ 'window.menuStyle': 'native', 'editor.fontSize': 14 })
})
test('disabled, missing and invalid-name scenarios leave settings untouched', async () => {
  const { root, settingsPath } = await fixture({ 'window.menuStyle': 'native' })
  const original = await readFile(settingsPath, 'utf8')
  await applyScenarioSettings(root, 'native-menu', false, settingsPath)
  await applyScenarioSettings(root, 'another-test', true, settingsPath)
  await applyScenarioSettings(root, '../native-menu', true, settingsPath)
  expect(await readFile(settingsPath, 'utf8')).toBe(original)
})
test('rejects non-object settings without replacing the user settings', async () => {
  const { root, settingsPath } = await fixture([])
  const original = await readFile(settingsPath, 'utf8')
  await expect(applyScenarioSettings(root, 'native-menu', true, settingsPath)).rejects.toThrow('must be an object')
  expect(await readFile(settingsPath, 'utf8')).toBe(original)
})
