import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Editor, Explorer, Workspace, ContextMenu, ImagesPreview }: TestContext): Promise<void> => {
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
    {
      content: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">
<circle cx="250" cy="250" r="210" fill="#000" stroke="#fff" stroke-width="8"/>
</svg>
`,
      name: 'folder/file2.svg',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('folder')
  await Explorer.focus()
  await Explorer.openContextMenu('folder')
  await ContextMenu.select('Open in Images Preview')
  await ImagesPreview.shouldHaveImage('file.svg')
}

export const run = async ({ ImagesPreview }: TestContext): Promise<void> => {
  await ImagesPreview.next()
  await ImagesPreview.previous()
}

export const teardown = async ({ ImagesPreview }: TestContext): Promise<void> => {
  await ImagesPreview.close()
}
