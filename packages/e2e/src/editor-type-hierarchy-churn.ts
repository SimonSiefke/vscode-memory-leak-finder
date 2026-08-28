import type { TestContext } from '../types.ts'

export const skip = 1

const content = `Animal

Dog extends Animal

Labrador extends Dog
`

export const setup = async ({ Editor, Extensions, Workspace }: TestContext): Promise<void> => {
  await Extensions.add({
    expectedName: 'type-hierarchy-provider-sample',
    path: 'packages/e2e/fixtures/sample.type-hierarchy-provider',
  })
  await Workspace.setFiles([{ content, name: 'type-hierarchy.txt' }])
  await Editor.closeAll()
  await Editor.goToFile({
    column: 2,
    file: 'type-hierarchy.txt',
    line: 3,
  })
}

export const run = async ({ TypeHierarchy }: TestContext): Promise<void> => {
  await TypeHierarchy.open()
  await TypeHierarchy.focusNext()
  await TypeHierarchy.focusPrevious()
  await TypeHierarchy.close()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
