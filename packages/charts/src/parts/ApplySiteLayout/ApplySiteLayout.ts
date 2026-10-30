import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { escapeHtml } from '../EscapeHtml/EscapeHtml.ts'
import * as Root from '../Root/Root.ts'

const pageLabel = (path: string): string => {
  if (path === 'index.html') return 'Memory leak charts'
  if (path === 'instruction-count/index.html') return 'Instruction counts by test'
  if (path === 'css-selector-stats/index.html') return 'Slowest CSS selectors'
  return path
    .replace(/\/index\.html$/, '')
    .split('/')
    .map((part) => part.replaceAll('-', ' ').replace(/^./, (letter) => letter.toUpperCase()))
    .join(' / ')
}

// Run after all report generators so every page has the same menu and only links to available reports.
export const applySiteLayout = async (basePath = join(Root.root, '.vscode-charts')): Promise<void> => {
  const files = await readdir(basePath, { recursive: true })
  const pages = files
    .filter((file) => file === 'index.html' || file.endsWith('/index.html') || file.endsWith('\\index.html'))
    .map((file) => file.replaceAll('\\', '/'))
  const primaryPages = ['index.html', 'instruction-count/index.html', 'css-selector-stats/index.html']
  pages.sort((a, b) => {
    const rank = (page: string) => (primaryPages.includes(page) ? primaryPages.indexOf(page) : primaryPages.length)
    return rank(a) - rank(b) || a.localeCompare(b)
  })
  await writeFile(join(basePath, 'site.css'), await readFile(new URL('./site.css', import.meta.url), 'utf8'))
  await writeFile(join(basePath, 'site.js'), await readFile(new URL('./site.js', import.meta.url), 'utf8'))

  for (const page of pages) {
    const filePath = join(basePath, page)
    const rootHref = relative(dirname(filePath), basePath).replaceAll('\\', '/') || '.'
    const href = (target: string) => `${rootHref}/${target.split('/').map(encodeURIComponent).join('/')}`
    const title = pageLabel(page)
    const links = pages
      .map(
        (target) =>
          `<a href="${escapeHtml(href(target))}"${target === page ? ' aria-current="page"' : ''}>${escapeHtml(pageLabel(target))}</a>`,
      )
      .join('\n')
    const header = `<a class="SkipLink" href="#page-content">Skip to content</a>
<header class="SiteHeader">
  <details class="SiteMenu">
    <summary aria-label="Open navigation menu"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 4.5h12M3 9h12M3 13.5h12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></summary>
    <nav aria-label="Reports"><div class="MenuHeading">Reports</div>${links}</nav>
  </details>
  <a class="SiteBrand" href="${escapeHtml(href('index.html'))}">VS Code Memory Leak Finder</a>
  <span class="SiteDivider" aria-hidden="true">/</span><span class="SitePage">${escapeHtml(title)}</span>
</header>`
    let html = await readFile(filePath, 'utf8')
    // The generator owns these documents; keeping this pass idempotent is useful for local previews.
    if (html.includes('class="SiteHeader"')) continue
    if (page !== 'index.html') html = html.replaceAll('VSCode Memory Leak Finder Charts', escapeHtml(title))
    html = html.replaceAll('<table>', '<div class="TableScroll"><table>').replaceAll('</table>', '</table></div>')
    html = html.replace(/<html(?: lang="en")?>/, '<html lang="en">')
    if (!html.includes('name="viewport"'))
      html = html.replace('</head>', '<meta name="viewport" content="width=device-width, initial-scale=1"></head>')
    html = html.replace('</head>', `<link rel="stylesheet" href="${escapeHtml(href('site.css'))}"></head>`)
    html = html.replace(/<body>/, `<body>${header}<div class="SiteContent" id="page-content" tabindex="-1">`)
    html = html.replace('</body>', `</div><script src="${escapeHtml(href('site.js'))}"></script></body>`)
    await writeFile(filePath, html)
  }
}
