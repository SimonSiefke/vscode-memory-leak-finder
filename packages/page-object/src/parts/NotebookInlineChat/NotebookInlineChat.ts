export const create = ({ expect, page, VError }: any) => {
  return {
    async hide() {
      try {
        await page.waitForIdle()
        const notebook = page.locator('.notebook-editor')
        await expect(notebook).toBeVisible()
        await page.waitForIdle()
        const notebookInlineChat = page.locator('.notebook-inline-chat:not(.hide)')
        await expect(notebookInlineChat).toBeVisible()
        const editor = notebookInlineChat.locator('.monaco-editor[data-uri^="chatSessionInput"]')
        await expect(editor).toBeVisible()
        await page.waitForIdle()
        await page.keyboard.press('Escape')
        await page.waitForIdle()

        // it is what it is...
        const notebookInlineChatHidden = page.locator('.notebook-inline-chat.hide')
        await expect(notebookInlineChatHidden).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to hide notebook inline chat`)
      }
    },
    async show() {
      try {
        const notebook = page.locator('.notebook-editor')
        await expect(notebook).toBeVisible()
        await page.waitForIdle()
        await page.keyboard.press('Control+i')
        await page.waitForIdle()
        const chat = page.locator('.chat-widget')
        await expect(chat).toBeVisible()
        const editor = chat.locator('.monaco-editor[data-uri^="chatSessionInput"]')
        await expect(editor).toBeVisible()
        const editContext = editor.locator('.native-edit-context')
        await expect(editContext).toBeVisible()
        await page.waitForIdle()
        await expect(editContext).toBeFocused()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show notebook inline chat`)
      }
    },
  }
}
