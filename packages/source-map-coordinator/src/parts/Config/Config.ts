import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

const cacheDir = join(Root.root, '.extension-source-maps-cache')

interface IConfig {
  readonly extensionName: string
  readonly repoUrl: string
  readonly cacheDir: string
  readonly buildScript: readonly string[]
  readonly enabled: boolean
  readonly modifications: readonly any[]
  readonly platform: string
}

export const getConfigs = (): readonly IConfig[] => {
  const platform = process.platform // TODO pass platform as argument
  return [
    {
      extensionName: 'vscode-js-debug',
      repoUrl: 'git@github.com:microsoft/vscode-js-debug.git',
      buildScript: [`npm`, `run`, `package`],
      enabled: true,
      cacheDir,
      modifications: [],
      platform,
    },
    {
      buildScript: ['npm', 'run', 'build'],
      cacheDir,
      extensionName: 'copilot-chat',
      repoUrl: 'git@github.com:microsoft/vscode-copilot-chat.git',
      enabled: false,
      modifications: [
        {
          name: '.esbuild.ts',
          occurrence: /sourcemap:\s*isDev\s*\?\s*['"]linked['"]\s*:\s*false/gi,
          replacement: "sourcemap: isDev ? 'linked' : 'linked'",
        },
      ],
      platform,
    },
  ]
}
