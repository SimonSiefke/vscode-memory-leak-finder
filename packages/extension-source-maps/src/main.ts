import { join } from 'node:path'
import * as GenerateExtensionSourceMaps from './parts/GenerateExtensionSourceMaps/GenerateExtensionSourceMaps.ts'
import { root } from './parts/Root/Root.ts'

const main = async (): Promise<void> => {
  const cacheDir = join(root, '.extension-source-maps-cache')

  // Generate sourcemaps for copilot-chat
  // await GenerateExtensionSourceMaps.generateExtensionSourceMaps({
  //   cacheDir,
  //   extensionName: 'copilot-chat',
  //   repoUrl: 'git@github.com:microsoft/vscode-copilot-chat.git',
  //   version: 'v0.35.3',
  // })

  // Generate sourcemaps for vscode-js-debug
  await GenerateExtensionSourceMaps.generateExtensionSourceMaps({
    cacheDir,
    extensionName: 'vscode-js-debug',
    repoUrl: 'git@github.com:microsoft/vscode-js-debug.git',
    version: 'v1.105.0',
  })
}

main()
