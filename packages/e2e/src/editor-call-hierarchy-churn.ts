import type { TestContext } from '../types.ts'

export const skip = 1

const content = `function leaf(): void {}

function middle(): void {
  leaf()
}

function root(): void {
  middle()
}

root()
const invalid: string = 1
`

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([{ content, name: 'call-hierarchy.ts' }])
  await Editor.closeAll()
  await Editor.goToFile({
    column: 25,
    file: 'call-hierarchy.ts',
    line: 12,
  })
  await Editor.shouldHaveSquigglyError()
  await Editor.goToFile({
    column: 10,
    file: 'call-hierarchy.ts',
    line: 3,
  })
}

export const run = async ({ CallHierarchy }: TestContext): Promise<void> => {
  await CallHierarchy.open()
  await CallHierarchy.focusNext()
  await CallHierarchy.focusPrevious()
  await CallHierarchy.close()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
