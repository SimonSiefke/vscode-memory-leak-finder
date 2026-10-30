import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { expect, test } from '@jest/globals'
import { JSDOM } from 'jsdom'
import { applySiteLayout } from '../src/parts/ApplySiteLayout/ApplySiteLayout.ts'

test('every report can reach every available page, including from nested paths and under a Pages subpath', async () => {
  const root = await mkdtemp(join(tmpdir(), 'charts-layout-'))
  const pages = ['index.html', 'instruction-count/index.html', 'cpu-profile/nested test/index.html']
  try {
    for (const page of pages) {
      await mkdir(dirname(join(root, page)), { recursive: true })
      await writeFile(join(root, page), '<!doctype html><html><head><title>Report</title></head><body><h1>Report</h1></body></html>')
    }
    await applySiteLayout(root)
    for (const page of pages) {
      const html = await readFile(join(root, page), 'utf8')
      const document = new JSDOM(html, { url: `https://example.com/repository/${page}` }).window.document
      const links = [...document.querySelectorAll<HTMLAnchorElement>('.SiteMenu nav a')]
      expect(links).toHaveLength(pages.length)
      for (const link of links) {
        const target = decodeURIComponent(new URL(link.href).pathname.replace('/repository/', ''))
        expect(pages).toContain(target)
        expect(resolve(dirname(join(root, page)), decodeURIComponent(link.getAttribute('href')!))).toBe(join(root, target))
      }
      expect(document.querySelector('[aria-current="page"]')?.getAttribute('href')).toBe(links[pages.indexOf(page)].getAttribute('href'))
      expect(document.querySelector('meta[name="viewport"]')).not.toBeNull()
      expect(document.querySelector('.SiteBrand')?.getAttribute('href')).toBe(links[0].getAttribute('href'))
    }
    const before = await readFile(join(root, pages[2]), 'utf8')
    await applySiteLayout(root)
    expect(await readFile(join(root, pages[2]), 'utf8')).toBe(before)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
