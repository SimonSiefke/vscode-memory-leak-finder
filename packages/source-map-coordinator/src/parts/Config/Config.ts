import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

const cacheDir = join(Root.root, '.extension-source-maps-cache')

export const getConfigs = () => {
  return [
    {
      extensionName: 'vscode-js-debug',
      repoUrl: 'git@github.com:microsoft/vscode-js-debug.git',
      buildScript: [`npm`, `run`, `package`],
      enabled: true,
      cacheDir,
      modifications: [],
    },
    {
      buildScript: ['npm', 'run', 'build'],
      cacheDir,
      extensionName: 'copilot-chat',
      repoUrl: 'git@github.com:microsoft/vscode-copilot-chat.git',
      version: 'v0.35.3',
      enabled: false,
      modifications: [
        {
          name: '.esbuild.ts',
          occurrence: /sourcemap:\s*isDev\s*\?\s*['"]linked['"]\s*:\s*false/gi,
          replacement: "sourcemap: isDev ? 'linked' : 'linked'",
        },
      ],
    },
  ]
}
