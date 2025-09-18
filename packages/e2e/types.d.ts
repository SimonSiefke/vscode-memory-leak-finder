declare const process: {
  platform: 'win32' | 'linux' | 'darwin'
}

// Base page object types
export interface Workbench {
  shouldBeVisible(): Promise<void>
  shouldHaveEditorBackground(color: string): Promise<void>
}

export interface ActivityBar {
  showSearch(): Promise<void>
  showSourceControl(): Promise<void>
  showRunAndDebug(): Promise<void>
  showExtensions(): Promise<void>
  showExplorer(): Promise<void>
  hide(): Promise<void>
  show(): Promise<void>
  showTooltipExplorer(): Promise<void>
  hideTooltip(): Promise<void>
}

export interface Explorer {
  focus(): Promise<void>
  shouldHaveItem(name: string): Promise<void>
  expand(name: string): Promise<void>
  collapse(name: string): Promise<void>
  collapseAll(): Promise<void>
  openContextMenu(): Promise<void>
  copy(): Promise<void>
  paste(): Promise<void>
  shouldHaveFocusedItem(name: string): Promise<void>
  delete(): Promise<void>
  focusNext(): Promise<void>
  click(): Promise<void>
  refresh(): Promise<void>
  newFile(name: string): Promise<void>
  newFolder(name: string): Promise<void>
  cancel(): Promise<void>
  rename(oldName: string, newName: string): Promise<void>
  toHaveItem(name: string): Promise<void>
  shouldHaveFocusedItem(name: string): Promise<void>
  not: {
    toHaveItem(name: string): Promise<void>
  }
}

export interface Editor {
  closeAll(): Promise<void>
  open(fileName: string): Promise<void>
  close(): Promise<void>
  goToFile(options: { file: string; line: number; column: number }): Promise<void>
  shouldHaveError(fileName: string): Promise<void>
  shouldNotHaveError(fileName: string): Promise<void>
  shouldHaveText(text: string): Promise<void>
  shouldHaveCursor(): Promise<void>
  shouldHaveSelection(): Promise<void>
  shouldHaveEmptySelection(): Promise<void>
  shouldHaveBreadCrumb(text: string): Promise<void>
  shouldHaveToken(text: string): Promise<void>
  shouldHaveActiveLineNumber(line: number): Promise<void>
  shouldHaveSquigglyError(): Promise<void>
  shouldNotHaveSquigglyError(): Promise<void>
  shouldHaveOverlayMessage(message: string): Promise<void>
  shouldHaveInspectedToken(): Promise<void>
  autoFix(options: { hasFixes: boolean }): Promise<void>
  closeAutoFix(): Promise<void>
  save(): Promise<void>
  type(text: string): Promise<void>
  deleteCharactersLeft(count: number): Promise<void>
  deleteCharactersRight(count: number): Promise<void>
  deleteAll(): Promise<void>
  click(): Promise<void>
  hover(): Promise<void>
  showColorPicker(): Promise<void>
  hideColorPicker(): Promise<void>
  showDebugHover(): Promise<void>
  hideDebugHover(): Promise<void>
  inspectTokens(): Promise<void>
  closeInspectedTokens(): Promise<void>
  newTextFile(): Promise<void>
  setBreakpoint(line: number): Promise<void>
  removeAllBreakpoints(): Promise<void>
  toggleBreakpoint(line: number): Promise<void>
  goToDefinition(): Promise<void>
  goToSourceDefinition(): Promise<void>
  findAllReferences(): Promise<void>
  rename(): Promise<void>
  renameCancel(): Promise<void>
  duplicateSelection(): Promise<void>
  undo(): Promise<void>
  openFind(): Promise<void>
  closeFind(): Promise<void>
  scrollDown(): Promise<void>
  scrollUp(): Promise<void>
  moveScrollBar(direction: string): Promise<void>
  select(): Promise<void>
  cursorRight(): Promise<void>
  splitDown(): Promise<void>
  splitLeft(): Promise<void>
  splitRight(): Promise<void>
  splitUp(): Promise<void>
  disableStickyScroll(): Promise<void>
  enableStickyScroll(): Promise<void>
  switchToTab(index: number): Promise<void>
  hideBreadCrumbs(): Promise<void>
  showBreadCrumbs(): Promise<void>
  showMinimap(): Promise<void>
  hideMinimap(): Promise<void>
  pin(): Promise<void>
  unpin(): Promise<void>
  showSourceAction(): Promise<void>
  hideSourceAction(): Promise<void>
  showSourceActionEmpty(): Promise<void>
  hideSourceActionEmpty(): Promise<void>
  focus(): Promise<void>
}

export interface Workspace {
  setFiles(files: Array<{ name: string; content: string }>): Promise<void>
  add(file: string): Promise<void>
  remove(file: string): Promise<void>
  initializeGitRepository(): Promise<void>
  getWorkspaceFilePath(): Promise<string>
  addExtension(extension: string): Promise<void>
}

