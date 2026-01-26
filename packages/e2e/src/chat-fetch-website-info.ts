import type { TestContext } from '../types.ts'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ ChatEditor, Editor, Electron }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor, page, expect }: TestContext): Promise<void> => {
  // Send the message about Benjamin Franklin with model selection
  const sendPromise = ChatEditor.sendMessage({
    message: 'What are some facts about Benjamin Franklin',
    model: 'zAiGLM4.5 air free',
    verify: true,
  })

  // Wait a bit to see if an intermediate dialog appears
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Try to click the allow button if it appears for website access
  await ChatEditor.clickAccessButton('Allow')

  // Wait for the original sendMessage promise to complete
  await sendPromise

  // Verify the response message appears
  const response = page.locator('.interactive-session .monaco-list-row .chat-most-recent-response')
  await expect(response).toBeVisible({ timeout: 30_000 })

  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
