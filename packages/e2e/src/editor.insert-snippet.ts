import type { TestContext } from '../types.ts'

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
  // Press Tab 3-4 times to navigate to body
  for (let i = 0; i < 4; i++) {
    await Editor.press('Tab')
  }
  await Editor.type('h1 hello world')
  await Editor.shouldHaveText(
    '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n</head>\n<body>\n    <h1>hello world</h1>\n</body>\n</html>',
  )
  await Editor.selectAll()
  await Editor.deleteAll()
  await Editor.shouldHaveText('')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
