import { readFile, writeFile } from 'fs/promises'
import { getCACertPath as getCACertPathImpl } from '../GetCACertPath/GetCACertPath.ts'
import * as HttpProxyServer from '../HttpProxyServer/HttpProxyServer.ts'

let proxyServerInstance: { port: number; url: string; [Symbol.asyncDispose]: () => Promise<void> } | null = null

export const createHttpProxyServer = async (
  port: number | undefined,
  useProxyMock: boolean | undefined,
): Promise<{ port: number; url: string }> => {
  if (proxyServerInstance) {
    throw new Error('Proxy server already created')
  }
  proxyServerInstance = await HttpProxyServer.createHttpProxyServer(port || 0)
  if (!proxyServerInstance) {
    throw new Error('Failed to create proxy server')
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

export const getProxyEnvVars = async (proxyUrl: string | null): Promise<Record<string, string>> => {
  const envVars: Record<string, string> = {}

  if (proxyUrl) {
    envVars.HTTP_PROXY = proxyUrl
    envVars.HTTPS_PROXY = proxyUrl
    envVars.http_proxy = proxyUrl
    envVars.https_proxy = proxyUrl
    // Don't proxy localhost connections
    envVars.NO_PROXY = 'localhost,127.0.0.1,0.0.0.0'
    envVars.no_proxy = 'localhost,127.0.0.1,0.0.0.0'

    // Set NODE_EXTRA_CA_CERTS to trust our MITM proxy CA certificate
    const caCertPath = getCACertPathImpl()
    envVars.NODE_EXTRA_CA_CERTS = caCertPath

    console.log(`[Proxy] Generated proxy environment variables: HTTP_PROXY=${proxyUrl}`)
    console.log(`[Proxy] Set NODE_EXTRA_CA_CERTS=${caCertPath}`)
  }

  return envVars
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

  // Wait a bit to ensure proxy server is ready
  await new Promise((resolve) => setTimeout(resolve, 100))

  return proxyServer
}
