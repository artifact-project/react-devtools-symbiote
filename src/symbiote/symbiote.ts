declare const __REACT_DEVTOOLS_GLOBAL_HOOK__: any;

interface Source {
	fileName: string;
	lineNumber: number;
}

interface ReactElement {
	dom: any;
	key?: any;
	ref?: any;
	type: any;
	props: any;
	children?: ReactElement[];

	// __DEV__
	_source: Source;
}

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

		// element._composite = this;

		if (Array.isArray(element.children)) {
			this._renderedChildren = element.children.map(child => isPrimitive(child)
				? {
					props: null,
					_currentElement: child.children,
					_stringText: child.children
				}
				: new ReactCompositeComponent(child)
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
	getInitialRoots(): any[];
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
				getClosestInstanceFromNode(domNode) {
					console.warn('[symbiote] getClosestInstanceFromNode not supported')
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
