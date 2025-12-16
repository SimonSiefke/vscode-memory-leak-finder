export const create = ({ expect, page, VError }) => {
  return {
    async shouldHaveHeading(text) {
      try {
        const extensionEditor = page.locator('.extension-editor')
        await expect(extensionEditor).toBeVisible()
        const name = extensionEditor.locator('.name')
        await expect(name).toBeVisible()
        await expect(name).toHaveText(text)
      } catch (error) {
        throw new VError(error, `Failed to verify extension detail heading ${text}`)
      }
    },
    async selectCategory(text) {
      try {
        const category = page.locator('.extension-editor .category', {
          hasText: text,
        })
        await expect(category).toBeVisible()
        await category.click()
      } catch (error) {
        throw new VError(error, `Failed to select extension detail category ${text}`)
      }
    },
    async shouldHaveTab(text) {
      try {
        const tab = page.locator('.extension-editor .action-label', {
          hasText: text,
        })
        await expect(tab).toBeVisible()
        await expect(tab).toHaveAttribute('aria-checked', 'true')
      } catch (error) {
        throw new VError(error, `Failed to verify extension detail tab ${text}`)
      }
    },
    async openFeature(featureName) {
      try {
        const tab = page.locator(`.extension-feature-list-item[aria-label="${featureName}"]`)
        await expect(tab).toBeVisible()
        await tab.click()
        await page.waitForIdle()
        await expect(tab).toHaveAttribute('aria-selected', 'true')
      } catch (error) {
        throw new VError(error, `Failed to open feature ${featureName}`)
      }
    },
    async shouldHaveFeatureHeading(featureText) {
      try {
        const featureTitle = page.locator(`.feature-title`)
        await expect(featureTitle).toBeVisible()
        await expect(featureTitle).toHaveText(featureText)
      } catch (error) {
        throw new VError(error, `Failed to check feature heading ${featureText}`)
      }
    },
    async openTab(text, options) {
      try {
        const tab = page.locator('.extension-editor .action-label', {
          hasText: text,
        })
        await page.waitForIdle()
        await expect(tab).toBeVisible()
        await page.waitForIdle()
        await tab.click()
        await page.waitForIdle()
        await expect(tab).toHaveAttribute('aria-checked', 'true')
        await page.waitForIdle()
        if (options && options.webView) {
          const webView = page.locator('.webview')
          await expect(webView).toBeVisible()
          await page.waitForIdle()
          await expect(webView).toHaveClass('ready', {
            timeout: options?.timeout,
          })
        } else if (options) {
          const webView = page.locator('.webview')
          await expect(webView).toBeHidden()
        }
      } catch (error) {
        throw new VError(error, `Failed to open extension detail tab ${text}`)
      }
    },
    async enableExtension(options) {
      try {
        const extensionEditor = page.locator('.extension-editor')
        const disabledStatusLabel = extensionEditor.locator('.extension-status-label[aria-label="Disabled"]')
        if (!options?.force) {
          await expect(disabledStatusLabel).toBeVisible()
        }
        const action = extensionEditor.locator('.action-label[aria-label^="Enable"]')
        await action.click()
        await expect(disabledStatusLabel).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to enable extension`)
      }
    },
    async disableExtension() {
      try {
        const extensionEditor = page.locator('.extension-editor')
        const action = extensionEditor.locator('.action-label[aria-label^="Disable"]')
        await action.click()
        const disabledStatusLabel = extensionEditor.locator('.extension-status-label[aria-label="Disabled"]')
        await expect(disabledStatusLabel).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to disable extension`)
      }
    },
    async installExtension() {
      try {
        await page.waitForIdle()
        const extensionEditor = page.locator('.extension-editor')
        await expect(extensionEditor).toBeVisible()
        
        // Look for install button - it might have different labels
        const installButton = extensionEditor.locator('.action-label[aria-label^="Install"], .action-label[aria-label*="Install"]')
        const installButtonCount = await installButton.count()
        
        if (installButtonCount > 0) {
          const isVisible = await installButton.isVisible().catch(() => false)
          if (isVisible) {
            await installButton.click()
            await page.waitForIdle({ timeout: 30000 })
            // Wait a bit for installation to complete
            const { resolve, promise } = Promise.withResolvers<void>()
            setTimeout(resolve, 2000)
            await promise
          }
        } else {
          // Extension might already be installed - check for "Uninstall" or "Installed" status
          const installedLabel = extensionEditor.locator('.extension-status-label[aria-label="Installed"], .action-label[aria-label*="Uninstall"]')
          const installedCount = await installedLabel.count()
          if (installedCount > 0) {
            // Extension is already installed, just wait a bit
            await page.waitForIdle()
          }
        }
      } catch (error) {
        throw new VError(error, `Failed to install extension`)
      }
    },
  }
}
