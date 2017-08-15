React DevTools Symbiote
-----------------------
A module that allows use [React DevTools](https://github.com/facebook/react-devtools) for inspection your component hierarchy without React.
<br/>
<a href="https://artifact-project.github.io/react-devtools-symbiote/">See DEMO</a>

```ts
npm i --save-dev react-devtools-symbiote
```


### Usage

```ts
import {connect} from 'react-devtools-symbiote';

const symbiote = connect({
	getInitialRoots() {
		return [{
			// VNode
			type: AppClass,
			dom: document.getElementById('app'),
			props: {name: 'MyApp'},
			children: [{
				type: 'div',
				props: {
					className: 'text',
				},
				children: [{
					type: '#', // text node
					children: 'Wow!1',
				}],
			}],
		}];
	},
});

// Update
symbiote.update(vnode);

// Unmount/destroy
symbiote.unmount(vnode);
```


#### VNode

```ts
interface VNode {
	key?: string;
	ref?: string;
	dom: HTMLElement | Text;
	type: Function | string;
	props: Object;
	children?: string | VNode[];
	_source: Source;
	setProps?(newProps: object);
	setState?(newState: object);
}

interface Source {
	fileName: string;
	lineNumber: number;
}
```


### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)
