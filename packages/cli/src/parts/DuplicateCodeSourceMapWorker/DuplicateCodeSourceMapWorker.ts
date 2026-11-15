import { parentPort, workerData } from 'node:worker_threads'
import type { SourceMapReference } from '../DuplicateCode/DuplicateCode.ts'
import { loadDuplicateCodeSourceMap } from '../LoadDuplicateCodeSourceMap/LoadDuplicateCodeSourceMap.ts'
import { mapDuplicateCodeLocations } from '../MapDuplicateCodeLocations/MapDuplicateCodeLocations.ts'

const { file, reference, positions } = workerData as { file: string; reference?: SourceMapReference; positions: readonly number[] }
const { contents, url } = await loadDuplicateCodeSourceMap(file, reference)
parentPort!.postMessage({ url, locations: await mapDuplicateCodeLocations(contents, positions) })
