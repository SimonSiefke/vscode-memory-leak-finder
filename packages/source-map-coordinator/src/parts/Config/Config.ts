import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

const cacheDir = join(Root.root, '.extension-source-maps-cache')

interface IConfig {
  readonly buildScript: readonly string[]
  readonly cacheDir: string
  readonly enabled: boolean
  readonly extensionName: string
  readonly friendlyName: string
  readonly match: string
  readonly modifications: readonly any[]
  readonly pathReplacements: readonly any[]
  readonly platform: string
  readonly repoUrl: string
  readonly resolveVersion: string
}

export const getConfigs = (platform: string): readonly IConfig[] => {
  return [
    {
      buildScript: [`npm`, `run`, `package`],
      cacheDir,
      enabled: true,
      extensionName: 'vscode-js-debug',
      friendlyName: 'js-debug',
      match: 'extensions/ms-vscode.js-debug/',
      modifications: [],
      pathReplacements: [
        {
          occurrence: /^src/,
          replacement: 'dist/src',
        },
      ],
      platform,
      repoUrl: 'git@github.com:microsoft/vscode-js-debug.git',
      resolveVersion: 'packageJson',
    },
    {
      buildScript: ['npm', 'run', 'build'],
      cacheDir,
      enabled: false,
      extensionName: 'copilot-chat',
      friendlyName: 'github-copilot-chat',
      match: 'extensions/ms-vscode.js-debug/',
      modifications: [
        {
          name: '.esbuild.ts',
          occurrence: /sourcemap:\s*isDev\s*\?\s*['"]linked['"]\s*:\s*false/gi,
          replacement: "sourcemap: isDev ? 'linked' : 'linked'",
        },
      ],
      pathReplacements: [],
      platform,
      repoUrl: 'git@github.com:microsoft/vscode-copilot-chat.git',
      resolveVersion: 'packageJson',
    },
  ]
}
