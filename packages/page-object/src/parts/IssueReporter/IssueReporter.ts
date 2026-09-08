import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'

export const create = (params: CreateParams) => {
  const { expect, page, platform, VError } = params
  const reporter = page.locator('.issue-reporter-wizard')
  const annotation = page.locator('.issue-reporter-annotation-overlay')
  const textEditor = annotation.locator('textarea[aria-label="Type text"]')
  const modifier = platform === 'darwin' ? 'Meta' : 'Control'

  return {
    async open() {
      try {
        const quickPick = QuickPick.create(params)
        await quickPick.executeCommand('Help: Report Issue...')
        await expect(reporter).toBeVisible()
      } catch (error) {
        throw new VError(error, 'Failed to open issue reporter')
      }
    },
    async captureScreenshot() {
      try {
        const capture = page.locator('.wizard-segmented-main')
        await expect(capture).toBeVisible()
        await capture.click()
        await expect(annotation).toBeVisible()
        await expect(annotation.locator('canvas')).toBeVisible()
      } catch (error) {
        throw new VError(error, 'Failed to capture screenshot for annotation')
      }
    },
    async editAnnotationText(text: string, finish: 'commit' | 'cancel' | 'blur') {
      try {
        await annotation.locator('button[aria-label="Text"]').click()
        await annotation.locator('canvas').click()
        // The editor uses an off-screen textarea for keyboard input and paints the text on the canvas.
        await expect(textEditor).toBeFocused()
        await page.keyboard.type(text)
        await expect(textEditor).toHaveValue(text)
        await page.keyboard.press(`${modifier}+a`)
        await page.keyboard.type(`${text} edited`)
        await expect(textEditor).toHaveValue(`${text} edited`)
        await page.keyboard.press('ArrowLeft')
        if (finish === 'blur') {
          await annotation.locator('button[aria-label="Draw"]').click()
        } else {
          await page.keyboard.press(finish === 'commit' ? `${modifier}+Enter` : 'Escape')
        }
        await expect(textEditor).toHaveCount(0)
        await expect(annotation).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to edit screenshot annotation text (${finish})`)
      }
    },
    async finishAnnotation(action: 'Save' | 'Discard') {
      try {
        await annotation.locator('.monaco-button', { hasText: action }).click()
        await expect(annotation).toHaveCount(0)
        await expect(reporter.locator('img[alt="Screenshot 1"]')).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to ${action.toLowerCase()} screenshot annotation`)
      }
    },
    async reopenScreenshot() {
      try {
        await reporter.locator('img[alt="Screenshot 1"]').click()
        await expect(annotation).toBeVisible()
        await expect(annotation.locator('button[aria-label="Undo"]')).toHaveAttribute('disabled', null)
      } catch (error) {
        throw new VError(error, 'Failed to reopen saved screenshot annotation')
      }
    },
    async close() {
      try {
        if (await annotation.isVisible()) {
          await annotation.locator('.monaco-button', { hasText: 'Discard' }).click()
          await expect(annotation).toHaveCount(0)
        }
        const deleteScreenshot = reporter.locator('[aria-label="Delete screenshot"]')
        if (await deleteScreenshot.isVisible()) {
          await deleteScreenshot.click()
        }
        await expect(reporter.locator('img[alt="Screenshot 1"]')).toHaveCount(0)
        const quickPick = QuickPick.create(params)
        await quickPick.executeCommand('View: Close Editor')
        await expect(reporter).toHaveCount(0)
        await expect(textEditor).toHaveCount(0)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, 'Failed to close issue reporter')
      }
    },
  }
}
