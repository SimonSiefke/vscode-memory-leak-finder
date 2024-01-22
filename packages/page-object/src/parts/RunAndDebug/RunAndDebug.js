export const create = ({ expect, page, VError }) => {
  return {
    async startRunAndDebug() {
      try {
        const button = page.locator('.monaco-button:has-text("Run and Debug")')
        await expect(button).toBeVisible()
        await button.click()
        const quickPickWidget = page.locator('.quick-input-widget')
        await expect(quickPickWidget).toBeVisible()
        const nodeJsOption = page.locator('[role="option"][aria-label="Node.js"]')
        await nodeJsOption.click()
        const debugToolBar = page.locator('.debug-toolbar')
        await expect(debugToolBar).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to start run and debug`)
      }
    },
    async pause() {
      try {
        const debugToolBar = page.locator('.debug-toolbar')
        await expect(debugToolBar).toBeVisible()
        const pauseButton = debugToolBar.locator('[aria-label^="Pause"]')
        await expect(pauseButton).toBeVisible()
        await page.waitForIdle()
        await page.waitForIdle()
        await page.waitForIdle()
        await page.waitForIdle()
        await page.waitForIdle()
        await page.waitForIdle()
        await page.waitForIdle()
        await page.waitForIdle()
        await page.waitForIdle()
        await page.waitForIdle()
        await page.waitForIdle()
        await page.waitForIdle()
        await pauseButton.click()
        await page.waitForIdle()
        await expect(pauseButton).toBeHidden({
          timeout: 20_000,
        })
        const continueButton = debugToolBar.locator('[aria-label^="Continue"]')
        await expect(continueButton).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to pause`)
      }
    },
    async stop() {
      try {
        const debugToolBar = page.locator('.debug-toolbar')
        await expect(debugToolBar).toBeVisible()
        const stopButton = debugToolBar.locator('[aria-label^="Stop"]')
        await expect(stopButton).toBeVisible()
        await stopButton.click()
        await expect(stopButton).toBeHidden()
        await expect(debugToolBar).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to stop`)
      }
    },
  }
}
