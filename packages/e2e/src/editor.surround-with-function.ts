import type { TestContext } from '../types.js'

const originalContent = `
const a = 1
const b = 2
const result = a + b

`

export const skip = 1

export const setup = async ({ Editor, Workspace, Explorer }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'src/main.ts',
      content: originalContent,
    },
    {
      name: 'tsconfig.json',
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
  // @ts-ignore
  await Editor.setCursor(2, 3)
  await Editor.selectAll()
  // @ts-ignore
  await Editor.showRefactor()
  await Editor.selectSourceAction('Extract Function')
  await Editor.shouldHaveText(`function extractedFunction() {
  const a = 1
  const b = 2
  const result = a + b
  return result
}

export const main = () => {
  const result = extractedFunction()
  return result
}
`)
  await Workspace.add({
    name: 'src/main.ts',
    content: originalContent,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
