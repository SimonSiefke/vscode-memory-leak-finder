interface RpcConnection {
  dispose(): Promise<void>
  invoke(method: string, ...params: unknown[]): Promise<unknown>
}

import type { FileOperation } from '../FileOperation/FileOperation.ts'

const state: {
  rpc: RpcConnection | undefined
} = {
  rpc: undefined,
}

export const set = (rpc: RpcConnection): void => {
  state.rpc = rpc
}

export const dispose = async (): Promise<void> => {
  if (state.rpc) {
    await state.rpc.dispose()
    state.rpc = undefined
  }
}

const invoke = (method: string, ...params: unknown[]): Promise<unknown> => {
  if (!state.rpc) {
    throw new Error('must initialize filesystem worker')
  }
  return state.rpc.invoke(method, ...params)
}

interface FindFilesOptions {
  cwd?: string
  exclude?: string[]
}

export const findFiles = (pattern: string, options: FindFilesOptions): Promise<string[]> => {
  return invoke('FileSystem.findFiles', pattern, options) as Promise<string[]>
}

export const readFileContent = (path: string): Promise<string> => {
  return invoke('FileSystem.readFileContent', path) as Promise<string>
}

interface ExecOptions {
  cwd?: string
  reject?: boolean
  env?: Record<string, string | undefined>
  stdio?: string
}

export const exec = (command: string, args: string[], options: ExecOptions): Promise<{ exitCode: number; stderr: string; stdout: string }> => {
  return invoke('FileSystem.exec', command, args, options) as Promise<{ exitCode: number; stderr: string; stdout: string }>
}

export const applyFileOperations = (operations: readonly FileOperation[]): Promise<void> => {
  return invoke('FileSystem.applyFileOperations', operations) as Promise<void>
}

export const pathExists = (uri: string): Promise<boolean> => {
  return invoke('FileSystem.exists', uri) as Promise<boolean>
}

export const makeDirectory = (uri: string): Promise<void> => {
  return invoke('FileSystem.makeDirectory', uri) as Promise<void>
}
