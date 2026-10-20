import { selectorStatistics } from './CssSelectorReport.ts'
import type { Result } from '../Types/Types.ts'

const escape = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)

export const selectorTableHtml = (result: Result): string => {
  const statistics = selectorStatistics(result)
  // Prevent selector text from closing the data script, even when it contains HTML.
  const data = JSON.stringify(statistics.rows).replace(/</g, '\\u003c')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Slowest CSS selectors · ${escape(result.benchmark.id)}</title>
<style>
body{font:15px system-ui,sans-serif;color:#1b2538;margin:24px}h1{font-size:24px}p{line-height:1.5}code{overflow-wrap:anywhere}
.controls{display:flex;flex-wrap:wrap;gap:20px;margin:20px 0}select,input{font:inherit;padding:6px}input{min-width:240px}
.table-wrap{overflow:auto;max-height:75vh;border:1px solid #dde3ef}table{border-collapse:separate;border-spacing:0;width:100%;font-variant-numeric:tabular-nums}
th{position:sticky;top:0;background:#edf1fa;text-align:left;white-space:nowrap}th,td{padding:10px 14px;border-bottom:1px solid #dde3ef}
th button{font:inherit;font-weight:600;color:inherit;border:0;background:transparent;cursor:pointer;padding:0;width:100%;text-align:inherit}
th button:focus-visible{outline:2px solid #315abd;outline-offset:4px}th[aria-sort=descending] button::after{content:' ▼'}th[aria-sort=ascending] button::after{content:' ▲'}
td:first-child{font:13px ui-monospace,monospace;overflow-wrap:anywhere;min-width:260px}td:not(:first-child){text-align:right;white-space:nowrap}tbody tr:nth-child(even){background:#f7f9fd}
</style></head><body>
<h1>Slowest CSS selectors</h1><p>${escape(result.benchmark.id)} · ${statistics.pairs} complete sample pairs</p>
<p>Before: <code>${escape(result.commits.before)}</code><br/>After: <code>${escape(result.commits.after)}</code></p>
<p>Time is median total matching time during startup, in milliseconds. Match attempts and match count are means per startup across complete sample pairs. Identical selector text is combined across stylesheets; nested fragments are shown as Chromium recorded them.</p>
<div class="controls"><label>Revision <select id="revision"><option value="after">After</option><option value="before">Before</option></select></label><label>Filter selectors <input id="filter" type="search" placeholder="Selector text"/></label></div>
<p id="status" role="status"></p><p>Click a column heading to sort; click again to reverse. The top 1,000 rows are selected after sorting all selectors.</p>
<div class="table-wrap"><table><thead><tr>
<th scope="col" aria-sort="none"><button type="button" data-key="selector">Selector name</button></th>
<th scope="col" aria-sort="descending"><button type="button" data-key="elapsedMs">Time (ms)</button></th>
<th scope="col" aria-sort="none"><button type="button" data-key="matchAttempts">matchAttempts</button></th>
<th scope="col" aria-sort="none"><button type="button" data-key="matchCount">matchCount</button></th>
</tr></thead><tbody></tbody></table></div>
<noscript>Enable JavaScript to view and sort the selector table.</noscript>
<script id="selector-data" type="application/json">${data}</script>
<script>
const rows = JSON.parse(document.getElementById('selector-data').textContent);
const revision = document.getElementById('revision'), filter = document.getElementById('filter');
const body = document.querySelector('tbody'), buttons = [...document.querySelectorAll('th button')];
let key = 'elapsedMs', direction = -1;
const format = value => value.toLocaleString('en-US', {maximumFractionDigits: 3});
function render() {
  const query = filter.value.toLowerCase();
  const sorted = rows.filter(row => row.selector.toLowerCase().includes(query)).sort((a, b) => {
    const comparison = key === 'selector' ? a.selector.localeCompare(b.selector) : a[revision.value][key] - b[revision.value][key];
    return direction * comparison || a.selector.localeCompare(b.selector);
  });
  const visible = sorted.slice(0, 1000);
  const fragment = document.createDocumentFragment();
  for (const row of visible) {
    const tr = document.createElement('tr');
    for (const value of [row.selector, ...['elapsedMs', 'matchAttempts', 'matchCount'].map(metric => format(row[revision.value][metric]))]) {
      const cell = document.createElement('td');
      cell.textContent = value;
      tr.appendChild(cell);
    }
    fragment.appendChild(tr);
  }
  body.replaceChildren(fragment);
  for (const button of buttons) button.parentElement.setAttribute('aria-sort', button.dataset.key === key ? (direction === -1 ? 'descending' : 'ascending') : 'none');
  document.getElementById('status').textContent = 'Showing ' + format(visible.length) + ' of ' + format(sorted.length) + ' matching selectors (' + format(rows.length) + ' total) · ' + revision.options[revision.selectedIndex].text;
}
for (const button of buttons) button.addEventListener('click', () => {
  direction = key === button.dataset.key ? -direction : button.dataset.key === 'selector' ? 1 : -1;
  key = button.dataset.key;
  render();
});
revision.addEventListener('change', render);
filter.addEventListener('input', render);
render();
</script></body></html>`
}
