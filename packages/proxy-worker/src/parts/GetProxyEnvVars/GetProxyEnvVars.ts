import { getCACertPath } from '../GetCACertPath/GetCACertPath.ts'

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
    const caCertPath = getCACertPath()
    envVars.NODE_EXTRA_CA_CERTS = caCertPath

    console.log(`[Proxy] Generated proxy environment variables: HTTP_PROXY=${proxyUrl}`)
    console.log(`[Proxy] Set NODE_EXTRA_CA_CERTS=${caCertPath}`)
  }

  return envVars
}
