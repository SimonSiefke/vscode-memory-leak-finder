import * as Proxy from '../Proxy/Proxy.ts'

export const commandMap = {
  'Proxy.createHttpProxyServer': Proxy.createHttpProxyServer,
  'Proxy.disposeProxyServer': Proxy.disposeProxyServer,
  'Proxy.getCACertPath': Proxy.getCACertPath,
}
