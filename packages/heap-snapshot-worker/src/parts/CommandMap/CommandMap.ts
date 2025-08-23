import * as CompareHeapSnapshotsFunctions from '../CompareHeapSnapshotsFunctions/CompareHeapSnapshotsFunctions.ts'
import * as GetArraysByClosureLocationFromHeapSnapshotCommand from '../GetArraysByClosureLocationFromHeapSnapshotCommand/GetArraysByClosureLocationFromHeapSnapshotCommand.ts'
import * as GetDomTimerCountFromHeapSnapshot from '../GetDomTimerCountFromHeapSnapshot/GetDomTimerCountFromHeapSnapshot.ts'
import * as GetLargestArraysFromHeapSnapshot from '../GetLargestArraysFromHeapSnapshot/GetLargestArraysFromHeapSnapshot.ts'
import * as GetMediaQueryListCountFromHeapSnapshot from '../GetMediaQueryListCountFromHeapSnapshot/GetMediaQueryListCountFromHeapSnapshot.ts'
import * as GetNamedArrayCountFromHeapSnapshot from '../GetNamedArrayCountFromHeapSnapshot/GetNamedArrayCountFromHeapSnapshot.ts'
import * as GetNamedClosureCountFromHeapSnapshot from '../GetNamedClosureCountFromHeapSnapshot/GetNamedClosureCountFromHeapSnapshot.ts'
import * as GetNamedEmitterCountFromHeapSnapshot from '../GetNamedEmitterCountFromHeapSnapshot/GetNamedEmitterCountFromHeapSnapshot.ts'
import * as GetNamedFunctionCountFromHeapSnapshot from '../GetNamedFunctionCountFromHeapSnapshot/GetNamedFunctionCountFromHeapSnapshot.ts'
import * as GetObjectShapeCountFromHeapSnapshot from '../GetObjectShapeCountFromHeapSnapshot/GetObjectShapeCountFromHeapSnapshot.ts'
import * as GetObjectsWithProperties from '../GetObjectsWithProperties/GetObjectsWithProperties.ts'
import * as GetPrototypeChainAnalysisFromHeapSnapshot from '../GetPrototypeChainAnalysisFromHeapSnapshot/GetPrototypeChainAnalysisFromHeapSnapshot.ts'
import * as GetRegexpObjectsFromHeapSnapshot from '../GetRegexpObjectsFromHeapSnapshot/GetRegexpObjectsFromHeapSnapshot.ts'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'
import * as LoadHeapSnapshot from '../LoadHeapSnapshot/LoadHeapSnapshot.ts'
import * as ParseHeapSnapshotNumbers from '../ParseHeapSnapshotNumbers/ParseHeapSnapshotNumbers.ts'
import * as ParseHeapSnapshotStrings from '../ParseHeapSnapshotStrings/ParseHeapSnapshotStrings.ts'
import * as ParseHeapSnapshotStringsCount from '../ParseHeapSnapshotStringsCount/ParseHeapSnapshotStringsCount.ts'
import * as ParseUserStrings from '../ParseUserStrings/ParseUserStrings.ts'
import * as CompareHeapSnapshotsFunctions2 from '../CompareHeapSnapshotsFunctions2/CompareHeapSnapshotsFunctions2.ts'

export const commandMap = {
  'HeapSnapshot.compareFunctions': CompareHeapSnapshotsFunctions.compareHeapSnapshotFunctions,
  'HeapSnapshot.dispose': HeapSnapshotState.dispose,
  'HeapSnapshot.getArraysByClosureLocation':
    GetArraysByClosureLocationFromHeapSnapshotCommand.getArraysByClosureLocationFromHeapSnapshotCommand,
  'HeapSnapshot.getLargestArraysFromHeapSnapshot': GetLargestArraysFromHeapSnapshot.getLargestArraysFromHeapSnapshot,
  'HeapSnapshot.getObjectsWithProperties': GetObjectsWithProperties.getObjectsWithProperties,
  'HeapSnapshot.getRegexpObjects': GetRegexpObjectsFromHeapSnapshot.getRegexpObjectsFromHeapSnapshot,
  'HeapSnapshot.load': LoadHeapSnapshot.loadHeapSnapshot,
  'HeapSnapshot.parseDomTimerCount': GetDomTimerCountFromHeapSnapshot.getDomTimerCountFromHeapSnapshot,
  'HeapSnapshot.parseFunctions': GetNamedFunctionCountFromHeapSnapshot.getNamedFunctionCountFromHeapSnapshot,
  'HeapSnapshot.parseMediaQueryListCount': GetMediaQueryListCountFromHeapSnapshot.getMediaQueryListCountFromHeapSnapshot,
  'HeapSnapshot.parseNamedArrayCount': GetNamedArrayCountFromHeapSnapshot.getNamedArrayCountFromHeapSnapshot,
  'HeapSnapshot.parseNamedClosureCount': GetNamedClosureCountFromHeapSnapshot.getNamedClosureCountFromHeapSnapshot,
  'HeapSnapshot.parseNamedEmitterCount': GetNamedEmitterCountFromHeapSnapshot.getNamedEmitterCountFromHeapSnapshot,
  'HeapSnapshot.parseNumbers': ParseHeapSnapshotNumbers.parseHeapSnapshotNumbers,
  'HeapSnapshot.parseObjectShapeCount': GetObjectShapeCountFromHeapSnapshot.getObjectShapeCountFromHeapSnapshot,
  'HeapSnapshot.parsePrototypeChains': GetPrototypeChainAnalysisFromHeapSnapshot.getPrototypeChainAnalysisFromHeapSnapshot,
  'HeapSnapshot.parseStringCount': ParseHeapSnapshotStringsCount.parseHeapSnapshotStringsCount,
  'HeapSnapshot.parseStrings': ParseHeapSnapshotStrings.parseHeapSnapshotStrings,
  'HeapSnapshot.parseUserStrings': ParseUserStrings.parseUserStrings,
  'HeapSnapshot.compareFunctions2': CompareHeapSnapshotsFunctions2.compareHeapSnapshotFunctions2,
}
