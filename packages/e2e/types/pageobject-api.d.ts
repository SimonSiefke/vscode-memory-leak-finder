// Generated API types for page-object
// This file provides type definitions for the page-object API used in e2e tests

export interface PageObjectContext {
  page: any
  expect: any
  VError: any
  ideVersion?: {
    minor: number
  }
  electronApp?: any
}

export interface ActivityBar {
  hide(): Promise<void>
  hideTooltip(): Promise<void>
  show(): Promise<void>
  showTooltipExplorer(): Promise<void>
  showView(options?: any): Promise<void>
  showExplorer(): Promise<void>
  showExtensions(): Promise<void>
  showRunAndDebug(): Promise<void>
  showSearch(): Promise<void>
  showSourceControl(): Promise<void>
}
export interface ChatEditor {
  addContext(initialPrompt: any, secondPrompt: any, confirmText: any): Promise<void>
  clearAll(): Promise<void>
  clearContext(contextName: any): Promise<void>
  closeFinishSetup(): Promise<void>
  open(): Promise<void>
  openFinishSetup(): Promise<void>
  sendMessage(options?: any): Promise<void>
  setMode(modeLabel: any): Promise<void>
}
export interface ContextMenu {
  close(): Promise<void>
  open(locator: any): Promise<void>
  select(option: any): Promise<void>
  shouldHaveItem(option: any): Promise<void>
  check(name: any): Promise<void>
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
  hide(): Promise<void>
  shouldHaveCompletions(items: any): Promise<void>
  shouldHaveLogpointOutput(expectedMessage: any): Promise<void>
  show(): Promise<void>
  type(value: any): Promise<void>
}
export interface DebugHover {
  collapseProperty(name: any): Promise<void>
  expandProperty(name: any, childProperties: any): Promise<void>
}
export interface Developer {
  toggleScreenCastMode(): Promise<void>
}
export interface DiffEditor {
  expectModified(text: any): Promise<void>
  expectOriginal(text: any): Promise<void>
  open(a: any, b: any): Promise<void>
  scrollDown(): Promise<void>
  scrollUp(): Promise<void>
  shouldHaveModifiedEditor(text: any): Promise<void>
  shouldHaveOriginalEditor(text: any): Promise<void>
}
export interface DropDownContextMenu {
  close(): Promise<void>
  shouldHaveItem(option: any): Promise<void>
}
export interface Editor {
  acceptRename(): Promise<void>
  autoFix(options: any): Promise<void>
  click(text: any): Promise<void>
  close(): Promise<void>
  closeAll(): Promise<void>
  closeAllEditorGroups(): Promise<void>
  closeAutoFix(): Promise<void>
  closeFind(): Promise<void>
  closeInspectedTokens(): Promise<void>
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
  findAllReferences(): Promise<void>
  focus(): Promise<void>
  fold(): Promise<void>
  foldAll(): Promise<void>
  format(): Promise<void>
  focusRightEditorGroup(): Promise<void>
  focusLeftEditorGroup(): Promise<void>
  focusBottomEditorGroup(): Promise<void>
  focusTopEditorGroup(): Promise<void>
  goToDefinition(): Promise<void>
  goToFile(options: any): Promise<void>
  goToSourceDefinition(options: any): Promise<void>
  hideBreadCrumbs(): Promise<void>
  hideColorPicker(): Promise<void>
  hideDebugHover(): Promise<void>
  hideMinimap(): Promise<void>
  hideSourceAction(): Promise<void>
  hideSourceActionEmpty(): Promise<void>
  hover(text: any, hoverText: any): Promise<void>
  inspectTokens(): Promise<void>
  moveScrollBar(y: any, expectedScrollBarY: any): Promise<void>
  newTextFile(): Promise<void>
  open(fileName: any, options?: any): Promise<void>
  openFind(): Promise<void>
  openSettingsJson(): Promise<void>
  pin(): Promise<void>
  press(key: any): Promise<void>
  reloadWebViews(options: any): Promise<void>
  removeAllBreakpoints(): Promise<void>
  rename(newText: any): Promise<void>
  renameCancel(newText: any): Promise<void>
  renameWithPreview(newText: any): Promise<void>
  save(options: any): Promise<void>
  saveAll(): Promise<void>
  scrollDown(): Promise<void>
  scrollUp(): Promise<void>
  select(text: any): Promise<void>
  selectAll(): Promise<void>
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
  shouldHaveFoldingGutter(enabled: any): Promise<void>
  shouldHaveFontFamily(fontFamily: any): Promise<void>
  shouldHaveInspectedToken(name: any): Promise<void>
  shouldHaveOverlayMessage(message: any): Promise<void>
  shouldHaveSelection(left: any, width: any): Promise<void>
  shouldHaveSemanticToken(type: any): Promise<void>
  shouldHaveSpark(): Promise<void>
  shouldHaveSquigglyError(): Promise<void>
  shouldHaveText(text: any, fileName?: any): Promise<void>
  shouldHaveToken(text: any, color: any): Promise<void>
  shouldNotHaveSemanticToken(type: any): Promise<void>
  shouldNotHaveSquigglyError(): Promise<void>
  showBreadCrumbs(): Promise<void>
  showColorPicker(): Promise<void>
  showDebugHover(options: any): Promise<void>
  showMinimap(): Promise<void>
  showRefactor(): Promise<void>
  showSourceAction(): Promise<void>
  showSourceActionEmpty(): Promise<void>
  split(command: any): Promise<void>
  splitDown(): Promise<void>
  splitLeft(): Promise<void>
  splitRight(): Promise<void>
  splitUp(): Promise<void>
  switchToTab(name: any): Promise<void>
  threeColumnsLayout(): Promise<void>
  toggleBreakpoint(): Promise<void>
  toggleScreenReaderAccessibilityMode(): Promise<void>
  type(text: any): Promise<void>
  undo(): Promise<void>
  unfold(): Promise<void>
  unfoldAll(): Promise<void>
  unpin(): Promise<void>
}
export interface EditorFind {
  openReplace(): Promise<void>
  replace(): Promise<void>
  setReplaceValue(value: any): Promise<void>
  setSearchValue(value: any): Promise<void>
}
export interface Electron {
  evaluate(expression: any): Promise<void>
  mockDialog(response: any): Promise<void>
  mockElectron(namespace: any, key: any, implementationCode: any): Promise<void>
  mockOpenDialog(response: any): Promise<void>
  mockSaveDialog(response: any): Promise<void>
  mockShellTrashItem(): Promise<void>
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
  openContextMenu(dirent: any, select?: any): Promise<void>
  paste(options?: any): Promise<void>
  refresh(): Promise<void>
  removeCurrent(): Promise<void>
  rename(oldDirentName: any, newDirentName: any): Promise<void>
  shouldHaveFocusedItem(direntName: any): Promise<void>
  shouldHaveItem(direntName: any): Promise<void>
  toHaveItem(direntName: any): Promise<void>
  not: any
}
export interface Extensions {
  add(path: any, expectedName: any): Promise<void>
  clear(): Promise<void>
  closeSuggest(): Promise<void>
  click(): Promise<void>
  openContextMenu(): Promise<void>
  shouldBe(name: any): Promise<void>
  hide(): Promise<void>
  install(options: any): Promise<void>
  openSuggest(): Promise<void>
  restart(): Promise<void>
  search(value: any): Promise<void>
  selectMcpItem(options: any): Promise<void>
  shouldHaveMcpItem(options: any): Promise<void>
  shouldHaveMcpWelcomeHeading(expectedText: any): Promise<void>
  shouldHaveTitle(expectedTtitle: any): Promise<void>
  shouldHaveValue(value: any): Promise<void>
  show(): Promise<void>
  waitForProgressToBeHidden(): Promise<void>
  first: any
}
export interface ExtensionDetailView {
  disableExtension(): Promise<void>
  enableExtension(options: any): Promise<void>
  installExtension(): Promise<void>
  openFeature(featureName: any): Promise<void>
  openTab(text: any, options: any): Promise<void>
  selectCategory(text: any): Promise<void>
  shouldHaveFeatureHeading(featureText: any): Promise<void>
  shouldHaveHeading(text: any): Promise<void>
  shouldHaveTab(text: any): Promise<void>
}
export interface Git {
  add(): Promise<void>
  checkoutBranch(branchName: any): Promise<void>
  cloneRepository(repoUrl: any): Promise<void>
  commit(message: any): Promise<void>
  createBranch(branchName: any): Promise<void>
  init(): Promise<void>
}
export interface GitHubPullRequests {
  checkoutIndex(index: any): Promise<void>
  focusView(): Promise<void>
}
export interface Hover {
  hide(): Promise<void>
  shouldHaveText(text: any): Promise<void>
}
export interface KeyBindingsEditor {
  searchFor(searchValue: any): Promise<void>
  setKeyBinding(commandName: any, keyBinding: any): Promise<void>
  show(): Promise<void>
}
export interface LanguageModelEditor {
  open(): Promise<void>
  filter(options: any): Promise<void>
  clearFilter(): Promise<void>
}
export interface MarkdownPreview {
  shouldBeVisible(): Promise<void>
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
  open(files: any): Promise<void>
  shouldBeVisible(): Promise<void>
}
export interface Notebook {
  addMarkdownCell(): Promise<void>
  removeMarkdownCell(): Promise<void>
  scrollDown(): Promise<void>
  scrollUp(): Promise<void>
  executeCell(cellIndex?: number): Promise<void>
  splitCell(cellIndex?: number): Promise<void>
  mergeCell(cellIndex?: number): Promise<void>
}
export interface Notification {
  closeAll(): Promise<void>
  shouldHaveItem(expectedMessage: any): Promise<void>
}
export interface Output {
  clearFilter(): Promise<void>
  filter(filterValue: any): Promise<void>
  hide(): Promise<void>
  openEditor(): Promise<void>
  select(channelName: any): Promise<void>
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
  hide(): Promise<void>
  shouldHaveCount(count: any): Promise<void>
  show(): Promise<void>
  switchToTableView(): Promise<void>
  switchToTreeView(): Promise<void>
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
  hide(): Promise<void>
  openFile(fileName: any): Promise<void>
  pressEnter(): Promise<void>
  select(text: any, stayVisible?: any): Promise<void>
  show(options?: any): Promise<void>
  showColorTheme(): Promise<void>
  showCommands(options?: any): Promise<void>
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
  setValue(variableName: any, variableValue: any, newVariableValue: any): Promise<void>
  startRunAndDebug(): Promise<void>
  step(expectedFile: any, expectedPauseLine: any, expectedCallStackSize: any): Promise<void>
  stop(): Promise<void>
  waitForDebugConsoleOutput(options: any): Promise<void>
  waitForPaused(options: any): Promise<void>
  waitForPausedOnException(options?: any): Promise<void>
}
export interface RunningExtensions {
  show(): Promise<void>
  startDebuggingExtensionHost(): Promise<void>
  startProfilingExtensionHost(): Promise<void>
  stopProfilingExtensionHost(): Promise<void>
}
export interface Search {
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
  setTextInput(options: any): Promise<void>
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
  moveLeft(): Promise<void>
  moveRight(): Promise<void>
  show(): Promise<void>
  toggle(): Promise<void>
  togglePosition(): Promise<void>
}
export interface SimpleBrowser {
  createMockServer(options: any): Promise<void>
  disposeMockServer(options: any): Promise<void>
  show(options: any): Promise<void>
  addElementToChat(options: any): Promise<void>
  mockElectronDebugger(options: any): Promise<void>
  clickLink(options: any): Promise<void>
  shouldHaveTabTitle(options: any): Promise<void>
}
export interface SourceControl {
  checkoutBranch(branchName: any): Promise<void>
  disableInlineBlame(): Promise<void>
  doMoreAction(name: any): Promise<void>
  enableInlineBlame(options: any): Promise<void>
  hideBranchPicker(): Promise<void>
  hideGraph(): Promise<void>
  showGraph(): Promise<void>
  refresh(): Promise<void>
  selectBranch(branchName: any): Promise<void>
  shouldHaveHistoryItem(name: any): Promise<void>
  shouldHaveUnstagedFile(name: any): Promise<void>
  shouldNotHaveHistoryItem(name: any): Promise<void>
  showBranchPicker(): Promise<void>
  stageFile(name: any, parentFolder?: any): Promise<void>
  undoLastCommit(): Promise<void>
  unstageFile(name: any): Promise<void>
  viewAsList(): Promise<void>
  viewAsTree(): Promise<void>
}
export interface StatusBar {
  click(label: any): Promise<void>
  hideItem(id: any): Promise<void>
  selectItem(id: any): Promise<void>
  showItem(id: any): Promise<void>
}
export interface Suggest {
  close(): Promise<void>
  open(expectedItem: any): Promise<void>
}
export interface Tab {
  openContextMenu(label: any): Promise<void>
}
export interface Task {
  changeIcon(fromIcon: any, toIcon: any): Promise<void>
  clear(): Promise<void>
  hideQuickPick(): Promise<void>
  open(): Promise<void>
  openQuickPick(options: any): Promise<void>
  openRun(): Promise<void>
  pin(name: any): Promise<void>
  run(taskName: any): Promise<void>
  runError(taskName: any): Promise<void>
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
  shouldHaveSuccessDecoration(): Promise<void>
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
export interface TitleBar {
  hideMenu(text: any): Promise<void>
  hideMenuFile(): Promise<void>
  showMenu(text: any): Promise<void>
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
  expandStep(name: any): Promise<void>
  hide(): Promise<void>
  show(): Promise<void>
  showFundamentals(): Promise<void>
}
export interface Window {
  blur(): Promise<void>
  focus(): Promise<void>
}
export interface Workbench {
  focusLeftEditorGroup(): Promise<void>
  shouldBeVisible(): Promise<void>
  shouldHaveEditorBackground(color: any): Promise<void>
}
export interface Workspace {
  add(file: any): Promise<void>
  addExtension(name: any): Promise<void>
  initializeGitRepository(): Promise<void>
  remove(file: any): Promise<void>
  setFiles(files: any): Promise<void>
  waitForFile(fileName: any): Promise<void>
}

export interface PageObjectApi {
  readonly ActivityBar: ActivityBar
  readonly ChatEditor: ChatEditor
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
  readonly Explorer: Explorer
  readonly Extensions: Extensions
  readonly ExtensionDetailView: ExtensionDetailView
  readonly Git: Git
  readonly GitHubPullRequests: GitHubPullRequests
  readonly Hover: Hover
  readonly KeyBindingsEditor: KeyBindingsEditor
  readonly LanguageModelEditor: LanguageModelEditor
  readonly MarkdownPreview: MarkdownPreview
  readonly MCP: MCP
  readonly MultiDiffEditor: MultiDiffEditor
  readonly Notebook: Notebook
  readonly Notification: Notification
  readonly Output: Output
  readonly Panel: Panel
  readonly PortsView: PortsView
  readonly Problems: Problems
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
  readonly StatusBar: StatusBar
  readonly Suggest: Suggest
  readonly Tab: Tab
  readonly Task: Task
  readonly Terminal: Terminal
  readonly TerminalInlineChat: TerminalInlineChat
  readonly Testing: Testing
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
