declare const __REACT_DEVTOOLS_GLOBAL_HOOK__: any;

export interface Source {
	fileName: string;
	lineNumber: number;
}

export interface ReactElement {
	dom: HTMLElement | Text;
	key?: string;
	ref?: string | Function;
	type: any;
	props: object;
	children?: ReactElement[];

	// __DEV__
	_source: Source;
}

const domStore = new WeakMap<HTMLElement | Text, ReactCompositeComponent>();

class ReactComponent {
	props = {};
	state = null;
	context = {};

	_instance: any;
	_currentElement: ReactElement;

	constructor(element: ReactElement) {
		const {type, props} = element;

		if (typeof type === 'function') {
			type.displayName = type.displayName || type.name;
		}

		this.props = props;

		this._currentElement = element;

		this._instance = {
			type,
			props,
			state: null,
		};
	}
}

function isPrimitive({type}) {
	return type === '#' || type === '!' || type === '<';
}

class ReactCompositeComponent extends ReactComponent {
	_hostNode: any;
	_renderedChildren: any[] = null;

	constructor(element: ReactElement) {
		super(element);

		// element.dom._composite = this;
		// element._composite = this;
		domStore.set(element.dom, this);

		if (Array.isArray(element.children)) {
			this._renderedChildren = element.children.map(node => isPrimitive(node)
				? {
					props: null,
					_currentElement: node.children,
					_stringText: node.children
				}
				: new ReactCompositeComponent(node)
			);
		}

		if (typeof element.type === 'string') {
			this._hostNode = element.dom;
		}
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

export interface Symbiote {
	onUpdate?(fn: Function): void
	getInitialRoots(): ReactElement[];
}

export function connect(symbiote: Symbiote) {
	const hook = getHook();

	if (typeof hook.inject === 'function') {
		const Reconciler =  {
			receiveComponent(internalInstance) {
				// todo
			},
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
					return symbiote.getInitialRoots().map(root => new ReactTopLevelWrapper(root));
				},
			},

			Reconciler,
		});

		symbiote.onUpdate && symbiote.onUpdate(({_element: {_composite}}) => {
			Reconciler.receiveComponent(_composite);
		});
	}
}
