import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export const applyScenarioSettings = async (
  fixturesDir: string,
  scenario: string,
  enableExtensions: boolean,
  settingsPath: string,
): Promise<void> => {
  if (!enableExtensions || !/^[a-z0-9-]+$/.test(scenario)) {
    return
  }
  let content: string
  try {
    content = await readFile(join(fixturesDir, `sample.${scenario}`, 'e2e-settings.json'), 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return
    throw error
  }
  const overrides = JSON.parse(content)
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new Error(`Scenario settings for ${scenario} must be an object`)
  }
  const settings = JSON.parse(await readFile(settingsPath, 'utf8'))
  await writeFile(settingsPath, JSON.stringify({ ...settings, ...overrides }, null, 2) + '\n')
}
