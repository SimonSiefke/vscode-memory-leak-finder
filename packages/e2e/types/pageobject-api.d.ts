// Generated API types for page-object
// This file provides type definitions for the page-object API used in e2e tests

export interface PageObjectContext {
  readonly page: any
  readonly createPageObject?: (page: any) => Promise<any>
  readonly expect: any
  readonly VError: any
  readonly ideVersion?: {
    readonly minor: number
  }
  readonly electronApp?: any
}

export interface NewWindowHandle {
  close(): Promise<void>
}

export interface ChatEditorModels {
  readonly Auto: 'Auto'
  readonly GPT41: 'GPT-4.1'
  readonly GPT5Mini: 'GPT-5 mini'
  readonly GPT54Mini: 'GPT-5.4 mini'
  readonly ZAiGLM45AirFree: 'zAiGLM4.5 air free'
  readonly DefaultFree: 'zAiGLM4.5 air free'
}

export type ChatModel = ChatEditorModels[keyof ChatEditorModels]
export type ChatEditorText = string | RegExp

export interface ChatEditorSendOptions {
  readonly message: string
  readonly viewLinesText?: ChatEditorText
  readonly image?: string
  readonly model?: ChatModel
}

export interface ChatEditorSendMessageOptions extends ChatEditorSendOptions {
  readonly expectedResponse?: string
  readonly approveToolCalls?: boolean
  readonly validateRequest?: { readonly exists: readonly unknown[] }
  readonly verify?: boolean
  readonly waitForFileChanges?: readonly string[]
  readonly waitForPorts?: readonly number[]
  readonly toolInvocations?: readonly any[]
}

export interface PageObjectWindowHandle extends NewWindowHandle {
  sessionRpc?: any
  locator?: (selector: string) => any
  waitForIdle(): Promise<void>
  shouldBeVisible(): Promise<void>
}

