import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, Layers3, Pause, Play, Search } from 'lucide-react'
import { computeCityLayout, getGrowthColor } from './layout.ts'
import { MemoryCityScene } from './MemoryCityScene.tsx'
import { TrackedEverythingTimeline } from './TrackedEverythingTimeline.tsx'
import { decodeTrackedEverythingEvents, eventIndexToTime, getSitePath, timeToEventIndex } from './trackedEverythingModel.ts'
import type { TrackedEverythingAggregates, TrackedEverythingDataset } from './trackedEverythingTypes.ts'
import type { BuildingLayout, BuildingView } from './types.ts'

const emptyAggregates: TrackedEverythingAggregates = {
  cursor: 0,
  fileCounts: {},
  recentFileCounts: {},
  recentSiteCounts: [],
  siteCounts: [],
  timeline: {},
  typeCounts: {},
  types: [],
}

const getFinalCounts = (
  events: Uint32Array,
  dataset: TrackedEverythingDataset,
): { readonly fileCounts: Record<string, number>; readonly siteCounts: number[] } => {
  const fileCounts: Record<string, number> = Object.create(null)
  const siteCounts = Array.from({ length: dataset.sites.length }, () => 0)
  for (const siteId of events) {
    const path = getSitePath(dataset.sites[siteId])
    fileCounts[path] = (fileCounts[path] || 0) + 1
    siteCounts[siteId]++
  }
  return { fileCounts, siteCounts }
}

const toView = (path: string, count: number): BuildingView => ({
  deltaBytes: count,
  growthPercent: count === 0 ? 0 : 100,
  growthSlope: count,
  kind: 'source',
  largestObjectRetainedBytes: count,
  objectCount: count,
  path,
  retainedBytes: count,
  shallowBytes: count,
})

const getSiteBuildingPath = (siteId: number): string => `site/${siteId}`

