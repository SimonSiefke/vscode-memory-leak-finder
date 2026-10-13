import { readFile, writeFile } from 'node:fs/promises'

export const applyScenarioSettings = async (settingsPath: string, overridesPath: string): Promise<() => Promise<void>> => {
  let overridesText: string
  try {
    overridesText = await readFile(overridesPath, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return async () => {}
    }
    throw error
  }
  const overrides: unknown = JSON.parse(overridesText)
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new Error('Scenario settings must be a JSON object')
  }
  const original = await readFile(settingsPath, 'utf8')
  await writeFile(settingsPath, JSON.stringify({ ...JSON.parse(original), ...overrides }, null, 2) + '\n')
  return async () => {
    await writeFile(settingsPath, original)
  }
}
