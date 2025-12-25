export const create = ({ expect, ideVersion, page, VError }) => {
  return {
    async openReplace() {
      try {
        const findWidget = page.locator('.find-widget.visible')
        await page.waitForIdle()
        const toggleReplace = findWidget.locator('[aria-label="Toggle Replace"]')
        await expect(toggleReplace).toBeVisible()
        const expanded = await toggleReplace.getAttribute('aria-expanded')
        if (expanded === 'true') {
          return
        }
        await page.waitForIdle()
        await toggleReplace.click()
        await page.waitForIdle()
        await expect(toggleReplace).toHaveAttribute('aria-expanded', 'true')
        await page.waitForIdle()
        const replace = page.locator('.replace-part .monaco-findInput textarea[aria-label="Replace"]')
        await expect(replace).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open replace`)
      }
    },
    async replace() {
      try {
        await page.waitForIdle()
        const findWidget = page.locator('.find-widget.visible')
        await expect(findWidget).toBeVisible()
        await page.waitForIdle()
        const button = findWidget.locator('[aria-label^="Replace All"][tabIndex="0"]')
        await expect(button).toBeVisible()
        await button.click()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to replace`)
      }
    },
    async setReplaceValue(value: string) {
      try {
        await page.waitForIdle()
        const findWidget = page.locator('.find-widget.visible')
        await expect(findWidget).toBeVisible()
        await page.waitForIdle()
        const toggleReplace = findWidget.locator('[aria-label="Toggle Replace"]')
        await expect(toggleReplace).toBeVisible()
        await page.waitForIdle()
        const replace = page.locator('.replace-part .monaco-findInput textarea[aria-label="Replace"]')
        await expect(replace).toBeVisible()
        await page.waitForIdle()
        await replace.focus()
        await page.waitForIdle()
        await replace.setValue(value)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to set replace value`)
      }
    },
    async setSearchValue(value: string) {
      try {
        await page.waitForIdle()
        const input = page.locator('.find-part .monaco-findInput textarea[aria-label="Find"]')
        await input.setValue(value)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to set search value`)
      }
    },
  }
}
