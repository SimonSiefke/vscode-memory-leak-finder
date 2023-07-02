import * as Character from '../Character/Character.js'

/**
 * @enum {number}
 */
const State = {
  TopLevel: 1,
  DoubleQuote: 2,
  Round: 3,
}

export const getSpecialSelectorBody = (selector, i, specialSelector) => {
  const startIndex = i + specialSelector.length
  const stack = []
  let state = State.TopLevel
  for (let j = startIndex; j < selector.length; j++) {
    const char = selector[j]
    switch (state) {
      case State.TopLevel:
        if (char === Character.RoundOpen) {
          stack.push(state)
          state = State.Round
        } else if (char === Character.DoubleQuote) {
          stack.push(state)
          state = State.DoubleQuote
        } else if (char === Character.Colon || char === Character.Space) {
          return selector.slice(i, j)
        }
        break
      case State.Round:
        if (char === Character.DoubleQuote) {
          stack.push(state)
          state = State.DoubleQuote
        } else if (char === Character.RoundClose) {
          state = stack.pop() || State.TopLevel
        }
        break
      case State.DoubleQuote:
        if (char === Character.DoubleQuote) {
          state = stack.pop() || State.TopLevel
        }
        break
      default:
        break
    }
  }
  return selector.slice(i)
}
