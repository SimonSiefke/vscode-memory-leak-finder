import { Database, FileJson2, GitBranch, RotateCcw, Search, Upload } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { fixtureReport } from './fixture.ts'
import { Inspector } from './Inspector.tsx'
import { getFilteredReport, type RetainerRiverLink, type RetainerRiverReport, validateRetainerRiverReport } from './report.ts'
import { formatBytes } from './report.ts'
import { SankeyChart } from './SankeyChart.tsx'

const mb = 1024 * 1024

const getDateLabel = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export const App = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [report, setReport] = useState<RetainerRiverReport>(fixtureReport)
  const [reportName, setReportName] = useState('Curated fixture')
  const [query, setQuery] = useState('')
  const [minimumMb, setMinimumMb] = useState(0)
  const [selectedLinkId, setSelectedLinkId] = useState<string>()
  const [error, setError] = useState<string>()

  const filteredReport = useMemo(() => getFilteredReport(report, query, minimumMb * mb), [minimumMb, query, report])
  const nodeById = useMemo(() => new Map(report.nodes.map((node) => [node.id, node])), [report.nodes])
  const selectedLink = report.links.find((link) => link.id === selectedLinkId)

  const loadFile = async (file: File): Promise<void> => {
    try {
      const value = JSON.parse(await file.text())
      const nextReport = validateRetainerRiverReport(value)
      setReport(nextReport)
      setReportName(file.name)
      setSelectedLinkId(undefined)
      setQuery('')
      setMinimumMb(0)
      setError(undefined)
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    }
  }

  const selectLink = (link: RetainerRiverLink) => {
    setSelectedLinkId(link.id)
  }

  return (
    <main className="App">
      <header className="TopBar">
        <div className="Brand">
          <div className="BrandMark" aria-hidden="true">
            <GitBranch size={21} />
          </div>
          <div>
            <span className="Eyebrow">Heap retention explorer</span>
            <h1>Retainer River</h1>
          </div>
        </div>
        <div className="HeaderActions">
          <span className="DataBadge">
            <Database aria-hidden="true" size={14} />
            {reportName}
          </span>
          <input
            accept="application/json,.json"
            className="VisuallyHidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                void loadFile(file)
              }
              event.currentTarget.value = ''
            }}
            ref={inputRef}
            type="file"
          />
          <button className="SecondaryButton" onClick={() => inputRef.current?.click()} type="button">
            <Upload aria-hidden="true" size={15} />
            Open report
          </button>
          <button
            aria-label="Reset to fixture"
            className="IconButton HeaderIconButton"
            onClick={() => {
              setReport(fixtureReport)
              setReportName('Curated fixture')
              setSelectedLinkId(undefined)
              setQuery('')
              setMinimumMb(0)
              setError(undefined)
            }}
            title="Reset to fixture"
            type="button"
          >
            <RotateCcw aria-hidden="true" size={16} />
          </button>
        </div>
      </header>

      <section className="Hero">
        <div>
          <p className="HeroLead">Follow memory from the roots that keep it alive to the objects that should have disappeared.</p>
          <p className="HeroMeta">
            {report.metadata.testName} · {report.metadata.processType} · {report.metadata.runs} runs · {getDateLabel(report.generatedAt)}
          </p>
        </div>
        <div className="SummaryGrid">
          <div>
            <span>Retained memory</span>
            <strong>{formatBytes(report.summary.retainedBytes)}</strong>
          </div>
          <div>
            <span>Leaked objects</span>
            <strong>{report.summary.leakedObjects.toLocaleString('en-US')}</strong>
          </div>
          <div>
            <span>Retaining paths</span>
            <strong>{report.summary.retainingPaths.toLocaleString('en-US')}</strong>
          </div>
        </div>
      </section>

      {error && (
        <div className="ErrorNotice" role="alert">
          <FileJson2 aria-hidden="true" size={17} />
          <span>{error}</span>
        </div>
      )}

      <section className="Workspace">
        <div className="RiverPanel">
          <div className="Toolbar">
            <label className="SearchField">
              <Search aria-hidden="true" size={15} />
              <input
                aria-label="Search retaining paths"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search object, service, or property…"
                type="search"
                value={query}
              />
            </label>
            <label className="Threshold">
              <span>Minimum flow</span>
              <input
                aria-label="Minimum retained megabytes"
                max="20"
                min="0"
                onChange={(event) => setMinimumMb(Number(event.target.value))}
                step="1"
                type="range"
                value={minimumMb}
              />
              <output>{minimumMb === 0 ? 'All' : `≥ ${minimumMb} MB`}</output>
            </label>
          </div>

          <div className="RiverPanelHeader">
            <div>
              <span className="LiveDot" />
              {filteredReport.links.length / 3} visible flows
            </div>
            <span>Width = retained bytes</span>
          </div>

          {filteredReport.links.length === 0 ? (
            <div className="EmptyState">
              <div className="EmptyStateIcon">
                {report.links.length === 0 ? <GitBranch aria-hidden="true" size={23} /> : <Search aria-hidden="true" size={23} />}
              </div>
              <h2>{report.links.length === 0 ? 'No retained growth detected' : 'No retaining paths match'}</h2>
              <p>
                {report.links.length === 0
                  ? 'This run did not find any newly retained objects above the configured growth threshold.'
                  : 'Clear the search or lower the minimum flow to bring the river back.'}
              </p>
              {report.links.length > 0 && (
                <button
                  className="SecondaryButton"
                  onClick={() => {
                    setQuery('')
                    setMinimumMb(0)
                  }}
                  type="button"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <SankeyChart
              links={filteredReport.links}
              nodes={filteredReport.nodes}
              onSelectLink={selectLink}
              selectedLinkId={selectedLinkId}
            />
          )}
        </div>

        <Inspector link={selectedLink} nodeById={nodeById} onClose={() => setSelectedLinkId(undefined)} />
      </section>
    </main>
  )
}
