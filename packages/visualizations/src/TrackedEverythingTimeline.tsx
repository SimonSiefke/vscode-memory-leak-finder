import { useEffect, useRef } from 'react'

const colors = ['#ee48b1', '#24d5de', '#8b7cf6', '#f5b84b', '#63d471', '#f4775b', '#5aa8ff', '#c4cfdf']

export const TrackedEverythingTimeline = ({
  cursor,
  eventCount,
  timeline,
  types,
}: {
  readonly cursor: number
  readonly eventCount: number
  readonly timeline: Readonly<Record<string, readonly number[]>>
  readonly types: readonly string[]
}) => {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) {
      return
    }
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const scale = window.devicePixelRatio || 1
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    const context = canvas.getContext('2d')
    if (!context) {
      return
    }
    context.scale(scale, scale)
    context.clearRect(0, 0, width, height)
    const binCount = types.length ? timeline[types[0]]?.length || 0 : 0
    const totals = Array.from({ length: binCount }, (_, bin) => types.reduce((total, type) => total + (timeline[type]?.[bin] || 0), 0))
    const maximum = Math.max(1, ...totals)
    for (let bin = 0; bin < binCount; bin++) {
      const x = (bin / Math.max(1, binCount)) * width
      const binWidth = Math.ceil(width / Math.max(1, binCount)) + 1
      let bottom = height
      for (let typeIndex = 0; typeIndex < types.length; typeIndex++) {
        const value = timeline[types[typeIndex]]?.[bin] || 0
        const segmentHeight = (value / maximum) * height
        context.fillStyle = colors[typeIndex % colors.length]
        context.fillRect(x, bottom - segmentHeight, binWidth, segmentHeight)
        bottom -= segmentHeight
      }
    }
    const cursorX = (cursor / Math.max(1, eventCount)) * width
    context.fillStyle = '#ffffff'
    context.fillRect(cursorX - 1, 0, 2, height)
  }, [cursor, eventCount, timeline, types])
  return <canvas className="EverythingDensity" ref={ref} aria-label="Creation density by type" />
}
