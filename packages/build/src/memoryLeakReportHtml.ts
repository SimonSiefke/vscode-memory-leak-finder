import type { MemoryLeakReportData } from './memoryLeakReport.ts'

const serializeForHtml = (value: unknown): string => {
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029')
}

export const renderMemoryLeakReport = (report: MemoryLeakReportData): string => {
  const visibleReport = {
    ...report,
    repositories: report.repositories.filter((repository) => repository.openCount + repository.closedCount > 0),
  }
  const data = serializeForHtml(visibleReport)
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title>JavaScript memory-leak issue radar</title>
  <style>
    :root { --bg:#0b0c10; --panel:#13151b; --panel-2:#191c24; --line:#2a2e39; --text:#f5f3ed; --muted:#9da3af; --hot:#ff6b4a; --warm:#ffc857; --cool:#66d9c8; --shadow:0 22px 60px #0007; }
    * { box-sizing:border-box; }
    body { margin:0; min-height:100vh; color:var(--text); background:radial-gradient(circle at 15% -10%, #44251f 0, transparent 35rem), var(--bg); font:14px/1.45 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    button,input,select { font:inherit; }
    a { color:inherit; }
    .shell { max-width:1720px; margin:auto; padding:32px; }
    header { display:flex; align-items:end; justify-content:space-between; gap:24px; margin-bottom:28px; }
    .eyebrow { color:var(--warm); font-size:12px; font-weight:800; letter-spacing:.18em; text-transform:uppercase; }
    h1 { max-width:850px; margin:8px 0 4px; font-size:clamp(30px,4vw,58px); line-height:1; letter-spacing:-.045em; }
    .subtitle { margin:12px 0 0; color:var(--muted); font-size:15px; }
    .generated { color:var(--muted); text-align:right; white-space:nowrap; }
    .stats { display:grid; grid-template-columns:repeat(4,minmax(130px,1fr)); gap:12px; margin-bottom:18px; }
    .stat { padding:18px 20px; border:1px solid var(--line); border-radius:14px; background:#13151bd9; box-shadow:var(--shadow); }
    .stat strong { display:block; font-size:28px; line-height:1; }
    .stat span { display:block; margin-top:7px; color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.08em; }
    .toolbar { display:grid; grid-template-columns:minmax(220px,1fr) auto auto; gap:10px; margin-bottom:12px; }
    .control { min-height:42px; padding:0 13px; color:var(--text); border:1px solid var(--line); border-radius:10px; outline:none; background:var(--panel); }
    .control:focus { border-color:var(--warm); box-shadow:0 0 0 3px #ffc85720; }
    .layout { display:grid; grid-template-columns:350px minmax(0,1fr); min-height:680px; border:1px solid var(--line); border-radius:16px; overflow:hidden; background:#101217d9; box-shadow:var(--shadow); }
    .repo-panel { border-right:1px solid var(--line); background:#101217; }
    .repo-list { max-height:calc(100vh - 235px); min-height:680px; overflow:auto; }
    .repo-button { width:100%; padding:15px 16px; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:10px; color:inherit; text-align:left; border:0; border-bottom:1px solid #222631; background:transparent; cursor:pointer; }
    .repo-button:hover { background:#191c24; }
    .repo-button.active { background:linear-gradient(90deg,#ff6b4a1c,transparent); box-shadow:inset 3px 0 var(--hot); }
    .repo-name { overflow:hidden; font-weight:750; text-overflow:ellipsis; white-space:nowrap; }
    .repo-meta { display:flex; gap:9px; margin-top:5px; color:var(--muted); font-size:12px; }
    .count { align-self:center; min-width:35px; padding:4px 8px; border-radius:999px; color:#0b0c10; background:var(--warm); font-weight:850; text-align:center; }
    .count.zero { color:var(--muted); background:#252933; }
    .detail { min-width:0; padding:24px; }
    .detail-head { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; padding-bottom:20px; border-bottom:1px solid var(--line); }
    .detail h2 { margin:0; font-size:26px; letter-spacing:-.025em; }
    .detail-description { max-width:750px; margin:7px 0 0; color:var(--muted); }
    .repo-link { flex:none; padding:9px 12px; border:1px solid var(--line); border-radius:9px; color:var(--text); text-decoration:none; }
    .repo-link:hover { border-color:var(--warm); }
    .tags { display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; }
    .tag { padding:3px 7px; border:1px solid var(--line); border-radius:999px; color:var(--muted); font-size:11px; }
    .board { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; margin-top:20px; }
    .column { min-width:0; }
    .column-title { display:flex; align-items:center; justify-content:space-between; margin:0 2px 10px; font-size:13px; letter-spacing:.06em; text-transform:uppercase; }
    .column-title.open { color:var(--hot); }
    .column-title.closed { color:var(--cool); }
    .issue-list { display:grid; gap:10px; }
    .issue { display:block; padding:15px; border:1px solid var(--line); border-radius:12px; background:var(--panel-2); text-decoration:none; transition:transform .12s,border-color .12s; }
    .issue:hover { transform:translateY(-2px); border-color:#565d6d; }
    .issue-title { margin:0; font-size:14px; line-height:1.35; }
    .issue-number { color:var(--muted); font-weight:500; }
    .issue-body { display:-webkit-box; overflow:hidden; margin:9px 0 0; color:var(--muted); font-size:12px; -webkit-box-orient:vertical; -webkit-line-clamp:3; }
    .issue-footer { display:flex; flex-wrap:wrap; align-items:center; gap:7px; margin-top:12px; color:var(--muted); font-size:11px; }
    .label { max-width:150px; padding:2px 6px; overflow:hidden; border:1px solid; border-radius:999px; text-overflow:ellipsis; white-space:nowrap; }
    .empty { padding:40px 18px; color:var(--muted); border:1px dashed var(--line); border-radius:12px; text-align:center; }
    .limit-note { margin:12px 2px 0; color:var(--muted); font-size:11px; }
    .no-results { padding:50px 24px; color:var(--muted); text-align:center; }
    @media (max-width:900px) { .shell{padding:18px}.stats{grid-template-columns:repeat(2,1fr)}.toolbar{grid-template-columns:1fr 1fr}.toolbar input{grid-column:1/-1}.layout{grid-template-columns:1fr}.repo-panel{border-right:0;border-bottom:1px solid var(--line)}.repo-list{min-height:0;max-height:300px}.detail{padding:20px}.detail-head{flex-direction:column}.repo-link{align-self:flex-start}.board{grid-template-columns:1fr}header{align-items:start;flex-direction:column}.generated{text-align:left} }
  </style>
</head>
<body>
  <main class="shell">
    <header>
      <div><div class="eyebrow">Issue intelligence / Node ecosystem</div><h1>Memory-leak issue radar</h1><p class="subtitle">Popular repositories with a root package.json, ranked by matching GitHub issues.</p></div>
      <div class="generated" id="generated"></div>
    </header>
    <section class="stats" id="stats"></section>
    <section class="toolbar" aria-label="Report filters">
      <input class="control" id="search" type="search" placeholder="Filter repositories, languages, topics…">
      <select class="control" id="visibility" aria-label="Issue visibility"><option value="matches">All matches</option><option value="open">With open issues</option></select>
      <select class="control" id="sort" aria-label="Sort repositories"><option value="issues">Most issues</option><option value="open">Most open</option><option value="stars">Most stars</option><option value="name">Name</option></select>
    </section>
    <section class="layout">
      <aside class="repo-panel"><div class="repo-list" id="repo-list"></div></aside>
      <article class="detail" id="detail"></article>
    </section>
  </main>
  <script id="report-data" type="application/json">${data}</script>
  <script>
    const report = JSON.parse(document.getElementById('report-data').textContent)
    const list = document.getElementById('repo-list')
    const detail = document.getElementById('detail')
    const search = document.getElementById('search')
    const visibility = document.getElementById('visibility')
    const sort = document.getElementById('sort')
    let selected = ''
    const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
    const date = value => new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value))
    const relative = value => {
      const days = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 86400000))
      if (days < 1) return 'today'
      if (days < 30) return days + 'd ago'
      if (days < 365) return Math.round(days / 30) + 'mo ago'
      return (days / 365).toFixed(1) + 'y ago'
    }
    const el = (tag, className, text) => {
      const node = document.createElement(tag)
      if (className) node.className = className
      if (text !== undefined) node.textContent = text
      return node
    }
    const addStat = (value, label) => {
      const card = el('div', 'stat')
      card.append(el('strong', '', compact.format(value)), el('span', '', label))
      document.getElementById('stats').append(card)
    }
    addStat(report.repositoryCount, 'Repositories scanned')
    addStat(report.repositoriesWithMatches, 'With matches')
    addStat(report.openIssueCount, 'Open issues')
    addStat(report.closedIssueCount, 'Closed issues')
    document.getElementById('generated').textContent = 'Generated ' + date(report.generatedAt) + ' · ≥ ' + compact.format(report.minStars) + ' stars'

    const colorWithAlpha = color => /^([0-9a-f]{6})$/i.test(color) ? '#' + color + '33' : 'transparent'
    const renderIssue = issue => {
      const card = el('a', 'issue')
      card.href = issue.url
      card.target = '_blank'
      card.rel = 'noreferrer'
      const title = el('h3', 'issue-title')
      title.append(el('span', 'issue-number', '#' + issue.number + ' '), document.createTextNode(issue.title))
      card.append(title)
      if (issue.bodyText) card.append(el('p', 'issue-body', issue.bodyText.replace(/\\s+/g, ' ').trim()))
      const footer = el('div', 'issue-footer')
      if (issue.author) footer.append(el('span', '', '@' + issue.author.login))
      footer.append(el('span', '', 'Updated ' + relative(issue.updatedAt)), el('span', '', issue.comments.totalCount + ' comments'))
      for (const label of issue.labels.nodes.slice(0, 3)) {
        const badge = el('span', 'label', label.name)
        badge.style.borderColor = '#' + label.color
        badge.style.background = colorWithAlpha(label.color)
        footer.append(badge)
      }
      card.append(footer)
      return card
    }
    const renderColumn = (title, state, issues, count) => {
      const column = el('section', 'column')
      const heading = el('h3', 'column-title ' + state)
      heading.append(el('span', '', title), el('span', '', compact.format(count)))
      column.append(heading)
      const issueList = el('div', 'issue-list')
      if (issues.length === 0) issueList.append(el('div', 'empty', 'No matching ' + state + ' issues'))
      else issues.forEach(issue => issueList.append(renderIssue(issue)))
      column.append(issueList)
      if (count > issues.length) column.append(el('p', 'limit-note', 'Showing ' + issues.length + ' of ' + count + ' matches. Open GitHub to see the rest.'))
      return column
    }
    const renderDetail = repository => {
      detail.replaceChildren()
      const head = el('div', 'detail-head')
      const copy = el('div')
      copy.append(el('h2', '', repository.repository.nameWithOwner))
      copy.append(el('p', 'detail-description', repository.repository.description || 'No repository description provided.'))
      const tags = el('div', 'tags')
      if (repository.repository.primaryLanguage) tags.append(el('span', 'tag', repository.repository.primaryLanguage.name))
      tags.append(el('span', 'tag', compact.format(repository.repository.stargazerCount) + ' stars'))
      repository.repository.repositoryTopics.nodes.slice(0, 6).forEach(item => tags.append(el('span', 'tag', item.topic.name)))
      copy.append(tags)
      const link = el('a', 'repo-link', 'View repository ↗')
      link.href = repository.repository.url
      link.target = '_blank'
      link.rel = 'noreferrer'
      head.append(copy, link)
      const board = el('div', 'board')
      board.append(renderColumn('Open', 'open', repository.openIssues, repository.openCount))
      board.append(renderColumn('Closed', 'closed', repository.closedIssues, repository.closedCount))
      detail.append(head, board)
    }
    const filteredRepositories = () => {
      const query = search.value.trim().toLowerCase()
      const mode = visibility.value
      const repositories = report.repositories.filter(item => {
        const haystack = [item.repository.nameWithOwner, item.repository.description || '', item.repository.primaryLanguage?.name || '', ...item.repository.repositoryTopics.nodes.map(node => node.topic.name)].join(' ').toLowerCase()
        const visible = mode === 'matches' || (mode === 'open' && item.openCount > 0)
        return visible && haystack.includes(query)
      })
      const compare = {
        issues: (a,b) => b.openCount + b.closedCount - a.openCount - a.closedCount,
        open: (a,b) => b.openCount - a.openCount,
        stars: (a,b) => b.repository.stargazerCount - a.repository.stargazerCount,
        name: (a,b) => a.repository.nameWithOwner.localeCompare(b.repository.nameWithOwner),
      }[sort.value]
      return repositories.sort(compare)
    }
    const render = () => {
      const repositories = filteredRepositories()
      list.replaceChildren()
      if (!repositories.length) {
        list.append(el('div', 'no-results', 'No repositories match these filters.'))
        detail.replaceChildren(el('div', 'no-results', 'Try a different filter.'))
        return
      }
      if (!repositories.some(item => item.repository.nameWithOwner === selected)) selected = repositories[0].repository.nameWithOwner
      for (const item of repositories) {
        const button = el('button', 'repo-button' + (item.repository.nameWithOwner === selected ? ' active' : ''))
        button.type = 'button'
        const copy = el('div')
        copy.append(el('div', 'repo-name', item.repository.nameWithOwner))
        const meta = el('div', 'repo-meta')
        meta.append(el('span', '', compact.format(item.repository.stargazerCount) + ' ★'), el('span', '', item.openCount + ' open'))
        copy.append(meta)
        const count = item.openCount + item.closedCount
        button.append(copy, el('span', 'count' + (count ? '' : ' zero'), String(count)))
        button.addEventListener('click', () => { selected = item.repository.nameWithOwner; render() })
        list.append(button)
      }
      renderDetail(repositories.find(item => item.repository.nameWithOwner === selected))
    }
    search.addEventListener('input', render)
    visibility.addEventListener('change', render)
    sort.addEventListener('change', render)
    render()
  </script>
</body>
</html>`
}
