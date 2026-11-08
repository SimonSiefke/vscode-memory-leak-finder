interface WorkspaceApi {
  Workspace: { add(file: { name: string; content: string }): Promise<void>; remove(name: string): Promise<void> }
  Explorer: {
    focus(): Promise<void>
    refresh(): Promise<void>
    shouldHaveItem(name: string): Promise<void>
    not: { toHaveItem(name: string): Promise<void> }
  }
}

// A fresh window can render the Explorer before its filesystem watcher subscribes.
// Observe an update after an initial snapshot; both checks stay outside scenario.run().
export const prepareWorkspaceWatcher = async (api: WorkspaceApi): Promise<void> => {
  const snapshot = '.large-benchmark-snapshot-ready'
  const update = '.large-benchmark-watcher-ready'
  try {
    await api.Workspace.add({ name: snapshot, content: '' })
    await api.Explorer.focus()
    await api.Explorer.refresh()
    await api.Explorer.shouldHaveItem(snapshot)
    await api.Workspace.add({ name: update, content: '' })
    await api.Explorer.shouldHaveItem(update)
  } finally {
    await Promise.all([api.Workspace.remove(snapshot), api.Workspace.remove(update)])
  }
  await api.Explorer.not.toHaveItem(snapshot)
  await api.Explorer.not.toHaveItem(update)
}
