React DevTools Symbiote
-----------------------
A module that allows use [React DevTools](https://github.com/facebook/react-devtools) for inspection your component hierarchy without React.

```ts
npm i --save-dev react-devtools-symbiote
```

### Usage

```ts
import {connect} from 'react-devtools-symbiote';

connect({
	onUpdate(fn) {
		// alas, todo
	},

	getInitialRoots() {
		return [{
			// VNode
			type: AppClass,
			dom: document.getElementById('app'),
			props: {name: 'MyApp'},
			children: {
				type: 'div',
				props: {
					className: 'text',
				},
				children: {
					type: '#', // text node
					children: 'Wow!1',
				},
			},
		}];
	},
});
```

#### VNode

```ts
interface VNode {
	key?: string;
	ref?: string;
	dom: HTMLElement | Text;
	type: Function | string;
	props: Object;
	children?: VNode[];
}
```


### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)
