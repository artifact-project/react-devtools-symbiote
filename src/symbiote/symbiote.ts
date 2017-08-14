declare const __REACT_DEVTOOLS_GLOBAL_HOOK__: any;

interface Source {
	fileName: string;
	lineNumber: number;
}

class ReactElement {
	dom = null;
	type = null;
	key = null;
	ref = null;
	props: any = {};

	// __DEV__
	_source: Source = null;

	constructor(type, props: any, children: ReactElement[] = []) {
		props.children = children;

		this.type = type;
		this.props = props;
		this.key = props.key;
		this.ref = props.ref;
	}
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


class ReactCompositeComponent extends ReactComponent {
	_hostNode: any;
	_renderedChildren: any[] = null;

	constructor(element: ReactElement) {
		super(element);

		if (Array.isArray(element.props.children)) {
			this._renderedChildren = element.props.children.map(child => child instanceof ReactElement
				? new ReactCompositeComponent(child)
				: {
					props: null,
					_currentElement: child.children,
					_stringText: child.children
				}
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

	constructor(tree) {
		function convert(el) {
			if (el.type === '#') {
				return el;
			}

			const {type, props, children} = el;

			return new ReactElement(
				type,
				props,
				(children ? [].concat(children) : []).map(convert),
			);
		}

		super(convert(tree));
	}
}

export function getHook() {
	return typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' && __REACT_DEVTOOLS_GLOBAL_HOOK__;
}

export interface Symbiote {
	onUpdate?(fn: Function): void
	getTopLevels(): any[];
}

export function connect(symbiote: Symbiote) {
	const hook = getHook();

	if (typeof hook.inject === 'function') {
		const Reconciler =  {
			receiveComponent(internalInstance) {
			},
		};

		hook.inject({
			ComponentTree: {
				getClosestInstanceFromNode() {
					console.warn('[symbiote] getClosestInstanceFromNode not supported')
				},

				getNodeFromInstance(component: ReactCompositeComponent) {
					return component._currentElement.dom;
				}
			},

			Mount: {
				get _instancesByReactRootID() {
					return symbiote.getTopLevels();
				},
			},

			Reconciler,
		});

		symbiote.onUpdate(() => {
			// Reconciler.receiveComponent();
		});
	}
}
