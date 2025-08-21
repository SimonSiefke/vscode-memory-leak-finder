import { Initialize } from '../TestPrefix/TestPrefix.ts'

// TODO when initialization is done, clear the intializing message and print instead that initialization is done with the time it took
export const getInitializingMessage = async (): Promise<string> => {
  const messageFileName = Initialize
  return `${messageFileName}\n`
}
