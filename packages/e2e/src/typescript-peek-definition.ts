import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Workspace, SideBar }: TestContext): Promise<void> => {
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
      name: 'file.ts',
      content: `import { DebugNameData } from './debugNameData.ts'

const element = new DebugNameData(1, 2, 3)`,
    },
  ])
  await Editor.goToFile({
    file: 'file.ts',
    line: 3,
    column: 25,
  })
  await Editor.shouldHaveSquigglyError()
}

export const run = async ({ Editor, Notification }: TestContext): Promise<void> => {
  // TODO open peek definition
  // await Editor.goToSourceDefinition({ hasDefinition: false })
  // await Notification.closeAll()
  await new Promise((r) => {})
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
