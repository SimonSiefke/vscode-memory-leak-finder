import { test, expect } from '@jest/globals'
import * as GetOriginalClassName from '../src/parts/GetOriginalClassName/GetOriginalClassName.ts'
import { readFileSync } from 'fs'

const originalFileName = 'test.ts'

test('getOriginalClassName', () => {
  const sourceContent = `class Test {
  constructor(value){
    this.value = value
  }
}`
  const originalLine = 1
  const originalColumn = 14
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('Test')
})

test('getOriginalClassName - typescript constructor', () => {
  const sourceContent = `export class FolderConfiguration extends Disposable {

	protected readonly _onDidChange: Emitter<void> = this._register(new Emitter<void>());
	readonly onDidChange: Event<void> = this._onDidChange.event;

	private folderConfiguration: CachedFolderConfiguration | FileServiceBasedConfiguration;
	private readonly scopes: ConfigurationScope[];
	private readonly configurationFolder: URI;
	private cachedFolderConfiguration: CachedFolderConfiguration;

	constructor(
		useCache: boolean,
		readonly workspaceFolder: IWorkspaceFolder,
	) {
		super();
  }
}
`
  const originalLine = 10
  const originalColumn = 2
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe(
    'FolderConfiguration',
  )
})

test('getOriginalClassName - extends', () => {
  const sourceContent = `class extends Test {
  constructor(value){
    this.value = value
  }
}`
  const originalLine = 1
  const originalColumn = 14
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe(
    'class extends Test',
  )
})

test('getOriginalClassName - class method', () => {
  const sourceContent = `class ToolBar {
  handleClick(){
    const x = 1
  }
}`
  const originalLine = 2
  const originalColumn = 4
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe(
    'ToolBar.handleClick',
  )
})

test('getOriginalClassName - static class method', () => {
  const sourceContent = `class App {
  static init(){
    return 0
  }
}`
  const originalLine = 2
  const originalColumn = 2
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('App.init')
})

test('getOriginalClassName - class field arrow function', () => {
  const sourceContent = `class A {
  onClick = () => {
    return 1
  }
}`
  const originalLine = 2
  const originalColumn = 2
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('A.onClick')
})

test('getOriginalClassName - function declaration', () => {
  const sourceContent = `function doSomething(){
  return 1
}`
  const originalLine = 1
  const originalColumn = 2
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('doSomething')
})

test('getOriginalClassName - nested function', () => {
  const sourceContent = `function outer(){
  function inner(){
    return 1
  }
  return inner()
}`
  const originalLine = 2
  const originalColumn = 4
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('inner')
})

test('getOriginalClassName - variable arrow function', () => {
  const sourceContent = `const run = () => {
  return 1
}`
  const originalLine = 1
  const originalColumn = 2
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('run')
})

test('getOriginalClassName - getter method', () => {
  const sourceContent = `class Store {
  get value(){
    return 1
  }
}`
  const originalLine = 2
  const originalColumn = 4
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('Store.get value')
})

test('getOriginalClassName - function expression', () => {
  const sourceContent = `const compute = function(){
  return 1
}`
  const originalLine = 1
  const originalColumn = 2
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('compute')
})

test('getOriginalClassName - prototype method assignment', () => {
  const sourceContent = `function App(){}
App.prototype.start = function(){
  return 1
}`
  const originalLine = 2
  const originalColumn = 2
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('App.start')
})

test('getOriginalClassName - private class method (ts)', () => {
  const sourceContent = `class Service {
  private compute(value: number): number {
    return value * 2
  }
}`
  const originalLine = 2
  const originalColumn = 4
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('Service.compute')
})

test('getOriginalClassName - protected class method (ts)', () => {
  const sourceContent = `class Repository {
  protected save(): void {
    return
  }
}`
  const originalLine = 2
  const originalColumn = 2
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('Repository.save')
})

test('getOriginalClassName - abstract class with abstract method (ts)', () => {
  const sourceContent = `abstract class Model {
  abstract compute(x: number): number
}`
  const originalLine = 2
  const originalColumn = 2
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('Model')
})

test('getOriginalClassName - interface should be unknown (ts)', () => {
  const sourceContent = `interface IQueue<T> {
  enqueue(item: T): void
}`
  const originalLine = 1
  const originalColumn = 2
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('unknown')
})

test('getOriginalClassName - enum should be unknown (ts)', () => {
  const sourceContent = `enum Kind {
  A,
  B,
}`
  const originalLine = 1
  const originalColumn = 2
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('unknown')
})

test('getOriginalClassName - namespace function returns function name (ts)', () => {
  const sourceContent = `namespace Utils {
  export function sum(a: number, b: number): number {
    return a + b
  }
}`
  const originalLine = 2
  const originalColumn = 10
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('sum')
})

test('getOriginalClassName - generic class and method (ts)', () => {
  const sourceContent = `class Box<T> {
  get<U>(x: U): U {
    return x
  }
}`
  const originalLine = 2
  const originalColumn = 3
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('Box.get')
})

