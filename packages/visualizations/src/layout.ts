import { hierarchy, treemap, treemapSquarify, type HierarchyRectangularNode } from 'd3-hierarchy'
import type { BuildingLayout, BuildingView, DistrictLayout } from './types.ts'

interface TreeValue {
  building?: BuildingView
  children?: TreeValue[]
  name: string
  path: string
}

export interface CityLayout {
  readonly buildings: readonly BuildingLayout[]
  readonly districts: readonly DistrictLayout[]
}

const createTree = (buildings: readonly BuildingView[]): TreeValue => {
  const root: TreeValue = { children: [], name: 'Memory City', path: '' }
  for (const building of buildings.toSorted((a, b) => a.path.localeCompare(b.path))) {
    const parts = building.path.split('/')
    let current = root
    for (let index = 0; index < parts.length; index++) {
      const name = parts[index]
      const path = parts.slice(0, index + 1).join('/')
      current.children ||= []
      let child = current.children.find((item) => item.name === name)
      if (!child) {
        child = { name, path }
        current.children.push(child)
      }
      if (index === parts.length - 1) {
        child.building = building
      } else {
        child.children ||= []
      }
      current = child
    }
  }
  return root
}

const getSlopeLimit = (buildings: readonly BuildingView[]): number => {
  const values = buildings.map((building) => Math.abs(building.growthSlope)).sort((a, b) => a - b)
  return values[Math.min(values.length - 1, Math.floor(values.length * 0.95))] || 1
}

const mix = (left: readonly number[], right: readonly number[], amount: number): string => {
  const values = left.map((value, index) => Math.round(value + (right[index] - value) * amount))
  return `rgb(${values.join(',')})`
}

export const getGrowthColor = (slope: number, limit: number): string => {
  const normalized = Math.max(-1, Math.min(1, Math.sign(slope) * (Math.log1p(Math.abs(slope)) / Math.log1p(limit))))
  const neutral = [78, 91, 116]
  return normalized < 0 ? mix(neutral, [39, 211, 220], -normalized) : mix(neutral, [238, 72, 177], normalized)
}

export const computeCityLayout = (buildings: readonly BuildingView[]): CityLayout => {
  if (buildings.length === 0) {
    return { buildings: [], districts: [] }
  }
  const root = hierarchy(createTree(buildings))
    .sum((item) => Math.max(1, item.building?.objectCount || 0))
    .sort((a, b) => (b.value || 0) - (a.value || 0) || a.data.path.localeCompare(b.data.path))
  treemap<TreeValue>()
    .size([100, 100])
    .paddingOuter(1)
    .paddingInner(0.55)
    .paddingTop((node) => (node.depth > 0 ? 2.2 : 0))
    .tile(treemapSquarify.ratio(1.2))(root)
  const retainedValues = buildings.map((building) => building.retainedBytes)
  const maxRetained = Math.max(...retainedValues, 1)
  const slopeLimit = getSlopeLimit(buildings)
  const buildingLayouts: BuildingLayout[] = []
  const districts: DistrictLayout[] = []
  for (const node of root.descendants() as HierarchyRectangularNode<TreeValue>[]) {
    const width = Math.max(0.18, node.x1 - node.x0)
    const depth = Math.max(0.18, node.y1 - node.y0)
    if (node.data.building) {
      const height =
        node.data.building.retainedBytes === 0
          ? 0.001
          : 0.35 + (Math.log1p(node.data.building.retainedBytes) / Math.log1p(maxRetained)) * 24
      buildingLayouts.push({
        ...node.data.building,
        color: getGrowthColor(node.data.building.growthSlope, slopeLimit),
        depth: Math.max(0.12, depth - 0.18),
        height,
        width: Math.max(0.12, width - 0.18),
        x: node.x0 + width / 2 - 50,
        z: node.y0 + depth / 2 - 50,
      })
    } else if (node.depth > 0 && node.depth <= 2) {
      districts.push({
        depth,
        height: 0.06 + node.depth * 0.025,
        path: node.data.path,
        width,
        x: node.x0 + width / 2 - 50,
        z: node.y0 + depth / 2 - 50,
      })
    }
  }
  return { buildings: buildingLayouts, districts }
}
