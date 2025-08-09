export const state: {
  commands: Record<string, (...args: any[]) => any>
} = {
  commands: Object.create(null),
}

export const registerCommand = (key: string, fn: (...args: any[]) => any): void => {
  state.commands[key] = fn
}

export const registerCommands = (commandMap: Record<string, (...args: any[]) => any>): void => {
  for (const [key, value] of Object.entries(commandMap)) {
    registerCommand(key, value)
  }
}

export const getCommand = (key: string): ((...args: any[]) => any) | undefined => {
  return state.commands[key]
}

