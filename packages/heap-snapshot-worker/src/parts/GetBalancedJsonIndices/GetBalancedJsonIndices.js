const State = {
  TopLevel: 0,
  InsideString: 1,
}

const Character = {
  Quote: '"',
  CurlyOpen: '{',
  CurlyClose: '}',
  SquareOpen: '[',
  SquareClose: ']',
}

export const getBalancedJsonIndices = (data, startIndex) => {
  let balance = 0
  let state = State.TopLevel
  for (let i = startIndex; i < data.length; i++) {
    switch (data[i]) {
      case Character.Quote:
        break
      case Character.CurlyOpen:
        balance++
        break
      case Character.CurlyClose:
        balance--
        if (balance === 0) {
          return i + 1
        }
        break
      case Character.SquareOpen:
        break
      case Character.SquareClose:
        break
    }
    // switch(state){
    // case State.TopLevel
    // }
    const char = data[i]
  }
  return -1
}
