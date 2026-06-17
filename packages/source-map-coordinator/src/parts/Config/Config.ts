import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

const cacheDir = join(Root.root, '.extension-source-maps-cache')

interface IConfig {
  readonly buildScript: readonly string[]
  readonly cacheDir: string
  readonly enabled: boolean
  readonly extensionName: string
  readonly friendlyName: string
  readonly modifications: readonly any[]
  readonly pathReplacements: readonly any[]
  readonly platform: string
  readonly repoUrl: string
  readonly match: string
  readonly resolveVersion: string
}

export const getConfigs = (platform: string): readonly IConfig[] => {
  return [
    {
      extensionName: 'vscode-js-debug',
      repoUrl: 'git@github.com:microsoft/vscode-js-debug.git',
      buildScript: [`npm`, `run`, `package`],
      enabled: true,
      cacheDir,
      modifications: [],
      platform,
      friendlyName: 'js-debug',
      match: 'extensions/ms-vscode.js-debug/',
      resolveVersion: 'packageJson',
      pathReplacements: [
        {
          occurrence: /^src/,
          replacement: 'dist/src',
        },
      ],
    },
    {
      friendlyName: 'github-copilot-chat',
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
      match: 'extensions/ms-vscode.js-debug/',
      resolveVersion: 'packageJson',
      pathReplacements: [],
    },
  ]
}
