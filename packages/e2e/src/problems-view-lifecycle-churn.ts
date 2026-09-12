import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Panel, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'const value: string = 42\n',
      name: 'problems.ts',
    },
  ])
  await Editor.closeAll()
  await Panel.hide()
  await Editor.open('problems.ts')
  await Editor.shouldHaveSquigglyError()
}

export const run = async ({ Problems }: TestContext): Promise<void> => {
  await Problems.show()
  await Problems.shouldHaveCount(1)
  await Problems.switchToTableView()
  await Problems.filter('problems.ts')
  await Problems.clearFilter()
  await Problems.switchToTreeView()
  await Problems.hide()
}

export const teardown = async ({ Editor, Panel }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Panel.hide()
}
