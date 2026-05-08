import type { TestContext } from '../types.js'

const folderPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test-workspace'

// global variable is bad code
let _options = {}

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
  await Workspace.setFiles(initialFiles)
  await Electron.mockOpenDialog({
    canceled: false,
    filePaths: [folderPath],
  })
  await Extensions.install({
    id: 'ms-vscode-remote.remote-ssh',
    name: 'Remote - SSH',
  })
  const connection = await SshServer.launch()
  _options = connection
  await SshClient.connectToSsh(connection)
  await ActivityBar.showExplorer()
  // @ts-ignore
  await SshClient.openFolder(connection)
  await Explorer.refresh()
  await Explorer.shouldHaveItem('error.ts')
  await Explorer.selectItem('error.ts')
  await Editor.shouldHaveText(`let x:string = 1`)
  await Editor.shouldHaveSquigglyError()
  await SideBar.hide()
}

export const run = async ({ SshClient, Explorer, Editor, SideBar, Workspace }: TestContext): Promise<void> => {
  const uuid = crypto.randomUUID()
  // @ts-ignore
  await SshClient.openFolder({
    ..._options,
    workspacePath: `/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test-workspace/${uuid}`,
  })
  await Explorer.refresh()
  for (const item of initialFiles) {
    await Workspace.add({
      name: `${uuid}/${item.name}`,
      content: item.content,
    })
  }
  await Explorer.refresh()
  await Explorer.shouldHaveItem('error.ts')
  await Explorer.selectItem('error.ts')
  await Editor.shouldHaveText(`let x:string = 1`)
  await Editor.shouldHaveSquigglyError()
  await SideBar.hide()
}

export const teardown = async ({ SshServer }: TestContext): Promise<void> => {
  await SshServer.dispose()
}
