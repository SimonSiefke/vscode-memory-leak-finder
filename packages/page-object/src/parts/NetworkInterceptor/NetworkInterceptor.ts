import * as Root from '../Root/Root.ts'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'

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

  const enableProxy = async (): Promise<void> => {
    try {
      // Proxy server is started in LaunchVsCode when --enable-proxy is used
      // We just need to read the settings.json to get the proxy URL and verify it's set
      const settingsPath = getSettingsPath()
      if (existsSync(settingsPath)) {
        const content = await readFile(settingsPath, 'utf8')
        const settings = JSON.parse(content)
        if (settings['http.proxy']) {
          console.log(`[NetworkInterceptor] Proxy already configured: ${settings['http.proxy']}`)
          return
        }
      }
      // If proxy is not configured, that's okay - it might not be enabled
      console.log('[NetworkInterceptor] No proxy configured in settings')
    } catch (error) {
      throw new VError(error, `Failed to enable proxy`)
    }
  }

  const disableProxy = async (): Promise<void> => {
    try {
      // Remove proxy from VS Code settings
      await updateVsCodeSettings(null)
    } catch (error) {
      throw new VError(error, `Failed to disable proxy`)
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
