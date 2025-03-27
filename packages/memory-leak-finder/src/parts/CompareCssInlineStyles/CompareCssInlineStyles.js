import * as Assert from '../Assert/Assert.js'

export const compareCssInlineStyles = (before, after) => {
  Assert.object(before)
  Assert.object(after)
  return {
    before,
    after,
  }
}