test('getOriginalClassName - readonly class field with type (ts)', () => {
  const sourceContent = `class Store {
  readonly value: number = 1
}`
  const originalLine = 1
  const originalColumn = 11
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('Store.value')
})

test('getOriginalClassName - decorator on method (ts)', () => {
  const sourceContent = `class Controller {
  @dec
  run(): void {
    return
  }
}`
  const originalLine = 3
  const originalColumn = 3
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('Controller.run')
})

test('getOriginalClassName - method of function', () => {
  const sourceContent = `export const MenuRegistry: IMenuRegistry = new class implements IMenuRegistry {

	private readonly _commands = new Map<string, ICommandAction>();
	private readonly _menuItems = new Map<MenuId, LinkedList<IMenuItem | ISubmenuItem>>();
	private readonly _onDidChangeMenu = new MicrotaskEmitter<IMenuRegistryChangeEvent>({
		merge: MenuRegistryChangeEvent.merge
	});

	readonly onDidChangeMenu: Event<IMenuRegistryChangeEvent> = this._onDidChangeMenu.event;

	addCommand(command: ICommandAction): IDisposable {
		this._commands.set(command.id, command);
		this._onDidChangeMenu.fire(MenuRegistryChangeEvent.for(MenuId.CommandPalette));

		return markAsSingleton(toDisposable(() => {
			if (this._commands.delete(command.id)) {
				this._onDidChangeMenu.fire(MenuRegistryChangeEvent.for(MenuId.CommandPalette));
			}
		}));
	}

	getCommand(id: string): ICommandAction | undefined {
		return this._commands.get(id);
	}

	getCommands(): ICommandsMap {
		const map = new Map<string, ICommandAction>();
		this._commands.forEach((value, key) => map.set(key, value));
		return map;
	}

	appendMenuItem(id: MenuId, item: IMenuItem | ISubmenuItem): IDisposable {
		let list = this._menuItems.get(id);
		if (!list) {
			list = new LinkedList();
			this._menuItems.set(id, list);
		}
		const rm = list.push(item);
		this._onDidChangeMenu.fire(MenuRegistryChangeEvent.for(id));
		return markAsSingleton(toDisposable(() => {
			rm();
			this._onDidChangeMenu.fire(MenuRegistryChangeEvent.for(id));
		}));
	}
}
`
  const originalLine = 39
  const originalColumn = 38
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe(
    'MenuRegistry.appendMenuItem',
  )
})

test('getOriginalClassName - class getter', () => {
  const sourceContent = `export class Emitter<T> {

	private readonly _options?: EmitterOptions;
	private readonly _leakageMon?: LeakageMonitor;
	private readonly _perfMon?: EventProfiling;
	private _disposed?: true;
	private _event?: Event<T>;
	protected _listeners?: ListenerOrListeners<T>;
	private _deliveryQueue?: EventDeliveryQueuePrivate;
	protected _size = 0;

	constructor(options?: EmitterOptions) {}

	dispose() {}

	get event(): Event<T> {
		this._event ??= (callback: (e: T) => unknown, thisArgs?: any, disposables?: IDisposable[] | DisposableStore) => {
			return undefined;
		};
		return this._event;
	}
}`
  const originalLine = 16
  const originalColumn = 19
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('Emitter.get event')
})

test('getOriginalClassName - domListener', () => {
  const sourceContent = `class DomListener implements IDisposable {

	private _handler: (e: any) => void;
	private _node: EventTarget;
	private readonly _type: string;
	private readonly _options: boolean | AddEventListenerOptions;

	constructor(node: EventTarget, type: string, handler: (e: any) => void, options?: boolean | AddEventListenerOptions) {
		this._node = node;
		this._type = type;
		this._handler = handler;
		this._options = (options || false);
		this._node.addEventListener(this._type, this._handler, this._options);
	}
}`
  const originalLine = 7
  const originalColumn = 13
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('DomListener')
})

test('getOriginalClassName - nested function', () => {
  const sourceContent = `export function toDisposable(fn: () => void): IDisposable {
	const self = trackDisposable({
		dispose: createSingleCallFunction(() => {
			markAsDisposed(self);
			fn();
		})
	});
	return self;
}`
  const originalLine = 2
  const originalColumn = 36
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('toDisposable')
})

test('getOriginalClassName - context key constructor', () => {
  const sourceContent = `export class ContextKeyAndExpr implements IContextKeyExpression {

	public static create(_expr: ReadonlyArray<ContextKeyExpression | null | undefined>, negated: ContextKeyExpression | null, extraRedundantCheck: boolean): ContextKeyExpression | undefined {
		return ContextKeyAndExpr._normalizeArr(_expr, negated, extraRedundantCheck);
	}

	public readonly type = ContextKeyExprType.And;

	private constructor(
		public readonly expr: ContextKeyExpression[],
		private negated: ContextKeyExpression | null
	) {
	}
}
`
  const originalLine = 8
  const originalColumn = 18
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn, originalFileName)).toBe('ContextKeyAndExpr')
})
