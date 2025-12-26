import fetch from 'node-fetch'
import { HttpProxyAgent } from 'http-proxy-agent'
import * as HttpProxyServer from '../src/parts/HttpProxyServer/HttpProxyServer.ts'

// Start proxy server
console.log('Starting proxy server...')
const proxyServer = await HttpProxyServer.createHttpProxyServer({
  port: 0, // Let system assign a free port
  useProxyMock: true,
})
console.log(`Proxy server running on ${proxyServer.url}`)

const proxyUrl = proxyServer.url
const targetUrl = 'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery'

const agent = new HttpProxyAgent(proxyUrl)

const body =
  '{"filters":[{"criteria":[{"filterType":10,"value":"copilot2"},{"filterType":8,"value":"Microsoft.VisualStudio.Code"},{"filterType":12,"value":"4096"}],"pageNumber":1,"pageSize":50,"sortBy":0,"sortOrder":0}],"assetTypes":[],"flags":950}'

console.log('Making request through proxy...')
const response = await fetch(targetUrl, {
  method: 'POST',
  agent,
  headers: {
    accept: 'application/json;api-version=3.0-preview.1',
    'accept-language': 'en-US',
    'content-type': 'application/json',
    'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Linux"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    'x-market-client-id': 'VSCode 1.106.0',
  },
  body,
})

console.log(`Status: ${response.status}`)
console.log(`Headers:`, Object.fromEntries(response.headers.entries()))

const responseData = await response.text()
try {
  const parsed = JSON.parse(responseData)
  console.log('Response:', JSON.stringify(parsed, null, 2))
} catch (e) {
  console.log('Response:', responseData)
}

await proxyServer.dispose()
console.log('Proxy server stopped')
