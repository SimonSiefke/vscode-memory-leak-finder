import { expect, test } from '@jest/globals'
import { computeCityLayout, getGrowthColor } from '../src/layout.ts'
import { filterBuildingViews, getBuildingViews, isMemoryCityDataset } from '../src/model.ts'
import { sampleData } from '../src/sampleData.ts'

test('validates the versioned dataset contract', () => {
  expect(isMemoryCityDataset(sampleData)).toBe(true)
  expect(isMemoryCityDataset({ ...sampleData, schemaVersion: 2 })).toBe(false)
  expect(isMemoryCityDataset({ ...sampleData, revisions: [{ id: 'bad', label: 'bad', owners: {} }] })).toBe(false)
  expect(isMemoryCityDataset(null)).toBe(false)
})

test('computes two-revision delta and a trailing three-revision slope', () => {
  const second = getBuildingViews(sampleData, 'renderer', 1).find((building) => building.path.endsWith('textModel.ts'))
  const third = getBuildingViews(sampleData, 'renderer', 2).find((building) => building.path.endsWith('textModel.ts'))
  const base = sampleData.revisions[0].owners.renderer.buildings.find((building) => building.path.endsWith('textModel.ts'))
  if (!base || !second || !third) {
    throw new Error('Expected textModel.ts fixture')
  }
  expect(second.deltaBytes).toBe(second.retainedBytes - base.retainedBytes)
  expect(third.growthSlope).toBeGreaterThan(0)
})

test('filters owner buildings by search, district, and runtime visibility', () => {
  const buildings = getBuildingViews(sampleData, 'renderer', 2)
  expect(filterBuildingViews(buildings, 'textmodel', '', true)).toHaveLength(1)
  expect(filterBuildingViews(buildings, '', 'src/vs/editor', false).every((building) => building.kind === 'source')).toBe(true)
  expect(filterBuildingViews(buildings, '', '', false).some((building) => building.kind === 'runtime')).toBe(false)
})

test('treemap layout is deterministic and preserves every building', () => {
  const buildings = getBuildingViews(sampleData, 'renderer', 2)
  const first = computeCityLayout(buildings)
  const second = computeCityLayout([...buildings].reverse())
  expect(first).toEqual(second)
  expect(first.buildings).toHaveLength(buildings.length)
  expect(first.districts.length).toBeGreaterThan(0)
  expect(first.buildings.every((building) => building.height > 0 && building.width > 0 && building.depth > 0)).toBe(true)
})

test('growth colors use cyan for shrinkage, slate for neutral, and magenta for growth', () => {
  expect(getGrowthColor(-100, 100)).toBe('rgb(39,211,220)')
  expect(getGrowthColor(0, 100)).toBe('rgb(78,91,116)')
  expect(getGrowthColor(100, 100)).toBe('rgb(238,72,177)')
})
