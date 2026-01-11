import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ ChatEditor, Editor, Electron, Extensions }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Extensions.install({
    id: 'GitHub.copilot-chat',
    name: 'GitHub Copilot Chat',
  })
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  await ChatEditor.sendMessage({
    message: `Please format this json:

\`\`\`json
{ "count":123, "value": 567 }
\`\`\``,
    validateRequest: {
      exists: ['.interactive-result-editor[data-mode-id="json"]'],
    },
    verify: true,
  })

  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
