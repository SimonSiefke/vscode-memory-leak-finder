import type { TestContext } from '../types.ts'

export const requiresNetwork = true

export const skip = 1

export const setup = async ({ Editor, Extensions, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([
    {
      content: `{
  "name": "test-project",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "1.0.0"
  }
}`,
      name: 'package.json',
    },
  ])
  await Extensions.install({
    id: 'version lens',
    name: 'Version Lens',
  })
  await Editor.open('package.json')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.enableVersionLens()

  await Editor.disableVersionLens()
}