// Additional page object types
export interface ChatEditor {
  open(): Promise<void>
  sendMessage(message: string): Promise<void>
  addAllProblemsAsContext(): Promise<void>
  finishSetupToggle(): Promise<void>
  setMode(mode: string): Promise<void>
}

export interface DebugConsole {
  toggle(): Promise<void>
}

export interface RunAndDebug {
  start(): Promise<void>
  stop(): Promise<void>
}

export interface DebugHover {
  shouldHaveText(text: string): Promise<void>
}

export interface DiffEditor {
  open(): Promise<void>
}

export interface Suggest {
  shouldHaveText(text: string): Promise<void>
}

export interface Hover {
  shouldHaveText(text: string): Promise<void>
}

export interface Notification {
  shouldHaveText(text: string): Promise<void>
}

export interface Extensions {
  show(): Promise<void>
  search(query: string): Promise<void>
  first: {
    shouldBe(name: string): Promise<void>
    openContextMenu(): Promise<void>
  }
}

export interface ExtensionDetailView {
  open(): Promise<void>
  disable(): Promise<void>
  openSettings(): Promise<void>
  selectCategories(categories: string[]): Promise<void>
  toggleTabs(): Promise<void>
}

export interface RunningExtensions {
  show(): Promise<void>
  debug(): Promise<void>
  profile(): Promise<void>
}

export interface KeyBindingsEditor {
  open(): Promise<void>
  setKeybinding(command: string, keybinding: string): Promise<void>
}

export interface QuickPick {
  open(): Promise<void>
  selectItem(item: string): Promise<void>
  close(): Promise<void>
}

export interface WellKnownCommands {
  execute(command: string): Promise<void>
}

export interface MarkdownPreview {
  open(): Promise<void>
  update(): Promise<void>
}

export interface Notebook {
  addMarkdownCell(): Promise<void>
}

export interface Output {
  select(): Promise<void>
  toggle(): Promise<void>
}

export interface Panel {
  toggle(): Promise<void>
}

export interface PortsView {
  open(): Promise<void>
  openPort(port: number): Promise<void>
}

export interface Problems {
  toggle(): Promise<void>
}

export interface Electron {
  getVersion(): Promise<string>
}

export interface Profile {
  create(): Promise<void>
  export(): Promise<void>
}

export interface Colors {
  selectTheme(theme: string): Promise<void>
}

export interface ReleaseNotes {
  open(): Promise<void>
}

export interface Search {
  open(): Promise<void>
  search(query: string): Promise<void>
  replace(query: string, replacement: string): Promise<void>
  clear(): Promise<void>
  toggleFiles(): Promise<void>
}

export interface SideBar {
  move(): Promise<void>
  toggle(): Promise<void>
}

export interface SettingsEditor {
  open(): Promise<void>
  selectSetting(setting: string): Promise<void>
  editKeyValue(key: string, value: string): Promise<void>
  expandOutlineItem(item: string): Promise<void>
  navigateOutline(direction: string): Promise<void>
  scroll(): Promise<void>
  search(query: string): Promise<void>
  select(): Promise<void>
  switchTab(tab: string): Promise<void>
  openContextMenu(): Promise<void>
}

export interface SettingsEditorFilter {
  filterByTag(tag: string): Promise<void>
}

export interface SettingsEditorCompletion {
  selectItem(item: string): Promise<void>
}

export interface Settings {
  open(): Promise<void>
  scroll(): Promise<void>
}

export interface SourceControl {
  stageFile(file: string): Promise<void>
  toggle(): Promise<void>
}

export interface StatusBar {
  shouldHaveItem(item: string): Promise<void>
  toggleProblems(): Promise<void>
}

export interface Task {
  changeIcon(): Promise<void>
  configure(): Promise<void>
  pin(): Promise<void>
  run(): Promise<void>
}

export interface Terminal {
  create(): Promise<void>
  execute(command: string): Promise<void>
  split(): Promise<void>
  toggle(): Promise<void>
}

export interface TitleBar {
  menuMove(): Promise<void>
  menuToggle(): Promise<void>
}

export interface View {
  toggleZenMode(): Promise<void>
}

export interface WelcomePage {
  edit(): Promise<void>
  open(): Promise<void>
}

export interface Window {
  toggleFocus(): Promise<void>
}

export interface ContextMenu {
  close(): Promise<void>
}

export interface Tab {
  openContextMenu(): Promise<void>
}

export interface SideBar {
  move(): Promise<void>
  toggle(): Promise<void>
}

export interface Page {
  // Playwright page object
}

export interface Expect {
  // Playwright expect object
}

export interface WriteSettings {
  writeSettings(settings: Record<string, any>): Promise<void>
}

export interface References {
  shouldHaveText(text: string): Promise<void>
}

// Test function types
export type TestContext = any

export type TestFunction = (context: TestContext) => Promise<void>
export type SetupFunction = (context: TestContext) => Promise<void>
export type TeardownFunction = (context: TestContext) => Promise<void>

// Test exports - these are declared in individual test files
// export const run: TestFunction
// export const setup?: SetupFunction
// export const teardown?: TeardownFunction
// export const skip?: boolean
