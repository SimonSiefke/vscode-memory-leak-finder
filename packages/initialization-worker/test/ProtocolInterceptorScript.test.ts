import { expect, test } from '@jest/globals'
import { protocolInterceptorScript } from '../src/parts/ProtocolInterceptorScript/ProtocolInterceptorScript.ts'

test('protocolInterceptorScript requests lazy transforms for normal app modules', () => {
  const script = protocolInterceptorScript(33692, '/tmp/.vscode-workbench-tracked-allocations/workbench.desktop.main.js', 'allocations')

  expect(script).toContain("const http = require('http')")
  expect(script).toContain("const requestPath = '/transform?filePath=' + encodeURIComponent(filePath)")
  expect(script).toContain("port: transformServerPort")
  expect(script).toContain('const trackingMode = "allocations"')
  expect(script).toContain('return trackingMode')
  expect(script).toContain("readTransformedFile(filePath).then")
})

test('protocolInterceptorScript uses explicit function tracking mode by default', () => {
  const script = protocolInterceptorScript(33692, '/tmp/.vscode-workbench-tracked-allocations/workbench.desktop.main.js')

  expect(script).toContain('const trackingMode = "functions"')
  expect(script).toContain('return trackingMode')
})

test('protocolInterceptorScript keeps worker and blob script skips', () => {
  const script = protocolInterceptorScript(33692, null)

  expect(script).toContain("lowerUrl.startsWith('blob:')")
  expect(script).toContain("lowerPath.includes('worker')")
  expect(script).toContain("lowerUrl.includes('worker')")
  expect(script).toContain("lowerPath.includes('service-worker')")
})
