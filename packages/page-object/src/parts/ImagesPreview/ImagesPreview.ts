import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as Explorer from '../Explorer/Explorer.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'

export const create = ({ expect, page, VError, ideVersion, electronApp, platform }: CreateParams) => {
  return {
    async close() {
      try {
        await page.waitForIdle()
        const preview = page.locator('.image-carousel-editor')
        await expect(preview).toBeVisible()
        await page.keyboard.press('Escape')
        await page.waitForIdle()
        await expect(preview).toBeHidden()
        await page.waitForIdle()
        const focusElement = page.locator('.explorer-viewlet .monaco-list')
        await expect(focusElement).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to hide images preview`)
      }
    },
    async open(folderName:string) {
      try {
        const explorer=Explorer.create({page, expect, VError, ideVersion, electronApp, platform})
          await explorer.openContextMenu(folderName)
const menu=ContextMenu.create({expect, page, VError, electronApp, ideVersion, platform})
await menu.select('Open in Images Preview')

// TODO wait for images preview to be visible

      } catch (error) {
        throw new VError(error, `Failed show images preview`)
      }
    },
    async next() {
      try {
        await page.waitForIdle()
        const preview = page.locator('.image-carousel-editor')
        await expect(preview).toBeVisible()
        const nextButton = preview.locator('[aria-label="Next image"]')
        await expect(nextButton).toBeVisible()
        await page.waitForIdle()
        await nextButton.click()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to click next`)
      }
    },
    async previous() {
      try {
        await page.waitForIdle()
        const preview = page.locator('.image-carousel-editor')
        await expect(preview).toBeVisible()
        const nextButton = preview.locator('[aria-label="Previous image"]')
        await expect(nextButton).toBeVisible()
        await page.waitForIdle()
        await nextButton.click()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to click previous`)
      }
    },
    async shouldHaveImage(src: string) {
      try {
        await page.waitForIdle()
        const preview = page.locator('.image-carousel-editor')
        await expect(preview).toBeVisible()
        await page.waitForIdle()
        const image = preview.locator('.main-image')
        await expect(image).toBeVisible()
        await page.waitForIdle()
        // TODO
        // await expect(image).toHaveAttribute('complete', true)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify that images preview has image with src "${src}"`)
      }
    },
  }
}
