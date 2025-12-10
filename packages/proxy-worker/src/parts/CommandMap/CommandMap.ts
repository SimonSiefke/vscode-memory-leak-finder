import * as Proxy from '../Proxy/Proxy.ts'
import * as ConvertRequestsToMocks from '../ConvertRequestsToMocks/ConvertRequestsToMocks.ts'

export const commandMap = {
  'Proxy.createHttpProxyServer': Proxy.createHttpProxyServer,
  'Proxy.disposeProxyServer': Proxy.disposeProxyServer,
  'Proxy.getCACertPath': Proxy.getCACertPath,
  'Proxy.getProxyEnvVars': Proxy.getProxyEnvVars,
  'ConvertRequestsToMocks.convertRequestsToMocksMain': ConvertRequestsToMocks.convertRequestsToMocksMain,
}
