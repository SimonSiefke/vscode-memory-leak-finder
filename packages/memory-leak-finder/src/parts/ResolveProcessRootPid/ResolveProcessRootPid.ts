import * as GetSshRemoteServerRootPid from '../GetSshRemoteServerRootPid/GetSshRemoteServerRootPid.ts'

type ResolveSshRemoteServerRootPid = () => Promise<number | undefined>

type Dependencies = {
  readonly resolveSshRemoteServerRootPid: ResolveSshRemoteServerRootPid
}

export const createResolveProcessRootPid = (dependencies: Dependencies) => {
  return async (pid: number | undefined, processRootStrategy: string): Promise<number | undefined> => {
    if (pid === undefined) {
      return undefined
    }
    if (processRootStrategy === 'ssh-remote-server') {
      const remotePid = await dependencies.resolveSshRemoteServerRootPid()
      return remotePid ?? pid
    }
    return pid
  }
}

export const resolveProcessRootPid = createResolveProcessRootPid({
  resolveSshRemoteServerRootPid: GetSshRemoteServerRootPid.getSshRemoteServerRootPid,
})
