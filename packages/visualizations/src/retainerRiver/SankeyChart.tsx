import { sankey, sankeyLinkHorizontal, type SankeyGraph, type SankeyLink, type SankeyNode } from 'd3-sankey'
import { useMemo, useState } from 'react'
import type { RetainerRiverLink, RetainerRiverNode, RetainerRiverStage } from './report.ts'
import { formatBytes } from './report.ts'

const Width = 1180
const MinimumHeight = 620
const MarginX = 26
const MarginTop = 56
const MarginBottom = 34

const stageIndex: Record<RetainerRiverStage, number> = {
  leak: 3,
  retainer: 2,
  root: 0,
  service: 1,
}

const stageColor: Record<RetainerRiverStage, string> = {
  leak: '#f47b68',
  retainer: '#d6a552',
  root: '#5b83b4',
  service: '#40a89b',
}

type LayoutNode = SankeyNode<RetainerRiverNode, RetainerRiverLink>
type LayoutLink = SankeyLink<RetainerRiverNode, RetainerRiverLink>

const getNode = (node: string | LayoutNode): LayoutNode => {
  return node as LayoutNode
}

const getStage = (node: LayoutNode): RetainerRiverStage => {
  return node.stage
}

const truncate = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value
  }
  return `${value.slice(0, maxLength - 1)}…`
}

interface SankeyChartProps {
  readonly links: readonly RetainerRiverLink[]
  readonly nodes: readonly RetainerRiverNode[]
  readonly onSelectLink: (link: RetainerRiverLink) => void
  readonly selectedLinkId?: string
}

export const SankeyChart = ({ links, nodes, onSelectLink, selectedLinkId }: SankeyChartProps) => {
  const [hoveredFlowId, setHoveredFlowId] = useState<string | undefined>()
  const maximumNodesInStage = Math.max(
    0,
    ...(['root', 'service', 'retainer', 'leak'] as const).map((stage) => nodes.filter((node) => node.stage === stage).length),
  )
  const height = Math.max(MinimumHeight, MarginTop + MarginBottom + maximumNodesInStage * 44)
  const graph = useMemo(() => {
    const layout = sankey<RetainerRiverNode, RetainerRiverLink>()
      .nodeId((node) => node.id)
      .nodeAlign((node) => stageIndex[node.stage])
      .nodeWidth(14)
      .nodePadding(20)
      .nodeSort((a, b) => b.retainedBytes - a.retainedBytes || a.label.localeCompare(b.label))
      .extent([
        [MarginX, MarginTop],
        [Width - MarginX, height - MarginBottom],
      ])
    return layout({
      links: links.map((link) => ({ ...link, value: link.retainedBytes })) as any,
      nodes: nodes.map((node) => ({ ...node })),
    }) as SankeyGraph<RetainerRiverNode, RetainerRiverLink>
  }, [height, links, nodes])

  const path = sankeyLinkHorizontal<RetainerRiverNode, RetainerRiverLink>()

  return (
    <div className="RiverScroll" aria-label="Retaining paths visualization">
      <svg
        className="River"
        role="img"
        aria-label="Sankey diagram showing retained memory from GC roots to leaked objects"
        viewBox={`0 0 ${Width} ${height}`}
      >
        <defs>
          {graph.links.map((link) => {
            const source = getNode(link.source)
            const target = getNode(link.target)
            return (
              <linearGradient id={`gradient-${link.id}`} key={link.id} gradientUnits="userSpaceOnUse" x1={source.x1} x2={target.x0}>
                <stop offset="0%" stopColor={stageColor[getStage(source)]} />
                <stop offset="100%" stopColor={stageColor[getStage(target)]} />
              </linearGradient>
            )
          })}
        </defs>

        {(['root', 'service', 'retainer', 'leak'] as const).map((stage) => (
          <g key={stage}>
            <text className="StageLabel" x={MarginX + stageIndex[stage] * ((Width - MarginX * 2 - 14) / 3)} y="22">
              {stage === 'root'
                ? 'GC ROOTS'
                : stage === 'service'
                  ? 'SERVICES / OWNERS'
                  : stage === 'retainer'
                    ? 'CLOSURES / COLLECTIONS'
                    : 'LEAKS'}
            </text>
            <line
              className="StageRule"
              x1={MarginX + stageIndex[stage] * ((Width - MarginX * 2 - 14) / 3)}
              x2={MarginX + stageIndex[stage] * ((Width - MarginX * 2 - 14) / 3) + 160}
              y1="36"
              y2="36"
            />
          </g>
        ))}

        <g className="RiverLinks">
          {graph.links.map((link) => {
            const isMuted = Boolean(hoveredFlowId && hoveredFlowId !== link.flowId)
            const isSelected = selectedLinkId === link.id
            const width = Math.max(2, link.width || 0)
            const label = `${getNode(link.source).label} to ${getNode(link.target).label}, ${formatBytes(link.retainedBytes)}, ${link.objectCount} objects`
            return (
              <path
                aria-label={label}
                className={`RiverLink${isSelected ? ' is-selected' : ''}${isMuted ? ' is-muted' : ''}`}
                d={path(link) || undefined}
                key={link.id}
                onBlur={() => setHoveredFlowId(undefined)}
                onClick={() => onSelectLink(link)}
                onFocus={() => setHoveredFlowId(link.flowId)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectLink(link)
                  }
                }}
                onMouseEnter={() => setHoveredFlowId(link.flowId)}
                onMouseLeave={() => setHoveredFlowId(undefined)}
                role="button"
                stroke={`url(#gradient-${link.id})`}
                strokeWidth={width}
                tabIndex={0}
              >
                <title>{label}</title>
              </path>
            )
          })}
        </g>

        <g className="RiverNodes">
          {graph.nodes.map((node) => {
            const height = Math.max(4, (node.y1 || 0) - (node.y0 || 0))
            const isRight = node.stage === 'leak'
            const textX = isRight ? (node.x0 || 0) - 9 : (node.x1 || 0) + 9
            const anchor = isRight ? 'end' : 'start'
            const nodeLabel = `${node.label}, ${formatBytes(node.retainedBytes)}, ${node.objectCount} objects`
            return (
              <g key={node.id}>
                <rect
                  aria-label={nodeLabel}
                  className="RiverNode"
                  fill={stageColor[node.stage]}
                  height={height}
                  rx="4"
                  width={(node.x1 || 0) - (node.x0 || 0)}
                  x={node.x0}
                  y={node.y0}
                >
                  <title>{nodeLabel}</title>
                </rect>
                <text
                  className="NodeLabel"
                  dominantBaseline="middle"
                  textAnchor={anchor}
                  x={textX}
                  y={((node.y0 || 0) + (node.y1 || 0)) / 2}
                >
                  <tspan className="NodeName" x={textX} dy="-0.45em">
                    {truncate(node.label, 29)}
                  </tspan>
                  <tspan className="NodeValue" x={textX} dy="1.35em">
                    {formatBytes(node.retainedBytes)} · {node.objectCount} objects{node.inferred ? ' · inferred' : ''}
                  </tspan>
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
