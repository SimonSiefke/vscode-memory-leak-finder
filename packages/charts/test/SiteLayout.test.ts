import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { expect, test } from '@jest/globals'
import { JSDOM } from 'jsdom'
import { applySiteLayout } from '../src/parts/ApplySiteLayout/ApplySiteLayout.ts'

test('every report can reach every available page, including from nested paths and under a Pages subpath', async () => {
  const root = await mkdtemp(join(tmpdir(), 'charts-layout-'))
  const pages = ['index.html', 'instruction-count/index.html', "cpu-profile/nested test & example's/index.html"]
  const siteUrl = 'https://simonsiefke.github.io/vscode-memory-leak-finder/'
  const canonicalUrls = [siteUrl, `${siteUrl}instruction-count/`, `${siteUrl}cpu-profile/nested%20test%20%26%20example's/`]
  try {
    for (const page of pages) {
      await mkdir(dirname(join(root, page)), { recursive: true })
      await writeFile(join(root, page), '<!doctype html><html><head><title>Report</title></head><body><h1>Report</h1></body></html>')
    }
    await applySiteLayout(root)
    expect(await readFile(join(root, 'favicon.svg'), 'utf8')).toContain('<svg')
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
      const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
      expect(favicon?.getAttribute('type')).toBe('image/svg+xml')
      const faviconBase = relative(dirname(join(root, page)), root).replaceAll('\\', '/') || '.'
      expect(favicon?.getAttribute('href')).toBe(`${faviconBase}/favicon.svg`)
      expect(resolve(dirname(join(root, page)), favicon?.getAttribute('href') ?? '')).toBe(join(root, 'favicon.svg'))
      expect(document.querySelector('.SiteBrand')?.getAttribute('href')).toBe(links[0].getAttribute('href'))
      const description = document.querySelector('meta[name="description"]')?.getAttribute('content')
      expect(description).toContain('VS Code')
      if (page !== 'index.html') expect(description).toContain(document.querySelector('.SitePage')?.textContent)
      expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(canonicalUrls[pages.indexOf(page)])
      expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(canonicalUrls[pages.indexOf(page)])
      expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe(description)
      expect(document.querySelector('link[rel="sitemap"]')?.getAttribute('href')).toBe(`${siteUrl}sitemap.xml`)
    }
    const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8')
    const xml = new JSDOM(sitemap, { contentType: 'application/xml' }).window.document
    expect(xml.documentElement.namespaceURI).toBe('http://www.sitemaps.org/schemas/sitemap/0.9')
    expect([...xml.querySelectorAll('loc')].map((loc) => loc.textContent)).toEqual(canonicalUrls)
    const before = await readFile(join(root, pages[2]), 'utf8')
    await applySiteLayout(root)
    expect(await readFile(join(root, pages[2]), 'utf8')).toBe(before)
    expect(await readFile(join(root, 'sitemap.xml'), 'utf8')).toBe(sitemap)
    expect(await readFile(join(root, 'favicon.svg'), 'utf8')).toContain('<svg')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
