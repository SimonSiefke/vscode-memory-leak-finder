export const state = {
  commands: Object.create(null),
}

export const registerCommand = (key, fn) => {
  state.commands[key] = fn
}

export const registerCommands = (commandMap) => {
  for (const [key, value] of Object.entries(commandMap)) {
    registerCommand(key, value)
  }
}

export const getCommand = (key) => {
  return state.commands[key]
}
