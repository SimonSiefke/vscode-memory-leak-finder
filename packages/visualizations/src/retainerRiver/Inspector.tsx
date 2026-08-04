import { ArrowRight, Braces, Code2, Layers3, MapPin, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { RetainerRiverLink, RetainerRiverNode, RetainerRiverStackFrame } from './report.ts'
import { formatBytes } from './report.ts'

const formatLocation = (frame: RetainerRiverStackFrame): string => {
  const location = frame.original || frame.generated
  if (!location) {
    return 'Source unavailable'
  }
  return `${location.source}:${location.line + 1}:${location.column + 1}`
}

const Stack = ({ frames, title }: { readonly frames: readonly RetainerRiverStackFrame[]; readonly title: string }) => {
  return (
    <section className="InspectorSection">
      <h3>
        <Code2 aria-hidden="true" size={15} />
        {title}
      </h3>
      {frames.length === 0 ? (
        <p className="Muted">Allocation stack was not recorded for this object.</p>
      ) : (
        <ol className="Stack">
          {frames.map((frame, index) => (
            <li key={`${frame.functionName}:${index}`}>
              <span className="StackIndex">{index + 1}</span>
              <div>
                <strong>{frame.functionName || '(anonymous)'}</strong>
                <span title={formatLocation(frame)}>{formatLocation(frame)}</span>
                {!frame.original && frame.generated && <small>generated location</small>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

interface InspectorProps {
  readonly link?: RetainerRiverLink
  readonly nodeById: ReadonlyMap<string, RetainerRiverNode>
  readonly onClose: () => void
}

export const Inspector = ({ link, nodeById, onClose }: InspectorProps) => {
  const [evidenceIndex, setEvidenceIndex] = useState(0)

  useEffect(() => {
    setEvidenceIndex(0)
  }, [link?.id])

  if (!link) {
    return (
      <aside className="Inspector InspectorEmpty">
        <div className="InspectorEmptyIcon">
          <Braces aria-hidden="true" size={22} />
        </div>
        <h2>Inspect a retaining edge</h2>
        <p>Select any river segment to see the concrete property chain and source-mapped allocation evidence behind it.</p>
        <span className="KeyboardHint">Tip: press Tab, then Enter</span>
      </aside>
    )
  }

  const source = nodeById.get(link.source)
  const target = nodeById.get(link.target)
  const item = link.evidence[Math.min(evidenceIndex, link.evidence.length - 1)]

  return (
    <aside className="Inspector" aria-label="Retaining edge details">
      <header className="InspectorHeader">
        <div>
          <span className="Eyebrow">Selected edge</span>
          <h2>
            {source?.label || link.source}
            <ArrowRight aria-hidden="true" size={16} />
            {target?.label || link.target}
          </h2>
        </div>
        <button aria-label="Close inspector" className="IconButton" onClick={onClose} type="button">
          <X aria-hidden="true" size={17} />
        </button>
      </header>

      <div className="MetricGrid">
        <div>
          <span>Retained</span>
          <strong>{formatBytes(link.retainedBytes)}</strong>
        </div>
        <div>
          <span>Objects</span>
          <strong>{link.objectCount.toLocaleString('en-US')}</strong>
        </div>
      </div>

      {item ? (
        <>
          {link.evidence.length > 1 && (
            <label className="EvidencePicker">
              <span>Retaining path</span>
              <select onChange={(event) => setEvidenceIndex(Number(event.target.value))} value={evidenceIndex}>
                {link.evidence.map((evidence, index) => (
                  <option key={`${evidence.retainingProperty}:${index}`} value={index}>
                    Path {index + 1} of {link.evidence.length} · {evidence.retainingProperty}
                  </option>
                ))}
              </select>
            </label>
          )}
          <section className="InspectorSection">
            <h3>
              <Layers3 aria-hidden="true" size={15} />
              Retaining property
            </h3>
            <div className="PropertyCard">
              <code>{item.retainingProperty}</code>
              <span>{item.leakedObject}</span>
            </div>
            {item.retainingLocation && (
              <div className="SourceLocation" title={item.retainingLocation.source}>
                <MapPin aria-hidden="true" size={14} />
                <span>
                  {item.retainingLocation.source}:{item.retainingLocation.line + 1}:{item.retainingLocation.column + 1}
                </span>
              </div>
            )}
          </section>

          <section className="InspectorSection">
            <h3>
              <Braces aria-hidden="true" size={15} />
              Concrete retaining chain
            </h3>
            <ol className="PropertyPath">
              {item.path.map((segment, index) => (
                <li key={`${segment.sourceName}:${segment.property}:${index}`}>
                  <span className="PathDot" />
                  <div>
                    <strong>{segment.sourceName}</strong>
                    <code>
                      {segment.edgeType} · {segment.property}
                    </code>
                    <span>{segment.targetName}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <Stack frames={item.allocationStack} title="Retaining object allocation" />
          <Stack frames={item.leakedObjectStack} title="Leaked object allocation" />
        </>
      ) : (
        <p className="Muted">No retaining evidence was recorded for this edge.</p>
      )}
    </aside>
  )
}
