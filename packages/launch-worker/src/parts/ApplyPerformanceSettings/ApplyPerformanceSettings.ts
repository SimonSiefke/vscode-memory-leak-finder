import { readFile, writeFile } from 'node:fs/promises'

export const applyPerformanceSettings = async (settingsPath: string, env: NodeJS.ProcessEnv = process.env): Promise<void> => {
  if (env.VSCODE_PERFORMANCE_CORE_WORKLOAD !== '1') {
    return
  }
  const settings = JSON.parse(await readFile(settingsPath, 'utf8'))
  settings['chat.agentHost.enabled'] = false
  settings['chat.allowAnonymousAccess'] = false
  settings['chat.disableAIFeatures'] = true
  await writeFile(settingsPath, JSON.stringify(settings, null, 2) + '\n')
}
