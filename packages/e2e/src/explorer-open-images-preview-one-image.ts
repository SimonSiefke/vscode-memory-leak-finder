import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'text content',
      name: 'folder/readme.txt',
    },
    {
      content: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">
<circle cx="250" cy="250" r="210" fill="#fff" stroke="#000" stroke-width="8"/>
</svg>
`,
      name: 'folder/file.svg',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('folder')
  await Explorer.focus()
}

export const run = async ({ ImagesPreview }: TestContext): Promise<void> => {
  // @ts-ignore
  await ImagesPreview.open('folder')
  await ImagesPreview.shouldHaveImage('file.svg')
  await ImagesPreview.close()
}
