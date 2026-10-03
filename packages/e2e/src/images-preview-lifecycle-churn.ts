import type { TestContext } from '../types.ts'

export const skip = 1

const image = (fill: string, stroke: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">
  <circle cx="250" cy="250" r="210" fill="${fill}" stroke="${stroke}" stroke-width="8"/>
</svg>
`

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    { content: image('#fff', '#000'), name: 'images/first.svg' },
    { content: image('#000', '#fff'), name: 'images/second.svg' },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('images')
}

export const run = async ({ ImagesPreview }: TestContext): Promise<void> => {
  await ImagesPreview.open('images')
  try {
    await ImagesPreview.shouldHaveImage('first.svg')
    await ImagesPreview.next()
    await ImagesPreview.previous()
  } finally {
    await ImagesPreview.close()
  }
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
