import type { PerformanceScenario, TestContext } from '../types.ts'

const warmupFileName = 'editor-open-performance-warmup.txt'
const measuredFileName = 'editor-open-performance-measured.txt'

const getFileContent = (label: string): string => {
  return Array.from({ length: 20 }, (_, index) => `${label} line ${String(index + 1).padStart(3, '0')}`).join('\n')
}

const warmupContent = getFileContent('Warmup')
const measuredContent = getFileContent('Measured')

const getIterationFile = (iteration: number) => {
  return iteration < 0
    ? {
        content: warmupContent,
        name: warmupFileName,
      }
    : {
        content: measuredContent,
        name: measuredFileName,
      }
}

export const setupEditorOpenPerformanceScenario = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: warmupContent,
      name: warmupFileName,
    },
    {
      content: measuredContent,
      name: measuredFileName,
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem(measuredFileName)
}

export const createEditorOpenPerformanceScenario = (mode: 'cold' | 'warm'): PerformanceScenario<TestContext> => {
  return {
    mode,
    async prepare({ QuickPick }: TestContext, iteration: number): Promise<void> {
      const file = getIterationFile(iteration)
      await QuickPick.show()
      await QuickPick.clearInput()
      await QuickPick.type(file.name)
      const focusedItem = await QuickPick.getFocusedItemLabel()
      if (focusedItem !== file.name) {
        throw new Error(`Expected quick pick item "${file.name}" to be focused, got "${focusedItem}"`)
      }
    },
    async action({ QuickPick }: TestContext): Promise<void> {
      await QuickPick.acceptSelected()
    },
    async ready({ Editor }: TestContext, iteration: number): Promise<void> {
      const file = getIterationFile(iteration)
      await Editor.waitForTextFileRendered(file.name, file.content)
    },
    async validate({ Editor }: TestContext, iteration: number): Promise<void> {
      const file = getIterationFile(iteration)
      await Editor.shouldHaveBreadCrumb(file.name)
      await Editor.shouldHaveText(file.content, file.name)
      await Editor.shouldBeFocused()
    },
    async reset({ Editor }: TestContext): Promise<void> {
      await Editor.close()
    },
  }
}
