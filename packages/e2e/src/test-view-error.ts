import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Workspace, Editor }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'test-file-1.md',
      content: `# Easy Math

2 + 2 = 4 // this test will pass
2 + 2 = 5 // this test will fail

# Harder Math

230230 + 5819123 = 6049353

3 - 1 = 2
`,
    },
  ])
  await Workspace.addExtension('test-provider-sample')
  await Editor.closeAll()
  await Editor.open('test-file-1.md')
}

export const run = async (): Promise<void> => {
  // TODO
}
