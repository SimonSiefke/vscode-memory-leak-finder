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
  show(): Promise<void>
  showView(options: any): Promise<void>
  hide(): Promise<void>
  showTooltipExplorer(): Promise<void>
  hideTooltip(): Promise<void>
  showSourceControl(): Promise<void>
  showSearch(): Promise<void>
  showRunAndDebug(): Promise<void>
  showExtensions(): Promise<void>
  showExplorer(): Promise<void>
}
export interface ChatEditor {
  open(): Promise<void>
  sendMessage(message: any): Promise<void>
  setMode(modeLabel: any): Promise<void>
  openFinishSetup(): Promise<void>
  closeFinishSetup(): Promise<void>
  addContext(initialPrompt: any, secondPrompt: any, confirmText: any): Promise<void>
  clearContext(contextName: any): Promise<void>
}
export interface ContextMenu {
  open(locator: any): Promise<void>
  select(option: any): Promise<void>
  shouldHaveItem(option: any): Promise<void>
  close(): Promise<void>
}
export interface CursorChat {
  show(): Promise<void>
  sendMessage(question: any): Promise<void>
  shouldHaveMessageCount(count: any): Promise<void>
  shouldHaveResponse(responseText: any): Promise<void>
  resetFocus(): Promise<void>
}
export interface DebugConsole {
  show(): Promise<void>
  hide(): Promise<void>
  evaluate(options: any): Promise<void>
  type(value: any): Promise<void>
  clear(): Promise<void>
  shouldHaveCompletions(items: any): Promise<void>
  clearInput(): Promise<void>
}
export interface DebugHover {
  expandProperty(name: any, childProperties: any): Promise<void>
  collapseProperty(name: any): Promise<void>
}
export interface DiffEditor {
  expectOriginal(text: any): Promise<void>
  expectModified(text: any): Promise<void>
  open(a: any, b: any): Promise<void>
  shouldHaveOriginalEditor(text: any): Promise<void>
  shouldHaveModifiedEditor(text: any): Promise<void>
  scrollDown(): Promise<void>
  scrollUp(): Promise<void>
}
export interface DropDownContextMenu {
  shouldHaveItem(option: any): Promise<void>
  close(): Promise<void>
}
export interface Editor {
  open(fileName: any): Promise<void>
  focus(): Promise<void>
  hover(text: any, hoverText: any): Promise<void>
  splitRight(): Promise<void>
  split(command: any): Promise<void>
  splitDown(): Promise<void>
  splitUp(): Promise<void>
  splitLeft(): Promise<void>
  goToSourceDefinition(options: any): Promise<void>
  close(): Promise<void>
  closeAll(): Promise<void>
  select(text: any): Promise<void>
  selectAll(): Promise<void>
  deleteAll(): Promise<void>
  duplicateSelection(): Promise<void>
  undo(): Promise<void>
  cursorRight(): Promise<void>
  shouldHaveSelection(left: any, width: any): Promise<void>
  shouldHaveEmptySelection(): Promise<void>
  goToDefinition(): Promise<void>
  findAllReferences(): Promise<void>
  newTextFile(): Promise<void>
  shouldHaveOverlayMessage(message: any): Promise<void>
  click(text: any): Promise<void>
  shouldHaveSquigglyError(): Promise<void>
  shouldNotHaveSquigglyError(): Promise<void>
  deleteCharactersRight(options: any): Promise<void>
  deleteCharactersLeft(options: any): Promise<void>
  type(text: any): Promise<void>
  shouldHaveText(text: any): Promise<void>
  rename(newText: any): Promise<void>
  renameCancel(newText: any): Promise<void>
  shouldHaveToken(text: any, color: any): Promise<void>
  shouldHaveBreadCrumb(text: any): Promise<void>
  save(options?: any): Promise<void>
  switchToTab(name: any): Promise<void>
  showColorPicker(): Promise<void>
  hideColorPicker(): Promise<void>
  showBreadCrumbs(): Promise<void>
  hideBreadCrumbs(): Promise<void>
  enableStickyScroll(): Promise<void>
  disableStickyScroll(): Promise<void>
  openFind(): Promise<void>
  closeFind(): Promise<void>
  showMinimap(): Promise<void>
  hideMinimap(): Promise<void>
  removeAllBreakpoints(): Promise<void>
  toggleBreakpoint(): Promise<void>
  showSourceActionEmpty(): Promise<void>
  hideSourceActionEmpty(): Promise<void>
  showSourceAction(): Promise<void>
  hideSourceAction(): Promise<void>
  shouldHaveCursor(estimate: any): Promise<void>
  inspectTokens(): Promise<void>
  shouldHaveInspectedToken(name: any): Promise<void>
  closeInspectedTokens(): Promise<void>
  setBreakpoint(lineNumber: any): Promise<void>
  goToFile(options: any): Promise<void>
  showDebugHover(options: any): Promise<void>
  hideDebugHover(): Promise<void>
  autoFix(options: any): Promise<void>
  closeAutoFix(): Promise<void>
  shouldHaveError(fileName: any): Promise<void>
  pin(): Promise<void>
  unpin(): Promise<void>
  scrollDown(): Promise<void>
  scrollUp(): Promise<void>
  shouldHaveActiveLineNumber(value: any): Promise<void>
  moveScrollBar(y: any, expectedScrollBarY: any): Promise<void>
}
export interface Electron {
  evaluate(expression: any): Promise<void>
  mockElectron(namespace: any, key: any, implementationCode: any): Promise<void>
  mockDialog(response: any): Promise<void>
  mockSaveDialog(response: any): Promise<void>
  mockOpenDialog(response: any): Promise<void>
  mockShellTrashItem(): Promise<void>
}
export interface Explorer {
  focus(): Promise<void>
  newFile(name: any): Promise<void>
  newFolder(options: any): Promise<void>
  cancel(): Promise<void>
  focusNext(): Promise<void>
  click(): Promise<void>
  expand(folderName: any): Promise<void>
  collapse(folderName: any): Promise<void>
  collapseAll(): Promise<void>
  shouldHaveItem(direntName: any): Promise<void>
  toHaveItem(direntName: any): Promise<void>
  shouldHaveFocusedItem(direntName: any): Promise<void>
  copy(dirent: any): Promise<void>
  openContextMenu(options: any): Promise<void>
  paste(): Promise<void>
  delete(item: any): Promise<void>
  executeContextMenuCommand(locator: any, option: any): Promise<void>
  rename(oldDirentName: any, newDirentName: any): Promise<void>
  refresh(): Promise<void>
  toHaveItem(direntName: any): Promise<void>
  not: any
}
export interface Extensions {
  search(value: any): Promise<void>
  first: any
  clear(): Promise<void>
  shouldHaveValue(value: any): Promise<void>
  show(): Promise<void>
  hide(): Promise<void>
  openSuggest(): Promise<void>
  closeSuggest(): Promise<void>
  shouldHaveMcpWelcomeHeading(expectedText: any): Promise<void>
  shouldHaveTitle(expectedTtitle: any): Promise<void>
  shouldBe(name: any): Promise<void>
  click(): Promise<void>
  openContextMenu(): Promise<void>
}
export interface Hover {
  hide(): Promise<void>
  shouldHaveText(text: any): Promise<void>
}
export interface KeyBindingsEditor {
  show(): Promise<void>
  searchFor(searchValue: any): Promise<void>
  setKeyBinding(commandName: any, keyBinding: any): Promise<void>
}
export interface MarkdownPreview {
  shouldHaveHeading(id: any): Promise<void>
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
}
export interface Output {
  show(): Promise<void>
  hide(): Promise<void>
  select(channelName: any): Promise<void>
}
export interface Panel {
  toggle(): Promise<void>
  show(): Promise<void>
  hide(): Promise<void>
}
export interface PortsView {
  open(): Promise<void>
  close(): Promise<void>
  setPortInput(portId: any): Promise<void>
  cancelPortEdit(): Promise<void>
}
export interface Problems {
  shouldHaveCount(count: any): Promise<void>
  show(): Promise<void>
  hide(): Promise<void>
}
export interface Profile {
  removeOtherProfiles(): Promise<void>
  create(info: any): Promise<void>
  remove(info: any): Promise<void>
  export(options: any): Promise<void>
}
export interface QuickPick {
  show(options?: any): Promise<void>
  showCommands(): Promise<void>
  type(value: any): Promise<void>
  select(text: string, stayVisible?: boolean): Promise<void>
  executeCommand(options: any): Promise<void>
  openFile(fileName: any): Promise<void>
  showColorTheme(): Promise<void>
  focusNext(): Promise<void>
  focusPrevious(): Promise<void>
  hide(): Promise<void>
  close(): Promise<void>
  getVisibleCommands(): Promise<string[]>
}
export interface References {
  shouldBeVisible(): Promise<void>
  shouldHaveMessage(message: any): Promise<void>
  shouldBeFocused(): Promise<void>
  clear(): Promise<void>
}
export interface ReleaseNotes {
  show(): Promise<void>
}
export interface RunAndDebug {
  startRunAndDebug(): Promise<void>
  pause(): Promise<void>
  stop(): Promise<void>
  waitForPaused(options: any): Promise<void>
  runAndWaitForPaused(options?: any): Promise<void>
  removeAllBreakpoints(): Promise<void>
  step(expectedFile: any, expectedPauseLine: any, expectedCallStackSize?: any): Promise<void>
  setValue(variableName: any, variableValue: any, newVariableValue: any): Promise<void>
}
export interface RunningExtensions {
  show(): Promise<void>
  startDebuggingExtensionHost(): Promise<void>
  startProfilingExtensionHost(): Promise<void>
  stopProfilingExtensionHost(): Promise<void>
}
export interface Search {
  toHaveResults(results: any): Promise<void>
  type(text: any): Promise<void>
  clear(): Promise<void>
  typeReplace(text: any): Promise<void>
  replace(): Promise<void>
  deleteText(): Promise<void>
  shouldHaveNoResults(): Promise<void>
  expandFiles(): Promise<void>
  collapseFiles(): Promise<void>
  openEditor(): Promise<void>
}
export interface Settings {
  open(): Promise<void>
}
export interface SettingsEditor {
  open(): Promise<void>
  scrollDown(): Promise<void>
  scrollUp(): Promise<void>
  search(options: any): Promise<void>
  clear(): Promise<void>
  select(options: any): Promise<void>
  toggleCheckBox(options: any): Promise<void>
  enableCheckBox(options: any): Promise<void>
  openTab(tabName: any): Promise<void>
  disableCheckBox(options: any): Promise<void>
  openSettingsContextMenu(name: any): Promise<void>
  expand(groupName: any): Promise<void>
  collapse(groupName: any): Promise<void>
  ensureIdle(): Promise<void>
  addItem(options: any): Promise<void>
  removeItem(options: any): Promise<void>
  collapseOutline(): Promise<void>
  focusOutline(name: any): Promise<void>
  applyFilter(options: any): Promise<void>
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
  toggle(): Promise<void>
  show(): Promise<void>
  hide(): Promise<void>
  togglePosition(): Promise<void>
  moveRight(): Promise<void>
  moveLeft(): Promise<void>
}
export interface SourceControl {
  shouldHaveUnstagedFile(name: any): Promise<void>
  stageFile(name: any): Promise<void>
  unstageFile(name: any): Promise<void>
}
export interface StatusBar {
  click(label: any): Promise<void>
  item(id: any): Promise<any>
  shouldHaveText(text: any): Promise<void>
  click(): Promise<void>
  hide(): Promise<void>
  show(): Promise<void>
}
export interface Suggest {
  open(): Promise<void>
  close(): Promise<void>
}
export interface Tab {
  openContextMenu(label: any): Promise<void>
}
export interface Task {
  open(): Promise<void>
  openRun(): Promise<void>
  pin(name: any): Promise<void>
  unpin(name: any): Promise<void>
  run(taskName: any): Promise<void>
  changeIcon(fromIcon: any, toIcon: any): Promise<void>
}
export interface Terminal {
  killAll(): Promise<void>
  show(): Promise<void>
  split(): Promise<void>
  add(): Promise<void>
  killSecond(): Promise<void>
  killFirst(): Promise<void>
  execute(command: any): Promise<void>
  clear(): Promise<void>
  focusFirst(): Promise<void>
  focusSecond(): Promise<void>
  killThird(): Promise<void>
  shouldNotHaveActiveTerminals(): Promise<void>
}
export interface TitleBar {
  showMenu(text: any): Promise<void>
  showMenuFile(): Promise<void>
  showMenuEdit(): Promise<void>
  hideMenu(text: any): Promise<void>
  hideMenuFile(): Promise<void>
}
export interface View {
  enterZenMode(): Promise<void>
  leaveZenMode(): Promise<void>
}
export interface WebView {
  shouldBeVisible(): Promise<void>
  focus(): Promise<void>
}
export interface WelcomePage {
  show(): Promise<void>
  showFundamentals(): Promise<void>
  expandStep(name: any): Promise<void>
  hide(): Promise<void>
}
export interface Window {
  focus(): Promise<void>
  blur(): Promise<void>
}
export interface Workbench {
  shouldHaveEditorBackground(color: any): Promise<void>
  shouldBeVisible(): Promise<void>
}
export interface Workspace {
  setFiles(files: any): Promise<void>
  addExtension(name: any): Promise<void>
  initializeGitRepository(): Promise<void>
  add(file: any): Promise<void>
  remove(file: any): Promise<void>
  getWorkspaceFilePath(name: string): Promise<any>
}
export interface Server {
  start(options?: { port?: number; path?: string }): Promise<{ url: string; port: number }>
  stop(): Promise<void>
  isRunning(): Promise<boolean>
  getUrl(): string
}

