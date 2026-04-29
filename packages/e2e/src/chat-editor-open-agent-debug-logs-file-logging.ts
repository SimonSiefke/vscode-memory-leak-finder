import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 1,
    value: 'github.copilot.chat.agentDebugLog.fileLogging.enabled',
  })
  await SettingsEditor.enableCheckBox({
    name: 'github.copilot.chat.agentDebugLog.fileLogging.enabled',
  })
  await Editor.closeAll()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  await ChatEditor.open()
  await ChatEditor.openAgentDebugLogs()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
