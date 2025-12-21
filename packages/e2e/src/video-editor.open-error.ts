import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = 1

// Minimal valid MP4 file (ftyp box only)
// This is the smallest valid MP4 file structure
const minimalMp4 = Buffer.from([
  // ftyp box (20 bytes)
  0x00,
  0x00,
  0x00,
  0x20, // box size (32 bytes)
  0x66,
  0x74,
  0x79,
  0x70, // 'ftyp'
  0x69,
  0x73,
  0x6f,
  0x6d, // major brand 'isom'
  0x00,
  0x00,
  0x02,
  0x00, // minor version
  0x69,
  0x73,
  0x6f,
  0x6d, // compatible brand 'isom'
  0x69,
  0x73,
  0x6f,
  0x32, // compatible brand 'iso2'
  0x6d,
  0x70,
  0x34,
  0x31, // compatible brand 'mp41'
])

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: minimalMp4,
      name: 'test-video.mp4',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('test-video.mp4')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.open('test-video.mp4', {
    hasError: true,
  })
  await Editor.close()
}
