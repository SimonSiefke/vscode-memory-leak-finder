import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

interface SelectorRow {
  readonly selector: string
  readonly elapsedMs: number
  readonly matchAttempts: number
  readonly matchCount: number
}

interface Scenario {
  readonly name: string
  readonly rows: readonly SelectorRow[]
}

export const getCssSelectorStatsData = async (basePath: string): Promise<Scenario[]> => {
  const folder = join(basePath, 'css-selector-stats')
  let files: string[]
  try {
    files = await readdir(folder, { recursive: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
  const scenarios: Scenario[] = []
  for (const file of files.filter((file) => file.endsWith('.json')).toSorted()) {
    const result = JSON.parse(await readFile(join(folder, file), 'utf8'))
    if (!Array.isArray(result.cssSelectorStats?.topSelectors)) continue
    const selectors = new Map<string, SelectorRow>()
    for (const row of result.cssSelectorStats.topSelectors as SelectorRow[]) {
      if (
        typeof row.selector !== 'string' ||
        ![row.elapsedMs, row.matchAttempts, row.matchCount].every(
          (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0,
        )
      )
        continue
      const previous = selectors.get(row.selector)
      selectors.set(row.selector, {
        selector: row.selector,
        elapsedMs: (previous?.elapsedMs || 0) + row.elapsedMs,
        matchAttempts: (previous?.matchAttempts || 0) + row.matchAttempts,
        matchCount: (previous?.matchCount || 0) + row.matchCount,
      })
    }
    scenarios.push({ name: file.slice(0, -5).replaceAll('\\', '/'), rows: [...selectors.values()] })
  }
  return scenarios
}

export const renderCssSelectorStatsHtml = (scenarios: readonly Scenario[]): string => {
  const data = JSON.stringify(scenarios).replace(/</g, '\\u003c')
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Slowest CSS selectors</title>
<style>
body{font:15px system-ui,sans-serif;color:#1b2538;margin:24px}p{line-height:1.5}
.controls{display:flex;flex-wrap:wrap;align-items:flex-end;gap:16px 20px;margin:24px 0}
.controls label{display:flex;flex-direction:column;gap:6px;min-width:0;max-width:100%;font-weight:600}
.controls select,.controls input{box-sizing:border-box;min-height:40px;max-width:100%;border:1px solid #d1d9e0;border-radius:6px;background-color:#fff;color:inherit;font:inherit;font-weight:400;line-height:1.5;padding:8px 12px}
.controls select{width:360px;appearance:none;padding-right:40px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath d='m4 6 4 4 4-4' fill='none' stroke='%2359636e' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;cursor:pointer}
.controls input{width:240px}.controls input::placeholder{color:#59636e;opacity:1}
.controls select:hover,.controls input:hover{border-color:#8c959f}
.controls select:focus-visible,.controls input:focus-visible{border-color:#0969da;outline:2px solid #0969da;outline-offset:3px}
@media(max-width:600px){.controls label,.controls select,.controls input{width:100%}}
@media(forced-colors:active){.controls select{appearance:auto;background-image:none;padding-right:12px}}
table{border-collapse:collapse;width:100%;table-layout:fixed;font-variant-numeric:tabular-nums}th,td{padding:10px;border-bottom:1px solid #dde3ef;overflow-wrap:anywhere;text-align:right}
th{position:sticky;top:0;background:#edf1fa}th:first-child,td:first-child{text-align:left;width:60%}td:first-child{font:13px ui-monospace,monospace}
th button{font:inherit;font-weight:600;border:0;background:transparent;color:inherit;cursor:pointer}th[aria-sort=descending] button::after{content:' ▼'}th[aria-sort=ascending] button::after{content:' ▲'}tbody tr:nth-child(even){background:#f7f9fd}
</style></head><body><h1>Slowest CSS selectors</h1>
<p>CSS selector matching during each measured VS Code scenario, excluding application startup. Each scenario runs once in a fresh instance. Time is total matching time in milliseconds; identical selector text is combined across stylesheets. Instrumentation adds overhead, and scenario duration and background activity affect the totals.</p>
<div class="controls"><label>Scenario <select id="scenario"></select></label><label>Filter selectors <input id="filter" type="search" placeholder="Selector text"></label></div>
<p id="status" role="status"></p><p>Click a column heading to sort; click again to reverse. The top 1,000 rows are selected after filtering and sorting all selectors.</p>
<table><thead><tr><th scope="col" aria-sort="none"><button data-key="selector">Selector name</button></th><th scope="col" aria-sort="descending"><button data-key="elapsedMs">Time (ms)</button></th><th scope="col" aria-sort="none"><button data-key="matchAttempts">matchAttempts</button></th><th scope="col" aria-sort="none"><button data-key="matchCount">matchCount</button></th></tr></thead><tbody></tbody></table>
<noscript>Enable JavaScript to view and sort the selector table.</noscript>
<p><a href="../index.html">Memory leak charts</a></p>
<script id="data" type="application/json">${data}</script>
<script>
(() => {
const scenarios = JSON.parse(document.querySelector('#data').textContent);
const scenario = document.querySelector('#scenario'), filter = document.querySelector('#filter');
const body = document.querySelector('tbody'), buttons = [...document.querySelectorAll('th button')];
let key = 'elapsedMs', direction = -1;
for (const [index, entry] of scenarios.entries()) {
  const option = document.createElement('option'); option.value = index; option.textContent = entry.name;
  scenario.appendChild(option);
}
scenario.selectedIndex = Math.max(0, scenarios.findIndex(entry => entry.rows.length));
function render() {
  const rows = scenarios[scenario.value]?.rows || [];
  const query = filter.value.toLowerCase();
  const sorted = rows.filter(row => row.selector.toLowerCase().includes(query)).sort((a,b) =>
    direction * (key === 'selector' ? a.selector.localeCompare(b.selector) : a[key] - b[key]) || a.selector.localeCompare(b.selector));
  const visible = sorted.slice(0,1000), fragment = document.createDocumentFragment();
  for (const row of visible) {
    const tr = document.createElement('tr');
    for (const value of [row.selector, ...['elapsedMs','matchAttempts','matchCount'].map(metric => row[metric].toLocaleString('en-US',{maximumFractionDigits:3}))]) {
      const td = document.createElement('td'); td.textContent = value; tr.appendChild(td);
    }
    fragment.appendChild(tr);
  }
  body.replaceChildren(fragment);
  for (const button of buttons) button.parentElement.setAttribute('aria-sort',button.dataset.key === key ? (direction === -1 ? 'descending' : 'ascending') : 'none');
  document.querySelector('#status').textContent = !rows.length ? 'No selector timing rows collected for this scenario. Selector instrumentation may be unavailable.' : 'Showing ' + visible.length + ' of ' + sorted.length + ' matching selectors (' + rows.length + ' total)';
}
for (const button of buttons) button.addEventListener('click', () => {
  direction = key === button.dataset.key ? -direction : button.dataset.key === 'selector' ? 1 : -1;
  key = button.dataset.key; render();
});
scenario.addEventListener('change',render); filter.addEventListener('input',render); render();
})();
</script></body></html>`
}

export const generateCssSelectorStatsHtml = async (
  basePath = join(Root.root, '.vscode-memory-leak-finder-results'),
  outPath = join(Root.root, '.vscode-charts', 'css-selector-stats'),
): Promise<void> => {
  const scenarios = await getCssSelectorStatsData(basePath)
  if (!scenarios.length) return
  await mkdir(outPath, { recursive: true })
  await writeFile(join(outPath, 'index.html'), renderCssSelectorStatsHtml(scenarios))
}
