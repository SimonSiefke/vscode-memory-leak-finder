import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { expect, test } from '@jest/globals'
import { JSDOM } from 'jsdom'
import { findPromiseStackTraceFolders } from '../src/parts/FindPromiseStackTraceFolders/FindPromiseStackTraceFolders.ts'
import { generatePromiseStackTraceHtmlForFolder } from '../src/parts/GeneratePromiseStackTraceHtmlForFolder/GeneratePromiseStackTraceHtmlForFolder.ts'
import { getCodeFrame } from '../src/parts/GetCodeFrame/GetCodeFrame.ts'
import * as Root from '../src/parts/Root/Root.ts'

const withSource = async (fn: (hash: string, location: string) => Promise<void>) => {
  const sources = join(Root.root, '.vscode-sources')
  await mkdir(sources, { recursive: true })
  const source = await mkdtemp(join(sources, 'promise-code-frame-test-'))
  try {
    await mkdir(join(source, 'src'))
    await writeFile(
      join(source, 'src', 'promise.ts'),
      [
        '// first',
        '// second',
        'function createPromise() {',
        '  return new Promise(() => "<pending>")',
        '}',
        '// sixth',
        '// seventh',
        '// eighth',
      ].join('\n'),
    )
    await fn(basename(source), 'src/promise.ts:4:2')
  } finally {
    await rm(source, { recursive: true, force: true })
  }
}

test('renders Babel context and a caret at the zero-based source-map column, using the matching source revision', async () => {
  await withSource(async (hash, location) => {
    const frame = await getCodeFrame(location, hash)
    expect(frame).toBe(
      [
        '  2 | // second',
        '  3 | function createPromise() {',
        '> 4 |   return new Promise(() => "<pending>")',
        '    |   ^',
        '  5 | }',
        '  6 | // sixth',
      ].join('\n'),
    )
    expect(await getCodeFrame('src/promise.ts:4:0', hash)).toContain('    | ^')
    expect(await getCodeFrame(`at createPromise (${location})`, hash)).toBe(frame)
    expect(await getCodeFrame(location, `${hash}-missing`)).toBeNull()
    expect(await getCodeFrame('not a source location', hash)).toBeNull()
  })
})

test('discovers promise folders under the renderer and other process results', async () => {
  const root = await mkdtemp(join(tmpdir(), 'promise-folders-'))
  try {
    const folders = [join(root, 'promisesWithStackTrace'), join(root, 'extension-host', 'promises-with-stack-trace')]
    for (const folder of folders) await mkdir(folder, { recursive: true })
    expect((await findPromiseStackTraceFolders(root)).sort()).toEqual(folders.sort())
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('writes black/red charts and source frames above complete stacks, retaining duplicate locations and escaping source text', async () => {
  await withSource(async (hash, location) => {
    const root = await mkdtemp(join(tmpdir(), 'promise-report-'))
    try {
      const source = join(root, 'results')
      const target = join(root, 'charts')
      await mkdir(source)
      await mkdir(target)
      await writeFile(
        join(source, 'scenario & growth.json'),
        JSON.stringify({
          promisesWithStackTrace: [
            { count: 10, delta: 7, originalStack: [location, 'src/caller.ts:20:0'], sourcesHash: hash },
            { count: 8, delta: 5, originalStack: `${location}\nsrc/other.ts:30:0`, sourcesHash: hash },
            { count: 6, delta: 3, originalStack: [], stackTrace: ['at fallback (missing.ts:1:0)'] },
            { count: 2, delta: 2, stackTrace: ['</code><img src=x onerror=alert(1)>'] },
          ],
        }),
      )
      await generatePromiseStackTraceHtmlForFolder(source, target, 'promisesWithStackTrace')
      const html = await readFile(join(target, 'index.html'), 'utf8')
      const document = new JSDOM(html).window.document
      const cards = [...document.querySelectorAll('.PromiseItem')]
      expect(cards).toHaveLength(4)
      expect(document.querySelector('h2')?.textContent).toBe('scenario & growth')
      expect(document.querySelector('.PromiseChart')?.getAttribute('src')).toBe('./scenario%20%26%20growth.svg')
      expect(cards[0].querySelector('.CodeFrame code')?.textContent).toContain('> 4 |   return new Promise(() => "<pending>")')
      expect(cards[0].querySelector('.CodeBlock code')?.textContent).toBe(`at ${location}\nat src/caller.ts:20:0`)
      expect(cards[0].innerHTML.indexOf('class="CodeFrame"')).toBeLessThan(cards[0].innerHTML.indexOf('class="CodeBlock"'))
      expect(cards[1].querySelector('.CodeFrame')).not.toBeNull()
      expect(cards[2].querySelector('h3')?.textContent).toBe('missing.ts:1:0')
      expect(cards[2].querySelector('.CodeFrameUnavailable')).not.toBeNull()
      expect(cards[2].querySelector('.CodeBlock code')?.textContent).toBe('at fallback (missing.ts:1:0)')
      expect(cards[3].querySelector('img')).toBeNull()
      const svg = await readFile(join(target, 'scenario & growth.svg'), 'utf8')
      const chart = new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document
      expect(chart.querySelector('[aria-label="rect"] [fill="#000"], [aria-label="rect"] [fill="#000000"]')).not.toBeNull()
      expect(chart.querySelector('[fill="#b22222"], [fill="#B22222"]')).not.toBeNull()
      expect([...chart.querySelectorAll('text')].filter((node) => node.textContent === 'promise.ts:4:2')).toHaveLength(2)
      expect([...chart.querySelectorAll('text')].map((node) => node.textContent)).toEqual(expect.arrayContaining(['10', '8', '6', '2']))
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
}, 30_000)
