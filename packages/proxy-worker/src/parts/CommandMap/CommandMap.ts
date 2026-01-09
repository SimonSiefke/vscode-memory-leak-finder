import * as ConvertRequestsToMocks from '../ConvertRequestsToMocks/ConvertRequestsToMocks.ts'
import * as Proxy from '../Proxy/Proxy.ts'

export const commandMap = {
  'ConvertRequestsToMocks.convertRequestsToMocksMain': ConvertRequestsToMocks.convertRequestsToMocksMain,
  'Proxy.createHttpProxyServer': Proxy.createHttpProxyServer,
  'Proxy.disposeProxyServer': Proxy.disposeProxyServer,
  'Proxy.getCACertPath': Proxy.getCACertPath,
  'Proxy.getProxyEnvVars': Proxy.getProxyEnvVars,
  'Proxy.setCurrentTestName': Proxy.setCurrentTestName,
  'Proxy.setupProxy': Proxy.setupProxy,
}
