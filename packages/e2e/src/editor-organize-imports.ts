import type { TestContext } from '../types.ts'

const originalContent = `import { unused } from './add.ts'
import { used } from './add.ts'

export const main = () => {
  return used()
}
`

export const skip = 1

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: originalContent,
      name: 'src/main.ts',
    },
    {
      content: `export const used = () => {
  return 42
}

export const unused = () => {
  return 0
}
`,
      name: 'src/add.ts',
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
  await Editor.setCursor(5, 1)
  await Editor.shouldHaveBreadCrumb('main.ts')
  await Editor.shouldHaveBreadCrumb('main')
  await Editor.shouldHaveSquigglyError()
  await Editor.setCursor(1, 1)
  // @ts-ignore
  await Editor.shouldHaveLightBulb()
}

export const run = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  // Wait a bit for TypeScript language server to initialize

  // TODO set cursor and wait for spark
  await new Promise((resolve) => setTimeout(resolve, 2000))

  await Editor.showSourceAction()
  await Editor.selectSourceAction('Organize Imports')
  await Editor.shouldHaveText(`import { used } from './add.ts'

export const main = () => {
  return used()
}
`)
  await Workspace.add({
    content: originalContent,
    name: 'src/main.ts',
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
