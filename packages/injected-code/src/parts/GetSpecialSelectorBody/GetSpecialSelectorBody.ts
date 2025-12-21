import * as Character from '../Character/Character.ts'

/**
 * @enum {number}
 */
const State = {
  DoubleQuote: 2,
  Round: 3,
  TopLevel: 1,
}

export const getSpecialSelectorBody = (selector: string, i: number, specialSelector: string): string => {
  const startIndex = i + specialSelector.length
  const stack: number[] = []
  let state = State.TopLevel
  for (let j = startIndex; j < selector.length; j++) {
    const char = selector[j]
    switch (state) {
      case State.DoubleQuote:
        if (char === Character.DoubleQuote) {
          state = stack.pop() || State.TopLevel
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
      case State.TopLevel:
        switch (char) {
          case Character.Colon:
          case Character.Space: {
            return selector.slice(i, j)
          }
          case Character.DoubleQuote: {
            stack.push(state)
            state = State.DoubleQuote

            break
          }
          case Character.RoundOpen: {
            stack.push(state)
            state = State.Round

            break
          }
          // No default
        }
        break
      default:
        break
    }
  }
  return selector.slice(i)
}
