import * as ModeType from '../ModeType/ModeType.ts'

interface Effect {
  readonly type: string
  readonly value: any
}

interface EffectsResult {
  readonly effects: readonly Effect[]
  readonly newState: any
}

export const getEffects = async (state: any, newState: any): Promise<EffectsResult> => {
  if (newState === state) {
    return {
      effects: [],
      newState,
    }
  }
  const effects: Effect[] = []
  if (newState.stdout && newState.stdout.length > 0) {
    effects.push({
      type: 'stdout',
      value: newState.stdout.join(''),
    })
  }
  if (newState.previousFilters.length > 0) {
    effects.push({
      type: 'add-filters',
      value: newState.previousFilters,
    })
  }
  if (newState.mode === ModeType.Exit) {
    effects.push({
      type: 'exit',
      value: null,
    })
  }
  if (newState.mode === ModeType.Interrupted) {
    effects.push({
      type: 'kill-workers',
      value: null,
    })
  }
  if (state.mode !== ModeType.Running && newState.mode === ModeType.Running) {
  }
  return {
    effects,
    newState,
  }
}