export interface ActivityBar {
  hide(): Promise<void>
  hideTooltip(): Promise<void>
  moveExplorerToPanel(): Promise<void>
  moveExtensionsToPanel(): Promise<void>
  moveRunAndDebugToPanel(): Promise<void>
  moveSearchToPanel(): Promise<void>
  moveSourceControlToPanel(): Promise<void>
  resetViewLocations(): Promise<void>
  show(): Promise<void>
  shouldBeHidden(): Promise<void>
  shouldBeVisible(): Promise<void>
  showTooltipExplorer(): Promise<void>
  showView(options?: any): Promise<void>
  showExplorer(): Promise<void>
  showExtensions(): Promise<void>
  showRunAndDebug(): Promise<void>
  showSearch(): Promise<void>
  showSourceControl(): Promise<void>
}
export interface ChatEditor {
  readonly Models: ChatEditorModels
  addAllProblemsAsContext(): Promise<void>
  addContext(initialPrompt: any, secondPrompt: any, confirmText: any): Promise<void>
  archiveAllActiveItems(): Promise<void>
  archiveFirstActiveItem(): Promise<void>
  attachImage(file: any): Promise<void>
  clearAll(): Promise<void>
  clearContext(contextName: any): Promise<void>
  focusSessionList(): Promise<void>
  getLatestResponseText(): Promise<string>
  shouldHaveAttachedContextHoverText(text: any): Promise<void>
  closeFinishSetup(): Promise<void>
  scrollToBottom(): Promise<void>
  scrollToTop(): Promise<void>
  shouldHaveCodeBlockWithLanguage(language: any): Promise<void>
  shouldHaveLatestResponseCodeBlockWithLanguage(language: any): Promise<void>
  moveToEditor(): Promise<void>
  moveToNewWindow(): Promise<NewWindowHandle>
  close(): Promise<void>
  moveToSideBar(): Promise<void>
  open(): Promise<void>
  openView(): Promise<void>
  openAgentDebugLogs(): Promise<void>
  openFinishSetup(): Promise<void>
  selectModel(modelName: ChatModel, retry?: boolean): Promise<void>
  sendPart1(options: ChatEditorSendOptions): Promise<void>
  send(options: ChatEditorSendOptions): Promise<void>
  sendMessage(options: ChatEditorSendMessageOptions): Promise<void>
  setMode(modeLabel: any): Promise<void>
  setModeLegacy(modeLabel: any): Promise<void>
  shouldBeVisibleInSecondarySideBar(): Promise<void>
  shouldHaveNoActiveItems(): Promise<void>
  retryLastMessage(): Promise<void>
  clickAccessButton(buttonText?: any): Promise<void>
  approveAllAccessRequests(options?: any): Promise<void>
  waitForLatestExchange(message: any): Promise<void>
  waitForNewWindow(options: any, electron: any): Promise<number>
  waitForWindowCount(electron: any, expectedCount: any): Promise<void>
}
export interface ColorPicker {
  close(): Promise<void>
  dragColorAreaPointerRight(): Promise<void>
  dragColorAreaPointerTo(options: any): Promise<void>
  getColorValue(): Promise<string>
  open(): Promise<void>
  shouldChangeColorValueWhenDraggingColorAreaPointerRight(): Promise<void>
}
export interface ContextMenu {
  check(name: any): Promise<void>
  checkSubItem(option: any): Promise<void>
  close(): Promise<void>
  open(locator: any): Promise<void>
  openSubMenu(option: any, expands?: any): Promise<void>
  select(option: any, needsFocus?: any): Promise<void>
  shouldHaveItem(option: any): Promise<void>
  uncheck(name: any): Promise<void>
}
export interface CursorChat {
  resetFocus(): Promise<void>
  sendMessage(question: any): Promise<void>
  shouldHaveMessageCount(count: any): Promise<void>
  shouldHaveResponse(responseText: any): Promise<void>
  show(): Promise<void>
}
export interface DebugConsole {
  clear(): Promise<void>
  clearInput(): Promise<void>
  evaluate(options: any): Promise<void>
  expand(options: any): Promise<void>
  hide(): Promise<void>
  shouldHaveCompletions(options: any): Promise<void>
  shouldHaveLogpointOutput(expectedMessage: any): Promise<void>
  show(): Promise<void>
  type(value: any): Promise<void>
}
export interface DebugHover {
  collapseProperty(name: any): Promise<void>
  expandProperty(name: any, options: any): Promise<void>
}
export interface Developer {
  toggleScreenCastMode(): Promise<void>
  toggleProcessExplorer(): Promise<void>
  startTracing(): Promise<void>
  stopTracing(): Promise<void>
}
export interface DiffEditor {
  expectModified(text: any): Promise<void>
  expectOriginal(text: any): Promise<void>
  open(options: any): Promise<void>
  scrollDown(): Promise<void>
  scrollDownInline(): Promise<void>
  scrollUp(): Promise<void>
  scrollUpInline(): Promise<void>
  shouldHaveModifiedEditor(text: any): Promise<void>
  shouldHaveOriginalEditor(text: any): Promise<void>
  stageChange(text: any): Promise<string[]>
}
export interface DropDownContextMenu {
  close(): Promise<void>
  select(option: any): Promise<void>
  shouldHaveItem(option: any): Promise<void>
}
export interface Editor {
  acceptInlineCompletion(): Promise<void>
  acceptRename(): Promise<void>
  addCursorBelow(): Promise<void>
  autoFix(options: any): Promise<void>
  click(text: any): Promise<void>
  clickLink(text: any): Promise<void>
  close(): Promise<void>
  closeAll(): Promise<void>
  closeOthers(): Promise<void>
  closeAllEditorGroups(): Promise<void>
  closeAutoFix(): Promise<void>
  closeFind(): Promise<void>
  closeInspectedTokens(): Promise<void>
  closePeekDefinition(): Promise<void>
  cursorRight(): Promise<void>
  deleteAll(): Promise<void>
  deleteCharactersLeft(options: any): Promise<void>
  deleteCharactersRight(options: any): Promise<void>
  disableReadonly(): Promise<void>
  disableStickyScroll(): Promise<void>
  disableVersionLens(): Promise<void>
  duplicateSelection(): Promise<void>
  enable2x2GridView(): Promise<void>
  enableReadonly(): Promise<void>
  enableStickyScroll(): Promise<void>
  enableVersionLens(): Promise<void>
  expandSelection(): Promise<void>
  findAllReferences(): Promise<void>
  focus(): Promise<void>
  focusBottomEditorGroup(): Promise<void>
  focusLeftEditorGroup(): Promise<void>
  focusRightEditorGroup(): Promise<void>
  focusTopEditorGroup(): Promise<void>
  fold(): Promise<void>
  foldAll(): Promise<void>
  format(): Promise<void>
  goToDefinition(): Promise<void>
  goToEndOfLine(): Promise<void>
  goToFile(options: any): Promise<void>
  goToSourceDefinition(options: any): Promise<void>
  hideBreadCrumbs(): Promise<void>
  hideColorPicker(): Promise<void>
  hideDebugHover(): Promise<void>
  hideInlineChat(): Promise<void>
  hideMinimap(): Promise<void>
  hideSourceAction(): Promise<void>
  hideSourceActionEmpty(): Promise<void>
  hover(hoverText: any): Promise<void>
  inspectTokens(): Promise<void>
  moveScrollBar(y: any, expectedScrollBarY: any): Promise<void>
  newEditorGroupBottom(): Promise<void>
  newEditorGroupLeft(): Promise<void>
  newEditorGroupRight(): Promise<void>
  newEditorGroupTop(): Promise<void>
  newTextFile(): Promise<void>
  open(fileName: any, options?: any): Promise<void>
  openFind(): Promise<void>
  openSettingsJson(): Promise<void>
  peekDefinition(options: any): Promise<void>
  pin(): Promise<void>
  press(key: any): Promise<void>
  reloadWebViews(options: any): Promise<void>
  removeAllBreakpoints(): Promise<void>
  removeBreakPoint(lineNumber: any): Promise<void>
  rename(newText: any): Promise<void>
  renameCancel(newText: any): Promise<void>
  renameWithPreview(newText: any): Promise<void>
  replaceText(options: any): Promise<void>
  save(options: any): Promise<void>
  saveAll(): Promise<void>
  scrollDown(): Promise<void>
  scrollUp(): Promise<void>
  select(text: any): Promise<void>
  selectAll(options?: any): Promise<void>
  selectLine(): Promise<void>
  selectRefactor(actionText: any): Promise<void>
  selectSourceAction(actionText: any): Promise<void>
  setBreakpoint(lineNumber: any): Promise<void>
  setCursor(line: any, column: any): Promise<void>
  setLanguageMode(languageId: any): Promise<void>
  setLogpoint(lineNumber: any, logMessage: any): Promise<void>
  shouldHaveActiveLineNumber(value: any): Promise<void>
  shouldHaveBreadCrumb(text: any): Promise<void>
  shouldHaveCodeLens(options: any): Promise<void>
  shouldHaveCodeLensWithVersion(options: any): Promise<void>
  shouldHaveCursor(estimate: any): Promise<void>
  shouldHaveEmptySelection(): Promise<void>
  shouldHaveError(fileName: any): Promise<void>
  shouldHaveExceptionWidget(): Promise<void>
  shouldHaveFile(fileName: any): Promise<void>
  shouldHaveFoldingGutter(enabled: any): Promise<void>
  shouldHaveFontFamily(fontFamily: any): Promise<void>
  shouldHaveFontSize(expectedFontSize: any): Promise<void>
  shouldHaveInlineCompletion(expectedText: any): Promise<void>
  shouldHaveInspectedToken(name: any): Promise<void>
  shouldHaveLightBulb(): Promise<void>
  shouldHaveOverlayMessage(message: any): Promise<void>
  shouldHaveSelectedCharacters(count: any): Promise<void>
  shouldHaveBreadCrumbs(): Promise<void>
  shouldHaveMinimap(): Promise<void>
  shouldHaveSelection(left: any, width: any): Promise<void>
  shouldHaveSemanticToken(type: any): Promise<void>
  shouldHaveSpark(): Promise<void>
  shouldHaveSquigglyError(): Promise<void>
  shouldHaveControlCharacterHighlight(): Promise<void>
  shouldHaveVisibleWhitespace(fileName?: any): Promise<void>
  shouldNotHaveVisibleWhitespace(fileName?: any): Promise<void>
  shouldHaveVisibleLink(text: any): Promise<void>
  shouldHaveText(text: any, fileName?: any, groupId?: any): Promise<void>
  shouldHaveToken(text: any, color: any): Promise<void>
  shouldNotHaveSemanticToken(type: any): Promise<void>
  shouldNotHaveBreadCrumbs(): Promise<void>
  shouldNotHaveMinimap(): Promise<void>
  shouldNotHaveSquigglyError(): Promise<void>
  showBreadCrumbs(): Promise<void>
  showColorPicker(): Promise<void>
  showDebugHover(options: any): Promise<void>
  showInlineChat(): Promise<void>
  showMinimap(): Promise<void>
  showRefactor(): Promise<void>
  showSourceAction(): Promise<void>
  showSourceActionEmpty(): Promise<void>
  split(command: any, options?: any): Promise<void>
  splitDown(options?: any): Promise<void>
  splitLeft(): Promise<void>
  splitRight(options?: any): Promise<void>
  splitUp(): Promise<void>
  switchToTab(name: any): Promise<void>
  threeColumnsLayout(): Promise<void>
  toggleBreakpoint(): Promise<void>
  toggleScreenReaderAccessibilityMode(): Promise<void>
  type(text: any): Promise<void>
  undo(options?: any): Promise<void>
  unfold(): Promise<void>
  unfoldAll(): Promise<void>
  unpin(): Promise<void>
  waitForBinaryReady(): Promise<void>
  waitForImageReady(): Promise<void>
  waitForNoteBookReady(): Promise<void>
  waitforTextFileReady(fileName: any): Promise<void>
  waitForVideoReady(hasError: any): Promise<void>
  waitForWarning(): Promise<void>
  moveToNewWindow(): Promise<NewWindowHandle>
  close(): Promise<void>
  waitForNewWindow(options: any, electron: any): Promise<number>
}
export interface EditorFind {
  openReplace(): Promise<void>
  replace(): Promise<void>
  setReplaceValue(value: any): Promise<void>
  setSearchValue(value: any): Promise<void>
}
export interface Electron {
  evaluate(expression: any): Promise<void>
  getWindowCount(): Promise<number>
  getWindowIsVisible(windowId: any): Promise<boolean>
  getWindowIds(): Promise<readonly number[]>
  getAllWebContents(): Promise<readonly WebContentsEntry[]>
  getWebContents(webContentsId: any): Promise<WebContentsEntry | undefined>
  waitForNewWebContentsView(options?: any): Promise<WebContentsEntry>
  waitForWebContentsView(options?: any): Promise<WebContentsEntry>
  waitForWebContentsUrl(options?: any): Promise<WebContentsEntry>
  executeJavaScriptInWebContents(options?: any): Promise<void>
  waitForWebContentsText(options?: any): Promise<void>
  waitForWindowCount(expectedCount: any, timeout?: any): Promise<void>
  getNewWindowId(): Promise<number | null>
  waitForWindowVisible(windowId: any): Promise<void>
  closeWindow(windowId: any): Promise<void>
  mockDialog(response: any): Promise<void>
  mockElectron(namespace: any, key: any, implementationCode: any): Promise<void>
  mockOpenDialog(response: any): Promise<void>
  mockSaveDialog(response: any): Promise<void>
  mockShellTrashItem(): Promise<void>
  unmockElectron(namespace: any, key: any): Promise<void>
}
export interface ExternalRuntimeHandle {
  readonly args: readonly string[]
  readonly command: string
  readonly inspectPort: number
  readonly pid: number
  readonly runtimeName: 'bun' | 'node'
  readonly serverPort: number
  dispose(): Promise<void>
  evaluate(expression: any): Promise<unknown>
  getJson<T>(path: any, init?: any): Promise<T>
  getRuntimeInfo(): ExternalRuntimeInfo
  getRuntimeName(): Promise<'bun' | 'node'>
  getNamedArrayCount(): Promise<Record<string, number>>
  request(path: any, init?: any): Promise<Response>
  takeSnapshot(name: any): Promise<string>
}
export interface ExternalRuntimeInfo {
  readonly args: readonly string[]
  readonly command: string
  readonly inspectPort: number
  readonly pid: number
  readonly runtimeName: 'bun' | 'node'
  readonly serverPort: number
}
export interface ExternalRuntime {
  createPorts(): Promise<{
    inspectPort: number
    serverPort: number
  }>
  dispose(): Promise<void>
  evaluate(expression: any): Promise<unknown>
  getJson<T>(path: any, init?: any): Promise<T>
  getRuntimeInfo(): ExternalRuntimeInfo
  getRuntimeName(): Promise<'bun' | 'node'>
  getNamedArrayCount(): Promise<Record<string, number>>
  request(path: any, init?: any): Promise<Response>
  startExternalRuntime(options: any): Promise<void>
  takeSnapshot(name: any): Promise<string>
}
export interface Explorer {
  cancel(): Promise<void>
  click(): Promise<void>
  collapse(folderName: any): Promise<void>
  collapseAll(): Promise<void>
  copy(dirent: any): Promise<void>
  delete(item: any): Promise<void>
  executeContextMenuCommand(locator: any, option: any): Promise<void>
  expand(folderName: any): Promise<void>
  focus(): Promise<void>
  focusNext(): Promise<void>
  newFile(name: any): Promise<void>
  newFolder(options: any): Promise<void>
  toHaveItem(direntName: any): Promise<void>
  openAllFiles(): Promise<void>
  openContextMenu(dirent: any, _select?: any): Promise<void>
  openItem(direntName: any): Promise<void>
  paste(options?: any): Promise<void>
  refresh(): Promise<void>
  removeCurrent(): Promise<void>
  rename(oldDirentName: any, newDirentName: any): Promise<void>
  shouldHaveFocusedItem(direntName: any): Promise<void>
  selectItem(direntName: any): Promise<void>
  shouldHaveItem(direntName: any): Promise<void>
  toHaveItem(direntName: any): Promise<void>
  readonly not: any
}
export interface Extensions {
  add(options: any): Promise<void>
  clear(): Promise<void>
  closeSuggest(): Promise<void>
  click(): Promise<void>
  openContextMenu(): Promise<void>
  shouldBe(name: any): Promise<void>
  shouldHaveActivationTime(): Promise<void>
  hide(): Promise<void>
  install(options: any): Promise<void>
  moveScrollBar(y: any, expectedScrollBarTop: any): Promise<void>
  open(options: any): Promise<void>
  openSuggest(): Promise<void>
  restart(): Promise<void>
  scrollDown(): Promise<void>
  scrollUp(): Promise<void>
  search(value: any): Promise<void>
  click(): Promise<void>
  selectMcpItem(options: any): Promise<void>
  shouldHaveMcpItem(options: any): Promise<void>
  shouldHaveMcpWelcomeHeading(expectedText: any): Promise<void>
  shouldHaveTitle(expectedTtitle: any): Promise<void>
  shouldHaveValue(value: any): Promise<void>
  show(): Promise<void>
  waitForProgressToBeHidden(): Promise<void>
  readonly first: any
  readonly second: any
}
export interface ExtensionDetailView {
  disableExtension(): Promise<void>
  enableExtension(options?: any): Promise<void>
  installExtension(): Promise<void>
  openFeature(featureName: any): Promise<void>
  openTab(text: any, options?: any): Promise<void>
  selectCategory(text: any): Promise<void>
  shouldHaveFeatureHeading(featureText: any): Promise<void>
  shouldHaveHeading(text: any): Promise<void>
  shouldHaveTab(text: any): Promise<void>
}
export interface ExternalRuntime {
  createPorts(): Promise<any>
  startExternalRuntime(options?: any): Promise<void>
  dispose(): Promise<void>
  evaluate(expression: any): Promise<void>
  getNamedArrayCount(): Promise<void>
  getRuntimeInfo(): Promise<void>
  getRuntimeName(): Promise<void>
  takeSnapshot(name: any): Promise<void>
  dispose(): Promise<void>
}
export interface Git {
  add(): Promise<void>
  checkoutBranch(branchName: any): Promise<void>
  cloneRepository(repoUrl: any): Promise<void>
  commit(message: any): Promise<void>
  createBranch(branchName: any): Promise<void>
  init(): Promise<void>
  initRepository(relativePath: any): Promise<void>
  openRepository(relativePath: any): Promise<void>
  shouldHaveNoStagedDiff(fileName: any): Promise<void>
  shouldHaveStagedDiffContaining(fileName: any, text: any): Promise<void>
  shouldHaveWorkingTreeDiffContaining(fileName: any, text: any): Promise<void>
  shouldNotHaveStagedDiffContaining(fileName: any, text: any): Promise<void>
  shouldNotHaveWorkingTreeDiffContaining(fileName: any, text: any): Promise<void>
}
export interface GitHubPullRequests {
  checkoutIndex(index: any): Promise<void>
  focusView(): Promise<void>
}
export interface Hover {
  hide(): Promise<void>
  shouldHaveText(text: any): Promise<void>
  shouldHaveActions(): Promise<void>
}
export interface ImagesPreview {
  shouldHaveImage(src: any): Promise<void>
  close(): Promise<void>
  next(): Promise<void>
  previous(): Promise<void>
}
export interface KeyBindingsEditor {
  searchFor(searchValue: any): Promise<void>
  setKeyBinding(commandName: any, keyBinding: any): Promise<void>
  show(): Promise<void>
}
export interface LanguageModelEditor {
  clearFilter(): Promise<void>
  filter(options: any): Promise<void>
  open(): Promise<void>
}
export interface MarkdownPreview {
  shouldBeVisible(): Promise<void>
  shouldHaveCodeBlocks(subFrame: any, count: any): Promise<void>
  shouldHaveCodeBlockWithLanguage(subFrame: any, language: any): Promise<void>
  shouldHaveHeading(subFrame: any, id: any): Promise<void>
}
export interface MCP {
  addServer(options: any): Promise<void>
  createMCPServer(): Promise<any>
  getInputValue(): Promise<string>
  getVisibleCommands(): Promise<string[]>
  listServers(): Promise<void>
  openConfiguration(): Promise<void>
  removeAllServers(): Promise<void>
  removeServer(serverName: any): Promise<void>
  selectCommand(text: any, stayVisible?: any): Promise<void>
}
export interface MultiDiffEditor {
  close(): Promise<void>
  open(options: any): Promise<void>
  shouldBeVisible(): Promise<void>
}
export interface Notebook {
  addMarkdownCell(): Promise<void>
  clearAllOutputs(): Promise<void>
  createVenv(): Promise<void>
  executeCell(options?: any): Promise<void>
  mergeCell(cellIndex?: any): Promise<void>
  removeMarkdownCell(): Promise<void>
  scrollDown(): Promise<void>
  scrollUp(): Promise<void>
  splitCell(cellIndex?: any): Promise<void>
}
export interface NotebookInlineChat {
  hide(): Promise<void>
  show(): Promise<void>
  type(message: any): Promise<void>
}
export interface Notification {
  closeAll(options?: { force?: boolean }): Promise<void>
  shouldHaveItem(expectedMessage: any): Promise<void>
}
export interface Output {
  clearFilter(): Promise<void>
  filter(filterValue: any): Promise<void>
  hide(): Promise<void>
  moveOutputToSidebar(): Promise<void>
  openEditor(): Promise<void>
  select(channelName: any, options?: any): Promise<void>
  show(): Promise<void>
}
export interface Panel {
  hide(): Promise<void>
  show(): Promise<void>
  toggle(): Promise<void>
}
export interface PortsView {
  cancelPortEdit(): Promise<void>
  close(): Promise<void>
  forwardPort(port: any): Promise<any>
  open(): Promise<void>
  setPortInput(portId: any): Promise<void>
  shouldHaveForwardedPort(portId: any): Promise<void>
  unforwardAllPorts(port: any): Promise<void>
}
export interface Problems {
  clearFilter(): Promise<void>
  filter(filterValue: any): Promise<void>
  hide(): Promise<void>
  moveProblemsToSidebar(): Promise<void>
  shouldHaveVisibleCount(count: any): Promise<void>
  shouldHaveCount(count: any): Promise<void>
  shouldHaveVisibleTextCount(text: any, count: any): Promise<void>
  show(): Promise<void>
  switchToTableView(): Promise<void>
  switchToTreeView(): Promise<void>
}
export interface ProcessExplorer {
  waitForNewWindow(options: any): Promise<string>
  show(): Promise<PageObjectWindowHandle>
  close(): Promise<void>
  shouldBeVisible(): Promise<void>
}
export interface Profile {
  create(info: any): Promise<void>
  export(options: any): Promise<void>
  remove(info: any): Promise<void>
  removeOtherProfiles(): Promise<void>
}
export interface QuickPick {
  close(): Promise<void>
  executeCommand(command: any, options?: any): Promise<void>
  focusNext(): Promise<void>
  focusPrevious(): Promise<void>
  getInputValue(): Promise<string>
  getVisibleCommands(): Promise<string[]>
  getFocusedItemLabel(): Promise<string>
  hide(): Promise<void>
  openFile(fileName: any): Promise<void>
  pressEnter(): Promise<void>
  select(text: any, stayVisible?: any, stopsApplication?: any): Promise<void>
  show(options?: any): Promise<void>
  showColorTheme(): Promise<void>
  showFileIconTheme(): Promise<void>
  showCommands(options?: any): Promise<void>
  waitForInputVisible(): Promise<void>
  type(value: any): Promise<void>
}
export interface References {
  clear(): Promise<void>
  shouldBeFocused(): Promise<void>
  shouldBeVisible(): Promise<void>
  shouldHaveMessage(message: any): Promise<void>
}
export interface ReleaseNotes {
  show(): Promise<void>
}
export interface RunAndDebug {
  continue(): Promise<void>
  pause(): Promise<void>
  removeAllBreakpoints(): Promise<void>
  runAndWaitForDebugConsoleOutput(options: any): Promise<void>
  runAndWaitForPaused(options: any): Promise<void>
  setPauseOnExceptions(options: any): Promise<void>
  setValue(options?: any): Promise<void>
  startRunAndDebug(options?: any): Promise<void>
  step(options?: any): Promise<void>
  stepInto(options: any): Promise<void>
  stepOutOf(options: any): Promise<void>
  stop(): Promise<void>
  waitForDebugConsoleOutput(options: any): Promise<void>
  takeCpuProfile(options: any): Promise<void>
  waitForPaused(options?: any): Promise<void>
  waitForPausedOnException(options?: any): Promise<void>
}
export interface RunningExtensions {
  show(): Promise<void>
  showAndWaitFor(name: any): Promise<void>
  startDebuggingExtensionHost(): Promise<void>
  startProfilingExtensionHost(): Promise<void>
  stopProfilingExtensionHost(): Promise<void>
}
export interface Search {
  shouldBeVisible(): Promise<void>
  clear(): Promise<void>
  collapseFiles(): Promise<void>
  deleteText(): Promise<void>
  enableRegex(): Promise<void>
  expandFiles(): Promise<void>
  openEditor(): Promise<void>
  replace(): Promise<void>
  setFilesToInclude(pattern: any): Promise<void>
  shouldHaveNoResults(): Promise<void>
  toHaveResults(options: any): Promise<void>
  type(text: any): Promise<void>
  typeReplace(text: any): Promise<void>
}
export interface SettingsEditor {
  addItem(options: any): Promise<void>
  applyFilter(options: any): Promise<void>
  clear(): Promise<void>
  closeSettingsContextMenu(name: any): Promise<void>
  collapse(groupName: any): Promise<void>
  collapseOutline(): Promise<void>
  disableCheckBox(options: any): Promise<void>
  enableCheckBox(options: any): Promise<void>
  ensureIdle(): Promise<void>
  expand(groupName: any): Promise<void>
  focusOutline(name: any): Promise<void>
  moveScrollBar(y: any, expectedScrollBarTop: any): Promise<void>
  open(): Promise<void>
  openSettingsContextMenu(name: any, options: any): Promise<void>
  openTab(tabName: any): Promise<void>
  removeItem(options: any): Promise<void>
  search(options: any): Promise<void>
  select(options: any): Promise<void>
  setTextInput(options?: any): Promise<void>
  toggleCheckBox(options: any): Promise<void>
}
export interface SettingsEditorCompletion {
  select(options: any): Promise<void>
}
export interface SettingsEditorFilter {
  select(options: any): Promise<void>
}
export interface SettingsEditorInput {
  shouldHaveText(text: any): Promise<void>
}
export interface SideBar {
  hide(): Promise<void>
  hideSecondary(): Promise<void>
  moveLeft(): Promise<void>
  moveRight(): Promise<void>
  show(): Promise<void>
  toggle(): Promise<void>
  togglePosition(): Promise<void>
  shouldBeHidden(): Promise<void>
  shouldBeLeft(): Promise<void>
  shouldBeRight(): Promise<void>
  shouldBeVisible(): Promise<void>
  shouldSecondaryBeVisible(): Promise<void>
  showSecondary(): Promise<void>
}
export interface SimpleBrowser {
  isSimpleBrowserTabLoading(): Promise<boolean>
  getBrowserNavigationButton(options: any): Promise<void>
  openIntegratedBrowser(): Promise<void>
  navigateIntegratedBrowser(options: any): Promise<void>
  waitForContentFrameModern(options?: any): Promise<void>
  activateModernBrowserEditor(): Promise<void>
  activateChatEditorForBrowserContext(): Promise<void>
  getContentFrameLegacy(options?: any): Promise<void>
  getContentFrameModern(options?: any): Promise<void>
  getContentFrame(options?: any): Promise<void>
  executeJavaScript(options: any): Promise<void>
  tryClickFirstVisible(options: any): Promise<boolean>
  hasAttachedChatContext(): Promise<boolean>
  getAttachedChatContextCounts(): Promise<void>
  executeWorkbenchCommand(commandId: any): Promise<boolean>
  getVisibleTabAndActionLabels(): Promise<string>
  addConsoleLogsToChat(): Promise<void>
  addElementToChat(options: any): Promise<void>
  clickLink(options: any): Promise<void>
  clickPageLink(options: any): Promise<void>
  back(options?: any): Promise<void>
  createMockServer(options: any): Promise<void>
  createDeferredMockServer(options: any): Promise<void>
  createWorkspaceFileServer(options: any): Promise<void>
  disposeMockServer(options: any): Promise<void>
  finishMockServerResponse(options: any): Promise<void>
  mockElectronDebugger(options: any): Promise<void>
  openMoreActions(): Promise<void>
  openDevtools(): Promise<void>
  forward(options?: any): Promise<void>
  reload(options?: any): Promise<void>
  shouldHaveText(options?: any): Promise<void>
  shouldHaveTabTitle(options: any): Promise<void>
  shouldHaveTabLoadingSpinner(): Promise<void>
  shouldNotHaveTabLoadingSpinner(): Promise<void>
  shouldHaveElementScreenshotInChat(): Promise<void>
  shouldHaveFindWidget(): Promise<void>
  showLegacy(options: any): Promise<void>
  showModern(options: any): Promise<void>
  showLoadError(options: any): Promise<void>
  show(options?: any): Promise<void>
  shouldHaveLoadError(options: any): Promise<void>
}
export interface SourceControl {
  checkoutBranch(branchName: any): Promise<void>
  closeRepository(name: any): Promise<void>
  disableInlineBlame(): Promise<void>
  doMoreAction(name: any): Promise<void>
  enableInlineBlame(options: any): Promise<void>
  hideBranchPicker(): Promise<void>
  hideGraph(): Promise<void>
  refresh(): Promise<void>
  selectBranch(branchName: any): Promise<void>
  openChange(name: any): Promise<void>
  show(): Promise<void>
  shouldHaveHistoryItem(name: any): Promise<void>
  shouldHaveRepositoryCount(count: any): Promise<void>
  shouldHaveUnstagedFile(name: any): Promise<void>
  shouldNotHaveHistoryItem(name: any): Promise<void>
  showBranchPicker(): Promise<void>
  showGraph(): Promise<void>
  stageFile(name: any, parentFolder?: any): Promise<void>
  undoLastCommit(): Promise<void>
  unstageAllChanges(): Promise<void>
  unstageFile(name: any): Promise<void>
  viewAsList(): Promise<void>
  viewAsTree(): Promise<void>
}
export interface SshServer {
  launch(): Promise<SshServerConnection>
  waitForPort(options?: any): Promise<void>
  shouldBeConnected(): Promise<void>
  dispose(): Promise<void>
}
export interface StatusBar {
  click(label: any): Promise<void>
  hideItem(id: any): Promise<void>
  selectItem(id: any): Promise<void>
  shouldBeHidden(): Promise<void>
  shouldBeVisible(): Promise<void>
  showItem(id: any): Promise<void>
}
export interface Suggest {
  accept(item: any): Promise<void>
  close(): Promise<void>
  open(expectedItem?: any): Promise<void>
}
export interface Tab {
  openContextMenu(_label: any): Promise<void>
}
export interface Task {
  changeIcon(fromIcon: any, toIcon: any): Promise<void>
  clear(): Promise<void>
  clearTerminal(): Promise<void>
  hideQuickPick(): Promise<void>
  open(): Promise<void>
  openQuickPick(options: any): Promise<void>
  openRun(): Promise<void>
  pin(name: any): Promise<void>
  reRunLast(options: any): Promise<void>
  run(taskName: any, check?: any): Promise<void>
  runError(options: any): Promise<void>
  selectQuickPickItem(options: any): Promise<void>
  unpin(name: any): Promise<void>
}
export interface Terminal {
  add(): Promise<void>
  clear(): Promise<void>
  clearFindInput(): Promise<void>
  closeFind(): Promise<void>
  execute(command: any, options?: any): Promise<void>
  focusHover(): Promise<void>
  ignoreHover(): Promise<void>
  killAll(): Promise<void>
  killFirst(): Promise<void>
  killSecond(): Promise<void>
  moveToEditorArea(): Promise<void>
  moveToPanelArea(): Promise<void>
  openFind(): Promise<void>
  restartPtyHost(): Promise<void>
  scrollToBottom(): Promise<void>
  scrollToTop(): Promise<void>
  setFindInput(value: any): Promise<void>
  shouldHaveIncompleteDecoration(enabled: any): Promise<void>
  shouldHaveSuccessDecoration(): Promise<void>
  shouldContainText(text: any, timeout?: any): Promise<void>
  show(options?: any): Promise<void>
  split(): Promise<void>
  type(command: any): Promise<void>
  waitForReady(): Promise<void>
}
export interface TerminalInlineChat {
  hide(): Promise<void>
  sendMessage(options?: any): Promise<void>
  show(): Promise<void>
}
export interface Testing {
  focusOnTestExplorerView(): Promise<void>
  runAllTests(options: any): Promise<void>
  runTask(taskName: any): Promise<void>
  shouldHaveTestFailure(): Promise<void>
  shouldHaveTestSuccess(): Promise<void>
}
export interface Timeline {
  open(fileName: any): Promise<void>
  shouldBeVisible(): Promise<void>
  shouldHaveItem(name: any): Promise<void>
}
export interface Timeout {
  waitMinutes(minutes: any): Promise<void>
}
export interface TitleBar {
  hideMenu(text: any): Promise<void>
  hideMenuFile(): Promise<void>
  showMenu(text: any): Promise<void>
  selectMenuItem(text: any): Promise<void>
  showMenuEdit(): Promise<void>
  showMenuFile(): Promise<void>
}
export interface View {
  enterZenMode(): Promise<void>
  leaveZenMode(): Promise<void>
}
export interface WaitForApplicationToBeReady {
  waitForApplicationToBeReady(options: any): Promise<void>
}
export interface WebView {
  focus(): Promise<void>
  shouldBeVisible(): Promise<void>
  shouldBeVisible2(options?: any): Promise<void>
}
export interface WelcomePage {
  checkStepByIndex(index: any): Promise<void>
  collapseStepByIndex(index: any): Promise<void>
  expandStep(name: any): Promise<void>
  expandStepByIndex(index: any): Promise<void>
  getFundamentalsStepCount(): Promise<number>
  hide(): Promise<void>
  show(): Promise<void>
  showFundamentals(): Promise<void>
  uncheckStepByIndex(index: any): Promise<void>
  getStepByIndex(index: any): Promise<void>
}
export interface Window {
  blur(): Promise<void>
  focus(): Promise<void>
}
export interface Workbench {
  connectToSsh(options: any): Promise<void>
  waitForNewWindow(options: any): Promise<void>
  openNewWindow(): Promise<PageObjectApi & PageObjectWindowHandle>
  close(): Promise<void>
  shouldBeVisible(): Promise<void>
  reload(): Promise<void>
  focusLeftEditorGroup(): Promise<void>
  shouldBeVisible(): Promise<void>
  shouldHaveEditorBackground(color: any): Promise<void>
}
export interface Workspace {
  add(options: any): Promise<void>
  addExtension(name: any): Promise<void>
  initializeGitRepository(): Promise<void>
  gitAdd(): Promise<void>
  gitCommit(message: any): Promise<void>
  remove(file: any): Promise<void>
  setFiles(options: any): Promise<void>
  setFilesWithoutWaiting(options: any): Promise<void>
  readWorkspaceSettings(): Promise<Record<string, unknown>>
  updateWorkspaceSettings(settings: any): Promise<void>
  writeFile(relativePath: any, content: any): Promise<void>
  writeWorkspaceSettings(settings: any): Promise<void>
  waitForFile(fileName: any): Promise<boolean>
}

