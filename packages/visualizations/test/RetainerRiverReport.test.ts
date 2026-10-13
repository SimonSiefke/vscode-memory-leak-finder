import { describe, expect, test } from '@jest/globals'
import { fixtureReport } from '../src/retainerRiver/fixture.ts'
import { formatBytes, getEvidenceSummary, getFilteredReport, validateRetainerRiverReport } from '../src/retainerRiver/report.ts'

describe('formatBytes', () => {
  test.each([
    [0, '0 B'],
    [700, '700 B'],
    [1024, '1.00 KB'],
    [10 * 1024, '10.0 KB'],
    [128 * 1024, '128 KB'],
    [2.5 * 1024 * 1024, '2.50 MB'],
  ])('formats %s bytes', (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected)
  })
})

describe('getEvidenceSummary', () => {
  test('discloses sampled paths while retaining the complete object count', () => {
    const link = { ...fixtureReport.links[0], evidenceTruncated: true, objectCount: 1000 }
    expect(getEvidenceSummary(link)).toBe(`Showing ${link.evidence.length} sampled paths for 1,000 objects. Counts include every object.`)
  })

  test('leaves older exhaustive reports unchanged', () => {
    expect(getEvidenceSummary(fixtureReport.links[0])).toBeUndefined()
  })
})

describe('validateRetainerRiverReport', () => {
  test('accepts the fixture', () => {
    expect(validateRetainerRiverReport(fixtureReport)).toBe(fixtureReport)
  })

  test('rejects an unsupported schema', () => {
    expect(() => validateRetainerRiverReport({ ...fixtureReport, schemaVersion: 2 })).toThrow('Unsupported report schema version')
  })

  test('rejects a dangling link', () => {
    const links = [{ ...fixtureReport.links[0], target: 'missing' }]
    expect(() => validateRetainerRiverReport({ ...fixtureReport, links })).toThrow('references an unknown node')
  })

  test('rejects malformed nodes and links', () => {
    expect(() => validateRetainerRiverReport(null)).toThrow('Report must be an object')
    expect(() => validateRetainerRiverReport({ ...fixtureReport, nodes: undefined })).toThrow('nodes and links arrays')
    expect(() => validateRetainerRiverReport({ ...fixtureReport, nodes: [{ id: 1 }] })).toThrow('string id and label')
    expect(() =>
      validateRetainerRiverReport({
        ...fixtureReport,
        nodes: [{ ...fixtureReport.nodes[0], retainedBytes: -1 }],
      }),
    ).toThrow('Invalid retained byte count')
    expect(() =>
      validateRetainerRiverReport({
        ...fixtureReport,
        links: [{ ...fixtureReport.links[0], retainedBytes: 0 }],
      }),
    ).toThrow('Invalid retained byte count or evidence')
  })
})

describe('getFilteredReport', () => {
  test('keeps every segment of a matching flow', () => {
    const result = getFilteredReport(fixtureReport, 'TextModel', 0)
    expect(result.links).toHaveLength(3)
    expect(new Set(result.links.map((link) => link.flowId))).toEqual(new Set(['text-models']))
    expect(result.nodes).toHaveLength(4)
  })

  test('searches retaining properties', () => {
    const result = getFilteredReport(fixtureReport, '_instances', 0)
    expect(new Set(result.links.map((link) => link.flowId))).toEqual(new Set(['terminals']))
  })

  test('filters by retained bytes', () => {
    const result = getFilteredReport(fixtureReport, '', 10 * 1024 * 1024)
    expect(new Set(result.links.map((link) => link.flowId))).toEqual(new Set(['editor-widgets', 'text-models']))
  })

  test('returns a valid empty graph', () => {
    const result = getFilteredReport(fixtureReport, 'does not exist', 0)
    expect(result.links).toEqual([])
    expect(result.nodes).toEqual([])
  })
})
