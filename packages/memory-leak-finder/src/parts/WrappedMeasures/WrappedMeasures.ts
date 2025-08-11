import * as RawMeasures from '../Measures/Measures.ts'
import * as WrapMeasure from '../WrapMeasure/WrapMeasure.ts'

export const Measures = Object.create(null)

for (const [key, value] of Object.entries(RawMeasures)) {
  Measures[key] = WrapMeasure.wrapMeasure(value)
}
