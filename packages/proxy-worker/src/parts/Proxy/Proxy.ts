import { readFile, writeFile } from 'node:fs/promises'
import { getCACertPath as getCACertPathImpl } from '../GetCACertPath/GetCACertPath.ts'
import * as HttpProxyServer from '../HttpProxyServer/HttpProxyServer.ts'
import * as SetCurrentTestName from '../SetCurrentTestName/SetCurrentTestName.ts'

let proxyServerInstance: { port: number; url: string; [Symbol.asyncDispose]: () => Promise<void> } | null = null

export const createHttpProxyServer = async (
  port: number | undefined,
  useProxyMock: boolean | undefined,
): Promise<{ port: number; url: string }> => {
  if (proxyServerInstance) {
    throw new Error('Proxy server already created')
  }
  const server = await HttpProxyServer.createHttpProxyServer({
    port: port || 0,
    useProxyMock: useProxyMock || false,
  })
  proxyServerInstance = {
    port: server.port,
    [Symbol.asyncDispose]: server[Symbol.asyncDispose],
    url: server.url,
  }
  return {
    port: proxyServerInstance.port,
    url: proxyServerInstance.url,
  }
}

export const disposeProxyServer = async (): Promise<void> => {
  if (proxyServerInstance) {
    await proxyServerInstance[Symbol.asyncDispose]()
    proxyServerInstance = null
  }
}

export const getCACertPath = (): string => {
  return getCACertPathImpl()
}

export const setupProxy = async (
  port: number | undefined,
  useProxyMock: boolean | undefined,
  settingsPath: string | null,
): Promise<{ port: number; url: string }> => {
  console.log('[Proxy] Creating proxy server...')
  const proxyServer = await createHttpProxyServer(port, useProxyMock)
  console.log(`[Proxy] Proxy server started on ${proxyServer.url} (port ${proxyServer.port})`)

  // Update settings file if path is provided
  if (settingsPath) {
    try {
      const settingsContent = await readFile(settingsPath, 'utf8')
      const settings = JSON.parse(settingsContent)
      settings['http.proxy'] = proxyServer.url
      settings['http.proxyStrictSSL'] = false
      await writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8')
      console.log(`[Proxy] Proxy configured in settings: ${proxyServer.url}`)
    } catch (error) {
      console.error(`[Proxy] Error updating settings file ${settingsPath}:`, error)
      // Continue even if settings update fails
    }
  }

  return proxyServer
}

export const setCurrentTestName = (testName: string | null): void => {
  console.log(`[Proxy.setCurrentTestName] Setting test name to: ${testName}`)
  SetCurrentTestName.setCurrentTestName(testName)
  const verify = SetCurrentTestName.getCurrentTestName()
  console.log(`[Proxy.setCurrentTestName] Verified test name is now: ${verify}`)
}

export { getProxyEnvVars } from '../GetProxyEnvVars/GetProxyEnvVars.ts'
