(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.reactDevToolsSymbiote = {})));
}(this, (function (exports) { 'use strict';

const __assign = Object.assign || function (target) {
    for (var source, i = 1; i < arguments.length; i++) {
        source = arguments[i];
        for (var prop in source) {
            if (Object.prototype.hasOwnProperty.call(source, prop)) {
                target[prop] = source[prop];
            }
        }
    }
    return target;
};

function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var domStore = new WeakMap();
var ReactComponent = (function () {
    function ReactComponent(element) {
        this.props = {};
        this.state = null;
        this.context = {};
        var type = element.type, props = element.props, state = element.state;
        if (typeof type === 'function') {
            type.displayName = type.displayName || type.name;
        }
        this.props = props;
        this.state = state;
        this._currentElement = element;
        this._instance = {
            type: type,
            props: props,
            state: state,
            forceUpdate: function () {
                debugger;
            }
        };
    }
    return ReactComponent;
}());
function isPrimitive(_a) {
    var type = _a.type;
    return type === '#' || type === '!' || type === '<';
}
var ReactCompositeComponent = (function (_super) {
    __extends(ReactCompositeComponent, _super);
    function ReactCompositeComponent(element, Reconciler) {
        var _this = _super.call(this, element) || this;
        _this._renderedChildren = {};
        var dom = element.dom;
        _this.__updateChildren__(element.children, Reconciler);
        if (typeof element.type === 'string') {
            _this._hostNode = dom;
        }
        if (dom && !domStore.has(dom)) {
            domStore.set(dom, _this);
            Reconciler && Reconciler.mountComponent(_this);
        }
        return _this;
    }
    ReactCompositeComponent.prototype.__update__ = function (element, Reconciler) {
        var type = element.type, props = element.props, state = element.state, children = element.children;
        this._instance.type = type;
        if (props) {
            this.props = this._instance.props = __assign({}, Object(this.props), props);
        }
        if (state) {
            this.state = this._instance.state = __assign({}, Object(this.state), state);
        }
        this._currentElement = element;
        this.__updateChildren__(children, Reconciler);
        if (typeof element.type === 'string') {
            this._hostNode = element.dom;
        }
        Reconciler && Reconciler.receiveComponent(this);
        return this;
    };
    ReactCompositeComponent.prototype.__updateChildren__ = function (children, Reconciler) {
        if (Array.isArray(children)) {
            var used_1 = new Set();
            var _renderedChildren_1 = this._renderedChildren;
            this._renderedChildren = children.reduce(function (map, node, idx) {
                var child;
                if (isPrimitive(node)) {
                    child = {
                        props: null,
                        _currentElement: node.children,
                        _stringText: node.children,
                        __destroy__: function (Reconciler) {
                            Reconciler && Reconciler.unmountComponent(child);
                        },
                    };
                    Reconciler && Reconciler.mountComponent(child);
                }
                else if (domStore.has(node.dom)) {
                    child = domStore.get(node.dom).__update__(node);
                    used_1.add(child);
                }
                else {
                    child = new ReactCompositeComponent(node, Reconciler);
                }
                map["." + idx] = child;
                return map;
            }, {});
            Reconciler && Object.keys(_renderedChildren_1).forEach(function (key) {
                var child = _renderedChildren_1[key];
                // todo: Рекурсивное удаление
                !used_1.has(child) && child.__destroy__(Reconciler);
            });
        }
        else {
            this._renderedChildren = null;
        }
    };
    ReactCompositeComponent.prototype.__destroy__ = function (Reconciler) {
        var _this = this;
        this._currentElement.dom && domStore.delete(this._currentElement.dom);
        this._renderedChildren && Object.keys(this._renderedChildren).forEach(function (key) {
            _this._renderedChildren[key].__destroy__(Reconciler);
        });
        Reconciler && Reconciler.unmountComponent(this);
    };
    return ReactCompositeComponent;
}(ReactComponent));
var ReactTopLevelWrapper = (function (_super) {
    __extends(ReactTopLevelWrapper, _super);
    function ReactTopLevelWrapper(root) {
        return _super.call(this, root) || this;
    }
    ReactTopLevelWrapper.displayName = 'ReactTopLevelWrapper';
    ReactTopLevelWrapper.isReactTopLevelWrapper = true;
    return ReactTopLevelWrapper;
}(ReactCompositeComponent));
function getHook() {
    return typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' && __REACT_DEVTOOLS_GLOBAL_HOOK__;
}
function connect(options) {
    var hook = getHook();
    if (typeof hook.inject === 'function') {
        var Reconciler_1 = {
            // Ничего тут не надо, но эти методы перехватыват DevTools
            mountComponent: function (internalInstance) { },
            receiveComponent: function (internalInstance) { },
            unmountComponent: function (internalInstance) { },
        };
        hook.inject({
            ComponentTree: {
                getClosestInstanceFromNode: function (target) {
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
                    return options.getInitialRoots().map(function (root) { return new ReactTopLevelWrapper(root); });
                },
            },
            Reconciler: Reconciler_1,
        });
        // Export public API
        return {
            update: function (node) {
                var composite = domStore.get(node.dom);
                composite && composite.__update__(node, Reconciler_1);
            },
            unmount: function (node) {
                var composite = domStore.get(node.dom);
                composite && composite.__destroy__(Reconciler_1);
            }
        };
    }
    return null;
}

exports.getHook = getHook;
exports.connect = connect;

Object.defineProperty(exports, '__esModule', { value: true });

})));
