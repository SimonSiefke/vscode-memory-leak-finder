export const mockCursorConfig = {
  cursorCreds: {
    cppBackendUrl: 'https://example.com',
    websiteUrl: 'https://example.com',
    backendUrl: 'https://example.com',
    authClientId: 'abc',
    authDomain: 'prod.authentication.cursor.sh',
    repoBackendUrl: 'example.com',
    telemBackendUrl: 'example.com',
    cmdkBackendUrl: 'example.com',
    hfUrl: 'example.com',
    geoCppBackendUrl: 'example.com',
    cppConfigBackendUrl: 'example.com',
    credentialsDisplayName: 'Prod',
  },
  composerState: {
    isComposerEnabled2: true,
    alwaysKeepComposerInBound: true,
    location: 'bar',
    enableDevTools: false,
    isBackgroundComposerEnabled: false,
    isPersistenceEnabled2: true,
    isComposerCapabilitiesEnabled: false,
    defaultCapabilities: [],
    barAnchor: 'center',
    autoApplyFilesOutsideContext: true,
    location2: 'pane',
    nonBarLocation: 'pane',
    chatLocation: 'pane',
    hasMigratedChatLocation: true,
    shouldAutoContinueToolCall: false,
    useYoloMode: false,
    yoloPrompt: '',
    yoloCommandAllowlist: [],
    yoloCommandDenylist: [],
    preferDiffInChat: true,
    mainComposerMode: 'edit',
    useAutoContext: false,
    useContextBank: false,
    defaultUseToolsInEdit: false,
    enableDataHandleDebugging: false,
    unification2: true,
    unification6: 'disabled',
    shouldReviewChanges: 'enabled',
    wasBarPreviouslyOpen: false,
    doNotShowYoloModeWarningAgain: false,
    selectedFakeStreamerId: null,
    yoloDeleteFileDisabled: false,
    isPlannerToolEnabled: false,
    isWebViewerToolEnabled: false,
    webViewerAllowNonLocalhost: false,
  },
  notepadState: {
    isNotepadEnabled: true,
  },
  controlPanelState: {
    location: 'floating',
    isControlPanelWindowEnabled: false,
  },
  aiFeaturesCopyPasteState: {
    mentions: [],
  },
  syncDevModeColorTheme: true,
  cppModelsState: {
    cppModels: ['fast'],
    defaultCppModel: 'main',
    defaultModel: 'fusion-01-27',
  },
  autopilotFeatureEnabled: false,
  isLinterEnabled: false,
  bigCmdKEnabled: false,
  aiSettings: {
    openAIModel: 'claude-3.5-sonnet',
    regularChatModel: 'cursor-small',
    cmdKModel: 'cursor-small',
    terminalCmdKModel: 'cursor-small',
    composerModel: 'cursor-small',
    privateFTOpenAIModel: null,
    longContextOpenAIModel: 'claude-3-5-sonnet-200k',
    teamIds: [],
    modelOverrideEnabled: ['gpt-4o', 'claude-3.5-sonnet', 'cursor-small'],
    modelOverrideDisabled: ['gpt-4'],
    usageHardLimit: 0,
    isUsagePricingEnabled: false,
  },
  authenticationSettings: {
    githubLoggedIn: false,
  },
  docState: {
    visibleDocs: [],
    usableDocs: [],
    previosulyUsedDocs: [],
  },
  lastUpdateHiddenTimeInUnixSeconds: 0,
  lintRules: '',
  bubbleTimesLeft: 1,
  showAgentActionDebugger: false,
  cmdLineHookState: {
    ignored: false,
    timesShown: 0,
  },
  agentDebuggerState: {
    priomptLiveMode: false,
    isRecordingTasks: true,
  },
  showLinterDebugger: false,
  linterDebuggerState: {
    specificRules: true,
    compileErrors: false,
    changeBehavior: true,
    matchCode: false,
    relevance: true,
    userAwareness: true,
  },
  compressComposerEdits: true,
  cacheChatPrompts: true,
  cmdkDiffHistoryEnabled: false,
  shouldOnlyImportOnAccept: true,
  cppAutoImportDecorationStyle: 'squiggle',
  lintSettings: {
    forceEnableDiscriminators: [],
    forceDisableDiscriminators: [],
    forceEnableGenerators: [],
    forceDisableGenerators: [],
    watcherThreshold: 0.2,
    watcherDebounceTimeSeconds: 30,
    runOnSaveInstead: true,
    silenceIfOverlappingWithRegularLinter: true,
  },
  lastUpgradeToProNotificationTime: 0,
  hallucinatedFunctionsPersistentState: {},
  haveNotSeen: {
    chat: true,
    submit: true,
    context: true,
  },
  newUserData: {
    toolUsageCount: {
      plainChat: 0,
      contextChat: 0,
      intentChat: 0,
    },
  },
  azureState: {
    useAzure: false,
  },
  interpreterModeSettings: {
    interpreterModeByDefault: false,
  },
  cppFireOnEveryCursorChange: false,
  personalDocs: [],
  chunkedStreamingEnabledV2: true,
  cppCachedTypeaheadEnabled: true,
  cppManualTriggerWithOpToken: false,
  cppTriggerInComments: true,
  fastCppEnabled: false,
  cppEnabled: true,
  indexRepository: true,
  haveNotImportedFromVSC: true,
  shouldAutoParseCmdKLinks: false,
  SPECIAL_KEY_lastUpdatedTimeInUnixSeconds: 1740349646.039,
  aiHyperModeUXType: 'auto-accept',
  aiPreviewsEnabled: true,
  aiPreviewSettings: {
    enabledFeatures: {
      summary: true,
      relatedFiles: true,
      relatedCommits: true,
    },
    summary: {
      isExpanded: true,
    },
    relatedFiles: {
      isExpanded: true,
    },
    relatedCommits: {
      isExpanded: false,
    },
  },
  chatFadeInAnimationEnabled: false,
  isFileSyncClientEnabled: true,
  isAiReviewInputExpanded: true,
  useFastApplyModel: false,
  fastApplyModelType: 1,
  explicitlyEnableSemanticSearch: false,
  aiCursorHelpEnabled: true,
  showAllCmdKContexts: false,
  aiDocAgentEnabled: false,
  markdownTestString: '',
  cppInPeek: true,
  cursorPredictionUIExperiments: [],
  isCursorSmallEnabledForTheFirstTime: false,
  oneTimeSettings: {
    shouldDisableGithubCopilot: true,
    shouldMigrateFromGpt4ToGpt4o: false,
    shouldMigrateFromGpt4oToClaudeSonnet: false,
    didMigrateFromGpt4oToClaudeSonnet: true,
    didMigrateBackFromClaudeSonnetToGpt4o: false,
  },
  aiReviewPersistentStorage: {
    customInstructions: '',
  },
  indexingState: {
    lastAskedToIndexTime: 0,
  },
  shouldNotTryToGetThemToNoticeCpp: true,
  checklistState: {
    shouldSeeOnboardingChecklist: true,
    doneCommandL: true,
  },
  membershipType: 'pro',
  havePerformedSettingsServiceMigration: true,
  SPECIAL_KEY_id: 'abc',
  cppHasLoadedConfigFromCopilot: true,
  hasDisabledErrorLensForAiLinter: true,
  cursorPredictionState: {
    modelConfigs: [
      {
        name: 'legacy',
        radius: 80,
      },
      {
        name: 'default',
        radius: 50,
      },
      {
        name: 'v2',
        radius: 1000,
      },
      {
        name: 'v3',
        radius: 1000,
      },
    ],
    defaultModel: 'default',
    heuristics: [1],
  },
  removeAIReview: true,
  noStorageMode: true,
  selectedPrivacyForOnboarding: true,
  mcpServers: [],
  bugbotState: {
    isEnabled: true,
    preferredModelName: 'o1-preview',
  },
  shouldShowViewZoneWhenPreviewBoxIsClipped4: false,
  cppInCmdF: true,
  cppShowWhitespaceOnlyChanges: false,
  fastSemanticSearchEnabled: false,
  preferredEmbeddingModel: 0,
  turboModeOptions: {
    timesShownUpgradeMessage: 0,
  },
  internalAnalyticsDebugMode: false,
  fullContextOptions: {
    compress: true,
    hasDismissed: false,
  },
  teamBlocklist: [],
  availableDefaultModels2: [
    {
      name: 'claude-3.5-sonnet',
      defaultOn: true,
      isLongContextOnly: false,
    },
    {
      name: 'gpt-4',
      defaultOn: false,
    },
    {
      name: 'gpt-4o',
      defaultOn: true,
    },
    {
      name: 'claude-3-opus',
      defaultOn: false,
    },
    {
      name: 'cursor-fast',
      defaultOn: false,
    },
    {
      name: 'cursor-small',
      defaultOn: true,
    },
    {
      name: 'gpt-3.5-turbo',
      defaultOn: false,
    },
    {
      name: 'gpt-4-turbo-2024-04-09',
      defaultOn: false,
    },
    {
      name: 'gpt-4o-128k',
      defaultOn: true,
      isLongContextOnly: true,
    },
    {
      name: 'gemini-1.5-flash-500k',
      defaultOn: true,
      isLongContextOnly: true,
    },
    {
      name: 'claude-3-haiku-200k',
      defaultOn: true,
      isLongContextOnly: true,
    },
    {
      name: 'claude-3-5-sonnet-200k',
      defaultOn: true,
      isLongContextOnly: true,
    },
    {
      name: 'gpt-4o-mini',
      defaultOn: true,
      isLongContextOnly: false,
    },
    {
      name: 'o1-mini',
      defaultOn: false,
      isLongContextOnly: false,
    },
    {
      name: 'o1-preview',
      defaultOn: false,
      isLongContextOnly: false,
    },
    {
      name: 'o1',
      defaultOn: true,
      isLongContextOnly: false,
    },
    {
      name: 'claude-3.5-haiku',
      defaultOn: false,
      isLongContextOnly: false,
    },
    {
      name: 'gemini-2.0-pro-exp',
      defaultOn: false,
    },
    {
      name: 'gemini-2.0-flash-thinking-exp',
      defaultOn: false,
    },
    {
      name: 'gemini-2.0-flash',
      defaultOn: false,
    },
    {
      name: 'deepseek-v3',
      defaultOn: false,
    },
    {
      name: 'deepseek-r1',
      defaultOn: false,
    },
    {
      name: 'o3-mini',
      defaultOn: false,
    },
    {
      name: 'grok-2',
      defaultOn: false,
    },
  ],
  useOpenAIKey: false,
  cppConfig: {
    heuristics: [4, 5, 6, 2],
    excludeRecentlyViewedFilesPatterns: [
      '.env',
      '.production',
      '.pem',
      '.cursor-retrieval.',
      '.cursor-always-local.',
      '.svg',
      '.lock',
      '.jsonl',
      '.csv',
      '.tsv',
      'Copilot++',
    ],
    enableRvfTracking: true,
    globalDebounceDurationMillis: 70,
    clientDebounceDurationMillis: 50,
    cppUrl: 'https://api3.cursor.sh',
    useWhitespaceDiffHistory: true,
    enableFilesyncDebounceSkipping: false,
    checkFilesyncHashPercent: 0.004999999888241291,
    geoCppBackendUrl: 'https://us-eu.gcpp.cursor.sh',
    isFusedCursorPredictionModel: true,
    includeUnchangedLines: false,
    shouldFetchRvfText: false,
    aboveRadius: 1,
    belowRadius: 2,
    isOn: true,
    isGhostText: true,
    shouldLetUserEnableCppEvenIfNotPro: true,
    importPredictionConfig: {
      isDisabledByBackend: false,
      shouldTurnOnAutomatically: true,
      pythonEnabled: false,
    },
    recentlyRejectedEditThresholds: {
      hardRejectThreshold: 2,
      softRejectThreshold: 5,
    },
    maxNumberOfClearedSuggestionsSinceLastAccept: 20,
    suggestionHintConfig: {
      importantLspExtensions: ['vscode.typescript-language-features', 'ms-python.python', 'rust-lang.rust-analyzer', 'golang.go'],
      enabledForPathExtensions: ['.ts', '.tsx', '.py', '.js', '.go', '.rs'],
    },
  },
  cacheComposerPrompts: true,
}
