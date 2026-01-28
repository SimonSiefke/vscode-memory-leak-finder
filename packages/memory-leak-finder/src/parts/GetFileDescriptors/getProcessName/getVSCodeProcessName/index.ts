const getVSCodeProcessName = (args: string[]): string | null => {
  // Check for specific VS Code process types
  const typeIndex = args.indexOf('--type')
  if (typeIndex !== -1 && typeIndex + 1 < args.length) {
    const processType = args[typeIndex + 1]
    // Map common VS Code process types to readable names
    const typeMap: Record<string, string> = {
      extensionHost: 'VS Code Extension Host',
      fileWatcher: 'VS Code File Watcher',
      'gpu-process': 'VS Code GPU Process',
      ptyHost: 'VS Code PTY Host',
      renderer: 'VS Code Renderer',
      'shared-process': 'VS Code Shared Process',
      utility: 'VS Code Utility',
    }
    if (typeMap[processType]) {
      return typeMap[processType]
    }
    return `VS Code ${processType}`
  }

  // Check for utility-sub-type
  const subTypeIndex = args.indexOf('--utility-sub-type')
  if (subTypeIndex !== -1 && subTypeIndex + 1 < args.length) {
    const subType = args[subTypeIndex + 1]
    if (subType.includes('node.mojom.NodeService')) {
      return 'VS Code Node Service'
    }
    if (subType.includes('network.mojom.NetworkService')) {
      return 'VS Code Network Service'
    }
    if (subType.includes('storage.mojom.StorageService')) {
      return 'VS Code Storage Service'
    }
    return `VS Code ${subType.split('.').pop()}`
  }

  // Check for extension host
  if (args.some((arg) => arg.includes('extensionHost'))) {
    return 'VS Code Extension Host'
  }

  return 'VS Code'
}

export { getVSCodeProcessName }
