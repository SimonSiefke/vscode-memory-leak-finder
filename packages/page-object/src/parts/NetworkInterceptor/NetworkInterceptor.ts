import { createHttpProxyServer } from './HttpProxyServer.ts'
import * as Root from '../Root/Root.ts'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'

const REQUESTS_DIR = join(Root.root, '.vscode-requests')

const getSettingsPath = (): string => {
  // VS Code settings are stored in userDataDir/User/settings.json
  // Use the same path as the launch worker
  const userDataDir = join(Root.root, '.vscode-user-data-dir')
  return join(userDataDir, 'User', 'settings.json')
}

const updateVsCodeSettings = async (proxyUrl: string | null): Promise<void> => {
  const settingsPath = getSettingsPath()
  let settings: any = {}

  if (existsSync(settingsPath)) {
    try {
      const content = await readFile(settingsPath, 'utf8')
      settings = JSON.parse(content)
    } catch (error) {
      // If settings file is invalid, start fresh
      settings = {}
    }
  }

  if (proxyUrl) {
    settings['http.proxy'] = proxyUrl
    settings['http.proxyStrictSSL'] = false
  } else {
    delete settings['http.proxy']
    delete settings['http.proxyStrictSSL']
  }

  const { mkdir } = await import('fs/promises')
  const { dirname } = await import('path')
  await mkdir(dirname(settingsPath), { recursive: true })
  await writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8')
}


export const create = ({ page, VError }) => {
  let isEnabled = false
  let proxyServer: { port: number; url: string; dispose: () => Promise<void> } | null = null

  const enableProxy = async (): Promise<void> => {
    if (proxyServer) {
      return
    }

    try {
      // Start proxy server
      proxyServer = await createHttpProxyServer(0)

      // Update VS Code settings to use the proxy
      await updateVsCodeSettings(proxyServer.url)
    } catch (error) {
      throw new VError(error, `Failed to enable proxy server`)
    }
  }

  const disableProxy = async (): Promise<void> => {
    if (!proxyServer) {
      return
    }

    try {
      // Remove proxy from VS Code settings
      await updateVsCodeSettings(null)

      // Stop proxy server
      await proxyServer.dispose()
      proxyServer = null
    } catch (error) {
      throw new VError(error, `Failed to disable proxy server`)
    }
  }

  return {
    async enable() {
      if (isEnabled) {
        return
      }

      try {
        await enableProxy()
        isEnabled = true
      } catch (error) {
        throw new VError(error, `Failed to enable network interceptor`)
      }
    },
    async disable() {
      if (!isEnabled) {
        return
      }

      try {
        await disableProxy()
        isEnabled = false
      } catch (error) {
        throw new VError(error, `Failed to disable network interceptor`)
      }
    },
    async [Symbol.asyncDispose]() {
      await disableProxy()
    },
  }
}
