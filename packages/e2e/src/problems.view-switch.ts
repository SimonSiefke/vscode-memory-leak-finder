import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Workspace, Problems }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'src/main.ts',
      content: `const x: string = 42
`,
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
  await Editor.open('main.ts')
  await Editor.shouldHaveBreadCrumb('main.ts')
  await Editor.shouldHaveSquigglyError()
  await Problems.show()
  await Problems.shouldHaveCount(1)
  // @ts-ignore
  await Problems.switchToTableView()
}

export const run = async ({ Problems }: TestContext): Promise<void> => {
  await Problems.switchToListView()
  // @ts-ignore
  await Problems.switchToTableView()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
