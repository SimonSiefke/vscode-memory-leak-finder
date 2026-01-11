import { join } from 'path'
import { root } from '../Root/Root.ts'

const cacheDir = join(root, '.extension-source-maps-cache')

interface ConfigItem {
  readonly buildScript: readonly string[]
  readonly cacheDir: string
  readonly extensionName: string
  readonly repoUrl: string
  readonly version: string
}

export const config: readonly ConfigItem[] = [
  {
    buildScript: ['npm', 'run', 'build'],
    cacheDir,
    extensionName: 'copilot-chat',
    repoUrl: 'git@github.com:microsoft/vscode-copilot-chat.git',
    version: 'v0.35.3',
  },
  {
    buildScript: [`npm`, `run`, `package`],
    cacheDir,
    extensionName: 'vscode-js-debug',
    repoUrl: 'git@github.com:microsoft/vscode-js-debug.git',
    version: 'v1.105.0',
  },
]
