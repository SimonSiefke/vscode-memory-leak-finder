import * as HttpProxyServer from '../HttpProxyServer/HttpProxyServer.ts'
import * as CertificateManager from '../CertificateManager/CertificateManager.ts'

let proxyServerInstance: { port: number; url: string; dispose: () => Promise<void> } | null = null

export const createHttpProxyServer = async (
  port: number | undefined,
  useProxyMock: boolean | undefined,
): Promise<{ port: number; url: string }> => {
  if (proxyServerInstance) {
    throw new Error('Proxy server already created')
  }
  proxyServerInstance = await HttpProxyServer.createHttpProxyServer({
    port: port || 0,
    useProxyMock: useProxyMock || false,
  })
  return {
    port: proxyServerInstance.port,
    url: proxyServerInstance.url,
  }
}

export const disposeProxyServer = async (): Promise<void> => {
  if (proxyServerInstance) {
    await proxyServerInstance.dispose()
    proxyServerInstance = null
  }
}

export const getCACertPath = (): string => {
  return CertificateManager.getCACertPath()
}

