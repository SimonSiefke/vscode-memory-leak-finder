import * as MarkdownTyping from '../helpers/markdownTyping.ts'
import type { TestContext } from '../types.ts'

// Retains undo history intentionally; opt in for growth measurements.
export const skip = 1

export const requiresNetwork = true

export const setup = async (context: TestContext): Promise<void> => {
  const { Editor, Extensions, ExtensionDetailView, RunningExtensions, SideBar, Workspace } = context
  await Editor.closeAllEditorGroups()
  await Workspace.setFiles([
    {
      name: 'main.py',
      content: 'def add(a: int, b: int) -> int:\n    return a + b\n',
    },
  ])
  for (const extension of [
    { id: 'ms-python.python', name: 'Python' },
    { id: 'ms-python.vscode-pylance', name: 'Pylance' },
  ]) {
    await Extensions.show()
    await Extensions.search(`@id:${extension.id}`)
    await Extensions.first.shouldBe(extension.name)
    await Extensions.first.click()
    await ExtensionDetailView.installExtension()
    await ExtensionDetailView.enableExtension({ force: true })
    await SideBar.hide()
    await Editor.closeAll()
  }
  await Editor.open('main.py')
  await Editor.shouldHaveBreadCrumb('add')
  await RunningExtensions.showAndWaitFor('Python')
  await RunningExtensions.showAndWaitFor('Pylance')
  await Editor.closeAll()
  await SideBar.hide()
  await MarkdownTyping.setup(context, { tracked: false, gitEnabled: true })
}

export const run = MarkdownTyping.run
export const teardown = MarkdownTyping.teardown
