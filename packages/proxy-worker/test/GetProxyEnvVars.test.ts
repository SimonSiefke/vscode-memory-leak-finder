import { expect, test } from '@jest/globals'
import * as GetProxyEnvVars from '../src/parts/GetProxyEnvVars/GetProxyEnvVars.ts'

test('getProxyEnvVars - includes IPv4 and IPv6 loopback hosts in no-proxy variables', async () => {
  const envVars = await GetProxyEnvVars.getProxyEnvVars('http://localhost:3000')

  expect(envVars.NO_PROXY).toBe('localhost,127.0.0.1,0.0.0.0,::1,chatgpt.com,ab.chatgpt.com')
  expect(envVars.no_proxy).toBe('localhost,127.0.0.1,0.0.0.0,::1,chatgpt.com,ab.chatgpt.com')
  expect(envVars.NODE_EXTRA_CA_CERTS).toBeDefined()
  expect(envVars.NODE_TLS_REJECT_UNAUTHORIZED).toBe('0')
})
