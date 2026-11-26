import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Panel, SideBar, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `# Math

1 + 1 = 2
2 + 2 = 4
`,
      name: 'coverage.md',
    },
  ])
  await Workspace.addExtension('test-provider-sample')
  await Editor.closeAll()
  await Panel.hide()
  await SideBar.hide()
  await Editor.open('coverage.md')
}

export const run = async ({ Panel, SideBar, Testing }: TestContext): Promise<void> => {
  await Testing.focusOnTestExplorerView()
  await Testing.runAllTestsWithCoverage()
  await Testing.shouldHaveSummary('2/2')

  // The heading is the only statement that no test executes.
  await Testing.shouldHaveCoverageDecorations({ hit: 2, miss: 1 })
  await Testing.openCoverage()
  await Testing.shouldHaveCoverageRows([{ file: 'coverage.md', percent: '66.67%' }])

  await Testing.toggleInlineCoverage({ enabled: true })
  await Testing.toggleInlineCoverage({ enabled: false })

  await Testing.closeCoverage()
  await Testing.shouldHaveNoCoverage()

  await Testing.clearAllResults()
  await Panel.hide()
  await SideBar.hide()
}

export const teardown = async ({ Editor, Panel, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Panel.hide()
  await SideBar.hide()
}
