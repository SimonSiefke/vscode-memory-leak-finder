import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Scenario fixtures must be loaded before the extension-host debugger attaches.
export const getScenarioExtensionArgs = async (fixturesDir: string, scenario: string, enableExtensions: boolean): Promise<string[]> => {
  if (!enableExtensions || !/^[a-z0-9-]+$/.test(scenario)) {
    return []
  }
  const extensionPath = join(fixturesDir, `sample.${scenario}`)
  let content: string
  try {
    content = await readFile(join(extensionPath, 'package.json'), 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
  const manifest = JSON.parse(content)
  const args = [`--extensionDevelopmentPath=${extensionPath}`]
  if (manifest.enabledApiProposals?.length) {
    if (typeof manifest.publisher !== 'string' || typeof manifest.name !== 'string') {
      throw new Error(`Scenario extension ${scenario} needs a publisher and name`)
    }
    args.push(`--enable-proposed-api=${manifest.publisher}.${manifest.name}`)
  }
  return args
}
