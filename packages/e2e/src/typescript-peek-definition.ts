import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, SideBar, Workspace }: TestContext): Promise<void> => {
  await SideBar.hide()
  await Workspace.setFiles([
    {
      content: `{}
`,
      name: 'tsconfig.json',
    },
    {
      content: `export class DebugNameData {
	constructor(
		public readonly owner: DebugOwner | undefined,
		public readonly debugNameSource: DebugNameSource | undefined,
		public readonly referenceFn: Function | undefined,
	) { }

	public getDebugName(target: object): string | undefined {
		return getDebugName(target, this);
	}
}
`,
      name: 'debugNameData.ts',
    },
    {
      content: `import { DebugNameData } from './debugNameData.ts'

const element = new DebugNameData(1, 2, 3)`,
      name: 'file.ts',
    },
  ])
  await Editor.goToFile({
    column: 25,
    file: 'file.ts',
    line: 3,
  })
  await Editor.shouldHaveSquigglyError()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  // @ts-ignore
  await Editor.peekDefinition({
    itemCount: 2,
  })
  // @ts-ignore
  await Editor.closePeekDefinition()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
