import type { CreateParams } from '../CreateParams/CreateParams.ts'

export const create = (params: CreateParams) => {
  const { expect, page, platform, VError } = params
  const reporter = () => page.locator('.issue-reporter-wizard')
  const annotation = () => page.locator('.issue-reporter-annotation-overlay')
  const textEditor = () => annotation().locator('textarea[aria-label="Type text"]')
  const modifier = platform === 'darwin' ? 'Meta' : 'Control'

  const click = async (locator: any): Promise<void> => {
    await expect(locator).toBeVisible()
    const { x, y, width, height } = await locator.boundingBox()
    const position = { x: x + width / 2, y: y + height / 2, button: 'left', clickCount: 1 }
    await page.sessionRpc.invoke('Input.dispatchMouseEvent', { ...position, type: 'mousePressed', buttons: 1 })
    await page.sessionRpc.invoke('Input.dispatchMouseEvent', { ...position, type: 'mouseReleased', buttons: 0 })
  }

  const executeCommand = async (name: string): Promise<void> => {
    const key = { key: 'P', code: 'KeyP', windowsVirtualKeyCode: 80, modifiers: platform === 'darwin' ? 12 : 10 }
    await page.sessionRpc.invoke('Input.dispatchKeyEvent', { ...key, type: 'keyDown' })
    await page.sessionRpc.invoke('Input.dispatchKeyEvent', { ...key, type: 'keyUp' })
    const input = page.locator('.quick-input-widget input')
    await expect(input).toBeVisible()
    await input.fill(`>${name}`)
    const command = page.locator('.quick-input-widget .label-name', { hasExactText: name })
    await expect(command).toBeVisible({ timeout: 15_000 })
    await click(command)
    await expect(input).toBeHidden()
  }

  const closeEditor = async (): Promise<void> => {
    const modalClose = page.locator('[aria-label="Close Modal Editor (Escape)"]')
    if (await modalClose.isVisible()) {
      await click(modalClose)
    } else {
      const tab = page.locator('.tab.active')
      await click(tab.locator('[role="button"][aria-label^="Close"]'))
    }
  }

  return {
    async open() {
      try {
        await executeCommand('Help: Report Issue...')
        await expect(reporter()).toBeVisible({ timeout: 10_000 })
      } catch (error) {
        throw new VError(error, 'Failed to open issue reporter')
      }
    },
    async captureScreenshot() {
      try {
        const capture = page.locator('.wizard-segmented-main')
        await expect(capture).toBeVisible()
        await click(capture)
        await expect(annotation()).toBeVisible()
        await expect(annotation().locator('canvas')).toBeVisible()
      } catch (error) {
        throw new VError(error, 'Failed to capture screenshot for annotation')
      }
    },
    async editAnnotationText(text: string, finish: 'commit' | 'cancel' | 'blur') {
      try {
        await click(annotation().locator('button[aria-label="Text"]'))
        await click(annotation().locator('canvas'))
        // The editor uses an off-screen textarea for keyboard input and paints the text on the canvas.
        await expect(textEditor()).toBeFocused()
        await page.keyboard.type(text)
        await expect(textEditor()).toHaveValue(text)
        await textEditor().selectText()
        await page.keyboard.type(`${text} edited`)
        await expect(textEditor()).toHaveValue(`${text} edited`)
        await page.keyboard.press('ArrowLeft')
        if (finish === 'blur') {
          await annotation().locator('button[aria-label="Draw"]').focus()
        } else {
          await page.keyboard.press(finish === 'commit' ? `${modifier}+Enter` : 'Escape')
        }
        await expect(textEditor()).toHaveCount(0)
        await expect(annotation()).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to edit screenshot annotation text (${finish})`)
      }
    },
    async finishAnnotation(action: 'Save' | 'Discard') {
      try {
        await click(annotation().locator('.monaco-button', { hasText: action }))
        await expect(annotation()).toHaveCount(0)
        await expect(reporter().locator('img[alt="Screenshot 1"]')).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to ${action.toLowerCase()} screenshot annotation`)
      }
    },
    async reopenScreenshot() {
      try {
        await click(reporter().locator('img[alt="Screenshot 1"]'))
        await expect(annotation()).toBeVisible()
        await expect(annotation().locator('button[aria-label="Undo"]')).toHaveAttribute('disabled', null)
      } catch (error) {
        throw new VError(error, 'Failed to reopen saved screenshot annotation')
      }
    },
    async close() {
      try {
        if (await annotation().isVisible()) {
          await click(annotation().locator('.monaco-button', { hasText: 'Discard' }))
          await expect(annotation()).toHaveCount(0)
        }
        const deleteScreenshot = reporter().locator('[aria-label="Delete screenshot"]')
        if (await deleteScreenshot.isVisible()) {
          await click(deleteScreenshot)
        }
        await expect(reporter().locator('img[alt="Screenshot 1"]')).toHaveCount(0)
        await closeEditor()
        const discardDialog = page.locator('.monaco-dialog-box', { hasText: 'Discard issue report?' })
        if (await discardDialog.isVisible()) {
          await click(discardDialog.locator('.monaco-button', { hasText: 'Discard' }))
          await expect(discardDialog).toBeHidden()
        }
        await expect(reporter()).toBeHidden()
        await expect(page.locator('.tab[aria-label="Report Issue"]')).toHaveCount(0)
        await expect(textEditor()).toHaveCount(0)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, 'Failed to close issue reporter')
      }
    },
  }
}
