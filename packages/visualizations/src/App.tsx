import { useCallback, useEffect, useMemo, useState } from 'react'
import { Building2, ChevronRight, Database, Layers3, Pause, Play, RotateCcw, Search, Sparkles } from 'lucide-react'
import { computeCityLayout } from './layout.ts'
import { filterBuildingViews, formatBytes, getBuildingViews, getCoverage } from './model.ts'
import { MemoryCityScene } from './MemoryCityScene.tsx'
import type { BuildingLayout, MemoryCityDataset, MemoryCityOwner } from './types.ts'

interface AppProps {
  readonly dataset: MemoryCityDataset
  readonly loadError?: string
}

interface TooltipState {
  readonly building: BuildingLayout
  readonly x: number
  readonly y: number
}

const ownerLabels: Record<MemoryCityOwner, string> = {
  extensionHost: 'Extension Host',
  renderer: 'Renderer',
}

const getDirectory = (path: string): string => {
  const index = path.lastIndexOf('/')
  return index === -1 ? '' : path.slice(0, index)
}

const Breadcrumbs = ({ path, onChange }: { readonly path: string; readonly onChange: (path: string) => void }) => {
  const parts = path ? path.split('/') : []
  return (
    <nav className="Breadcrumbs" aria-label="District path">
      <button type="button" onClick={() => onChange('')}>
        City
      </button>
      {parts.map((part, index) => {
        const current = parts.slice(0, index + 1).join('/')
        return (
          <span className="BreadcrumbItem" key={current}>
            <ChevronRight size={13} />
            <button type="button" onClick={() => onChange(current)}>
              {part}
            </button>
          </span>
        )
      })}
    </nav>
  )
}