export interface PageObjectApi {
  readonly ActivityBar: ActivityBar
  readonly ChatEditor: ChatEditor
  readonly ColorPicker: ColorPicker
  readonly Colors: any
  readonly ContextMenu: ContextMenu
  readonly CursorChat: CursorChat
  readonly DebugConsole: DebugConsole
  readonly DebugHover: DebugHover
  readonly Developer: Developer
  readonly DiffEditor: DiffEditor
  readonly DropDownContextMenu: DropDownContextMenu
  readonly Editor: Editor
  readonly EditorFind: EditorFind
  readonly Electron: Electron
  readonly ExternalRuntime: ExternalRuntime
  readonly Explorer: Explorer
  readonly Extensions: Extensions
  readonly ExtensionDetailView: ExtensionDetailView
  readonly ExternalRuntime: ExternalRuntime
  readonly Git: Git
  readonly GitHubPullRequests: GitHubPullRequests
  readonly Hover: Hover
  readonly ImagesPreview: ImagesPreview
  readonly KeyBindingsEditor: KeyBindingsEditor
  readonly LanguageModelEditor: LanguageModelEditor
  readonly MarkdownPreview: MarkdownPreview
  readonly MCP: MCP
  readonly MultiDiffEditor: MultiDiffEditor
  readonly Notebook: Notebook
  readonly NotebookInlineChat: NotebookInlineChat
  readonly Notification: Notification
  readonly Output: Output
  readonly Panel: Panel
  readonly PortsView: PortsView
  readonly Problems: Problems
  readonly ProcessExplorer: ProcessExplorer
  readonly Profile: Profile
  readonly QuickPick: QuickPick
  readonly References: References
  readonly ReleaseNotes: ReleaseNotes
  readonly RunAndDebug: RunAndDebug
  readonly RunningExtensions: RunningExtensions
  readonly Search: Search
  readonly SettingsEditor: SettingsEditor
  readonly SettingsEditorCompletion: SettingsEditorCompletion
  readonly SettingsEditorFilter: SettingsEditorFilter
  readonly SettingsEditorInput: SettingsEditorInput
  readonly SideBar: SideBar
  readonly SimpleBrowser: SimpleBrowser
  readonly SourceControl: SourceControl
  readonly SshServer: SshServer
  readonly StatusBar: StatusBar
  readonly Suggest: Suggest
  readonly Tab: Tab
  readonly Task: Task
  readonly Terminal: Terminal
  readonly TerminalInlineChat: TerminalInlineChat
  readonly Testing: Testing
  readonly Timeline: Timeline
  readonly Timeout: Timeout
  readonly TitleBar: TitleBar
  readonly View: View
  readonly WaitForApplicationToBeReady: WaitForApplicationToBeReady
  readonly WebView: WebView
  readonly WelcomePage: WelcomePage
  readonly WellKnownCommands: any
  readonly Window: Window
  readonly Workbench: Workbench
  readonly Workspace: Workspace
}

// Export the create function type
export declare const create: (context: PageObjectContext) => Promise<PageObjectApi>

export default PageObjectApi
