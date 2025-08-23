import * as MeasureCombined from '../MeasureCombined/MeasureCombined.ts'
import * as WrappedMeasures from '../WrappedMeasures/WrappedMeasures.ts'

const MemoryLeakFinder = {
  MeasureCombined,
  WrappedMeasures,
}

export const loadMemoryLeakFinder = async () => {
  return MemoryLeakFinder
}