const FallbackTable = ({ buildings }: { readonly buildings: readonly BuildingLayout[] }) => (
  <div className="Fallback">
    <div>
      <Building2 size={24} />
      <h2>City map unavailable</h2>
      <p>WebGL could not start, so Memory City switched to its data view.</p>
    </div>
    <div className="TableWrap">
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Objects</th>
            <th>Retained</th>
            <th>Growth</th>
          </tr>
        </thead>
        <tbody>
          {buildings
            .toSorted((a, b) => b.retainedBytes - a.retainedBytes)
            .map((building) => (
              <tr key={building.path}>
                <td>{building.path}</td>
                <td>{building.objectCount.toLocaleString()}</td>
                <td>{formatBytes(building.retainedBytes)}</td>
                <td className={building.deltaBytes > 0 ? 'Positive' : building.deltaBytes < 0 ? 'Negative' : ''}>
                  {building.deltaBytes > 0 ? '+' : ''}
                  {formatBytes(building.deltaBytes)}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </div>
)

export const App = ({ dataset, loadError }: AppProps) => {
  const [owner, setOwner] = useState<MemoryCityOwner>('renderer')
  const [revisionIndex, setRevisionIndex] = useState(Math.max(0, dataset.revisions.length - 1))
  const [query, setQuery] = useState('')
  const [rootPath, setRootPath] = useState('')
  const [showRuntime, setShowRuntime] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [webglFailed, setWebglFailed] = useState(false)
  const [resetToken, setResetToken] = useState(0)
  const [selectedPath, setSelectedPath] = useState('')
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const views = useMemo(() => getBuildingViews(dataset, owner, revisionIndex), [dataset, owner, revisionIndex])
  const filtered = useMemo(() => filterBuildingViews(views, query, rootPath, showRuntime), [query, rootPath, showRuntime, views])
  const city = useMemo(() => computeCityLayout(filtered), [filtered])
  const revision = dataset.revisions[revisionIndex]
  const snapshot = revision?.owners[owner]
  const coverage = getCoverage(dataset, owner, revisionIndex)

  useEffect(() => {
    if (!playing || dataset.revisions.length < 2) {
      return
    }
    const handle = window.setInterval(() => {
      setRevisionIndex((index) => (index + 1) % dataset.revisions.length)
    }, 1600)
    return () => window.clearInterval(handle)
  }, [dataset.revisions.length, playing])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
        return
      }
      if (event.key === ' ') {
        event.preventDefault()
        setPlaying((value) => !value)
      } else if (event.key.toLowerCase() === 'r') {
        setResetToken((value) => value + 1)
      } else if (event.key === 'ArrowLeft') {
        setRevisionIndex((value) => Math.max(0, value - 1))
      } else if (event.key === 'ArrowRight') {
        setRevisionIndex((value) => Math.min(dataset.revisions.length - 1, value + 1))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dataset.revisions.length])

  const handleHover = useCallback((building: BuildingLayout | null, x: number, y: number) => {
    setTooltip(building ? { building, x, y } : null)
  }, [])

  const handleSelect = useCallback((building: BuildingLayout) => {
    setSelectedPath(building.path)
  }, [])

  return (
    <div className="App">
      <header className="Topbar">
        <div className="Brand">
          <span className="BrandMark">
            <Layers3 size={21} />
          </span>
          <div>
            <div className="Eyebrow">VS CODE MEMORY PROFILER</div>
            <h1>Memory City</h1>
          </div>
        </div>
        <div className="HeaderStats">
          <div>
            <span>Retained</span>
            <strong>{formatBytes(snapshot?.totals.retainedBytes || 0)}</strong>
          </div>
          <div>
            <span>Objects</span>
            <strong>{(snapshot?.totals.objectCount || 0).toLocaleString()}</strong>
          </div>
          <div>
            <span>Mapped</span>
            <strong>{coverage.toFixed(1)}%</strong>
          </div>
        </div>
      </header>

      <section className="ControlDeck">
        <div className="ControlRow">
          <div className="Segmented" aria-label="Process ownership">
            {(Object.keys(ownerLabels) as MemoryCityOwner[]).map((value) => (
              <button className={owner === value ? 'Active' : ''} type="button" key={value} onClick={() => setOwner(value)}>
                {ownerLabels[value]}
              </button>
            ))}
          </div>
          <label className="Search">
            <Search size={15} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a file or district…" />
          </label>
          <label className="RuntimeToggle">
            <input type="checkbox" checked={showRuntime} onChange={(event) => setShowRuntime(event.target.checked)} />
            <span>Runtime district</span>
          </label>
          <button className="IconButton" type="button" onClick={() => setResetToken((value) => value + 1)} title="Reset camera (R)">
            <RotateCcw size={16} />
          </button>
        </div>
        <Breadcrumbs path={rootPath} onChange={setRootPath} />
      </section>

      <main className="Viewport">
        {webglFailed ? (
          <FallbackTable buildings={city.buildings} />
        ) : (
          <MemoryCityScene
            buildings={city.buildings}
            districts={city.districts}
            onFailure={() => setWebglFailed(true)}
            onHover={handleHover}
            onSelect={handleSelect}
            resetToken={resetToken}
            selectedPath={selectedPath}
          />
        )}
        <div className="SceneWash" />
        <label className="ScenarioBadge">
          <Sparkles size={14} />
          <select aria-label="Scenario" value={dataset.scenario} onChange={() => {}}>
            <option value={dataset.scenario}>{dataset.scenario}</option>
          </select>
        </label>
        <div className="Legend">
          <span>shrinking</span>
          <div className="LegendGradient" />
          <span>growing</span>
        </div>
        <aside className="Inspector">
          <div className="InspectorTitle">
            <Database size={15} />
            <span>{revision?.label || 'No revision'}</span>
          </div>
          <dl>
            <div>
              <dt>Source buildings</dt>
              <dd>{views.filter((item) => item.kind === 'source').length.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Runtime objects</dt>
              <dd>{(snapshot?.totals.runtimeObjects || 0).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Allocation traces</dt>
              <dd>{(snapshot?.totals.allocationTraceObjects || 0).toLocaleString()}</dd>
            </div>
          </dl>
          <p>Click a building to fly closer. Scroll to zoom, drag to orbit, and right-drag to pan.</p>
        </aside>
        {loadError && <div className="LoadNotice">{loadError} Showing the built-in city tour.</div>}
      </main>

      <footer className="Timeline">
        <button
          className="PlayButton"
          type="button"
          onClick={() => setPlaying((value) => !value)}
          aria-label={playing ? 'Pause timeline' : 'Play timeline'}
        >
          {playing ? <Pause size={17} /> : <Play size={17} />}
        </button>
        <div className="TimelineTrack">
          <input
            aria-label="Revision"
            type="range"
            min={0}
            max={Math.max(0, dataset.revisions.length - 1)}
            step={1}
            value={revisionIndex}
            onChange={(event) => setRevisionIndex(Number(event.target.value))}
          />
          <div className="CommitLabels">
            {dataset.revisions.map((item, index) => (
              <button
                className={index === revisionIndex ? 'Active' : ''}
                type="button"
                key={`${item.id}-${index}`}
                onClick={() => setRevisionIndex(index)}
              >
                <span>{item.label}</span>
                <small>{item.id.slice(0, 8)}</small>
              </button>
            ))}
          </div>
        </div>
      </footer>

      {tooltip && (
        <div className="Tooltip" style={{ left: Math.min(window.innerWidth - 300, tooltip.x + 14), top: Math.max(16, tooltip.y - 54) }}>
          <strong>{tooltip.building.path.split('/').at(-1)}</strong>
          <span>{getDirectory(tooltip.building.path)}</span>
          <div>
            <b>{formatBytes(tooltip.building.retainedBytes)}</b> retained
          </div>
          <div>
            <b>{tooltip.building.objectCount.toLocaleString()}</b> objects
          </div>
          <div>
            <b>{formatBytes(tooltip.building.largestObjectRetainedBytes)}</b> largest object
          </div>
          <div className={tooltip.building.deltaBytes > 0 ? 'Positive' : tooltip.building.deltaBytes < 0 ? 'Negative' : ''}>
            <b>
              {tooltip.building.deltaBytes > 0 ? '+' : ''}
              {formatBytes(tooltip.building.deltaBytes)}
            </b>{' '}
            · {tooltip.building.growthPercent.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  )
}
