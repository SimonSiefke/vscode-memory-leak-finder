import { expect, test } from '@jest/globals'
import { getFolderContentHtml } from '../src/parts/GenerateIndexHtml/GenerateIndexHtml.ts'

test('renders Map and Set size charts together with metric and scenario labels', () => {
  const html = getFolderContentHtml('map-and-set-size', [
    'main-map-size-before-after.svg',
    'node-set-size-decreasing-count.svg',
    'styles.css',
  ])

  expect(html).toContain('<h2 class="ChartTitle">main-map-size-before-after</h2>')
  expect(html).toContain('<h2 class="ChartTitle">node-set-size-decreasing-count</h2>')
  expect(html).toContain('src="./main-map-size-before-after.svg"')
  expect(html).toContain('src="./node-set-size-decreasing-count.svg"')
  expect(html).not.toContain('styles.css')
})
