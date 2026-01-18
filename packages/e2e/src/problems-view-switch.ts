import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Problems, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `const x: string = 42
`,
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
  await Editor.open('main.ts')
  await Editor.shouldHaveBreadCrumb('main.ts')
  await Editor.shouldHaveSquigglyError()
  await Problems.show()
  await Problems.shouldHaveCount(1)

  await Problems.switchToTableView()
}

export const run = async ({ Problems }: TestContext): Promise<void> => {
  await Problems.switchToTreeView()

  await Problems.switchToTableView()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
