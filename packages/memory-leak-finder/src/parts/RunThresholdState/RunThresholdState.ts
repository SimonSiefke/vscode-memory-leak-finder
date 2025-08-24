export const state = {
  threshold: 0 as number,
}

export const set = (value: number): void => {
  if (Number.isFinite(value) && value >= 0) {
    state.threshold = value
  } else {
    state.threshold = 0
  }
}

export const get = (): number => {
  return state.threshold
}
