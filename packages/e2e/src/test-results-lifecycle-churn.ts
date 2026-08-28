import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Panel, SideBar, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `# Math

2 + 2 = 4
2 + 2 = 5
`,
      name: 'test-results.md',
    },
  ])
  await Workspace.addExtension('test-provider-sample')
  await Editor.closeAll()
  await Panel.hide()
  await SideBar.hide()
  await Editor.open('test-results.md')
}

export const run = async ({ SideBar, Testing }: TestContext): Promise<void> => {
  await Testing.focusOnTestExplorerView()
  await Testing.runAllTests({
    expectedRowCount: 1,
    expectedTestOutputRowCount: 3,
  })
  await Testing.clearAllResults()
  await SideBar.hide()
}

export const teardown = async ({ Editor, Panel, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Panel.hide()
  await SideBar.hide()
}
