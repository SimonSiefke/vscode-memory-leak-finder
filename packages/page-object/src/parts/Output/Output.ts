import * as CreateParams from '../CreateParams/CreateParams.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as Panel from '../Panel/Panel.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, ideVersion, page, platform, VError }: CreateParams.CreateParams) => {
  return {
    async clearFilter() {
      try {
        await page.waitForIdle()
        const outputView = page.locator('.pane-body.output-view')
        await expect(outputView).toBeVisible()
        const findMatch = page.locator('.findMatchInline').first()
        await expect(findMatch).toBeVisible()
        const outputActions = page.locator('[aria-label="Output actions"]')
        await expect(outputActions).toBeVisible()
        const input = outputActions.locator('.input[placeholder="Filter"]')
        await expect(input).toBeVisible()
        await input.focus()
        await page.waitForIdle()
        await input.clear()
        await page.waitForIdle()
        await expect(input).toHaveValue('')
        await page.waitForIdle()
        // await expect(findMatch).toBeHidden({ timeout: 10_000 })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed clear filter output`)
      }
    },
    async filter(filterValue: string) {
      try {
        await page.waitForIdle()
        const outputView = page.locator('.pane-body.output-view')
        await expect(outputView).toBeVisible()
        await page.waitForIdle()
        const outputActions = page.locator('[aria-label="Output actions"]')
        await expect(outputActions).toBeVisible()
        await page.waitForIdle()
        const input = outputActions.locator('.input[placeholder^="Filter"]')
        await expect(input).toBeVisible()
        await page.waitForIdle()
        await input.focus()
        await page.waitForIdle()
        await expect(input).toBeFocused()
        await page.waitForIdle()
        await input.clear()
        await page.waitForIdle()
        await input.setValue(filterValue)
        await page.waitForIdle()
        const findMatch = page
          .locator('.findMatchInline', {
            hasText: filterValue,
          })
          .first()
        await expect(findMatch).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to filter output`)
      }
    },
    async hide() {
      try {
        const outputView = page.locator('.pane-body.output-view')
        await expect(outputView).toBeVisible()
        const panel = Panel.create({ expect, ideVersion, page, platform, VError })
        await panel.hide()
        await expect(outputView).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide output`)
      }
    },
    async openEditor() {
      try {
        await page.waitForIdle()
        const moreActions = page.locator('.panel [aria-label="Views and More Actions..."]')
        await expect(moreActions).toBeVisible()
        await page.waitForIdle()
        await moreActions.focus()
        await page.waitForIdle()
        await expect(moreActions).toBeFocused()
        await page.waitForIdle()
        await moreActions.click()
        await page.waitForIdle()
        const contextMenu = ContextMenu.create({ expect, ideVersion, page, platform, VError })
        await contextMenu.shouldHaveItem('Open Output in Editor')
        await contextMenu.select('Open Output in Editor')
        await page.waitForIdle()
        const editor = page.locator('.part.editor .editor-instance[data-mode-id="log"]')
        await expect(editor).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open output in editor`)
      }
    },
    async select(channelName: string, options: { shouldHaveContent?: boolean } = {}) {
      try {
        const outputView = page.locator('.pane-body.output-view')
        await expect(outputView).toBeVisible()
        const select = page.locator('.panel [aria-label="Output actions"] .monaco-select-box')
        await expect(select).toBeVisible()
        await page.waitForIdle()
        const current = await select.getValue()
        if (current === channelName) {
          return
        }
        const quickPick = QuickPick.create({ expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.SelectOutputChannel, {
          pressKeyOnce: true,
          stayVisible: true,
        })
        await quickPick.select(channelName)
        await expect(select).toHaveValue(channelName)

        const nameLower = channelName.toLowerCase()
        const editor = page.locator(`.monaco-editor[data-uri^="output:${nameLower}"]`)
        await expect(editor).toBeVisible()
        await page.waitForIdle()

        if (options.shouldHaveContent) {
          const lines = editor.locator('.view-line')
          const count = await lines.count()
          if (count === 0) {
            throw new Error(`channel has no content`)
          }
        }
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to select output channel ${channelName}`)
      }
    },
    async show() {
      try {
        await page.waitForIdle()
        const outputView = page.locator('.pane-body.output-view')
        await expect(outputView).toBeHidden()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.OutputFocusOnOutputView)
        await page.waitForIdle()
        await expect(outputView).toBeVisible()
        await page.waitForIdle()
        const paneBody = page.locator('.pane-body.output-view')
        await expect(paneBody).toBeVisible()
        await page.waitForIdle()
        if (ideVersion && ideVersion.minor <= 100) {
          const inputArea = paneBody.locator('.inputarea')
          await expect(inputArea).toBeVisible()
          await page.waitForIdle()
          await expect(inputArea).toBeFocused()
        } else {
          const inputArea = paneBody.locator('.native-edit-context')
          await expect(inputArea).toBeVisible()
          await page.waitForIdle()
          await expect(inputArea).toBeFocused()
        }
        await page.waitForIdle()
        const viewLines = outputView.locator('.view-lines')
        await expect(viewLines).toBeVisible()
        await page.waitForIdle()
        const select = page.locator('.panel [aria-label="Output actions"] .monaco-select-box')
        await expect(select).toBeVisible()
        await page.waitForIdle()
        const cursor = outputView.locator('.cursor.monaco-mouse-cursor-text')
        await expect(cursor).toBeVisible()
        await page.waitForIdle()
        await expect(cursor).toHaveCount(1)
        await page.waitForIdle()
        const clearAction = page.locator('.panel [aria-label="Clear Output"]')
        await expect(clearAction).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show output`)
      }
    },
  }
}
