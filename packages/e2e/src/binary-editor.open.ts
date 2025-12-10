import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Workspace, Explorer, Editor }: TestContext): Promise<void> => {
  const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f])
  await Workspace.setFiles([
    {
      name: 'file.bin',
      content: binaryContent,
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('file.bin')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.open('file.bin')
  await Editor.close()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
