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
  await new Promise((resolve) => setTimeout(resolve, 2000))
  await Problems.show()
  await Problems.shouldHaveCount(1)
}

export const run = async ({ Problems }: TestContext): Promise<void> => {
  await Problems.switchToListView()
  await Problems.shouldBeInListView()
  await Problems.switchToTreeView()
  await Problems.shouldBeInTreeView()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
