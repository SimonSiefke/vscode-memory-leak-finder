import * as CommandMap from '../CommandMap/CommandMap.js'
import * as CommandState from '../CommandState/CommandState.js'

CommandState.registerCommands(CommandMap.commandMap)

export * from '../RunTests/RunTests.js'
