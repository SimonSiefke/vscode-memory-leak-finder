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
  hide(): Promise<string[]>
  hideTooltip(): Promise<string[]>
  show(): Promise<string[]>
  showTooltipExplorer(): Promise<void>
  showView(options?: any): Promise<void>
}
export interface ChatEditor {
  addContext(initialPrompt: any, secondPrompt: any, confirmText: any): Promise<void>
  clearAll(): Promise<void>
  clearContext(contextName: any): Promise<void>
  closeFinishSetup(): Promise<void>
  open(): Promise<void>
  openFinishSetup(): Promise<void>
  sendMessage(options: any): Promise<void>
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
  acceptRename(): Promise<string[]>
  autoFix(options: any): Promise<string[]>
  click(text: any): Promise<string[]>
  close(): Promise<string[]>
  closeAll(): Promise<string[]>
  closeAllEditorGroups(): Promise<string[]>
  closeAutoFix(): Promise<string[]>
  closeFind(): Promise<string[]>
  closeInspectedTokens(): Promise<string[]>
  cursorRight(): Promise<string[]>
  deleteAll(): Promise<string[]>
  deleteCharactersLeft(options: any): Promise<string[]>
  deleteCharactersRight(options: any): Promise<string[]>
  disableReadonly(): Promise<string[]>
  disableStickyScroll(): Promise<string[]>
  disableVersionLens(): Promise<string[]>
  duplicateSelection(): Promise<string[]>
  enable2x2GridView(): Promise<string[]>
  enableReadonly(): Promise<string[]>
  enableStickyScroll(): Promise<string[]>
  enableVersionLens(): Promise<string[]>
  findAllReferences(): Promise<string[]>
  focus(): Promise<string[]>
  fold(): Promise<string[]>
  foldAll(): Promise<string[]>
  format(): Promise<string[]>
  focusRightEditorGroup(): Promise<string[]>
  focusLeftEditorGroup(): Promise<string[]>
  focusBottomEditorGroup(): Promise<string[]>
  focusTopEditorGroup(): Promise<string[]>
  goToDefinition(): Promise<string[]>
  goToFile(options: any): Promise<string[]>
  goToSourceDefinition(options: any): Promise<string[]>
  hideBreadCrumbs(): Promise<string[]>
  hideColorPicker(): Promise<string>
  hideDebugHover(): Promise<string>
  hideMinimap(): Promise<string>
  hideSourceAction(): Promise<string>
  hideSourceActionEmpty(): Promise<string>
  hover(text: any, hoverText: any): Promise<string>
  inspectTokens(): Promise<string>
  moveScrollBar(y: any, expectedScrollBarY: any): Promise<string>
  newTextFile(): Promise<string>
  open(fileName: any, options?: any): Promise<string>
  openFind(): Promise<string>
  openSettingsJson(): Promise<string>
  pin(): Promise<string>
  press(key: any): Promise<string>
  reloadWebViews(options: any): Promise<string>
  removeAllBreakpoints(): Promise<string>
  rename(newText: any): Promise<string>
  renameCancel(newText: any): Promise<string>
  renameWithPreview(newText: any): Promise<string>
  save(options: any): Promise<string>
  saveAll(): Promise<string>
  scrollDown(): Promise<string>
  scrollUp(): Promise<string>
  select(text: any): Promise<string>
  selectAll(): Promise<string>
  selectRefactor(actionText: any): Promise<string>
  selectSourceAction(actionText: any): Promise<string>
  setBreakpoint(lineNumber: any): Promise<string>
  setCursor(line: any, column: any): Promise<string>
  setLanguageMode(languageId: any): Promise<string>
  setLogpoint(lineNumber: any, logMessage: any): Promise<string>
  shouldHaveActiveLineNumber(value: any): Promise<string>
  shouldHaveBreadCrumb(text: any): Promise<string>
  shouldHaveCodeLens(options: any): Promise<string>
  shouldHaveCodeLensWithVersion(options: any): Promise<string>
  shouldHaveCursor(estimate: any): Promise<string>
  shouldHaveEmptySelection(): Promise<string>
  shouldHaveError(fileName: any): Promise<string>
  shouldHaveExceptionWidget(): Promise<string>
  shouldHaveFoldingGutter(enabled: any): Promise<string>
  shouldHaveFontFamily(fontFamily: any): Promise<string>
  shouldHaveInspectedToken(name: any): Promise<string>
  shouldHaveOverlayMessage(message: any): Promise<string>
  shouldHaveSelection(left: any, width: any): Promise<string>
  shouldHaveSemanticToken(type: any): Promise<string>
  shouldHaveSpark(): Promise<string[]>
  shouldHaveSquigglyError(): Promise<string[]>
  shouldHaveText(text: any, fileName?: any): Promise<string[]>
  shouldHaveToken(text: any, color: any): Promise<string[]>
  shouldNotHaveSemanticToken(type: any): Promise<string[]>
  shouldNotHaveSquigglyError(): Promise<string[]>
  showBreadCrumbs(): Promise<string[]>
  showColorPicker(): Promise<string[]>
  showDebugHover(options: any): Promise<string[]>
  showMinimap(): Promise<string[]>
  showRefactor(): Promise<string[]>
  showSourceAction(): Promise<string[]>
  showSourceActionEmpty(): Promise<string[]>
  split(command: any): Promise<string[]>
  splitDown(): Promise<string[]>
  splitLeft(): Promise<string[]>
  splitRight(): Promise<string[]>
  splitUp(): Promise<string[]>
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
  openReplace(): Promise<string[]>
  replace(): Promise<void>
  setReplaceValue(value: any): Promise<void>
  setSearchValue(value: any): Promise<void>
}
export interface Electron {
  evaluate(expression: any): Promise<string[]>
  mockDialog(response: any): Promise<string[]>
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
  openContextMenu(dirent?: any): Promise<void>
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
  addServer(options: any): Promise<string[]>
  createMCPServer(): Promise<any>
  getInputValue(): Promise<string>
  getVisibleCommands(): Promise<string[]>
  listServers(): Promise<void>
  openConfiguration(): Promise<void>
  removeAllServers(): Promise<void>
  removeServer(serverName: any): Promise<void>
  selectCommand(text, stayVisible?: any): Promise<void>
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
}
export interface Notification {
  closeAll(): Promise<void>
  shouldHaveItem(expectedMessage: any): Promise<void>
}
export interface Output {
  clearFilter(): Promise<void>
  filter(filterValue: any): Promise<void>
  hide(): Promise<void>
  select(channelName: any): Promise<void>
  show(): Promise<void>
}
export interface Panel {
  hide(): Promise<string[]>
  show(): Promise<void>
  toggle(): Promise<void>
}
export interface PortsView {
  cancelPortEdit(): Promise<string[]>
  close(): Promise<string[]>
  forwardPort(port: any): Promise<any>
  open(): Promise<void>
  setPortInput(portId: any): Promise<void>
  shouldHaveForwardedPort(portId: any): Promise<void>
  unforwardAllPorts(port: any): Promise<void>
}
export interface Problems {
  hide(): Promise<string[]>
  shouldHaveCount(count: any): Promise<string[]>
  show(): Promise<string[]>
  switchToTableView(): Promise<string[]>
  switchToTreeView(): Promise<void>
}
export interface Profile {
  create(info: any): Promise<void>
  export(options: any): Promise<void>
  remove(info: any): Promise<void>
  removeOtherProfiles(): Promise<void>
}
export interface QuickPick {
  close(): Promise<string[]>
  executeCommand(options?: any): Promise<string[]>
  focusNext(): Promise<string[]>
  focusPrevious(): Promise<string[]>
  getInputValue(): Promise<string>
  getVisibleCommands(): Promise<string[]>
  hide(): Promise<string[]>
  openFile(fileName: any): Promise<string[]>
  pressEnter(): Promise<string[]>
  select(text?: any): Promise<string[]>
  show(options?: any): Promise<string[]>
  showColorTheme(): Promise<string[]>
  showCommands(options?: any): Promise<string[]>
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
  clear(): Promise<string[]>
  collapseFiles(): Promise<string[]>
  deleteText(): Promise<string[]>
  enableRegex(): Promise<string[]>
  expandFiles(): Promise<string[]>
  openEditor(): Promise<void>
  replace(): Promise<void>
  setFilesToInclude(pattern: any): Promise<void>
  shouldHaveNoResults(): Promise<void>
  toHaveResults(options: any): Promise<void>
  type(text: any): Promise<void>
  typeReplace(text: any): Promise<void>
}
export interface SettingsEditor {
  addItem(options: any): Promise<string[]>
  applyFilter(options: any): Promise<string[]>
  clear(): Promise<string[]>
  closeSettingsContextMenu(name: any): Promise<string[]>
  collapse(groupName: any): Promise<string[]>
  collapseOutline(): Promise<string[]>
  disableCheckBox(options: any): Promise<string[]>
  enableCheckBox(options: any): Promise<string[]>
  ensureIdle(): Promise<void>
  expand(groupName: any): Promise<void>
  focusOutline(name: any): Promise<void>
  moveScrollBar(y: any, expectedScrollBarTop: any): Promise<void>
  open(): Promise<void>
  openSettingsContextMenu(options: any): Promise<void>
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
}
export interface SourceControl {
  checkoutBranch(branchName: any): Promise<string[]>
  disableInlineBlame(): Promise<string[]>
  doMoreAction(name: any): Promise<string[]>
  enableInlineBlame(options: any): Promise<string[]>
  hideBranchPicker(): Promise<string[]>
  hideGraph(): Promise<string[]>
  showGraph(): Promise<string[]>
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
  selectQuickPickItem(options: any): Promise<void>
  unpin(name: any): Promise<void>
}
export interface Terminal {
  add(): Promise<void>
  clear(): Promise<void>
  clearFindInput(): Promise<void>
  closeFind(): Promise<void>
  execute(options?: any): Promise<void>
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
  hideMenu(text: any): Promise<string[]>
  hideMenuFile(): Promise<string[]>
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
  add(file: any): Promise<string[]>
  addExtension(name: any): Promise<string[]>
  initializeGitRepository(): Promise<void>
  remove(file: any): Promise<void>
  setFiles(files: any): Promise<void>
  waitForFile(fileName: any): Promise<void>
}

export interface PageObjectApi {
  readonly ActivityBar: ActivityBar
  readonly ChatEditor: ChatEditor
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
  readonly Window: Window
  readonly Workbench: Workbench
  readonly Workspace: Workspace
}

// Export the create function type
export declare const create: (context: PageObjectContext) => Promise<PageObjectApi>

export default PageObjectApi
