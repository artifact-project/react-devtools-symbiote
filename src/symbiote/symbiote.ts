declare const __REACT_DEVTOOLS_GLOBAL_HOOK__: any;

interface IReconciler {
	mountComponent(internalInstance);
	receiveComponent(internalInstance);
	unmountComponent(internalInstance);
}

export interface Source {
	fileName: string;
	lineNumber: number;
}

export interface ReactElement {
	dom?: HTMLElement | Text;
	key?: string;
	ref?: string | Function;
	type: any;
	props?: object;
	state?: object;
	children?: string | ReactElement[];

	setProps?: (newProps: object) => void;
	setState?: (newState: object) => void;
	forceUpdate?: () => void;

	// __DEV__
	_source?: Source;
}

const domStore = new WeakMap<HTMLElement | Text, ReactCompositeComponent>();

function forceUpdateDummy() {
}

class ReactComponent {
	props = {};
	state = null;
	context = {};

	_instance: any;
	_currentElement: ReactElement;

	constructor(element: ReactElement) {
		const {type, props, state} = element;

		if (typeof type === 'function') {
			type.displayName = type.displayName || type.name;
		}

		this.props = props;
		this.state = state;

		this._currentElement = element;
		this._instance = {
			type,
			props,
			state,

			setProps: element.setProps,
			setState: element.setState,
			forceUpdate: (element.setProps || element.setState) && (element.forceUpdate || forceUpdateDummy),
		};
	}
}

function isPrimitive({type}) {
	return type === '#' || type === '!' || type === '<';
}

class ReactCompositeComponent extends ReactComponent {
	_hostNode: any;
	_renderedChildren: any = {};

	constructor(element: ReactElement, Reconciler?: IReconciler) {
		super(element);

		const {dom} = element;

		this.__updateChildren__(<ReactElement[]>element.children, Reconciler);

		if (typeof element.type === 'string') {
			this._hostNode = dom;
		}

		if (dom && !domStore.has(dom)) {
			domStore.set(dom, this);
			Reconciler && Reconciler.mountComponent(this);
		}
	}

	__update__(element: ReactElement, Reconciler?: IReconciler) {
		const {type, props, state, children} = element;

		this._instance.type = type;

		if (props) {
			this.props = this._instance.props = {
				...Object(this.props),
				...props,
			};
		}

		if (state) {
			this.state = this._instance.state = {
				...Object(this.state),
				...state,
			};
		}

		this._currentElement = element;
		this.__updateChildren__(<ReactElement[]>children, Reconciler);

		if (typeof element.type === 'string') {
			this._hostNode = element.dom;
		}

		Reconciler && Reconciler.receiveComponent(this);

		return this;
	}

	__updateChildren__(children: ReactElement[], Reconciler?: IReconciler) {
		if (Array.isArray(children)) {
			const used = new Set();
			const {_renderedChildren} = this;

			this._renderedChildren = children.reduce((map, node, idx) => {
				let child;

				if (isPrimitive(node)) {
					child = {
						props: null,
						_currentElement: node.children,
						_stringText: node.children,
						__destroy__(Reconciler) {
							Reconciler && Reconciler.unmountComponent(child);
						},
					};
					Reconciler && Reconciler.mountComponent(child);
				} else if (domStore.has(node.dom)) {
					child = domStore.get(node.dom).__update__(node);
					used.add(child);
				} else {
					child = new ReactCompositeComponent(node, Reconciler);
				}

				map[`.${idx}`] = child;

				return map;
			}, {});

			Reconciler && Object.keys(_renderedChildren).forEach(key => {
				const child = _renderedChildren[key];
				// todo: Рекурсивное удаление
				!used.has(child) && child.__destroy__(Reconciler)
			});
		} else {
			this._renderedChildren = null;
		}
	}

	__destroy__(Reconciler?: IReconciler) {
		this._currentElement.dom && domStore.delete(this._currentElement.dom);
		this._renderedChildren && Object.keys(this._renderedChildren).forEach(key => {
			this._renderedChildren[key].__destroy__(Reconciler);
		});

		Reconciler && Reconciler.unmountComponent(this);
	}
}

class ReactTopLevelWrapper extends ReactCompositeComponent {
	static displayName = 'ReactTopLevelWrapper';
	static isReactTopLevelWrapper = true;

	constructor(root) {
		super(root);
	}
}

export function getHook() {
	return typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' && __REACT_DEVTOOLS_GLOBAL_HOOK__;
}

export interface SymbioteOptions {
	onUpdate?(fn: (node: ReactElement) => void);
	getInitialRoots(): ReactElement[];
}

export interface SymbioteAPI {
	update(node: ReactElement);
	unmount(node: ReactElement);
}

export function connect(options: SymbioteOptions): SymbioteAPI {
	const hook = getHook();

	if (typeof hook.inject === 'function') {
		const Reconciler: IReconciler =  {
			// Ничего тут не надо, но эти методы перехватыват DevTools
			mountComponent(internalInstance) {},
			receiveComponent(internalInstance) {},
			unmountComponent(internalInstance) {},
		};

		hook.inject({
			ComponentTree: {
				getClosestInstanceFromNode(target) {
					do {
						if (domStore.has(target)) {
							return domStore.get(target);
						}
					} while (target = target.parentNode);
				},

				getNodeFromInstance: function (target) {
                    return target._currentElement.dom;
                },
			},

			Mount: {
				get _instancesByReactRootID() {
					return options.getInitialRoots().map(root => new ReactTopLevelWrapper(root));
				},
			},

			Reconciler,
		});

		// Export public API
		return {
			update(node: ReactElement) {
				const composite = domStore.get(node.dom);
				composite && composite.__update__(node, Reconciler);
			},

			unmount(node) {
				const composite = domStore.get(node.dom);
				composite && composite.__destroy__(Reconciler);
			}
		};
	}

	return null;
}
