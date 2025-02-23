export const mockCursorConfig = {
  cursorCreds: {
    cppBackendUrl: 'https://example.com',
    websiteUrl: 'https://example.com',
    backendUrl: 'https://example.com',
    authClientId: 'abc',
    authDomain: 'prod.authentication.cursor.sh',
    repoBackendUrl: 'https://example.com',
    telemBackendUrl: 'https://example.com',
    cmdkBackendUrl: 'https://example.com',
    hfUrl: 'https://example.com',
    geoCppBackendUrl: 'https://example.com',
    cppConfigBackendUrl: 'https://example.com',
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
  },
  notepadState: { isNotepadEnabled: true },
  controlPanelState: { location: 'floating', isControlPanelWindowEnabled: false },
  aiFeaturesCopyPasteState: { mentions: [] },
  syncDevModeColorTheme: true,
  cppModelsState: { cppModels: ['main', 'turbo'], defaultCppModel: 'main' },
  autopilotFeatureEnabled: false,
  isLinterEnabled: false,
  bigCmdKEnabled: false,
  aiSettings: {
    openAIModel: 'claude-3.5-sonnet',
    regularChatModel: 'claude-3.5-sonnet',
    cmdKModel: 'claude-3.5-sonnet',
    terminalCmdKModel: 'claude-3.5-sonnet',
    composerModel: 'claude-3.5-sonnet',
    privateFTOpenAIModel: null,
    longContextOpenAIModel: 'claude-3-5-sonnet-200k',
    teamIds: [],
    modelOverrideEnabled: [],
  },
  authenticationSettings: { githubLoggedIn: false },
  docState: { visibleDocs: [], usableDocs: [], previosulyUsedDocs: [] },
  lastUpdateHiddenTimeInUnixSeconds: 0,
  lintRules: '',
  bubbleTimesLeft: 1,
  showAgentActionDebugger: false,
  cmdLineHookState: { ignored: false, timesShown: 0 },
  agentDebuggerState: { priomptLiveMode: false, isRecordingTasks: true },
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
  haveNotSeen: { chat: true, submit: true, context: true },
  newUserData: { toolUsageCount: { plainChat: 0, contextChat: 0, intentChat: 0 } },
  azureState: { useAzure: false },
  interpreterModeSettings: { interpreterModeByDefault: false },
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
  SPECIAL_KEY_lastUpdatedTimeInUnixSeconds: 1740342411.829,
  aiHyperModeUXType: 'auto-accept',
  aiPreviewsEnabled: true,
  aiPreviewSettings: {
    enabledFeatures: { summary: true, relatedFiles: true, relatedCommits: true },
    summary: { isExpanded: true },
    relatedFiles: { isExpanded: true },
    relatedCommits: { isExpanded: false },
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
    shouldMigrateFromGpt4ToGpt4o: true,
    shouldMigrateFromGpt4oToClaudeSonnet: true,
    didMigrateFromGpt4oToClaudeSonnet: true,
    didMigrateBackFromClaudeSonnetToGpt4o: false,
  },
  aiReviewPersistentStorage: { customInstructions: '' },
  indexingState: { lastAskedToIndexTime: 0 },
  shouldNotTryToGetThemToNoticeCpp: true,
  checklistState: { shouldSeeOnboardingChecklist: true },
  membershipType: 'free',
  havePerformedSettingsServiceMigration: true,
  SPECIAL_KEY_id: 'abc',
  cppHasLoadedConfigFromCopilot: true,
  hasDisabledErrorLensForAiLinter: true,
  cursorPredictionState: {
    modelConfigs: [
      { name: 'legacy', radius: 80 },
      { name: 'default', radius: 50 },
      { name: 'v2', radius: 1000 },
      { name: 'v3', radius: 1000 },
    ],
    defaultModel: 'default',
    heuristics: [1],
  },
  removeAIReview: true,
  noStorageMode: true,
  selectedPrivacyForOnboarding: true,
}