export const TrackedEverythingApp = ({ dataset }: { readonly dataset: TrackedEverythingDataset }) => {
  const workerRef = useRef<Worker | null>(null)
  const [aggregates, setAggregates] = useState(emptyAggregates)
  const [axis, setAxis] = useState<'allocation' | 'time'>('time')
  const [error, setError] = useState('')
  const [finalFileCounts, setFinalFileCounts] = useState<Record<string, number>>({})
  const [finalSiteCounts, setFinalSiteCounts] = useState<readonly number[]>([])
  const [playing, setPlaying] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedPath, setSelectedPath] = useState('')
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null)
  const [selectedType, setSelectedType] = useState('')

  useEffect(() => {
    const worker = new Worker(new URL('./trackedEverythingWorker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker
    worker.onmessage = (event: MessageEvent<TrackedEverythingAggregates & { readonly kind: string }>) => {
      setAggregates(event.data)
    }
    const load = async (): Promise<void> => {
      try {
        const response = await fetch(dataset.eventFile)
        if (!response.ok) {
          throw new Error(`event stream request returned ${response.status}`)
        }
        const buffer = await response.arrayBuffer()
        if (buffer.byteLength !== dataset.eventCount * 4) {
          throw new Error(`expected ${dataset.eventCount * 4} event bytes, received ${buffer.byteLength}`)
        }
        const events = decodeTrackedEverythingEvents(buffer, dataset)
        const finalCounts = getFinalCounts(events, dataset)
        setFinalFileCounts(finalCounts.fileCounts)
        setFinalSiteCounts(finalCounts.siteCounts)
        const normalizedBuffer = events.buffer as ArrayBuffer
        worker.postMessage({ buffer: normalizedBuffer, dataset, kind: 'init' }, [normalizedBuffer])
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : String(loadError))
      }
    }
    void load()
    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [dataset])

  const setCursor = useCallback(
    (cursor: number, type = selectedType) => {
      workerRef.current?.postMessage({ cursor, kind: 'cursor', selectedType: type })
    },
    [selectedType],
  )

  useEffect(() => {
    if (!playing || aggregates.cursor >= dataset.eventCount) {
      return
    }
    const increment = Math.max(1, Math.ceil(dataset.eventCount / 240))
    const handle = window.setInterval(() => {
      const next = Math.min(dataset.eventCount, aggregates.cursor + increment)
      setCursor(next)
      if (next === dataset.eventCount) {
        setPlaying(false)
      }
    }, 50)
    return () => window.clearInterval(handle)
  }, [aggregates.cursor, dataset.eventCount, playing, setCursor])

  const visibleSites = useMemo(
    () =>
      selectedPath
        ? dataset.sites.filter((site) => getSitePath(site) === selectedPath && (!selectedType || site.type === selectedType))
        : [],
    [dataset.sites, selectedPath, selectedType],
  )
  const finalViews = useMemo(
    () =>
      selectedPath
        ? visibleSites.map((site) => toView(getSiteBuildingPath(site.id), finalSiteCounts[site.id] || 0))
        : Object.entries(finalFileCounts).map(([path, count]) => toView(path, count)),
    [finalFileCounts, finalSiteCounts, selectedPath, visibleSites],
  )
  const finalLayout = useMemo(() => computeCityLayout(finalViews), [finalViews])
  const buildings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const recentLimit = Math.max(
      1,
      ...(selectedPath
        ? visibleSites.map((site) => aggregates.recentSiteCounts[site.id] || 0)
        : Object.values(aggregates.recentFileCounts)),
    )
    return finalLayout.buildings
      .filter((building) => {
        if (!normalizedQuery) {
          return true
        }
        if (!selectedPath) {
          return building.path.toLowerCase().includes(normalizedQuery)
        }
        const siteId = Number(building.path.split('/').at(-1))
        const site = dataset.sites[siteId]
        return `${site.type} ${site.originalSource || site.location} ${site.originalLine || ''}`.toLowerCase().includes(normalizedQuery)
      })
      .map((building): BuildingLayout => {
        const siteId = selectedPath ? Number(building.path.split('/').at(-1)) : -1
        const current = selectedPath ? aggregates.siteCounts[siteId] || 0 : aggregates.fileCounts[building.path] || 0
        const final = selectedPath ? finalSiteCounts[siteId] || 1 : finalFileCounts[building.path] || 1
        const recent = selectedPath ? aggregates.recentSiteCounts[siteId] || 0 : aggregates.recentFileCounts[building.path] || 0
        const progress = Math.log1p(current) / Math.log1p(final)
        return {
          ...building,
          color: getGrowthColor(recent, recentLimit),
          deltaBytes: current,
          growthPercent: (current / final) * 100,
          growthSlope: recent,
          height: current === 0 ? 0.001 : 0.001 + (building.height - 0.001) * progress,
          objectCount: current,
          retainedBytes: current,
          shallowBytes: current,
        }
      })
  }, [
    aggregates.fileCounts,
    aggregates.recentFileCounts,
    aggregates.recentSiteCounts,
    aggregates.siteCounts,
    dataset.sites,
    finalFileCounts,
    finalLayout.buildings,
    finalSiteCounts,
    query,
    selectedPath,
    visibleSites,
  ])
  const selectedSites = useMemo(
    () =>
      visibleSites
        .map((site) => ({
          ...site,
          count: aggregates.siteCounts[site.id] || 0,
          recentCount: aggregates.recentSiteCounts[site.id] || 0,
        }))
        .filter((site) => site.count > 0)
        .toSorted((left, right) => right.count - left.count)
        .slice(0, 12),
    [aggregates.recentSiteCounts, aggregates.siteCounts, visibleSites],
  )
  const selectedSite = selectedSiteId === null ? undefined : dataset.sites[selectedSiteId]
  const elapsedMs = eventIndexToTime(dataset.timeMarks, aggregates.cursor, dataset.durationMs)
  const sliderValue = axis === 'time' ? elapsedMs : aggregates.cursor
  const sliderMax = axis === 'time' ? dataset.durationMs : dataset.eventCount

  return (
    <div className="App EverythingApp">
      <header className="Topbar">
        <div className="Brand">
          <span className="BrandMark">
            <Layers3 size={21} />
          </span>
          <div>
            <div className="Eyebrow">LOSSLESS CREATION HISTORY</div>
            <h1>Tracked Everything</h1>
          </div>
        </div>
        <div className="HeaderStats">
          <div>
            <span>Created</span>
            <strong>{aggregates.cursor.toLocaleString()}</strong>
          </div>
          <div>
            <span>Sites</span>
            <strong>{dataset.sites.length.toLocaleString()}</strong>
          </div>
          <div>
            <span>Elapsed</span>
            <strong>{elapsedMs.toFixed(1)} ms</strong>
          </div>
        </div>
      </header>
      <section className="ControlDeck">
        <div className="ControlRow">
          <div className="Segmented">
            <button className={axis === 'time' ? 'Active' : ''} onClick={() => setAxis('time')} type="button">
              Time
            </button>
            <button className={axis === 'allocation' ? 'Active' : ''} onClick={() => setAxis('allocation')} type="button">
              Allocation
            </button>
          </div>
          <label className="Search">
            <Search size={15} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a source file…" />
          </label>
          <select
            className="TypeSelect"
            value={selectedType}
            onChange={(event) => {
              const value = event.target.value
              setSelectedType(value)
              setSelectedSiteId(null)
              setCursor(aggregates.cursor, value)
            }}
          >
            <option value="">All types</option>
            {aggregates.types.map((type) => (
              <option value={type} key={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="EverythingPath">
          <button
            type="button"
            onClick={() => {
              setSelectedPath('')
              setSelectedSiteId(null)
            }}
          >
            {dataset.scenario}
          </button>
          {selectedPath && (
            <>
              <ChevronRight size={13} />
              {selectedPath}
            </>
          )}
        </div>
      </section>
      <main className="Viewport">
        <MemoryCityScene
          buildings={buildings}
          districts={finalLayout.districts}
          onFailure={() => setError('WebGL could not initialize')}
          onHover={() => {}}
          onSelect={(building) => {
            if (selectedPath) {
              setSelectedSiteId(Number(building.path.split('/').at(-1)))
            } else {
              setSelectedPath(building.path)
              setSelectedSiteId(null)
            }
          }}
          resetToken={0}
          selectedPath={selectedSiteId === null ? '' : getSiteBuildingPath(selectedSiteId)}
        />
        <div className="SceneWash" />
        <aside className="Inspector EverythingInspector">
          <strong>{selectedPath ? selectedPath.split('/').at(-1) : 'Creation stream'}</strong>
          {selectedPath ? (
            selectedSite ? (
              <div className="EverythingSiteDetail">
                <b>{(aggregates.siteCounts[selectedSite.id] || 0).toLocaleString()} creations</b>
                <span>{selectedSite.type}</span>
                <span>
                  {selectedSite.originalSource || selectedSite.location}:{selectedSite.originalLine ?? ''}
                  {selectedSite.originalColumn === null ? '' : `:${selectedSite.originalColumn}`}
                </span>
                <span>+{(aggregates.recentSiteCounts[selectedSite.id] || 0).toLocaleString()} in the latest 1,024 events</span>
              </div>
            ) : (
              <ol>
                {selectedSites.map((site) => (
                  <li key={site.id}>
                    <b>{site.count.toLocaleString()}</b>
                    <span>
                      {site.type} · line {site.originalLine ?? site.location} · +{site.recentCount.toLocaleString()} recent
                    </span>
                  </li>
                ))}
              </ol>
            )
          ) : (
            <p>
              Select a building to inspect its hottest creation sites. Building footprints use final totals; heights show progress at the
              cursor.
            </p>
          )}
        </aside>
        {error && <div className="LoadNotice">{error}</div>}
      </main>
      <footer className="Timeline EverythingTimeline">
        <button
          className="PlayButton"
          type="button"
          onClick={() => {
            if (aggregates.cursor >= dataset.eventCount) {
              setCursor(0)
            }
            setPlaying((value) => !value)
          }}
        >
          {playing ? <Pause size={17} /> : <Play size={17} />}
        </button>
        <div className="EverythingTrack">
          <TrackedEverythingTimeline
            cursor={aggregates.cursor}
            eventCount={dataset.eventCount}
            timeline={aggregates.timeline}
            types={aggregates.types}
          />
          <input
            aria-label={axis === 'time' ? 'Elapsed time' : 'Allocation index'}
            type="range"
            min={0}
            max={Math.max(1, sliderMax)}
            step={axis === 'time' ? 0.1 : 1}
            value={sliderValue}
            onChange={(event) => {
              setPlaying(false)
              const value = Number(event.target.value)
              setCursor(axis === 'time' ? timeToEventIndex(dataset.timeMarks, value, dataset.eventCount) : value)
            }}
          />
          <div className="EverythingScale">
            <span>0</span>
            <span>{axis === 'time' ? `${dataset.durationMs.toFixed(1)} ms` : dataset.eventCount.toLocaleString()}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
