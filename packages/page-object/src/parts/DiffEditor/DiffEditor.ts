import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as Character from '../Character/Character.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as Explorer from '../Explorer/Explorer.ts'
import * as SideBar from '../SideBar/SideBar.ts'

const isNoteBook = (file: string) => {
  return file.endsWith('.ipynb')
}

const normalizeText = (value: string) => {
  return value.replaceAll('\u00a0', ' ').replaceAll('\n', ' ')
}

const wait = (milliseconds: number) => {
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(resolve, milliseconds)
  return promise
}

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  return {
    async expectModified(text: string) {
      try {
        const modified = page.locator('.editor.modified .view-lines')
        await expect(modified).toHaveText(text)
      } catch (error) {
        throw new VError(error, `Failed to verify modified text ${text}`)
      }
    },
    async expectOriginal(text: string) {
      try {
        const original = page.locator('.editor.original .view-lines')
        await expect(original).toHaveText(text)
      } catch (error) {
        throw new VError(error, `Failed to verify original text ${text}`)
      }
    },
    async open({
      cell1Content,
      cell2Content,
      file1,
      file1Content,
      file2,
      file2Content,
    }: {
      file1: string
      file2: string
      file1Content: string
      file2Content: string
      cell2Content: string
      cell1Content: string
    }) {
      try {
        const explorer = Explorer.create({ electronApp, expect, ideVersion, page, platform, VError })
        const contextMenu = ContextMenu.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        const sideBar = SideBar.create({ electronApp, expect, ideVersion, page, platform, VError })
        await explorer.focus()
        await explorer.openContextMenu(file1)
        await contextMenu.select('Select for Compare')
        await explorer.openContextMenu(file2)
        await contextMenu.select('Compare with Selected')
        await sideBar.hide()
        const arrow = '↔'
        const tab = page.locator('.tab', { hasText: `${file1} ${arrow} ${file2}` })
        await expect(tab).toBeVisible()
        await page.waitForIdle()
        if (isNoteBook(file1)) {
          const original = page.locator(`.monaco-diff-editor .monaco-editor[data-uri*="${file1}"]`)
          await expect(original).toBeVisible()
          const modified = page.locator(`.monaco-diff-editor .monaco-editor[data-uri*="${file2}"]`)
          await expect(modified).toBeVisible()
          if (cell1Content) {
            const lines = original.locator('.view-lines')
            await expect(lines).toHaveText(cell1Content)
          }
          if (cell2Content) {
            const lines = modified.locator('.view-lines')
            await expect(lines).toHaveText(cell2Content)
          }
        } else {
          const original = page.locator(`.monaco-diff-editor .monaco-editor[data-uri$="${file1}"]`)
          await expect(original).toBeVisible()
          const modified = page.locator(`.monaco-diff-editor .monaco-editor[data-uri$="${file2}"]`)
          await expect(modified).toBeVisible()
          if (file1Content) {
            const lines = original.locator('.view-lines')
            await expect(lines).toHaveText(file1Content)
          }
          if (file2Content) {
            const lines = modified.locator('.view-lines')
            await expect(lines).toHaveText(file2Content)
          }
        }
      } catch (error) {
        throw new VError(error, `Failed to open diff editor`)
      }
    },
    async scrollDown() {
      try {
        await page.waitForIdle()
        const scrollContainer = page.locator('.notebook-text-diff-editor .monaco-scrollable-element')
        await expect(scrollContainer).toBeVisible()
        await scrollContainer.scrollDown()
      } catch (error) {
        throw new VError(error, `Failed to scroll down in diff editor`)
      }
    },
    async scrollDownInline() {
      try {
        await page.waitForIdle()
        const scrollContainer = page.locator('.monaco-diff-editor .monaco-scrollable-element')
        await expect(scrollContainer).toBeVisible()
        await scrollContainer.scrollDown()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to scroll down in inline diff editor`)
      }
    },
    async scrollUp() {
      try {
        await page.waitForIdle()
        const scrollContainer = page.locator('.notebook-text-diff-editor .monaco-scrollable-element')
        await expect(scrollContainer).toBeVisible()
        await scrollContainer.scrollUp()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to scroll up in diff editor`)
      }
    },
    async scrollUpInline() {
      try {
        await page.waitForIdle()
        const scrollContainer = page.locator('.monaco-diff-editor .monaco-scrollable-element')
        await expect(scrollContainer).toBeVisible()
        await scrollContainer.scrollUp()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to scroll up in inline diff editor`)
      }
    },
    async shouldHaveModifiedEditor(text: string) {
      try {
        const editor = page.locator('.editor.modified')
        const editorLines = editor.locator('.view-lines')
        const actualText = text.replaceAll(Character.NewLine, Character.EmptyString).replaceAll(Character.Space, Character.NonBreakingSpace)
        await expect(editorLines).toHaveText(actualText, {
          timeout: 3000,
        })
      } catch (error) {
        throw new VError(error, `Failed to assert modified editor contents`)
      }
    },
    async shouldHaveOriginalEditor(text: string) {
      try {
        const editor = page.locator('.editor.original')
        const editorLines = editor.locator('.view-lines')
        const actualText = text.replaceAll(Character.NewLine, Character.EmptyString).replaceAll(Character.Space, Character.NonBreakingSpace)
        await expect(editorLines).toHaveText(actualText, {
          timeout: 3000,
        })
      } catch (error) {
        throw new VError(error, `Failed to assert original editor contents`)
      }
    },
    async stageChange(text: string) {
      const actionLabels = ['Stage Block', 'Stage Change', 'Stage Selection']
      try {
        const modifiedEditor = page.locator('.monaco-diff-editor .editor.modified')
        await expect(modifiedEditor).toBeVisible()
        const lines = modifiedEditor.locator('.view-line')
        let count = 0
        for (let i = 0; i < 20; i++) {
          count = await lines.count()
          if (count > 0) {
            break
          }
          const box = await modifiedEditor.boundingBox()
          if (box) {
            await page.mouse.move(box.x + Math.min(40, box.width / 2), box.y + Math.min(40, box.height / 2))
          }
          await wait(250)
        }
        let line = null
        for (let i = 0; i < count; i++) {
          const candidate = lines.nth(i)
          const candidateText = normalizeText((await candidate.textContent()) || '')
          if (candidateText.includes(text)) {
            line = candidate
            break
          }
        }
        if (!line) {
          const gutter = page.locator('.monaco-diff-editor .gutter').first()
          const gutterBox = await gutter.boundingBox()
          if (gutterBox) {
            await page.mouse.move(gutterBox.x + Math.min(20, gutterBox.width / 2), gutterBox.y + 20)
            await wait(250)
          }
          const plusActions = page.locator('.monaco-diff-editor .gutterItem .action-label.codicon-plus')
          const plusActionCount = await plusActions.count()
          let topMostPlusAction = null
          let topMostY = Number.POSITIVE_INFINITY
          for (let i = 0; i < plusActionCount; i++) {
            const plusAction = plusActions.nth(i)
            if (!(await plusAction.isVisible())) {
              continue
            }
            const plusBox = await plusAction.boundingBox()
            if (!plusBox) {
              continue
            }
            if (plusBox.y < topMostY) {
              topMostY = plusBox.y
              topMostPlusAction = plusAction
            }
          }
          if (topMostPlusAction) {
            await topMostPlusAction.click()
            return
          }
          // this is terrible ai slop
          const debug = await page.evaluate({
            expression: `(() => {
              const diff = document.querySelector('.monaco-diff-editor')
              const modified = document.querySelector('.monaco-diff-editor .editor.modified')
              const classes = Array.from(document.querySelectorAll('.monaco-diff-editor [class]'))
                .map((element) => element.className)
                .filter((value) => typeof value === 'string')
                .slice(0, 50)
              const texts = Array.from(document.querySelectorAll('.monaco-diff-editor .view-lines'))
                .map((element) => element.textContent || '')
                .slice(0, 10)
              return {
                diffClass: diff ? diff.className : null,
                modifiedClass: modified ? modified.className : null,
                viewLineCount: document.querySelectorAll('.monaco-diff-editor .view-line').length,
                viewLinesCount: document.querySelectorAll('.monaco-diff-editor .view-lines').length,
                classes,
                texts,
              }
            })()`,
            returnByValue: true,
          })
          throw new Error(`modified line not found, debug: ${JSON.stringify(debug)}`)
        }
        await expect(line).toBeVisible()
        const box = await line.boundingBox()
        if (!box) {
          throw new Error(`modified line bounding box not found`)
        }
        const y = box.y + box.height / 2
        await page.mouse.move(box.x + 5, y)
        await page.mouse.move(Math.max(0, box.x - 24), y)
        for (const label of actionLabels) {
          const candidates = [
            page.locator(`[aria-label="${label}"]`),
            page.locator(`[title="${label}"]`),
            page.locator(`button[aria-label="${label}"]`),
            page.locator(`button[title="${label}"]`),
          ]
          for (const candidate of candidates) {
            const count = await candidate.count()
            if (count === 0) {
              continue
            }
            const action = candidate.first()
            if (!(await action.isVisible())) {
              continue
            }
            await action.click()
            return
          }
        }
        const visibleLabels = await page.evaluate({
          expression: `(() => {
            return Array.from(document.querySelectorAll('[aria-label], [title]'))
              .map((element) => element.getAttribute('aria-label') || element.getAttribute('title'))
              .filter((value) => value)
              .slice(0, 200)
          })()`,
          returnByValue: true,
        })
        throw new Error(`stage action not found, visible labels: ${JSON.stringify(visibleLabels)}`)
      } catch (error) {
        throw new VError(error, `Failed to stage change containing "${text}"`)
      }
    },
  }
}
