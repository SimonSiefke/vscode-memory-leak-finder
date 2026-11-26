import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  const getTimelineHeader = () => page.locator('.pane-header[aria-label^="Timeline"]').first()
  const getTimelineRows = () => page.locator('.timeline-tree-view .monaco-list-row')
  const getTimelineRow = (name: string) => page.locator('.timeline-tree-view .monaco-list-row', { hasText: name })

  return {
    async open(fileName: string) {
      try {
        await page.waitForIdle()
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        const file = explorer.locator('.monaco-list-row', {
          hasText: fileName,
        })
        await expect(file).toBeVisible({
          timeout: 30_000,
        })
        await file.click({
          button: 'right',
        })
        const contextMenu = ContextMenu.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await contextMenu.select(WellKnownCommands.OpenTimeline)
        await this.shouldBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open timeline`)
      }
    },
    async runItemAction(name: string, action: string) {
      try {
        await this.shouldBeVisible()
        const item = getTimelineRow(name)
        await expect(item).toHaveCount(1, {
          timeout: 30_000,
        })
        const contextMenu = ContextMenu.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await contextMenu.open(item)
        await contextMenu.select(action)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to run timeline action "${action}" on item "${name}"`)
      }
    },
    async shouldBeVisible() {
      try {
        const timelineHeader = getTimelineHeader()
        await expect(timelineHeader).toBeVisible({
          timeout: 30_000,
        })
      } catch (error) {
        throw new VError(error, `Failed to verify timeline visibility`)
      }
    },
    async shouldHaveItem(name: string) {
      try {
        const timelineHeader = getTimelineHeader()
        await expect(timelineHeader).toBeVisible({
          timeout: 30_000,
        })
        const item = page.locator(`.monaco-list-row[aria-label*="${name}"], .monaco-list-row:has-text("${name}")`).first()
        await expect(item).toBeVisible({
          timeout: 30_000,
        })
      } catch (error) {
        throw new VError(error, `Failed to verify timeline item "${name}"`)
      }
    },
    async shouldHaveItemCount(count: number) {
      try {
        await this.shouldBeVisible()
        await expect(getTimelineRows()).toHaveCount(count, {
          timeout: 30_000,
        })
      } catch (error) {
        throw new VError(error, `Failed to verify timeline item count ${count}`)
      }
    },
    async shouldNotHaveItem(name: string) {
      try {
        await this.shouldBeVisible()
        await expect(getTimelineRow(name)).toHaveCount(0, {
          timeout: 30_000,
        })
      } catch (error) {
        throw new VError(error, `Failed to verify timeline item "${name}" is absent`)
      }
    },
  }
}
