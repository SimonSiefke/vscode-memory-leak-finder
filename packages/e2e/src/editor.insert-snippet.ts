import type { TestContext } from '../types.ts'

const expectedHtml =
  '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n</head>\n<body><h1>hello world</h1>\n    </body>\n</html>'

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'test.html',
      content: '',
    },
  ])
  await Editor.closeAll()
  await Editor.open('test.html')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.type('!')
  await Editor.press('Enter')
  // Press Tab to navigate to lang placeholder
  await Editor.press('Tab')
  await Editor.shouldHaveCursor(/(\d+px)/)
  // Press Tab to navigate to title placeholder
  await Editor.press('Tab')
  await Editor.shouldHaveCursor(/(\d+px)/)
  // Press Tab to navigate to body placeholder
  await Editor.press('Tab')
  await Editor.shouldHaveCursor(/(\d+px)/)
  // Press Tab one more time to exit snippet mode
  await Editor.press('Tab')
  await Editor.shouldHaveCursor(/(\d+px)/)
  await Editor.type('<h1>hello world</h1>')
  await Editor.shouldHaveText(expectedHtml)
  await Editor.selectAll()
  await Editor.deleteAll()
  await Editor.shouldHaveText('')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
