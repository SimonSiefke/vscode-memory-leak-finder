import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import type { CreateParams } from '../CreateParams/CreateParams.ts'

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  return {
    async disableExtension() {
      try {
        const extensionEditor = page.locator('.extension-editor')
        await expect(extensionEditor).toBeVisible()
        const disabledStatusLabel = extensionEditor.locator('.extension-status-label[aria-label="Disabled"]')
        if (await disabledStatusLabel.isVisible().catch(() => false)) {
          return false
        }
        const action = extensionEditor.locator('.action-label[aria-label^="Disable"]').first()
        if ((await action.count()) === 0) {
          return false
        }
        await expect(action).toBeVisible()
        const actionLabel = await action.getAttribute('aria-label')
        if (actionLabel?.startsWith('Disable AI Features')) {
          const actionItem = extensionEditor.locator(
            '.action-item.action-dropdown-item:has(.action-label[aria-label^="Disable AI Features"])',
          )
          const dropDown = actionItem.locator('.action-label.dropdown')
          await expect(dropDown).toBeVisible()
          await dropDown.click()
          const contextMenu = ContextMenu.create({ electronApp, expect, ideVersion, page, platform, VError })
          await contextMenu.select('Disable AI Features (Workspace)')
        } else {
          await action.click()
        }
        const enableAction = extensionEditor.locator('.action-label[aria-label^="Enable"]')
        await expect(enableAction).toBeVisible()
        await page.waitForIdle()
        return true
      } catch (error) {
        throw new VError(error, `Failed to disable extension`)
      }
    },
    async enableExtension(options?: any) {
      try {
        const extensionEditor = page.locator('.extension-editor')
        await expect(extensionEditor).toBeVisible()
        const disabledStatusLabel = extensionEditor.locator('.extension-status-label[aria-label="Disabled"]')
        if (!options?.force) {
          await expect(disabledStatusLabel).toBeVisible()
        }
        const enableAction = extensionEditor.locator('.action-label[aria-label^="Enable"]')
        const disableAction = extensionEditor.locator('.action-label[aria-label^="Disable"]')
        const disableCount = await disableAction.count()
        if (disableCount > 0) {
          return
        }
        await enableAction.click()
        await page.waitForIdle()
        await expect(disabledStatusLabel).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to enable extension`)
      }
    },
    async installExtension() {
      try {
        await page.waitForIdle()
        const extensionEditor = page.locator('.extension-editor')
        await expect(extensionEditor).toBeVisible()
        await page.waitForIdle()
        const unInstallButton = extensionEditor.locator('.action-label[aria-label^="Uninstall"], .action-label[aria-label*="Uninstall"]')
        const count = await unInstallButton.count()
        if (count > 0) {
          return
        }
        const installButton = extensionEditor.locator('.action-label[aria-label^="Install"], .action-label[aria-label*="Install"]')
        await expect(installButton).toBeVisible()
        await page.waitForIdle()
        await installButton.click()
        await page.waitForIdle()
        await expect(installButton).toBeHidden()
        await page.waitForIdle()
        const popup = page.locator('.monaco-dialog-box[aria-modal="true"]')
        // TODO ugly timeout
        await new Promise((r) => {
          setTimeout(r, 300)
        })
        const popupCount = await popup.count()
        if (popupCount > 0) {
          const acceptButton = popup.locator('.dialog-buttons .monaco-button', { hasText: 'Trust Publisher & Install' })
          await expect(acceptButton).toBeVisible()
          await page.waitForIdle()

          await acceptButton.click()
          await page.waitForIdle()
          await expect(popup).toBeHidden()
          await page.waitForIdle()
        }

        await expect(unInstallButton).toBeVisible({ timeout: 120_000 })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to install extension`)
      }
    },
    async openFeature(featureName: string) {
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
    async openTab(text: string, options?: any) {
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
    async selectCategory(text: string) {
      try {
        await page.waitForIdle()
        const category = page.locator('.extension-editor .category', {
          hasText: text,
        })
        await expect(category).toBeVisible()
        await page.waitForIdle()
        await category.click()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to select extension detail category ${text}`)
      }
    },
    async shouldHaveFeatureHeading(featureText: string) {
      try {
        const featureTitle = page.locator(`.feature-title`)
        await expect(featureTitle).toBeVisible()
        await expect(featureTitle).toHaveText(featureText)
      } catch (error) {
        throw new VError(error, `Failed to check feature heading ${featureText}`)
      }
    },
    async shouldHaveHeading(text: string) {
      try {
        const extensionEditor = page.locator('.active .extension-editor')
        await expect(extensionEditor).toBeVisible()
        await page.waitForIdle()
        const name = extensionEditor.locator('.name')
        await expect(name).toBeVisible()
        await page.waitForIdle()
        await expect(name).toHaveText(text)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify extension detail heading ${text}`)
      }
    },
    async shouldHaveTab(text: string) {
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
  }
}
