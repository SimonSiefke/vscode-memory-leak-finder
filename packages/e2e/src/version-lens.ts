import type { TestContext } from '../types.ts'

export const requiresNetwork = true

export const skip = 1

<<<<<<< HEAD
export const setup = async ({ SideBar, Workspace, Extensions, Editor, ExtensionDetailView }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([
    {
      name: 'package.json',
=======
export const setup = async ({ Editor, ExtensionDetailView, Extensions, SideBar, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([
    {
>>>>>>> origin/main
      content: `{
  "name": "test-project",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "1.0.0"
  }
}`,
<<<<<<< HEAD
=======
      name: 'package.json',
>>>>>>> origin/main
    },
  ])
  await Extensions.show()
  await Extensions.search('version lens')
  await Extensions.first.shouldBe('Version Lens')
  await Extensions.first.click()
  await ExtensionDetailView.installExtension()
  await Editor.closeAll()
  await SideBar.hide()
  await Editor.open('package.json')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  // @ts-ignore
  await Editor.enableVersionLens()
  // @ts-ignore
  await Editor.disableVersionLens()
}
