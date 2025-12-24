import type { TestContext } from '../types.ts'

const initialFiles = [
  {
    content: `export function add(a: number, b: number): number {
  return a + b
}`,
    name: 'add.ts',
  },
  {
    content: `import { add } from './add'

const result = add(1, 2)
console.log(result)
`,
    name: 'a.ts',
  },
  {
    content: `import { add } from './add'

const result = add(3, 4)
console.log(result)
`,
    name: 'b.ts',
  },
  {
    content: `import { add } from './add'

const result = add(5, 6)
console.log(result)
`,
    name: 'c.ts',
  },
  {
    content: `{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "module": "ES2022"
  },
  "include": ["*.ts"]
}
`,
    name: 'tsconfig.json',
  },
]

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles(initialFiles)
  await Editor.closeAll()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.open('add.ts')
  await Editor.open('a.ts')
  await Editor.open('b.ts')
  await Editor.open('c.ts')
  await Editor.switchToTab('add.ts')
  await Editor.shouldHaveText(`export function add(a: number, b: number): number {
  return a + b
}`)
  await Editor.click('add')
  await Editor.rename('subtract')
  await Editor.shouldHaveText(`export function subtract(a: number, b: number): number {
  return a + b
}`)
  await Editor.switchToTab('a.ts')
  await Editor.shouldHaveText(`import { subtract } from './add'

const result = subtract(1, 2)
console.log(result)
`)
  await Editor.switchToTab('b.ts')
  await Editor.shouldHaveText(`import { subtract } from './add'

const result = subtract(3, 4)
console.log(result)
`)
  await Editor.switchToTab('c.ts')
  await Editor.shouldHaveText(`import { subtract } from './add'

const result = subtract(5, 6)
console.log(result)
`)
}

export const teardown = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Editor.saveAll()
  await Editor.closeAll()
  await Workspace.setFiles(initialFiles)
}
