import type { TestContext } from '../types.ts'

export const skip = true

<<<<<<< HEAD
export const setup = async ({ Workspace, Editor, Testing, SideBar }: TestContext): Promise<void> => {
=======
export const setup = async ({ Editor, SideBar, Testing, Workspace }: TestContext): Promise<void> => {
>>>>>>> origin/main
  await Workspace.setFiles([
    {
      content: `# Easy Math

2 + 2 = 4 // this test will pass
2 + 2 = 5 // this test will fail

# Harder Math

230230 + 5819123 = 6049353

3 - 1 = 2
`,
      name: 'test-file-1.md',
    },
  ])
  await Workspace.addExtension('test-provider-sample')
  await Editor.closeAll()
  await SideBar.hide()
  await Editor.open('test-file-1.md')
  // @ts-ignore
  await Testing.focusOnTestExplorerView()
}

// @ts-ignore
export const run = async ({ Testing }): Promise<void> => {
  // TODO
  await Testing.runAllTests({
    expectedRowCount: 1,
    expectedTestOutputRowCount: 5,
  })
}

<<<<<<< HEAD
export const teardown = async ({ SideBar, Editor, Panel }: TestContext): Promise<void> => {
=======
export const teardown = async ({ Editor, Panel, SideBar }: TestContext): Promise<void> => {
>>>>>>> origin/main
  await Editor.closeAll()
  await SideBar.hide()
  await Panel.hide()
}
