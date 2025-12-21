import type { TestContext } from '../types.js'

const originalContent = `
const a = 1
const b = 2
const result = a + b

`

export const skip = 1

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: originalContent,
      name: 'src/main.ts',
    },
    {
      content: `{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "module": "ES2022"
  },
  "include": ["src"]
}
`,
      name: 'tsconfig.json',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.expand('src')
  await Explorer.shouldHaveItem('main.ts')
  await Editor.open('main.ts')
  await Editor.shouldHaveBreadCrumb('main.ts')
}

export const run = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Editor.shouldHaveText(originalContent)

  // @ts-ignore
  await Editor.setCursor(2, 3)
  await Editor.selectAll()
  // @ts-ignore
  await Editor.showRefactor()
  // @ts-ignore
  await Editor.selectRefactor('Extract to function in global scope')
  // @ts-ignore
  await Editor.acceptRename()
  await Editor.shouldHaveText(`
newFunction()

function newFunction() {
    const a = 1
    const b = 2
    const result = a + b
}

`)
  await Editor.save({ viaKeyBoard: true })

  await Workspace.add({
    content: originalContent,
    name: 'src/main.ts',
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
