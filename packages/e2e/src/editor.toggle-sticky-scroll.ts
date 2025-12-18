import type { TestContext } from '../types.ts'

export const skip = true

const getContent = (letterCount: number) => {
  let code = ''
  for (let i = 0; i < letterCount; i++) {
    const letterCode = 97 + i
    const letter = String.fromCharCode(letterCode)
    const indent = '  '.repeat(i)
    code += indent + `function ${letter}(){\n\n\n`
  }
  for (let i = 0; i < letterCount; i++) {
    const indent = '  '.repeat(letterCount - i - 1)
    code += indent + `}\n\n`
  }
  return code
}

export const setup = async ({ Workspace, Editor }: TestContext): Promise<void> => {
  const content = getContent(20)
  await Workspace.setFiles([
    {
      name: 'file.js',
      content: content,
    },
  ])
  await Editor.open('file.js')
  await Editor.disableStickyScroll()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.enableStickyScroll()
  await Editor.disableStickyScroll()
}
