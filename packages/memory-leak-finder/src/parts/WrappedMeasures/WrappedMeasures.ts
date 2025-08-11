import * as RawMeasures from '../Measures/Measures.js'
import * as WrapMeasure from '../WrapMeasure/WrapMeasure.js'

export const Measures = Object.create(null)

for (const [key, value] of Object.entries(RawMeasures)) {
  Measures[key] = WrapMeasure.wrapMeasure(value)
}
