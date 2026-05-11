import type { TestContext } from '../types.js'

const folderRoot = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test-workspace'

let workspacePath = folderRoot

const initialFiles = [
  {
    content: `let x:string = 1`,
    name: 'error.ts',
  },
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

export const setup = async ({
  SshServer,
  SshClient,
  Extensions,
  Electron,
  SideBar,
  Panel,
  ActivityBar,
  Workspace,
  Editor,
  Explorer,
}: TestContext): Promise<void> => {
  const uuid = crypto.randomUUID()
  workspacePath = `${folderRoot}/${uuid}`
  await Workspace.setFiles(
    initialFiles.map((item) => {
      return {
        ...item,
        name: `${uuid}/${item.name}`,
      }
    }),
  )
  await Electron.mockOpenDialog({
    canceled: false,
    filePaths: [workspacePath],
  })
  await Extensions.install({
    id: 'ms-vscode-remote.remote-ssh',
    name: 'Remote - SSH',
  })
  const connection = await SshServer.launch()
  await SshClient.connectToSsh(connection)
  await ActivityBar.showExplorer()
  await SshClient.openFolder({
    ...connection,
    workspacePath,
  })
  await Explorer.refresh()
  await Explorer.shouldHaveItem('error.ts')
  await Explorer.selectItem('error.ts')
  await Editor.shouldHaveText(`let x:string = 1`)
  await Editor.shouldHaveSquigglyError()
  await SideBar.hide()
  await Panel.hide()
}

export const run = async ({ Electron, Workbench }: TestContext): Promise<void> => {
  await Workbench.close()
  await Electron.waitForWindowCount(0, 20_000)
}

export const teardown = async ({ SshServer }: TestContext): Promise<void> => {
  await SshServer.dispose()
}
