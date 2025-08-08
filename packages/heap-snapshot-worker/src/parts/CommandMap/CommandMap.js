import * as CompareHeapSnapshotsFunctions from '../CompareHeapSnapshotsFunctions/CompareHeapSnapshotsFunctions.js'
import * as GetArraysByClosureLocationFromHeapSnapshotCommand from '../GetArraysByClosureLocationFromHeapSnapshotCommand/GetArraysByClosureLocationFromHeapSnapshotCommand.js'
import * as GetLargestArraysFromHeapSnapshot from '../GetLargestArraysFromHeapSnapshot/GetLargestArraysFromHeapSnapshot.js'
import * as GetNamedArrayCountFromHeapSnapshot from '../GetNamedArrayCountFromHeapSnapshot/GetNamedArrayCountFromHeapSnapshot.js'
import * as GetNamedClosureCountFromHeapSnapshot from '../GetNamedClosureCountFromHeapSnapshot/GetNamedClosureCountFromHeapSnapshot.js'
import * as GetMediaQueryListCountFromHeapSnapshot from '../GetMediaQueryListCountFromHeapSnapshot/GetMediaQueryListCountFromHeapSnapshot.ts'
import * as GetNamedEmitterCountFromHeapSnapshot from '../GetNamedEmitterCountFromHeapSnapshot/GetNamedEmitterCountFromHeapSnapshot.js'
import * as GetNamedFunctionCountFromHeapSnapshot from '../GetNamedFunctionCountFromHeapSnapshot/GetNamedFunctionCountFromHeapSnapshot.js'
import * as GetObjectShapeCountFromHeapSnapshot from '../GetObjectShapeCountFromHeapSnapshot/GetObjectShapeCountFromHeapSnapshot.js'
import * as GetObjectsWithProperties from '../GetObjectsWithProperties/GetObjectsWithProperties.js'
import * as GetPrototypeChainAnalysisFromHeapSnapshot from '../GetPrototypeChainAnalysisFromHeapSnapshot/GetPrototypeChainAnalysisFromHeapSnapshot.js'
import * as GetRegexpObjectsFromHeapSnapshot from '../GetRegexpObjectsFromHeapSnapshot/GetRegexpObjectsFromHeapSnapshot.js'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.js'
import * as LoadHeapSnapshot from '../LoadHeapSnapshot/LoadHeapSnapshot.js'
import * as ParseHeapSnapshotNumbers from '../ParseHeapSnapshotNumbers/ParseHeapSnapshotNumbers.js'
import * as ParseHeapSnapshotStrings from '../ParseHeapSnapshotStrings/ParseHeapSnapshotStrings.js'
import * as ParseHeapSnapshotStringsCount from '../ParseHeapSnapshotStringsCount/ParseHeapSnapshotStringsCount.js'

export const commandMap = {
  'HeapSnapshot.compareFunctions': CompareHeapSnapshotsFunctions.compareHeapSnapshotFunctions,
  'HeapSnapshot.dispose': HeapSnapshotState.dispose,
  'HeapSnapshot.getArraysByClosureLocation':
    GetArraysByClosureLocationFromHeapSnapshotCommand.getArraysByClosureLocationFromHeapSnapshotCommand,
  'HeapSnapshot.getLargestArraysFromHeapSnapshot': GetLargestArraysFromHeapSnapshot.getLargestArraysFromHeapSnapshot,
  'HeapSnapshot.getRegexpObjects': GetRegexpObjectsFromHeapSnapshot.getRegexpObjectsFromHeapSnapshot,
  'HeapSnapshot.load': LoadHeapSnapshot.loadHeapSnapshot,
  'HeapSnapshot.parseFunctions': GetNamedFunctionCountFromHeapSnapshot.getNamedFunctionCountFromHeapSnapshot,
  'HeapSnapshot.parseNamedArrayCount': GetNamedArrayCountFromHeapSnapshot.getNamedArrayCountFromHeapSnapshot,
  'HeapSnapshot.parseNamedClosureCount': GetNamedClosureCountFromHeapSnapshot.getNamedClosureCountFromHeapSnapshot,
  'HeapSnapshot.parseMediaQueryListCount': GetMediaQueryListCountFromHeapSnapshot.getMediaQueryListCountFromHeapSnapshot,
  'HeapSnapshot.parseNamedEmitterCount': GetNamedEmitterCountFromHeapSnapshot.getNamedEmitterCountFromHeapSnapshot,
  'HeapSnapshot.parseNumbers': ParseHeapSnapshotNumbers.parseHeapSnapshotNumbers,
  'HeapSnapshot.parseObjectShapeCount': GetObjectShapeCountFromHeapSnapshot.getObjectShapeCountFromHeapSnapshot,
  'HeapSnapshot.getObjectsWithProperties': GetObjectsWithProperties.getObjectsWithProperties,
  'HeapSnapshot.parsePrototypeChains': GetPrototypeChainAnalysisFromHeapSnapshot.getPrototypeChainAnalysisFromHeapSnapshot,
  'HeapSnapshot.parseStrings': ParseHeapSnapshotStrings.parseHeapSnapshotStrings,
  'HeapSnapshot.parseStringCount': ParseHeapSnapshotStringsCount.parseHeapSnapshotStringsCount,
}
