import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

// Monaco renders spaces as non-breaking spaces.
const toTextPattern = (value: string): RegExp => {
  const escaped = value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll(' ', '[ \\u00a0]')
  return new RegExp(escaped)
}

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  const getEditor = () => page.locator('.merge-editor')
  const getResultView = () => getEditor().locator('.code-view.result')
  const getMergeChanges = () => page.locator('.sidebar [role="treeitem"][aria-label="Merge Changes"]')
  const getQuickPick = () => QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })

  return {
    async acceptAllIncoming() {
      try {
        await expect(getEditor()).toBeVisible()
        await getQuickPick().executeCommand(WellKnownCommands.MergeEditorAcceptAllIncomingChangesFromLeft)
      } catch (error) {
        throw new VError(error, `Failed to accept all incoming changes in the merge editor`)
      }
    },
    async completeMerge() {
      try {
        await expect(getEditor()).toBeVisible()
        await getQuickPick().executeCommand(WellKnownCommands.GitCompleteMerge)
        await expect(getEditor()).toBeHidden({ timeout: 15_000 })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to complete merge`)
      }
    },
    async openFromSourceControl(fileName: string) {
      try {
        await expect(getMergeChanges()).toBeVisible({ timeout: 15_000 })
        const file = page.locator(`.sidebar [role="treeitem"][aria-label^="${fileName}, "]`).first()
        await expect(file).toBeVisible({ timeout: 15_000 })
        await page.waitForIdle()
        await file.click()
        await expect(getEditor()).toBeVisible({ timeout: 15_000 })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open "${fileName}" in the merge editor from Source Control`)
      }
    },
    async shouldBeClosed() {
      try {
        await expect(getEditor()).toHaveCount(0)
      } catch (error) {
        throw new VError(error, `Expected merge editor to be closed`)
      }
    },
    async shouldBeVisible() {
      try {
        await expect(getEditor()).toBeVisible()
        await expect(getEditor().locator('.code-view.input')).toHaveCount(2)
        await expect(getEditor().locator('.code-view.input').nth(0)).toBeVisible()
        await expect(getEditor().locator('.code-view.input').nth(1)).toBeVisible()
        await expect(getResultView()).toBeVisible()
      } catch (error) {
        throw new VError(error, `Expected merge editor with incoming, current and result views to be visible`)
      }
    },
    async shouldHaveNoMergeChanges() {
      try {
        await expect(getMergeChanges()).toBeHidden({ timeout: 15_000 })
      } catch (error) {
        throw new VError(error, `Expected Source Control to have no merge changes`)
      }
    },
    async shouldHaveRemainingConflicts(count: number) {
      try {
        const noun = count === 1 ? 'Conflict' : 'Conflicts'
        const detail = getResultView().locator('.header .detail')
        await expect(detail).toBeVisible()
        await expect(detail).toHaveText(new RegExp(`^\\s*${count} ${noun} Remaining\\s*$`))
      } catch (error) {
        throw new VError(error, `Expected merge editor to have ${count} remaining conflicts`)
      }
    },
    async shouldHaveResultContaining(text: string) {
      try {
        const lines = getResultView().locator('.view-lines')
        await expect(lines).toBeVisible()
        await expect(lines).toHaveText(toTextPattern(text))
      } catch (error) {
        throw new VError(error, `Expected merge editor result to contain "${text}"`)
      }
    },
  }
}
