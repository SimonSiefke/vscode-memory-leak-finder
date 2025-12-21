import type { TestContext } from '../types.ts'

const originalContent = `import { unused } from './add.ts'
import { used } from './add.ts'

export const main = () => {
  return used()
}
`

export const skip = 1

<<<<<<< HEAD
export const setup = async ({ Editor, Workspace, Explorer }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'src/main.ts',
      content: originalContent,
    },
    {
      name: 'src/add.ts',
=======
export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: originalContent,
      name: 'src/main.ts',
    },
    {
>>>>>>> origin/main
      content: `export const used = () => {
  return 42
}

export const unused = () => {
  return 0
}
`,
<<<<<<< HEAD
    },
    {
      name: 'tsconfig.json',
=======
      name: 'src/add.ts',
    },
    {
>>>>>>> origin/main
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
<<<<<<< HEAD
=======
      name: 'tsconfig.json',
>>>>>>> origin/main
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.expand('src')
  await Explorer.shouldHaveItem('main.ts')
  await Editor.open('main.ts')
  // @ts-ignore
  await Editor.setCursor(5, 1)
  await Editor.shouldHaveBreadCrumb('main.ts')
  await Editor.shouldHaveBreadCrumb('main')
  await Editor.shouldHaveSquigglyError()
}

export const run = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  // Wait a bit for TypeScript language server to initialize

  await new Promise((resolve) => setTimeout(resolve, 2000))

  await Editor.showSourceAction()
  await Editor.selectSourceAction('Organize Imports')
  await Editor.shouldHaveText(`import { used } from './add.ts'

export const main = () => {
  return used()
}
`)
  await Workspace.add({
<<<<<<< HEAD
    name: 'src/main.ts',
    content: originalContent,
=======
    content: originalContent,
    name: 'src/main.ts',
>>>>>>> origin/main
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