export interface PageObjectApi {
  readonly ActivityBar: ActivityBar
  readonly Colors: any
  readonly ChatEditor: ChatEditor
  readonly ExtensionDetailView: any
  readonly ContextMenu: ContextMenu
  readonly CursorChat: CursorChat
  readonly DebugConsole: DebugConsole
  readonly DebugHover: DebugHover
  readonly DiffEditor: DiffEditor
  readonly DropDownContextMenu: DropDownContextMenu
  readonly Editor: Editor
  readonly Electron: Electron
  readonly Explorer: Explorer
  readonly Extensions: Extensions
  readonly Hover: Hover
  readonly KeyBindingsEditor: KeyBindingsEditor
  readonly MarkdownPreview: MarkdownPreview
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
  readonly Server: Server
  readonly Settings: Settings
  readonly SettingsEditor: SettingsEditor
  readonly SettingsEditorCompletion: SettingsEditorCompletion
  readonly SettingsEditorFilter: SettingsEditorFilter
  readonly SettingsEditorInput: SettingsEditorInput
  readonly SideBar: SideBar
  readonly SourceControl: SourceControl
  readonly StatusBar: StatusBar
  readonly Suggest: Suggest
  readonly Tab: Tab
  readonly Task: Task
  readonly Terminal: Terminal
  readonly TitleBar: TitleBar
  readonly View: View
  readonly WebView: WebView
  readonly WelcomePage: WelcomePage
  readonly Window: Window
  readonly Workbench: Workbench
  readonly Workspace: Workspace
}

// Export the create function type
export declare const create: (context: PageObjectContext) => Promise<PageObjectApi>

export default PageObjectApi
