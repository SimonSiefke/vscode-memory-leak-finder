const Character = {
  Quote: '"',
  CurlyOpen: '{',
  CurlyClose: '}',
  SquareOpen: '[',
  SquareClose: ']',
}

export const getBalancedJsonIndices = (data, startIndex) => {
  let balance = 0
  for (let i = startIndex; i < data.length; i++) {
    switch (data[i]) {
      case Character.Quote:
        const endIndex = data.indexOf(Character.Quote, i + 1)
        if (endIndex === -1) {
          return -1
        }
        i = endIndex
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
  }
  return -1
}
