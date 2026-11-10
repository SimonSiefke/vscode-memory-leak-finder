import { expect, test } from '@jest/globals'
import { getExtensionHostOverviewHtml } from '../src/parts/GenerateIndexHtml/GenerateIndexHtml.ts'

test('extension-host overview links only to generated measure chart folders', () => {
  const html = getExtensionHostOverviewHtml([
    { folder: 'array-count', files: ['base.svg'] },
    { folder: 'function-count', files: ['base.svg'] },
  ])

  expect(html).toContain('<title>VS Code Extension Host Memory Charts</title>')
  expect(html).toContain('href="./array-count/index.html">array-count</a>')
  expect(html).toContain('src="./array-count/base.svg" alt="base.svg"')
  expect(html).toContain('href="./function-count/index.html">function-count</a>')
  expect(html).toContain('src="./function-count/base.svg" alt="base.svg"')
  expect(html).toContain('href="../index.html">All process charts</a>')
  expect(html).not.toContain('detached-dom-node-count')
})

test('extension-host overview escapes labels and encodes relative links', () => {
  const html = getExtensionHostOverviewHtml([{ folder: 'array count & size', files: ['base.svg'] }])

  expect(html).toContain('href="./array%20count%20%26%20size/index.html">array count &amp; size</a>')
  expect(html).toContain('src="./array%20count%20%26%20size/base.svg"')
})
